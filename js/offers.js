/**
 * Offers Page - Load newest products with is_new=true
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;
    var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23eff2f6'/%3E%3Cpath d='M100 280l100-140 120 140' fill='%23cbd0dd' stroke='%23cbd0dd' stroke-width='2'/%3E%3Ccircle cx='150' cy='120' r='30' fill='%23cbd0dd'/%3E%3Ctext x='200' y='360' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle'%3ESlika nije dostupna%3C/text%3E%3C/svg%3E";

    /**
     * Build product card HTML
     */
    function buildProductCard(p) {
        var imgSrc = p.mainImageUrl ? p.mainImageUrl : IMG_PLACEHOLDER;
        var labels = '';
        if (p.isNew) labels += '<span class="new">NOVO</span>';

        // Build price display — web cena glavna, maloprodajna prekrižena samo ako je veća
        var priceHtml = '';
        if (p.bestOurWebPrice) {
            priceHtml = '<span class="product-price">' + formatPrice(p.bestOurWebPrice) + '</span>';
            if (p.bestRetailPrice && p.bestRetailPrice > p.bestOurWebPrice) {
                priceHtml += ' <del class="product-old-price">' + formatPrice(p.bestRetailPrice) + '</del>';
            }
        } else if (p.bestRetailPrice) {
            priceHtml = '<span class="product-price">' + formatPrice(p.bestRetailPrice) + '</span>';
        } else {
            priceHtml = '<span class="text-muted">Nije dostupno</span>';
        }

        var inStockClass = p.inStock ? '' : ' out-of-stock-disabled';
        var inStockBadge = !p.inStock ? '<span class="out-of-stock">Nema na stanju</span>' : '';

        return '<div class="col-md-3 col-xs-6">' +
            '<div class="product">' +
            '<div class="product-img">' +
            '<img src="' + imgSrc + '" alt="' + p.name + '">' +
            '<div class="product-label">' + labels + '</div>' +
            '</div>' +
            '<div class="product-body">' +
            '<p class="product-category">' + (p.brandName || '') + '</p>' +
            '<h3 class="product-name"><a href="product.html?slug=' + p.slug + '">' + p.name + '</a></h3>' +
            '<h4 class="product-price">' + priceHtml + '</h4>' +
            inStockBadge +
            '<div class="product-rating"></div>' +
            '<div class="product-btns">' +
            '<button class="add-to-wishlist" data-id="' + p.id + '" data-slug="' + p.slug + '"><i class="fa fa-heart-o"></i><span class="tooltipp">dodaj u želje</span></button>' +
            '<button class="add-to-compare" data-id="' + p.id + '" data-slug="' + p.slug + '"><i class="fa fa-exchange"></i><span class="tooltipp">dodaj za poređenje</span></button>' +
            '<button class="quick-view" data-slug="' + p.slug + '"><i class="fa fa-eye"></i><span class="tooltipp">brzi pregled</span></button>' +
            '</div>' +
            '</div>' +
            '<div class="add-to-cart">' +
            '<button class="add-to-cart-btn' + inStockClass + '" data-id="' + p.id + '" data-slug="' + p.slug + '" ' + (!p.inStock ? 'disabled' : '') + '><i class="fa fa-shopping-cart"></i> dodaj u korpu</button>' +
            '</div>' +
            '</div>' +
            '</div>';
    }

    /**
     * Load newest products with is_new=true
     */
    function loadNewestProducts() {
        var $grid = $('#offers-products-grid');

        $.ajax({
            url: API_BASE + '/api/products/new-arrivals',
            data: {
                limit: 12
            },
            success: function (data) {
                var products = data.content || [];

                if (products.length === 0) {
                    $grid.html(
                        '<div class="col-md-12 text-center" style="padding: 60px 0;">' +
                        '<i class="fa fa-info-circle fa-3x" style="color: #777777;"></i>' +
                        '<p style="margin-top: 20px; color: #777777; font-size: 18px;">Trenutno nema novih proizvoda u ponudi.</p>' +
                        '<a href="store.html" class="primary-btn" style="margin-top: 20px;">Pogledaj sve proizvode</a>' +
                        '</div>'
                    );
                    return;
                }

                // Build product cards
                var html = products.map(buildProductCard).join('');
                $grid.html(html);

                // Sync wishlist button states after products are rendered
                if (window.OptimusWishlist) {
                    window.OptimusWishlist.syncButtonStates();
                }

                // Sync compare button states after products are rendered
                if (window.OptimusCompare) {
                    window.OptimusCompare.syncButtonStates();
                }
            },
            error: function (xhr, status, error) {
                console.error('Error loading newest products:', error, xhr);
                $grid.html(
                    '<div class="col-md-12 text-center" style="padding: 60px 0;">' +
                    '<i class="fa fa-exclamation-triangle fa-3x" style="color: #C8102E;"></i>' +
                    '<p style="margin-top: 20px; color: #777777; font-size: 18px;">Došlo je do greške pri učitavanju proizvoda.</p>' +
                    '<button class="primary-btn" style="margin-top: 20px;" onclick="location.reload()">Pokušaj ponovo</button>' +
                    '</div>'
                );
            }
        });
    }

    // Load products when page is ready
    $(document).ready(function () {
        loadNewestProducts();
    });

})(jQuery);
