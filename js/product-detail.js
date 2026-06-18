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
        if (!product.supplierProducts || product.supplierProducts.length === 0) {
            return { webPrice: null, retailPrice: null, inStock: false };
        }
        
        var suppliers = product.supplierProducts.filter(sp => sp.active === true);
        if (suppliers.length === 0) {
            return { webPrice: null, retailPrice: null, inStock: false };
        }

        var bestWebPrice = null;
        var bestRetailPrice = null;

        suppliers.forEach(function (sp) {
            if (sp.webPrice && (!bestWebPrice || sp.webPrice < bestWebPrice)) {
                bestWebPrice = sp.webPrice;
            }
            if (sp.retailPrice && (!bestRetailPrice || sp.retailPrice < bestRetailPrice)) {
                bestRetailPrice = sp.retailPrice;
            }
        });

        var inStock = suppliers.some(sp => sp.inStock === true);
        return { webPrice: bestWebPrice, retailPrice: bestRetailPrice, inStock: inStock };
    }

    function renderStockStatus(product) {
        var priceInfo = getBestPrices(product);
        if (priceInfo.inStock) {
            return '<span class="product-available">In Stock</span>';
        }
        return '<span class="product-available" style="color:#999;">Out of Stock</span>';
    }

    function renderPrice(product) {
        var priceInfo = getBestPrices(product);
        var webPrice = priceInfo.webPrice;
        var retailPrice = priceInfo.retailPrice;
        
        if (!webPrice && !retailPrice) {
            return '<h3 class="product-price"><span class="text-muted">Price Not Available</span></h3>';
        }
        
        var priceHtml = '<h3 class="product-price"><div class="product-price-detail-container">';
        
        if (webPrice) {
            priceHtml += '<div class="price-row">';
            priceHtml += '<span class="price-label">B2B Cijena:</span>';
            priceHtml += '<span class="product-price-value">' + parseFloat(webPrice).toFixed(2) + '</span>';
            priceHtml += '</div>';
        }
        
        if (retailPrice) {
            priceHtml += '<div class="price-row">';
            priceHtml += '<span class="price-label">Retail Cijena:</span>';
            priceHtml += '<span class="product-price-value">' + parseFloat(retailPrice).toFixed(2) + '</span>';
            priceHtml += '</div>';
        }
        
        priceHtml += '</div></h3>';
        
        return priceHtml;
    }

    function renderDetails(product) {
        var $details = $('.product-details');

        // Name
        $details.find('.product-name').text(product.name);

        // Price + stock
        $('#product-price-stock').html(
            renderPrice(product) + renderStockStatus(product)
        );

        // Short description
        $('#product-short-desc').text(product.shortDescription || product.description || '');

        // Category links
        var $catLinks = $details.find('.product-links').first();
        $catLinks.empty();
        $catLinks.append('<li>Category:</li>');
        if (product.category) {
            $catLinks.append(
                '<li><a href="store.html?category=' + product.category.slug + '">' + product.category.name + '</a></li>'
            );
        }

        // Page title + breadcrumb
        document.title = product.name + ' — Electro';
        var $breadcrumb = $('.breadcrumb-tree');
        if ($breadcrumb.length) {
            $breadcrumb.find('li.active').text(product.name);
            if (product.category) {
                $breadcrumb.find('li:nth-child(3) a').text(product.category.name)
                    .attr('href', 'store.html?category=' + product.category.slug);
            }
        }
    }

    function renderImages(product) {
        var images = product.images && product.images.length > 0
            ? product.images
            : [{ imageUrl: './img/product01.png', isMain: true }];

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
            $mainSlick.append(
                '<div class="product-preview"><img src="' + img.imageUrl + '" alt="' + product.name + '"></div>'
            );
            $thumbSlick.append(
                '<div class="product-preview"><img src="' + img.imageUrl + '" alt="' + product.name + '"></div>'
            );
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
        // Description tab
        $('#tab1 .col-md-12 p').text(product.description || product.shortDescription || '');

        // Details tab — specifications table
        if (product.specifications && product.specifications.length > 0) {
            var rows = product.specifications.map(function (s) {
                return '<tr><td><strong>' + s.name + '</strong></td><td>' + s.value + '</td></tr>';
            }).join('');
            $('#tab2 .col-md-12').html('<table class="table table-bordered">' + rows + '</table>');
        }
    }

    function showError() {
        $('.product-details').html(
            '<div class="alert alert-danger" style="margin-top:20px;">Product not found.</div>'
        );
    }

    function loadProduct(slug) {
        $.ajax({
            url: API_BASE + '/api/products/' + slug,
            success: function (product) {
                renderDetails(product);
                renderImages(product);
                renderTabs(product);
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
