/**
 * Cart View Page - Full shopping cart display with quantity management
 */
(function ($) {
    'use strict';

    var Cart = window.OptimusCart;

    function renderCartPage() {
        var $container = $('#cart-container');
        
        Cart.loadDetails(function(cartItems) {
            if (cartItems.length === 0) {
                $container.html([
                    '<div class="text-center" style="padding:60px 20px;">',
                    '  <i class="fa fa-shopping-cart" style="font-size:80px;color:#ddd;margin-bottom:20px;"></i>',
                    '  <h3>Vaša korpa je prazna</h3>',
                    '  <p style="color:#999;margin-bottom:30px;">Dodajte proizvode u korpu da biste nastavili.</p>',
                    '  <a href="store-modern.html" class="primary-btn">Nastavite kupovinu</a>',
                    '</div>'
                ].join(''));
                return;
            }

            var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23eee' width='150' height='150'/%3E%3C/svg%3E";
            
            // Build cart table
            var rows = cartItems.map(function(item) {
                var imgSrc = item.product.mainImageUrl || IMG_PLACEHOLDER;
                var price = item.product.bestRetailPrice || item.product.bestB2bPrice || 0;
                var subtotal = price * item.quantity;
                
                return [
                    '<tr data-product-id="' + item.product.id + '">',
                    '  <td class="cart-product-img">',
                    '    <img src="' + imgSrc + '" alt="' + item.product.name + '" style="width:80px;height:80px;object-fit:cover;">',
                    '  </td>',
                    '  <td class="cart-product-name">',
                    '    <h4><a href="product.html?slug=' + item.product.slug + '">' + item.product.name + '</a></h4>',
                    '    <p style="color:#999;font-size:12px;">' + (item.product.brandName || '') + '</p>',
                    '  </td>',
                    '  <td class="cart-product-price">$' + parseFloat(price).toFixed(2) + '</td>',
                    '  <td class="cart-product-quantity">',
                    '    <div class="input-number">',
                    '      <input type="number" value="' + item.quantity + '" min="1" data-product-id="' + item.product.id + '">',
                    '      <span class="qty-up">+</span>',
                    '      <span class="qty-down">-</span>',
                    '    </div>',
                    '  </td>',
                    '  <td class="cart-product-subtotal">$' + subtotal.toFixed(2) + '</td>',
                    '  <td class="cart-product-remove">',
                    '    <button class="delete" data-product-id="' + item.product.id + '"><i class="fa fa-close"></i></button>',
                    '  </td>',
                    '</tr>'
                ].join('');
            }).join('');

            var retailTotal = Cart.calculateTotal(cartItems, 'retail');
            var b2bTotal = Cart.calculateTotal(cartItems, 'b2b');
            
            var html = [
                '<div class="order-summary">',
                '  <div class="table-responsive">',
                '    <table class="table">',
                '      <thead>',
                '        <tr>',
                '          <th></th>',
                '          <th>Product</th>',
                '          <th>Price</th>',
                '          <th>Quantity</th>',
                '          <th>Subtotal</th>',
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
                '      <a href="store-modern.html" class="primary-btn">Continue Shopping</a>',
                '    </div>',
                '    <div class="col-md-6 text-right">',
                '      <div class="order-col" style="margin-bottom:10px;">',
                '        <div><strong>Retail Total:</strong></div>',
                '        <div><strong>$' + retailTotal.toFixed(2) + '</strong></div>',
                '      </div>',
                (b2bTotal > 0 ? [
                    '      <div class="order-col" style="margin-bottom:10px;">',
                    '        <div><strong>B2B Total:</strong></div>',
                    '        <div><strong>$' + b2bTotal.toFixed(2) + '</strong></div>',
                    '      </div>'
                ].join('') : ''),
                '      <a href="checkout.html" class="primary-btn" style="margin-top:15px;">Proceed to Checkout</a>',
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
