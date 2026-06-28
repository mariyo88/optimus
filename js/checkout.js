/**
 * Checkout Page - Integrates cart with order form
 */
(function ($) {
    'use strict';

    var Cart = window.OptimusCart;

    function renderOrderSummary() {
        Cart.recalculate(function(cartItems) {
            if (cartItems.length === 0) {
                $('.order-details').html([
                    '<div class="text-center" style="padding:40px;">',
                    '  <i class="fa fa-shopping-cart" style="font-size:60px;color:#ddd;margin-bottom:20px;"></i>',
                    '  <h4>Vaša korpa je prazna</h4>',
                    '  <p style="color:#999;margin:20px 0;">Dodajte proizvode u korpu pre nego što nastavite na checkout.</p>',
                    '  <a href="store-modern.html" class="primary-btn">Idite u prodavnicu</a>',
                    '</div>'
                ].join(''));
                return;
            }

            var productsHtml = cartItems.map(function(item) {
                var price = item.product.bestRetailPrice || 0;
                var subtotal = price * item.quantity;
                
                return [
                    '<div class="order-col">',
                    '  <div>' + item.quantity + 'x ' + item.product.name + '</div>',
                    '  <div>' + formatPrice(subtotal) + '</div>',
                    '</div>'
                ].join('');
            }).join('');

            var total = Cart.calculateTotal(cartItems, 'retail');
            
            var html = [
                '<div class="section-title text-center">',
                '  <h3 class="title">Your Order</h3>',
                '</div>',
                '<div class="order-summary">',
                '  <div class="order-col">',
                '    <div><strong>PRODUCT</strong></div>',
                '    <div><strong>TOTAL</strong></div>',
                '  </div>',
                '  <div class="order-products">',
                productsHtml,
                '  </div>',
                '  <div class="order-col">',
                '    <div>Shipping</div>',
                '    <div><strong>FREE</strong></div>',
                '  </div>',
                '  <div class="order-col">',
                '    <div><strong>TOTAL</strong></div>',
                '    <div><strong class="order-total">' + formatPrice(total) + '</strong></div>',
                '  </div>',
                '</div>',
                '<div class="payment-method">',
                '  <div class="input-radio">',
                '    <input type="radio" name="payment" id="payment-1" checked>',
                '    <label for="payment-1">',
                '      <span></span>',
                '      Direct Bank Transfer',
                '    </label>',
                '    <div class="caption">',
                '      <p>Izvršite uplatu direktno na naš bankovni račun. Koristite ID porudžbine kao referencu za plaćanje.</p>',
                '    </div>',
                '  </div>',
                '  <div class="input-radio">',
                '    <input type="radio" name="payment" id="payment-2">',
                '    <label for="payment-2">',
                '      <span></span>',
                '      Cash on Delivery',
                '    </label>',
                '    <div class="caption">',
                '      <p>Platite gotovinom pri isporuci proizvoda.</p>',
                '    </div>',
                '  </div>',
                '  <div class="input-radio">',
                '    <input type="radio" name="payment" id="payment-3">',
                '    <label for="payment-3">',
                '      <span></span>',
                '      PayPal System',
                '    </label>',
                '    <div class="caption">',
                '      <p>Platite putem PayPal-a brzo i sigurno.</p>',
                '    </div>',
                '  </div>',
                '</div>',
                '<div class="input-checkbox">',
                '  <input type="checkbox" id="terms">',
                '  <label for="terms">',
                '    <span></span>',
                '    I\'ve read and accept the <a href="#">terms & conditions</a>',
                '  </label>',
                '</div>',
                '<a href="#" class="primary-btn order-submit">Place order</a>'
            ].join('');
            
            $('.order-details').html(html);
        });
    }

    // Handle order submission
    $(document).on('click', '.order-submit', function(e) {
        e.preventDefault();
        
        // Validate terms acceptance
        if (!$('#terms').is(':checked')) {
            alert('Molimo vas da prihvatite uslove korišćenja.');
            return;
        }

        // Validate form fields
        var firstName = $('input[name="first-name"]').val().trim();
        var lastName = $('input[name="last-name"]').val().trim();
        var email = $('input[name="email"]').val().trim();
        var address = $('input[name="address"]').val().trim();
        var city = $('input[name="city"]').val().trim();
        var tel = $('input[name="tel"]').val().trim();

        if (!firstName || !lastName || !email || !address || !city || !tel) {
            alert('Molimo vas da popunite sva obavezna polja.');
            return;
        }

        // Get selected payment method
        var paymentMethod = $('input[name="payment"]:checked').attr('id');
        
        // In a real application, this would send data to backend
        alert('Vaša porudžbina je uspešno kreirana!\n\nOvo je demo verzija. U pravoj aplikaciji, podaci bi bili poslati na server.');
        
        // Clear cart after successful order
        Cart.clear();
        
        // Redirect to confirmation page or home
        window.location.href = 'index.html';
    });

    $(document).ready(function() {
        renderOrderSummary();
    });

})(jQuery);
