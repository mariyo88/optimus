/**
 * Reviews — učitavanje i slanje recenzija za product.html
 * Zavisi od: config.js (window.APP_CONFIG.API_BASE), jQuery
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;
    var PAGE_SIZE = 5;

    var _currentSlug = null;
    var _currentPage = 0;
    var _totalPages   = 0;
    var _totalReviews = 0;

    // ── Public init ───────────────────────────────────────────────────────────

    window.initReviews = function (productSlug, productData) {
        _currentSlug = productSlug;
        _currentPage = 0;
        
        // If productData is provided with review stats, use them immediately
        if (productData && typeof productData.averageRating !== 'undefined' && typeof productData.reviewCount !== 'undefined') {
            // Show initial data immediately
            updateHeaderRating(productData.averageRating, productData.reviewCount);
            updateReviewCountLink(productData.reviewCount);
            
            // If there are no reviews, skip the API call and show empty state
            if (productData.reviewCount === 0) {
                showEmptyReviewState();
                bindForm();
                bindReviewLink();
                return;
            }
        }
        
        // Load full reviews data from API (pagination, distribution, etc.)
        loadReviews(0);
        bindForm();
        bindReviewLink();
    };

    // ── Load & render ─────────────────────────────────────────────────────────

    function showEmptyReviewState() {
        // Clear rating summary
        $('#rating-avg-score').text('');
        $('#rating-avg-stars').html('');
        
        // Clear distribution
        var html = '';
        for (var star = 5; star >= 1; star--) {
            html += '<li>' +
                '<div class="rating-stars">' + buildStarsHtml(star) + '</div>' +
                '<div class="rating-progress"><div style="width:0%;"></div></div>' +
                '<span class="sum">0</span>' +
                '</li>';
        }
        $('#rating-distribution').html(html);
        
        // Show empty state in reviews list
        $('#reviews-list').html(
            '<li style="padding: 40px 20px; text-align: center; list-style: none;">' +
                '<div style="width: 72px; height: 72px; margin: 0 auto 20px; background: #f8f9fa; border-radius: 50%; display: flex; align-items: center; justify-content: center;">' +
                    '<i class="fa fa-commenting-o" style="font-size: 30px; color: #ccc;"></i>' +
                '</div>' +
                '<h4 style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 8px;">Još nema recenzija</h4>' +
                '<p style="color: #999; font-size: 13px; max-width: 280px; margin: 0 auto 20px; line-height: 1.6;">Budite prvi koji će podeliti iskustvo sa ovim proizvodom.</p>' +
            '</li>'
        );
        
        // Clear pagination
        $('#reviews-pagination').empty();
    }

    function loadReviews(page) {
        $.ajax({
            url: API_BASE + '/api/products/' + _currentSlug + '/reviews',
            data: { page: page, size: PAGE_SIZE },
            success: function (data) {
                _currentPage  = data.currentPage;
                _totalPages   = data.totalPages;
                _totalReviews = data.totalReviews;

                renderRatingSummary(data);
                renderReviewList(data.reviews);
                renderPagination(data);
                updateReviewCountLink(data.totalReviews);
                updateHeaderRating(data.averageRating, data.totalReviews);
            },
            error: function () {
                $('#reviews-list').html(
                    '<li style="padding:20px;color:#999;text-align:center;">Greška pri učitavanju recenzija.</li>'
                );
            }
        });
    }

    // ── Rating summary (leva kolona) ────────────────────────────────────────

    function renderRatingSummary(data) {
        var avg  = data.averageRating;
        var dist = data.ratingDistribution || {};
        var total = data.totalReviews;

        if (avg) {
            $('#rating-avg-score').text(avg.toFixed(1));
            $('#rating-avg-stars').html(buildStarsHtml(Math.round(avg)));
        } else {
            $('#rating-avg-score').text('');
            $('#rating-avg-stars').html('');
        }

        // Distribution bars (5 → 1)
        var html = '';
        for (var star = 5; star >= 1; star--) {
            var count   = dist[star] || 0;
            var percent = total > 0 ? Math.round((count / total) * 100) : 0;
            html += '<li>' +
                '<div class="rating-stars">' + buildStarsHtml(star) + '</div>' +
                '<div class="rating-progress"><div style="width:' + percent + '%;"></div></div>' +
                '<span class="sum">' + count + '</span>' +
                '</li>';
        }
        $('#rating-distribution').html(html);
    }

    // ── Review list (srednja kolona) ──────────────────────────────────────────

    function renderReviewList(reviews) {
        var $list = $('#reviews-list');

        if (!reviews || reviews.length === 0) {
            $list.html(
                '<li style="padding: 40px 20px; text-align: center; list-style: none;">' +
                    '<div style="width: 72px; height: 72px; margin: 0 auto 20px; background: #f8f9fa; border-radius: 50%; display: flex; align-items: center; justify-content: center;">' +
                        '<i class="fa fa-commenting-o" style="font-size: 30px; color: #ccc;"></i>' +
                    '</div>' +
                    '<h4 style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 8px;">Još nema recenzija</h4>' +
                    '<p style="color: #999; font-size: 13px; max-width: 280px; margin: 0 auto 20px; line-height: 1.6;">Budite prvi koji će podeliti iskustvo sa ovim proizvodom.</p>' +
                '</li>'
            );
            // Klik na CTA u empty state → fokus na formu
            $('#empty-state-review-btn').on('click', function (e) {
                e.preventDefault();
                $('html,body').animate({ scrollTop: $('#review-form').offset().top - 80 }, 300, function () {
                    $('#review-author').focus();
                });
            });
            return;
        }

        var html = reviews.map(function (r) {
            return '<li>' +
                '<div class="review-heading">' +
                    '<h5 class="name">' + escapeHtml(r.authorName) + '</h5>' +
                    '<p class="date">' + formatDate(r.createdAt) + '</p>' +
                    '<div class="review-rating">' + buildStarsHtml(r.rating) + '</div>' +
                '</div>' +
                '<div class="review-body"><p>' + escapeHtml(r.body) + '</p></div>' +
                '</li>';
        }).join('');

        $list.html(html);
    }

    // ── Pagination ────────────────────────────────────────────────────────────

    function renderPagination(data) {
        var $pag = $('#reviews-pagination');

        if (data.totalPages <= 1) {
            $pag.empty();
            return;
        }

        var html = '';

        // Prev
        if (_currentPage > 0) {
            html += '<li><a href="#" data-page="' + (_currentPage - 1) + '"><i class="fa fa-angle-left"></i></a></li>';
        }

        for (var i = 0; i < data.totalPages; i++) {
            if (i === _currentPage) {
                html += '<li class="active">' + (i + 1) + '</li>';
            } else {
                html += '<li><a href="#" data-page="' + i + '">' + (i + 1) + '</a></li>';
            }
        }

        // Next
        if (_currentPage < data.totalPages - 1) {
            html += '<li><a href="#" data-page="' + (_currentPage + 1) + '"><i class="fa fa-angle-right"></i></a></li>';
        }

        $pag.html(html);

        $pag.off('click.reviews').on('click.reviews', 'a[data-page]', function (e) {
            e.preventDefault();
            var page = parseInt($(this).data('page'));
            loadReviews(page);
            // Scroll to reviews section
            $('html,body').animate({ scrollTop: $('#tab3').offset().top - 80 }, 300);
        });
    }

    function pluralRecenzija(n) {
        var lastTwo = n % 100;
        var lastOne = n % 10;
        if (lastOne === 1 && lastTwo !== 11) return 'recenzija';
        if (lastOne >= 2 && lastOne <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'recenzije';
        return 'recenzija';
    }

    function updateReviewCountLink(total) {
        var $link = $('#review-count-link');
        if (total > 0) {
            $link.text(total + ' ' + pluralRecenzija(total) + ' | Dodajte recenziju');
        } else {
            $link.text('Dodajte prvu recenziju');
        }
        // Update tab label
        $('#tab3-nav').text('Recenzije' + (total > 0 ? ' (' + total + ')' : ''));
    }

    // ── Review form ───────────────────────────────────────────────────────────

    function bindForm() {
        $('#review-submit-form').off('submit.reviews').on('submit.reviews', function (e) {
            e.preventDefault();
            submitReview();
        });
    }

    function submitReview() {
        var authorName  = $.trim($('#review-author').val());
        var authorEmail = $.trim($('#review-email').val());
        var body        = $.trim($('#review-body').val());
        var rating      = parseInt($('input[name="rating"]:checked').val());

        // Basic client-side validation
        if (!authorName) {
            showFormMsg('Unesite vaše ime.', 'error');
            return;
        }
        if (!body || body.length < 10) {
            showFormMsg('Recenzija mora imati najmanje 10 znakova.', 'error');
            return;
        }
        if (!rating || rating < 1 || rating > 5) {
            showFormMsg('Odaberite ocjenu (1–5 zvjezdica).', 'error');
            return;
        }

        var payload = { authorName: authorName, body: body, rating: rating };
        if (authorEmail) payload.authorEmail = authorEmail;

        var $btn = $('#review-submit-btn');
        $btn.prop('disabled', true).text('Šalje se...');

        $.ajax({
            url: API_BASE + '/api/products/' + _currentSlug + '/reviews',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function () {
                showFormMsg('Hvala! Vaša recenzija je objavljena.', 'success');
                $('#review-submit-form')[0].reset();
                $btn.prop('disabled', false).text('Pošalji recenziju');
                // Reload first page to show new review
                loadReviews(0);
            },
            error: function (xhr) {
                var msg = 'Greška pri slanju. Pokušajte ponovo.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    msg = xhr.responseJSON.message;
                }
                showFormMsg(msg, 'error');
                $btn.prop('disabled', false).text('Pošalji recenziju');
            }
        });
    }

    function showFormMsg(text, type) {
        var $msg = $('#review-form-msg');
        $msg.text(text)
            .css('color', type === 'success' ? '#28a745' : '#4274D9')
            .show();
        if (type === 'success') {
            setTimeout(function () { $msg.fadeOut(); }, 5000);
        }
    }

    // ── Review count link → scroll to tab ────────────────────────────────────

    function bindReviewLink() {
        $('#review-count-link').off('click.reviews').on('click.reviews', function (e) {
            e.preventDefault();
            $('a[data-toggle="tab"][href="#tab3"]').tab('show');
            setTimeout(function () {
                $('html,body').animate({ scrollTop: $('#tab3').offset().top - 80 }, 300, function () {
                    $('#review-author').focus();
                });
            }, 100);
        });
    }

    // ── Header rating (zvjezdice iznad cijene) ────────────────────────────────

    function updateHeaderRating(avg, total) {
        var $el = $('#product-header-rating');
        if (!avg || total === 0) {
            $el.html('<i class="fa fa-star-o"></i><i class="fa fa-star-o"></i><i class="fa fa-star-o"></i><i class="fa fa-star-o"></i><i class="fa fa-star-o"></i>');
            return;
        }
        // Half-star rounding: round to nearest 0.5
        var rounded = Math.round(avg * 2) / 2;
        var html = '';
        for (var i = 1; i <= 5; i++) {
            if (i <= rounded) {
                html += '<i class="fa fa-star" style="margin-right:3px;"></i>';
            } else if (i - 0.5 === rounded) {
                html += '<i class="fa fa-star-half-o" style="margin-right:3px;"></i>';
            } else {
                html += '<i class="fa fa-star-o" style="margin-right:3px;"></i>';
            }
        }
        $el.html(html);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    function buildStarsHtml(rating) {
        var html = '';
        for (var i = 1; i <= 5; i++) {
            html += i <= rating
                ? '<i class="fa fa-star" style="margin-right:3px;"></i>'
                : '<i class="fa fa-star-o" style="margin-right:3px;"></i>';
        }
        return html;
    }

    function formatDate(isoString) {
        if (!isoString) return '';
        var d = new Date(isoString);
        var months = ['JAN','FEB','MAR','APR','MAJ','JUN','JUL','AVG','SEP','OKT','NOV','DEC'];
        var h = d.getHours();
        var m = d.getMinutes();
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() +
               ', ' + (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

})(jQuery);
