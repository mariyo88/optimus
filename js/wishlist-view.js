/**
 * Wishlist View Page - Full wishlist display with move-to-cart functionality
 */
(function ($) {
    'use strict';

    var Cart     = window.OptimusCart;
    var Wishlist = window.OptimusWishlist;

    var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23eee' width='150' height='150'/%3E%3C/svg%3E";

    function formatPrice(price) {
        return price.toLocaleString('sr-RS') + ' RSD';
    }

    // Cached enriched items for DOM-only updates
    var cachedItems = [];

    /**
     * Validates all wishlist items against the API — removes inactive/deleted products
     * from localStorage, shows a banner if any were removed, then renders the page.
     * Mirrors the recalculate() pattern used in cart.js.
     */
    function validateAndLoad(callback) {
        var list = Wishlist.get();

        if (list.length === 0) {
            callback([]);
            return;
        }

        var API_BASE = window.APP_CONFIG.API_BASE;
        var loadedCount = 0;
        var validItems = [];
        var removedNames = [];

        list.forEach(function (item) {
            var identifier = item.productSlug || item.productId;

            $.ajax({
                url: API_BASE + '/api/products/' + identifier,
                method: 'GET',
                success: function (product) {
                    if (product.active === false) {
                        // Inactive — remove from localStorage silently
                        removedNames.push(product.name || String(identifier));
                        Wishlist.remove(item.productId);
                        return;
                    }
                    validItems.push({ product: product, addedAt: item.addedAt });
                },
                error: function () {
                    // 404 / deleted — remove from localStorage
                    removedNames.push(String(identifier));
                    Wishlist.remove(item.productId);
                },
                complete: function () {
                    loadedCount++;
                    if (loadedCount === list.length) {
                        if (removedNames.length > 0) {
                            showRemovedBanner(removedNames);
                        }
                        // Preserve add-order (newest first)
                        validItems.sort(function (a, b) {
                            return new Date(b.addedAt) - new Date(a.addedAt);
                        });
                        callback(validItems);
                    }
                }
            });
        });
    }

    function showRemovedBanner(names) {
        var isSingle = names.length === 1;
        var message = isSingle
            ? '"' + names[0] + '" je uklonjen iz liste želja jer više nije dostupan.'
            : names.length + ' artikla su uklonjena iz liste želja jer više nisu dostupna.';

        $('#wl-removed-banner').remove();

        var $banner = $([
            '<div id="wl-removed-banner" style="',
            '  position:fixed;top:0;left:0;right:0;',
            '  z-index:10001;',
            '  background:linear-gradient(135deg,#2a0008 0%,#1E1F29 100%);',
            '  padding:10px 15px;',
            '  transform:translateY(-100%);',
            '  transition:transform 0.35s cubic-bezier(0.4,0,0.2,1);',
            '">',
            '  <i class="fa fa-ban" style="color:#D10024;margin-right:5px;font-size:12px;"></i>',
            '  <span style="color:#fff;font-size:12px;">' + message + '</span>',
            '</div>'
        ].join(''));

        $('body').append($banner);

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                $banner.css('transform', 'translateY(0)');
            });
        });

        setTimeout(function () {
            $banner.css('transform', 'translateY(-100%)');
            setTimeout(function () { $banner.remove(); }, 400);
        }, 5000);
    }

    function renderWishlistPage() {
        var $container = $('#wishlist-container');
        $container.html('<div class="text-center" style="padding:40px;"><i class="fa fa-spinner fa-spin fa-2x"></i></div>');

        validateAndLoad(function (items) {
            cachedItems = items;
            buildWishlistHTML(items, $container);
        });
    }

    function buildWishlistHTML(items, $container) {
        $container = $container || $('#wishlist-container');

        if (items.length === 0) {
            $container.html(
                '<div class="wl-empty-wrap">' +
                '  <div class="empty-icon"><i class="fa fa-heart-o"></i></div>' +
                '  <h3>Lista želja je prazna</h3>' +
                '  <a href="store.html" class="primary-btn">Pogledaj proizvode</a>' +
                '</div>'
            );
            return;
        }

        var rows = items.map(function (item) {
            var p        = item.product;
            var imgSrc   = p.mainImageUrl || IMG_PLACEHOLDER;
            var price    = p.bestOurWebPrice || p.bestRetailPrice || 0;
            var oldPrice = (p.bestOurWebPrice && p.bestRetailPrice && p.bestRetailPrice > p.bestOurWebPrice)
                ? p.bestRetailPrice : null;
            var brand    = p.brandName
                ? '<span class="brand-tag">' + p.brandName + '</span>'
                : '';
            var inStock  = p.stock > 0 || p.inStock;
            var stockBadge = inStock
                ? '<span class="wl-stock-badge in-stock"><i class="fa fa-check" style="margin-right:4px;"></i>Na stanju</span>'
                : '<span class="wl-stock-badge out-stock"><i class="fa fa-times" style="margin-right:4px;"></i>Nema na stanju</span>';
            var addedDate = item.addedAt
                ? new Date(item.addedAt).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : '';

            return [
                '<tr data-product-id="' + p.id + '">',

                '  <td class="wl-product-img" style="width:100px;">',
                '    <a href="product.html?slug=' + p.slug + '">',
                '      <img src="' + imgSrc + '" alt="' + p.name + '">',
                '    </a>',
                '  </td>',

                '  <td class="wl-product-name">',
                '    <h4><a href="product.html?slug=' + p.slug + '" title="' + p.name + '">' + p.name + '</a></h4>',
                '    ' + brand,
                '  </td>',

                '  <td class="wl-product-price" style="width:160px;">',
                '    ' + (price > 0 ? formatPrice(price) : '<span style="color:#aaa;">Cena nije dostupna</span>'),
                '    ' + (oldPrice ? '<span class="wl-product-old-price">' + formatPrice(oldPrice) + '</span>' : ''),
                '  </td>',

                '  <td style="width:140px;">',
                '    ' + stockBadge,
                '  </td>',

                '  <td style="width:110px;color:#aaa;font-size:12px;">' + addedDate + '</td>',

                '  <td style="width:160px;">',
                '    <button class="wl-add-cart-btn" ' +
                            'data-product-id="' + p.id + '" ' +
                            'data-product-slug="' + (p.slug || '') + '" ' +
                            (inStock ? '' : 'disabled') + '>',
                '      <i class="fa fa-shopping-cart"></i>' + (inStock ? ' U korpu' : ' Nije dostupno'),
                '    </button>',
                '  </td>',

                '  <td style="width:50px;text-align:center;">',
                '    <button class="wl-remove-btn" data-product-id="' + p.id + '" title="Ukloni iz liste">',
                '      <i class="fa fa-trash-o"></i>',
                '    </button>',
                '  </td>',

                '</tr>'
            ].join('');
        }).join('');

        var inStockCount = items.filter(function (i) { return i.product.stock > 0 || i.product.inStock; }).length;

        var html = [
            // ── Summary panel - iznad tabele ────────────────────────────────
            '<div class="row">',
            '  <div class="col-md-12">',
            '    <div class="wl-summary-panel-horizontal">',
            '      <div class="wl-summary-stats">',
            '        <div class="wl-stat-item">',
            '          <div class="wl-stat-icon"><i class="fa fa-heart"></i></div>',
            '          <div class="wl-stat-content">',
            '            <span class="wl-stat-label">Ukupno artikala</span>',
            '            <span class="wl-stat-value" id="wl-item-count">' + items.length + '</span>',
            '          </div>',
            '        </div>',
            '        <div class="wl-stat-item">',
            '          <div class="wl-stat-icon" style="background:#e8f7ef;"><i class="fa fa-check" style="color:#27ae60;"></i></div>',
            '          <div class="wl-stat-content">',
            '            <span class="wl-stat-label">Na stanju</span>',
            '            <span class="wl-stat-value" style="color:#27ae60;" id="wl-in-stock-count">' + inStockCount + '</span>',
            '          </div>',
            '        </div>',
            '      </div>',
            '      <div class="wl-summary-actions">',
            '        <button class="wl-move-all-btn" id="wl-move-all-btn">',
            '          <i class="fa fa-shopping-cart"></i>Dodaj sve dostupne u korpu',
            '        </button>',
            '        <button class="wl-clear-btn" id="wl-clear-btn">',
            '          <i class="fa fa-trash-o"></i>Obriši listu',
            '        </button>',
            '      </div>',
            '    </div>',
            '  </div>',
            '</div>',

            // ── Tabela - puna širina ─────────────────────────────────────────
            '<div class="row">',
            '  <div class="col-md-12">',
            '    <div class="wishlist-table-wrap">',
            '      <div class="table-responsive">',
            '        <table class="table">',
            '          <thead><tr>',
            '            <th></th>',
            '            <th>Proizvod</th>',
            '            <th>Cena</th>',
            '            <th>Dostupnost</th>',
            '            <th>Dodato</th>',
            '            <th></th>',
            '            <th></th>',
            '          </tr></thead>',
            '          <tbody>' + rows + '</tbody>',
            '        </table>',
            '      </div>',
            '    </div>',
            '    <a href="store.html" class="wl-continue-link">',
            '      <i class="fa fa-arrow-left"></i> Nastavi kupovinu',
            '    </a>',
            '  </div>',
            '</div>'
        ].join('');

        $container.html(html);
    }

    // ── Event handlers ────────────────────────────────────────────────────────

    // "U korpu" per-row button
    $(document).on('click', '#wishlist-container .wl-add-cart-btn', function () {
        var $btn       = $(this);
        var productId  = parseInt($btn.data('product-id'));
        var productSlug = $btn.data('product-slug');

        Cart.add(productId, 1, productSlug);
    });

    // Remove row
    $(document).on('click', '#wishlist-container .wl-remove-btn', function () {
        var productId = parseInt($(this).data('product-id'));
        Wishlist.remove(productId);
        cachedItems = cachedItems.filter(function (i) { return i.product.id !== productId; });

        if (cachedItems.length === 0) {
            renderWishlistPage();
            return;
        }

        $('tr[data-product-id="' + productId + '"]').remove();
        updateSummaryPanel();
    });

    // "Dodaj sve dostupne u korpu"
    $(document).on('click', '#wl-move-all-btn', function () {
        var available = cachedItems.filter(function (i) { return i.product.stock > 0 || i.product.inStock; });
        if (available.length === 0) return;

        available.forEach(function (item) {
            Cart.add(item.product.id, 1, item.product.slug);
        });
    });

    // "Obriši listu"
    $(document).on('click', '#wl-clear-btn', function () {
        $('#wl-confirm-modal').addClass('active');
    });

    // Modal handlers
    $(document).on('click', '#wl-modal-cancel, #wl-modal-close-x, .wl-confirm-modal', function (e) {
        if (e.target === this) {
            $('#wl-confirm-modal').removeClass('active');
        }
    });

    $(document).on('click', '#wl-modal-confirm', function () {
        $('#wl-confirm-modal').removeClass('active');
        Wishlist.clear();
        cachedItems = [];
        renderWishlistPage();
    });

    // Prevent modal content click from closing modal
    $(document).on('click', '.wl-confirm-content', function (e) {
        e.stopPropagation();
    });

    // Close modal on ESC key
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && $('#wl-confirm-modal').hasClass('active')) {
            $('#wl-confirm-modal').removeClass('active');
        }
    });

    function updateSummaryPanel() {
        var inStockCount = cachedItems.filter(function (i) { return i.product.stock > 0 || i.product.inStock; }).length;
        $('#wl-item-count').text(cachedItems.length);
        $('#wl-in-stock-count').text(inStockCount);
    }

    // ── Init ─────────────────────────────────────────────────────────────────

    $(document).ready(function () {
        renderWishlistPage();
    });

})(jQuery);
