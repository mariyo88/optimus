/**
 * Checkout Page - Integrates cart with order form and submits to backend
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;
    var Cart = window.OptimusCart;

    function renderOrderSummary() {
        Cart.loadDetails(function(cartItems) {
            if (cartItems.length === 0) {
                $('.order-details').html([
                    '<div class="text-center" style="padding:40px;">',
                    '  <i class="fa fa-shopping-cart" style="font-size:60px;color:#ddd;margin-bottom:20px;"></i>',
                    '  <h4>Vaša korpa je prazna</h4>',
                    '  <p style="color:#999;margin:20px 0;">Dodajte proizvode u korpu pre nego što nastavite na naručivanje.</p>',
                    '  <a href="store.html" class="primary-btn">Idite u prodavnicu</a>',
                    '</div>'
                ].join('')).css('visibility', 'visible');
                return;
            }

            var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23eee' width='80' height='80'/%3E%3C/svg%3E";

            var productsHtml = cartItems.map(function(item) {
                var price = item.product.bestOurWebPrice || item.product.bestRetailPrice || 0;
                var subtotal = price * item.quantity;
                var imgSrc = item.product.mainImageUrl || IMG_PLACEHOLDER;
                return [
                    '<div class="order-product-row">',
                    '  <div class="op-badge">' + item.quantity + '</div>',
                    '  <img class="op-img" src="' + imgSrc + '" alt="' + item.product.name + '">',
                    '  <div class="op-info">',
                    '    <span class="op-name">' + item.product.name + '</span>',
                    '    <span class="op-qty">kom: ' + item.quantity + '</span>',
                    '  </div>',
                    '  <div class="op-price">' + formatPrice(subtotal) + '</div>',
                    '</div>'
                ].join('');
            }).join('');

            var total = Cart.calculateTotal(cartItems);

            var html = [
                '<div class="section-title text-center">',
                '  <h3 class="title">Vaša porudžbina</h3>',
                '</div>',
                '<div class="order-summary">',
                '  <div class="order-summary-header">',
                '    <span>Proizvod</span>',
                '    <span>Cena</span>',
                '  </div>',
                '  <div class="order-product-list">',
                productsHtml,
                '  </div>',
                '  <div class="order-totals">',
                '    <div class="order-totals-row">',
                '      <span>Isporuka</span>',
                '      <span class="free-shipping-badge">Po dogovoru</span>',
                '    </div>',
                '    <div class="order-totals-row grand-total">',
                '      <span>Ukupno</span>',
                '      <span>' + formatPrice(total) + '</span>',
                '    </div>',
                '  </div>',
                '</div>',
                '<div class="payment-method">',
                '  <div class="input-radio">',
                '    <input type="radio" name="payment" id="payment-1" checked>',
                '    <label for="payment-1">',
                '      <span></span>',
                '      Direktna bankarska uplata',
                '    </label>',
                '    <div class="caption">',
                '      <p>Izvršite uplatu direktno na naš bankovni račun. Koristite broj porudžbine kao referencu za plaćanje.</p>',
                '    </div>',
                '  </div>',
                '  <div class="input-radio">',
                '    <input type="radio" name="payment" id="payment-2">',
                '    <label for="payment-2">',
                '      <span></span>',
                '      Plaćanje pouzećem',
                '    </label>',
                '    <div class="caption">',
                '      <p>Platite gotovinom pri isporuci proizvoda.</p>',
                '    </div>',
                '  </div>',
                '</div>',
                '<div class="input-checkbox">',
                '  <input type="checkbox" id="terms">',
                '  <label for="terms">',
                '    <span></span>',
                '    Pročitao/la sam i prihvatam <a href="#">uslove korišćenja</a>',
                '  </label>',
                '</div>',
                '<button type="button" id="order-submit-btn" class="primary-btn order-submit">Pošalji porudžbinu</button>'
            ].join('');

            $('.order-details').html(html).css('visibility', 'visible');
        });
    }

    function validateForm() {
        var errors = [];

        var firstName = $('input[name="first-name"]').val().trim();
        var lastName  = $('input[name="last-name"]').val().trim();
        var email     = $('input[name="email"]').val().trim();
        var address   = $('input[name="address"]').val().trim();
        var city      = $('input[name="city"]').val().trim();

        if (!firstName) errors.push('Ime je obavezno.');
        if (!lastName)  errors.push('Prezime je obavezno.');
        if (!email)     errors.push('Email je obavezan.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email adresa nije ispravna.');
        if (!address)   errors.push('Adresa je obavezna.');
        if (!city)      errors.push('Grad je obavezan.');

        if (!$('#terms').is(':checked')) {
            errors.push('Molimo vas da prihvatite uslove korišćenja.');
        }

        return errors;
    }

    function buildDeliveryAddress() {
        var parts = [
            $('input[name="address"]').val().trim(),
            $('input[name="city"]').val().trim(),
            $('input[name="zip-code"]').val().trim(),
            $('input[name="country"]').val().trim()
        ].filter(Boolean);
        return parts.join(', ');
    }

    function submitOrder() {
        var errors = validateForm();
        if (errors.length > 0) {
            showFormError(errors.join('\n'));
            return;
        }

        Cart.recalculate(function(cartItems) {
            if (cartItems.length === 0) {
                showFormError('Vaša korpa je prazna.');
                return;
            }

            var firstName = $('input[name="first-name"]').val().trim();
            var lastName  = $('input[name="last-name"]').val().trim();
            var phone     = $('input[name="tel"]').val().trim();

            var payload = {
                customerName:    firstName + ' ' + lastName,
                customerEmail:   $('input[name="email"]').val().trim(),
                customerPhone:   phone || null,
                deliveryAddress: buildDeliveryAddress(),
                items: cartItems.map(function(item) {
                    return {
                        productId: item.product.id,
                        quantity:  item.quantity
                    };
                })
            };

            var $btn = $('#order-submit-btn');
            $btn.prop('disabled', true).text('Slanje...');
            hideFormError();

            $.ajax({
                url: API_BASE + '/api/orders',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(payload),
                success: function(response) {
                    Cart.clear();
                    window.location.href = 'order-confirmation.html?orderId=' + response.id + '&orderNumber=' + encodeURIComponent(response.orderNumber);
                },
                error: function(xhr) {
                    $btn.prop('disabled', false).text('Pošalji porudžbinu');
                    var msg = 'Greška pri slanju porudžbine. Pokušajte ponovo.';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        msg = xhr.responseJSON.message;
                    } else if (xhr.status === 400 && xhr.responseJSON) {
                        // Validation errors from BE
                        var details = xhr.responseJSON;
                        if (details.errors) {
                            msg = Object.values(details.errors).join('\n');
                        }
                    }
                    showFormError(msg);
                }
            });
        });
    }

    function showFormError(msg) {
        var $err = $('#checkout-error');
        if (!$err.length) {
            $err = $('<div id="checkout-error" class="alert alert-danger" style="margin-top:15px;">');
            $('.order-details').prepend($err);
        }
        $err.text(msg).show();
        $('html, body').animate({ scrollTop: $('#checkout-error').offset().top - 20 }, 300);
    }

    function hideFormError() {
        $('#checkout-error').hide();
    }

    // Delegated click — works even after order-details is re-rendered
    $(document).on('click', '#order-submit-btn', function(e) {
        e.preventDefault();
        submitOrder();
    });

    // Handle terms and conditions link click
    $(document).on('click', 'label[for="terms"] a', function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = 'terms-and-conditions.html';
    });

    $(document).ready(function() {
        renderOrderSummary();
    });

})(jQuery);
