/**
 * Cart View Page - Full shopping cart display with quantity management
 */
(function ($) {
    'use strict';

    var Cart = window.OptimusCart;

    function renderCartPage() {
        var $container = $('#cart-container');
        
        Cart.recalculate(function(cartItems) {
            if (cartItems.length === 0) {
                $container.html([
                    '<div class="text-center" style="padding:100px 20px;">',
                    '  <div style="width: 100px; height: 100px; margin: 0 auto 25px; background: #f8f9fa; border-radius: 50%; display: flex; align-items: center; justify-content: center;">',
                    '    <i class="fa fa-shopping-cart" style="font-size:50px; color:#ccc;"></i>',
                    '  </div>',
                    '  <h3 style="color: #999; font-size: 20px; font-weight: 400; margin: 0 0 24px;">Korpa je prazna</h3>',
                    '  <a href="store.html" class="primary-btn">Pogledaj proizvode</a>',
                    '</div>'
                ].join(''));
                return;
            }

            var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23eee' width='150' height='150'/%3E%3C/svg%3E";
            
            // Build cart table
            var rows = cartItems.map(function(item) {
                var imgSrc = item.product.mainImageUrl || IMG_PLACEHOLDER;
                var price = item.product.bestOurWebPrice || item.product.bestRetailPrice || 0;
                var subtotal = price * item.quantity;
                var orderNumber = item.orderNumber || 0;
                
                return [
                    '<tr data-product-id="' + item.product.id + '">',
                    '  <td class="cart-product-order" style="text-align:center;width:50px;vertical-align:middle;">',
                    '    <div style="width:32px;height:32px;background:#D10024;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;margin:0 auto;">',
                    orderNumber,
                    '    </div>',
                    '  </td>',
                    '  <td class="cart-product-img">',
                    '    <img src="' + imgSrc + '" alt="' + item.product.name + '" style="width:80px;height:80px;object-fit:cover;">',
                    '  </td>',
                    '  <td class="cart-product-name">',
                    '    <h4><a href="product.html?slug=' + item.product.slug + '">' + item.product.name + '</a></h4>',
                    '    <p style="color:#999;font-size:12px;">' + (item.product.brandName || '') + '</p>',
                    '  </td>',
                    '  <td class="cart-product-price">' + formatPrice(price) + '</td>',
                    '  <td class="cart-product-quantity">',
                    '    <div class="input-number">',
                    '      <input type="number" value="' + item.quantity + '" min="1" data-product-id="' + item.product.id + '">',
                    '      <span class="qty-up">+</span>',
                    '      <span class="qty-down">-</span>',
                    '    </div>',
                    '  </td>',
                    '  <td class="cart-product-subtotal">' + formatPrice(subtotal) + '</td>',
                    '  <td class="cart-product-remove">',
                    '    <button class="delete" data-product-id="' + item.product.id + '"><i class="fa fa-close"></i></button>',
                    '  </td>',
                    '</tr>'
                ].join('');
            }).join('');

            var total = Cart.calculateTotal(cartItems);
            
            var html = [
                '<div class="order-summary">',
                '  <div class="table-responsive">',
                '    <table class="table">',
                '      <thead>',
                '        <tr>',
                '          <th style="text-align:center;width:50px;">#</th>',
                '          <th></th>',
                '          <th>Proizvod</th>',
                '          <th>Cena</th>',
                '          <th>Količina</th>',
                '          <th>Međuzbir</th>',
                '          <th></th>',
                '        </tr>',
                '      </thead>',
                '      <tbody>',
                rows,
                '      </tbody>',
                '    </table>',
                '  </div>',
                '  <div class="row" style="margin-top:30px;">',
                '    <div class="col-md-6">',
                '      <a href="store.html" class="primary-btn">Nastavi kupovinu</a>',
                '    </div>',
                '    <div class="col-md-6 text-right">',
                '      <div class="order-col" style="margin-bottom:10px;">',
                '        <div><strong>Ukupno:</strong></div>',
                '        <div><strong>' + formatPrice(total) + '</strong></div>',
                '      </div>',
                '      <a href="checkout.html" class="primary-btn" style="margin-top:15px;">Nastavi na naručivanje</a>',
                '    </div>',
                '  </div>',
                '</div>'
            ].join('');
            
            $container.html(html);
        });
    }

    // Update quantity when input changes
    $(document).on('change', '#cart-container input[type="number"]', function() {
        var productId = parseInt($(this).data('product-id'));
        var quantity = parseInt($(this).val());
        
        if (quantity > 0) {
            Cart.updateQuantity(productId, quantity);
            renderCartPage();
        }
    });

    // Quantity up button
    $(document).on('click', '#cart-container .qty-up', function() {
        var $input = $(this).siblings('input[type="number"]');
        var currentValue = parseInt($input.val()) || 1;
        var newValue = currentValue + 1;
        $input.val(newValue);
        $input.trigger('change');
    });

    // Quantity down button
    $(document).on('click', '#cart-container .qty-down', function() {
        var $input = $(this).siblings('input[type="number"]');
        var currentValue = parseInt($input.val()) || 1;
        var newValue = currentValue - 1;
        if (newValue >= 1) {
            $input.val(newValue);
            $input.trigger('change');
        }
    });

    // Remove item
    $(document).on('click', '#cart-container .delete', function() {
        var productId = parseInt($(this).data('product-id'));
        Cart.remove(productId);
        renderCartPage();
    });

    $(document).ready(function() {
        renderCartPage();
    });

})(jQuery);
