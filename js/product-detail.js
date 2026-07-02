/**
 * Product Detail — loads right-side product info from backend API
 * Reads ?slug= from URL query string
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;

    function getSlugFromUrl() {
        var params = new URLSearchParams(window.location.search);
        return params.get('slug');
    }

    function getBestPrices(product) {
        return {
            retailPrice: product.bestRetailPrice || null,
            ourWebPrice: product.bestOurWebPrice  || null,
            inStock: (product.stock != null && product.stock > 0)
        };
    }

    function renderStockInfo(product) {
        var stock = product.stock;
        var $el = $('#product-stock-info');

        var html;
        if (!product.active) {
            html = [
                '<div style="display:inline-flex;align-items:center;gap:8px;',
                'background:#f5f5f5;border:1px solid #ddd;border-radius:4px;',
                'padding:8px 14px;font-size:13px;color:#999;">',
                '<i class="fa fa-ban"></i> Proizvod nije dostupan',
                '</div>'
            ].join('');
        } else if (!stock || stock <= 0) {
            html = [
                '<div style="display:inline-flex;align-items:center;gap:8px;',
                'background:#fff5f5;border:1px solid #ffcccc;border-radius:4px;',
                'padding:8px 14px;font-size:13px;color:#cc0000;">',
                '<i class="fa fa-times-circle"></i> Nema na stanju',
                '</div>'
            ].join('');
        } else if (stock <= 3) {
            html = [
                '<div style="display:inline-flex;align-items:center;gap:8px;',
                'background:#fff8e1;border:1px solid #ffcc02;border-radius:4px;',
                'padding:8px 14px;font-size:13px;color:#b8860b;">',
                '<i class="fa fa-exclamation-triangle"></i>',
                'Poslednji komadi — ostalo <strong>' + stock + ' kom</strong>',
                '</div>'
            ].join('');
        } else if (stock <= 10) {
            html = [
                '<div style="display:inline-flex;align-items:center;gap:8px;',
                'background:#fff3e0;border:1px solid #ffab40;border-radius:4px;',
                'padding:8px 14px;font-size:13px;color:#e65100;">',
                '<i class="fa fa-cube"></i>',
                'Na stanju — <strong>' + stock + ' kom</strong>',
                '</div>'
            ].join('');
        } else {
            html = [
                '<div style="display:inline-flex;align-items:center;gap:8px;',
                'background:#f0faf0;border:1px solid #81c784;border-radius:4px;',
                'padding:8px 14px;font-size:13px;color:#2e7d32;">',
                '<i class="fa fa-check-circle"></i>',
                'Na stanju — <strong>' + stock + ' kom</strong>',
                '</div>'
            ].join('');
        }

        $el.html(html);
    }

    function renderPrice(product) {
        var priceInfo   = getBestPrices(product);
        var ourPrice    = priceInfo.ourWebPrice;
        var retailPrice = priceInfo.retailPrice;

        if (!ourPrice && !retailPrice) {
            return '<h3 class="product-price"><span class="text-muted">Cena nije dostupna</span></h3>';
        }

        var priceHtml = '<h3 class="product-price">';
        if (ourPrice) {
            priceHtml += formatPrice(ourPrice);
            if (retailPrice && retailPrice > ourPrice) {
                priceHtml += ' <del class="product-old-price">' + formatPrice(retailPrice) + '</del>';
            }
        } else {
            priceHtml += formatPrice(retailPrice);
        }
        priceHtml += '</h3>';

        return priceHtml;
    }

    function renderDetails(product) {
        var $details = $('.product-details');

        // Name
        $details.find('.product-name').text(product.name);

        // Price + stock
        $('#product-price-stock').html(renderPrice(product));

        // Stock info widget
        renderStockInfo(product);

        // Key Features - extract from specifications
        renderKeyFeatures(product);

        // SKU / EAN info
        var $skuEan = $('#product-sku-ean');
        $skuEan.empty().hide();
        if (product.sku) {
            $skuEan.append('<li>SKU: <strong>' + product.sku + '</strong></li>');
        }
        if (product.ean) {
            $skuEan.append('<li' + (product.sku ? ' style="margin-left:16px;"' : '') + '>EAN: <strong>' + product.ean + '</strong></li>');
        }
        if (product.sku || product.ean) {
            $skuEan.show();
        }

        // Category links
        var $catLinks = $details.find('.product-links').first();
        $catLinks.empty();
        $catLinks.append('<li>Kategorija:</li>');
        if (product.category) {
            // Koristi displayName ako postoji, inače fallback na name
            var categoryName = product.category.displayName || product.category.name;
            $catLinks.append(
                '<li><a href="store.html?category=' + product.category.slug + '">' + categoryName + '</a></li>'
            );
        }

        // Update Add to Cart button with product data
        var priceInfo = getBestPrices(product);
        var $addToCartBtn = $('.add-to-cart .add-to-cart-btn');
        $addToCartBtn.attr('data-id', product.id);
        $addToCartBtn.attr('data-slug', product.slug);
        
        if (!priceInfo.inStock) {
            $addToCartBtn.prop('disabled', true);
            $addToCartBtn.addClass('out-of-stock-disabled');
        }

        // Set default quantity to 1
        $('.add-to-cart input[type="number"]').val(1);

        // Page title + breadcrumb
        document.title = product.name + ' — Optimus';
        updateBreadcrumbs(product);
    }

    function renderKeyFeatures(product) {
        // Get top 4 specifications for key features
        var specs = product.specifications || [];
        var features = specs.slice(0, 4);

        // If less than 4 specs, add generic features
        if (features.length === 0) {
            // Use brand and category as fallback features
            if (product.brand && product.brand.name) {
                features.push({ name: 'Brend', value: product.brand.name });
            }
            if (product.category) {
                // Koristi displayName ako postoji, inače fallback na name
                var categoryName = product.category.displayName || product.category.name;
                features.push({ name: 'Kategorija', value: categoryName });
            }
            if (product.inStock !== undefined) {
                features.push({ name: 'Dostupnost', value: product.inStock ? 'Na stanju' : 'Nema na stanju' });
            }
        }

        // Hide the container if no features
        if (features.length === 0) {
            $('#product-key-features').hide();
            return;
        }

        // Show the container and populate features
        $('#product-key-features').show();
        for (var i = 0; i < 4; i++) {
            var $feature = $('#feature-' + (i + 1));
            if (features[i]) {
                $feature.html('<strong>' + features[i].name + ':</strong> ' + features[i].value);
                $feature.parent().show();
            } else {
                $feature.parent().hide();
            }
        }
    }

    function updateBreadcrumbs(product) {
        // Update product name (last breadcrumb)
        $('#breadcrumb-product').text(product.name);

        // Update category breadcrumb
        if (product.category) {
            // Koristi displayName ako postoji, inače fallback na name
            var categoryName = product.category.displayName || product.category.name;
            var $categoryBreadcrumb = $('#breadcrumb-category');
            $categoryBreadcrumb.html('<a href="store.html?category=' + product.category.slug + '">' + categoryName + '</a>')
                .show();
        } else {
            $('#breadcrumb-category').hide();
        }
    }

    function renderImages(product) {
        var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23eff2f6'/%3E%3Cpath d='M150 420l150-210 180 210' fill='%23cbd0dd' stroke='%23cbd0dd' stroke-width='2'/%3E%3Ccircle cx='225' cy='150' r='45' fill='%23cbd0dd'/%3E%3Ctext x='300' y='570' font-family='Arial' font-size='24' fill='%23999' text-anchor='middle'%3ESlika nije dostupna%3C/text%3E%3C/svg%3E";
        var images = product.images && product.images.length > 0
            ? product.images
            : [{ imageUrl: IMG_PLACEHOLDER, isMain: true }];

        // Sort: main image first
        images.sort(function (a, b) {
            if (a.isMain && !b.isMain) return -1;
            if (!a.isMain && b.isMain) return 1;
            return (a.sortOrder || 0) - (b.sortOrder || 0);
        });

        var $mainSlick = $('#product-main-img');
        var $thumbSlick = $('#product-imgs');

        // Destroy existing slick instances initialized by main.js
        if ($mainSlick.hasClass('slick-initialized')) $mainSlick.slick('unslick');
        if ($thumbSlick.hasClass('slick-initialized')) $thumbSlick.slick('unslick');

        $mainSlick.empty();
        $thumbSlick.empty();

        $.each(images, function (i, img) {
            var imgHtml = '<img src="' + img.imageUrl + '" alt="' + product.name + '" onerror="this.src=\'' + IMG_PLACEHOLDER + '\'">';
            $mainSlick.append('<div class="product-preview">' + imgHtml + '</div>');
            $thumbSlick.append('<div class="product-preview">' + imgHtml + '</div>');
        });
        
        // Init thumb first, then main (asNavFor requires both to exist)
        $thumbSlick.slick({
            slidesToShow: 3,
            slidesToScroll: 1,
            arrows: true,
            centerMode: false,
            focusOnSelect: true,
            centerPadding: 0,
            vertical: true,
            verticalSwiping: true,
            adaptiveHeight: false,
            asNavFor: '#product-main-img',
            responsive: [{ breakpoint: 991, settings: { vertical: false, arrows: false, dots: true, centerMode: true } }]
        });

        $mainSlick.slick({
            infinite: true,
            speed: 300,
            dots: false,
            arrows: true,
            fade: true,
            adaptiveHeight: false,
            asNavFor: '#product-imgs'
        });

        // Fix thumb height to match main image height
        // Wait for first image to load before measuring
        var $firstImg = $mainSlick.find('img').first();
        function applyThumbHeight() {
            var thumbHeight = $mainSlick.outerHeight();
            if (thumbHeight > 50) {
                $thumbSlick.css('height', thumbHeight + 'px');
                $thumbSlick.find('.slick-list').css('height', thumbHeight + 'px');
            }
        }
        if ($firstImg.length && !$firstImg[0].complete) {
            $firstImg.on('load', applyThumbHeight);
        } else {
            applyThumbHeight();
        }

        // Re-init zoom on new slides
        $mainSlick.find('.product-preview').zoom();
    }

    function renderTabs(product) {
        // Description tab - render HTML if present, otherwise use plain text
        var description = product.description || product.shortDescription || '';
        if (!description || !description.trim()) {
            // No description — hide the Opis tab and activate Detalji instead
            var $opisTab = $('ul.tab-nav li a[href="#tab1"]').parent();
            $opisTab.hide();
            $('#tab1').removeClass('active');
            $('ul.tab-nav li a[href="#tab2"]').parent().addClass('active');
            $('#tab2').addClass('active');
        } else if (description.includes('<ul class="SpecForm">')) {
            // HTML format - render as HTML
            $('#tab1 .col-md-12').html(description);
        } else {
            // Plain text format - render as text
            $('#tab1 .col-md-12 p').text(description);
        }

        // Details tab — specifications table
        if (product.specifications && product.specifications.length > 0) {
            var rows = product.specifications.map(function (s) {
                return '<tr><td><strong>' + s.name + '</strong></td><td>' + s.value + '</td></tr>';
            }).join('');
            // Prepend EAN row if available
            var eanRow = product.ean ? '<tr><td><strong>EAN / Barkod</strong></td><td>' + product.ean + '</td></tr>' : '';
            $('#tab2 .col-md-12').html('<table class="table table-bordered">' + eanRow + rows + '</table>');
        } else if (product.ean) {
            $('#tab2 .col-md-12').html(
                '<table class="table table-bordered"><tr><td><strong>EAN / Barkod</strong></td><td>' + product.ean + '</td></tr></table>'
            );
        }
    }

    function buildRelatedProductCard(p) {
        var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23eff2f6'/%3E%3Cpath d='M100 280l100-140 120 140' fill='%23cbd0dd' stroke='%23cbd0dd' stroke-width='2'/%3E%3Ccircle cx='150' cy='120' r='30' fill='%23cbd0dd'/%3E%3Ctext x='200' y='360' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle'%3ESlika nije dostupna%3C/text%3E%3C/svg%3E";
        var imgSrc   = p.mainImageUrl ? p.mainImageUrl : IMG_PLACEHOLDER;
        var labels   = '';
        if (p.isNew) labels += '<span class="new">NOVO</span>';

        // Price display — web cena glavna, maloprodajna prekrižena samo ako je veća
        var priceHtml = '';
        if (p.bestOurWebPrice) {
            priceHtml = '<h4 class="product-price"><span class="product-price">' + formatPrice(p.bestOurWebPrice) + '</span>';
            if (p.bestRetailPrice && p.bestRetailPrice > p.bestOurWebPrice) {
                priceHtml += ' <del class="product-old-price">' + formatPrice(p.bestRetailPrice) + '</del>';
            }
            priceHtml += '</h4>';
        } else if (p.bestRetailPrice) {
            priceHtml = '<h4 class="product-price">' + formatPrice(p.bestRetailPrice) + '</h4>';
        } else {
            priceHtml = '<h4 class="product-price"><span class="text-muted">Nije dostupno</span></h4>';
        }

        var inStockClass = p.inStock ? '' : ' out-of-stock-disabled';
        var inStockBadge = !p.inStock ? '<div class="out-of-stock">Nema na stanju</div>' : '';

        return [
            '<div class="col-md-3 col-xs-6">',
            '  <div class="product">',
            '    <div class="product-img">',
            '      <img src="' + imgSrc + '" alt="' + p.name + '" onerror="this.src=\'' + IMG_PLACEHOLDER + '\'">',
            '      <div class="product-label">' + labels + '</div>',
            '    </div>',
            '    <div class="product-body">',
            '      <p class="product-category">' + (p.brandName || '') + '</p>',
            '      <h3 class="product-name"><a href="product.html?slug=' + p.slug + '">' + p.name + '</a></h3>',
            '      ' + priceHtml,
            '      ' + inStockBadge,
            '      <div class="product-rating"></div>',
            '      <div class="product-btns">',
            '        <button class="add-to-wishlist"><i class="fa fa-heart-o"></i><span class="tooltipp">dodaj u listu želja</span></button>',
            '        <button class="add-to-compare"><i class="fa fa-exchange"></i><span class="tooltipp">dodaj za poređenje</span></button>',
            '        <button class="quick-view"><i class="fa fa-eye"></i><span class="tooltipp">brzi pregled</span></button>',
            '      </div>',
            '    </div>',
            '    <div class="add-to-cart">',
            '      <button class="add-to-cart-btn' + inStockClass + '" data-id="' + p.id + '" data-slug="' + p.slug + '" ' + (!p.inStock ? 'disabled' : '') + '><i class="fa fa-shopping-cart"></i> dodaj u korpu</button>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('\n');
    }

    function loadRelatedProducts(product) {
        if (!product.category || !product.category.slug) return;

        $.ajax({
            url: API_BASE + '/api/products',
            data: {
                category: product.category.slug,
                size: 5,
                sort: 'name,asc'
            },
            success: function (data) {
                var allProducts = data.content || [];
                // Filter out current product
                var relatedProducts = allProducts.filter(function (p) {
                    return p.id !== product.id;
                }).slice(0, 4);

                if (relatedProducts.length === 0) {
                    $('#related-products-container').html('<p class="text-center" style="padding:20px;color:#999;">No related products found.</p>');
                    return;
                }

                var html = relatedProducts.map(buildRelatedProductCard).join('');
                $('#related-products-container').html(html);
            }
        });
    }

    function showError() {
        // Sakrij kolonu sa slikama, tabove i slične proizvode
        $('.product-details').closest('.row').find('.col-md-7').hide();
        $('.product-details').closest('.col-md-5').removeClass('col-md-5').addClass('col-md-12');
        $('#product-tab').closest('.col-md-12').hide();
        $('#related-products-section').hide();

        $('.product-details').html(
            '<div style="text-align:center; padding: 80px 20px;">' +
                '<div style="font-size: 80px; margin-bottom: 20px;">🔍</div>' +
                '<h2 style="font-size: 28px; font-weight: 700; color: #222; margin-bottom: 12px;">Proizvod nije pronađen</h2>' +
                '<p style="color: #888; font-size: 15px; max-width: 400px; margin: 0 auto 32px auto; line-height: 1.6;">Traženi proizvod ne postoji ili je uklonjen iz ponude. Pokušajte da pretražite nešto drugo.</p>' +
                '<div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">' +
                    '<a href="index.html" style="display:inline-block; background:#D10024; color:#fff; padding:12px 28px; border-radius:4px; font-size:14px; font-weight:600; text-decoration:none;">Početna</a>' +
                    '<a href="store.html" style="display:inline-block; background:#fff; color:#D10024; border:2px solid #D10024; padding:10px 28px; border-radius:4px; font-size:14px; font-weight:600; text-decoration:none;">Pregledaj prodavnicu</a>' +
                '</div>' +
            '</div>'
        );
    }

    function loadProduct(slug) {
        $.ajax({
            url: API_BASE + '/api/products/' + slug,
            success: function (product) {
                renderDetails(product);
                renderImages(product);
                renderTabs(product);
                loadRelatedProducts(product);
                // Init share buttons (Facebook, WhatsApp, Copy Link, QR Code)
                if (typeof window.initQrShare === 'function') {
                    window.initQrShare(product.slug);
                }
            },
            error: showError
        });
    }

    $(document).ready(function () {
        var slug = getSlugFromUrl();
        if (!slug) return;
        loadProduct(slug);
    });

})(jQuery);
