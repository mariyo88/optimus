/**
 * Bestseller Widgets - dynamic loading from backend API
 *
 * Used on two pages:
 *  - index.html : 3-column widget section (#bestseller-widgets-row)
 *                 Each column = one topSellingCategory, products in a slick slider
 *  - store.html : sidebar aside widget (#store-bestseller-widgets)
 *                 Flat list of top products from the first topSellingCategory
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;

    var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23eff2f6'/%3E%3Cpath d='M50 140l50-70 60 70' fill='%23cbd0dd'/%3E%3Ccircle cx='75' cy='60' r='15' fill='%23cbd0dd'/%3E%3C/svg%3E";

    function formatPrice(val) {
        if (!val && val !== 0) return '';
        return Number(val).toLocaleString('sr-RS') + ' RSD';
    }

    function escapeHtml(str) {
        return $('<div>').text(str || '').html();
    }

    function buildProductWidget(p) {
        var imgSrc = p.mainImageUrl ? p.mainImageUrl : IMG_PLACEHOLDER;

        var priceHtml = '';
        if (p.bestOurWebPrice) {
            priceHtml = '<h4 class="product-price">' + formatPrice(p.bestOurWebPrice);
            if (p.bestRetailPrice && p.bestRetailPrice > p.bestOurWebPrice) {
                priceHtml += ' <del class="product-old-price">' + formatPrice(p.bestRetailPrice) + '</del>';
            }
            priceHtml += '</h4>';
        } else if (p.bestRetailPrice) {
            priceHtml = '<h4 class="product-price">' + formatPrice(p.bestRetailPrice) + '</h4>';
        } else {
            priceHtml = '<h4 class="product-price"><span class="text-muted" style="font-size:12px;">Nije dostupno</span></h4>';
        }

        return (
            '<div class="product-widget">' +
                '<div class="product-img">' +
                    '<img src="' + imgSrc + '" alt="' + escapeHtml(p.name) + '">' +
                '</div>' +
                '<div class="product-body">' +
                    '<p class="product-category">' + escapeHtml(p.brandName || p.categoryName || '') + '</p>' +
                    '<h3 class="product-name"><a href="product.html?slug=' + p.slug + '">' + escapeHtml(p.name) + '</a></h3>' +
                    priceHtml +
                '</div>' +
            '</div>'
        );
    }

    // -------------------------------------------------------------------------
    // index.html — 3-column slick widget section
    // -------------------------------------------------------------------------
    function loadBestsellerWidgets() {
        var $row = $('#bestseller-widgets-row');
        if (!$row.length) return;

        $.ajax({
            url: API_BASE + '/api/categories/public',
            success: function (categories) {
                var cols = [];

                $.each(categories, function (i, parent) {
                    if (cols.length >= 3) return false;
                    if (!parent.topSellingCategory || !parent.children || !parent.children.length) return;

                    $.each(parent.children, function (j, child) {
                        if (cols.length >= 3) return false;
                        if (!child.topSellingCategory) return;
                        cols.push({
                            label: child.displayName || child.name,
                            slug: child.slug,
                            index: cols.length
                        });
                    });
                });

                if (cols.length === 0) {
                    $('#bestseller-widgets-section').hide();
                    return;
                }

                $.each(cols, function (i, col) {
                    var navId   = 'bw-slick-nav-' + i;
                    var slickId = 'bw-slick-' + i;
                    var clearfix = (i === 1) ? '<div class="clearfix visible-sm visible-xs"></div>' : '';

                    var colHtml =
                        clearfix +
                        '<div class="col-md-4 col-xs-6">' +
                            '<div class="section-title">' +
                                '<h4 class="title">' + escapeHtml(col.label) + '</h4>' +
                                '<div class="section-nav">' +
                                    '<div id="' + navId + '" class="products-slick-nav"></div>' +
                                '</div>' +
                            '</div>' +
                            '<div id="' + slickId + '" class="products-widget-slick" data-nav="#' + navId + '">' +
                                '<div style="padding:20px 0;text-align:center;color:#aaa;font-size:13px;">Učitavanje...</div>' +
                            '</div>' +
                        '</div>';

                    $row.append(colHtml);
                });

                $.each(cols, function (i, col) {
                    var $slick      = $('#bw-slick-' + i);
                    var navSelector = '#bw-slick-nav-' + i;

                    $.ajax({
                        url: API_BASE + '/api/products',
                        data: { category: col.slug, size: 6, sort: 'createdAt,desc' },
                        success: function (data) {
                            var products = (data.content || []).slice(0, 6);

                            if (products.length === 0) {
                                $slick.html('<p style="padding:10px;font-size:13px;color:#aaa;">Nema proizvoda.</p>');
                                return;
                            }

                            var slides = '';
                            for (var s = 0; s < products.length; s += 3) {
                                slides += '<div>' + products.slice(s, s + 3).map(buildProductWidget).join('') + '</div>';
                            }

                            $slick.html(slides);
                            $slick.slick({
                                slidesToShow: 1,
                                slidesToScroll: 1,
                                autoplay: true,
                                autoplaySpeed: 4000,
                                infinite: products.length > 3,
                                speed: 300,
                                dots: false,
                                arrows: true,
                                appendArrows: navSelector
                            });
                        },
                        error: function () {
                            $slick.html('<p style="padding:10px;font-size:13px;color:#aaa;">Greška pri učitavanju.</p>');
                        }
                    });
                });
            },
            error: function () {
                $('#bestseller-widgets-section').hide();
            }
        });
    }

    // -------------------------------------------------------------------------
    // store.html — sidebar flat widget list (first topSellingCategory, up to 5)
    // -------------------------------------------------------------------------
    function loadStoreBestsellerWidgets() {
        var $container = $('#store-bestseller-widgets');
        if (!$container.length) return;

        $container.html('<p style="padding:10px 0;font-size:13px;color:#aaa;">Učitavanje...</p>');

        $.ajax({
            url: API_BASE + '/api/categories/public',
            success: function (categories) {
                var firstSlug = null;

                $.each(categories, function (i, parent) {
                    if (firstSlug) return false;
                    if (!parent.topSellingCategory || !parent.children || !parent.children.length) return;

                    $.each(parent.children, function (j, child) {
                        if (!child.topSellingCategory) return;
                        firstSlug = child.slug;
                        return false; // break inner
                    });
                });

                if (!firstSlug) {
                    $container.closest('.aside').hide();
                    return;
                }

                $.ajax({
                    url: API_BASE + '/api/products',
                    data: { category: firstSlug, size: 5, sort: 'createdAt,desc' },
                    success: function (data) {
                        var products = data.content || [];

                        if (products.length === 0) {
                            $container.closest('.aside').hide();
                            return;
                        }

                        $container.html(products.map(buildProductWidget).join(''));
                    },
                    error: function () {
                        $container.html('<p style="padding:10px 0;font-size:13px;color:#aaa;">Greška pri učitavanju.</p>');
                    }
                });
            },
            error: function () {
                $container.closest('.aside').hide();
            }
        });
    }

    // -------------------------------------------------------------------------
    // Init
    // -------------------------------------------------------------------------
    $(document).ready(function () {
        loadBestsellerWidgets();
        loadStoreBestsellerWidgets();
    });

})(jQuery);
