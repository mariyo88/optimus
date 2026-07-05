/**
 * Cart View Page - Full shopping cart display with quantity management
 */
(function ($) {
    'use strict';

    var Cart = window.OptimusCart;

    function formatPrice(price) {
        return price.toLocaleString('sr-RS') + ' RSD';
    }

    var cachedCartItems = [];

    function renderCartPage() {
        var $container = $('#cart-container');

        Cart.loadDetails(function(cartItems) {
            cachedCartItems = cartItems;
            buildCartHTML(cartItems, $container);
        });
    }

    function buildCartHTML(cartItems, $container) {
        $container = $container || $('#cart-container');

        if (cartItems.length === 0) {
            $container.html(
                '<div class="cart-empty-wrap">' +
                '  <div class="empty-icon"><i class="fa fa-shopping-cart"></i></div>' +
                '  <h3>Korpa je prazna</h3>' +
                '  <a href="store.html" class="primary-btn">Pogledaj proizvode</a>' +
                '</div>'
            );
            return;
        }

            var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23eee' width='150' height='150'/%3E%3C/svg%3E";

            var rows = cartItems.map(function(item) {
                var imgSrc = item.product.mainImageUrl || IMG_PLACEHOLDER;
                var price = item.product.bestOurWebPrice || item.product.bestRetailPrice || 0;
                var subtotal = price * item.quantity;
                var orderNumber = item.orderNumber || 0;
                var brand = item.product.brandName
                    ? '<span class="brand-tag">' + item.product.brandName + '</span>'
                    : '';

                return [
                    '<tr data-product-id="' + item.product.id + '">',
                    '  <td style="width:50px;text-align:center;">',
                    '    <div class="cart-order-badge">' + orderNumber + '</div>',
                    '  </td>',
                    '  <td class="cart-product-img" style="width:100px;">',
                    '    <a href="product.html?slug=' + item.product.slug + '">',
                    '      <img src="' + imgSrc + '" alt="' + item.product.name + '">',
                    '    </a>',
                    '  </td>',
                    '  <td class="cart-product-name">',
                    '    <h4><a href="product.html?slug=' + item.product.slug + '" title="' + item.product.name + '">' + item.product.name + '</a></h4>',
                    '    ' + brand,
                    '  </td>',
                    '  <td style="width:130px;">',
                    '    <div class="qty-control">',
                    '      <button class="qty-down" data-product-id="' + item.product.id + '">&#8722;</button>',
                    '      <input type="number" value="' + item.quantity + '" min="1"' + (item.product.stock > 0 ? ' max="' + item.product.stock + '"' : '') + ' data-product-id="' + item.product.id + '">',
                    '      <button class="qty-up" data-product-id="' + item.product.id + '">&#43;</button>',
                    '    </div>',
                    '  </td>',
                    '  <td class="cart-product-subtotal">' + formatPrice(subtotal) + '</td>',
                    '  <td style="width:50px;text-align:center;">',
                    '    <button class="cart-remove-btn delete" data-product-id="' + item.product.id + '" title="Ukloni">',
                    '      <i class="fa fa-trash-o"></i>',
                    '    </button>',
                    '  </td>',
                    '</tr>'
                ].join('');
            }).join('');

            var total = Cart.calculateTotal(cartItems);
            var itemCount = cartItems.reduce(function(acc, i) { return acc + i.quantity; }, 0);

            var html = [
                '<div class="row" style="align-items:flex-start;">',

                // Left: table
                '  <div class="col-md-9">',
                '    <div class="cart-table-wrap">',
                '      <div class="table-responsive">',
                '        <table class="table">',
                '          <thead><tr>',
                '            <th style="text-align:center;width:50px;">#</th>',
                '            <th></th>',
                '            <th>Proizvod</th>',
                '            <th>Količina</th>',
                '            <th>Cena</th>',
                '            <th></th>',
                '          </tr></thead>',
                '          <tbody>' + rows + '</tbody>',
                '        </table>',
                '      </div>',
                '    </div>',
                '    <a href="store.html" class="cart-continue-link">',
                '      <i class="fa fa-arrow-left"></i> Nastavi kupovinu',
                '    </a>',
                '  </div>',

                // Right: summary panel
                '  <div class="col-md-3">',
                '    <div class="cart-summary-panel">',
                '      <h4>Pregled narudžbine</h4>',
                '      <div class="cart-summary-row">',
                '        <span>Broj artikala</span><span>' + itemCount + '</span>',
                '      </div>',
                '      <div class="cart-summary-row">',
                '        <span>Dostava</span><span style="color:#27ae60;font-weight:600;">Po dogovoru</span>',
                '      </div>',
                '      <div class="cart-summary-row total">',
                '        <span>Ukupno</span><span>' + formatPrice(total) + '</span>',
                '      </div>',
                '      <a href="checkout.html" class="cart-checkout-btn">',
                '        <i class="fa fa-lock"></i> &nbsp;Naruči',
                '      </a>',
                '    </div>',
                '  </div>',

                '</div>'
            ].join('');

            $container.html(html);
    }

    // Ažurira subtotal i ukupan iznos bez novog API poziva
    function updateTotalsInDOM(productId, quantity) {
        var item = cachedCartItems.find(function(i) { return i.product.id === productId; });
        if (!item) return;

        item.quantity = quantity;
        var price = item.product.bestOurWebPrice || item.product.bestRetailPrice || 0;
        var subtotal = price * quantity;

        var $row = $('tr[data-product-id="' + productId + '"]');
        $row.find('.cart-product-subtotal').text(formatPrice(subtotal));

        var total = Cart.calculateTotal(cachedCartItems);
        var itemCount = cachedCartItems.reduce(function(acc, i) { return acc + i.quantity; }, 0);
        $('.cart-summary-panel .cart-summary-row:first-child span:last-child').text(itemCount);
        $('.cart-summary-panel .cart-summary-row.total span:last-child').text(formatPrice(total));
    }

    // Quantity input change — samo localStorage + DOM update, bez API poziva
    $(document).on('change', '#cart-container input[type="number"]', function() {
        var productId = parseInt($(this).data('product-id'));
        var quantity = parseInt($(this).val());
        if (quantity > 0) {
            Cart.updateQuantity(productId, quantity);
            updateTotalsInDOM(productId, quantity);
        }
    });

    // Qty +
    $(document).on('click', '#cart-container .qty-up', function() {
        var $input = $(this).siblings('input[type="number"]');
        var val = (parseInt($input.val()) || 1) + 1;
        var max = parseInt($input.attr('max'));
        if (!isNaN(max) && val > max) val = max;
        $input.val(val).trigger('change');
    });

    // Qty -
    $(document).on('click', '#cart-container .qty-down', function() {
        var $input = $(this).siblings('input[type="number"]');
        var val = (parseInt($input.val()) || 2) - 1;
        if (val >= 1) { $input.val(val).trigger('change'); }
    });

    // Direktan unos — ograniči na [1, max]
    $(document).on('input', '#cart-container input[type="number"]', function() {
        var max = parseInt($(this).attr('max'));
        var val = parseInt($(this).val());
        if (!isNaN(max) && val > max) $(this).val(max);
        if (val < 1) $(this).val(1);
    });

    // Remove item — ukloni iz cache-a i DOM-a bez novog API poziva
    $(document).on('click', '#cart-container .delete', function() {
        var productId = parseInt($(this).data('product-id'));
        Cart.remove(productId);
        cachedCartItems = cachedCartItems.filter(function(i) { return i.product.id !== productId; });

        if (cachedCartItems.length === 0) {
            renderCartPage(); // prazna korpa — pusti full render
            return;
        }

        $('tr[data-product-id="' + productId + '"]').remove();

        var total = Cart.calculateTotal(cachedCartItems);
        var itemCount = cachedCartItems.reduce(function(acc, i) { return acc + i.quantity; }, 0);
        $('.cart-summary-panel .cart-summary-row:first-child span:last-child').text(itemCount);
        $('.cart-summary-panel .cart-summary-row.total span:last-child').text(formatPrice(total));
    });

    $(document).ready(function() {
        // Single recalculate on page load to remove inactive/deleted products
        Cart.recalculate(function() {
            renderCartPage();
        });
    });

})(jQuery);
