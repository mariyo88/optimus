/**
 * Order Confirmation Page
 * Fetches order details from backend and displays confirmation message
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;

    function getParam(name) {
        return new URLSearchParams(window.location.search).get(name) || '';
    }

    function renderConfirmation(order) {
        var itemsHtml = order.items.map(function(item) {
            return [
                '<tr>',
                '  <td>' + item.productName + '</td>',
                '  <td class="text-center">' + item.quantity + '</td>',
                '  <td class="text-right">' + formatPrice(item.totalPrice) + '</td>',
                '</tr>'
            ].join('');
        }).join('');

        var html = [
            '<div style="',
            '    background:#fff;',
            '    border:1px solid #e5e5e5;',
            '    border-radius:4px;',
            '    padding:40px;',
            '    text-align:center;',
            '">',
            '  <div style="',
            '      width:80px;height:80px;',
            '      background:#d4edda;',
            '      border-radius:50%;',
            '      display:inline-flex;',
            '      align-items:center;',
            '      justify-content:center;',
            '      margin-bottom:20px;',
            '  ">',
            '    <i class="fa fa-check" style="font-size:36px;color:#28a745;"></i>',
            '  </div>',
            '  <h2 style="margin-bottom:10px;">Hvala na porudžbini!</h2>',
            '  <p style="color:#666;font-size:16px;margin-bottom:30px;">',
            '    Vaša porudžbina je uspešno primljena. Kontaktiraćemo vas uskoro.',
            '  </p>',
            '  <div style="',
            '      background:#f8f9fa;',
            '      border-radius:4px;',
            '      padding:20px;',
            '      margin-bottom:30px;',
            '      display:inline-block;',
            '      min-width:300px;',
            '  ">',
            '    <p style="margin:0;font-size:14px;color:#999;">Broj porudžbine</p>',
            '    <h3 style="margin:5px 0 0;color:#D10024;letter-spacing:1px;">' + order.orderNumber + '</h3>',
            '  </div>',
            '  <div style="text-align:left;margin-bottom:30px;">',
            '    <table class="table table-bordered" style="font-size:14px;">',
            '      <thead>',
            '        <tr>',
            '          <th>Proizvod</th>',
            '          <th class="text-center" style="width:80px;">Kol.</th>',
            '          <th class="text-right" style="width:120px;">Ukupno</th>',
            '        </tr>',
            '      </thead>',
            '      <tbody>',
            itemsHtml,
            '      </tbody>',
            '      <tfoot>',
            '        <tr>',
            '          <td colspan="2" class="text-right"><strong>Isporuka</strong></td>',
            '          <td class="text-right"><strong>BESPLATNO</strong></td>',
            '        </tr>',
            '        <tr>',
            '          <td colspan="2" class="text-right"><strong>UKUPNO</strong></td>',
            '          <td class="text-right"><strong style="color:#D10024;">' + formatPrice(order.totalPrice) + '</strong></td>',
            '        </tr>',
            '      </tfoot>',
            '    </table>',
            '  </div>',
            '  <div style="text-align:left;margin-bottom:30px;font-size:14px;">',
            '    <p><strong>Kupac:</strong> ' + order.customerName + '</p>',
            '    <p><strong>Email:</strong> ' + order.customerEmail + '</p>',
            (order.customerPhone ? '<p><strong>Telefon:</strong> ' + order.customerPhone + '</p>' : ''),
            '    <p><strong>Adresa isporuke:</strong> ' + order.deliveryAddress + '</p>',
            '  </div>',
            '  <a href="store.html" class="primary-btn">Nastavi kupovinu</a>',
            '</div>'
        ].join('');

        $('#confirmation-content').html(html);
    }

    function renderError() {
        $('#confirmation-content').html([
            '<div style="padding:60px 20px;">',
            '  <i class="fa fa-exclamation-triangle" style="font-size:60px;color:#D10024;margin-bottom:20px;"></i>',
            '  <h3>Porudžbina nije pronađena</h3>',
            '  <p style="color:#999;margin:20px 0;">Ne možemo da pronađemo detalje vaše porudžbine.</p>',
            '  <a href="index.html" class="primary-btn">Idi na početnu</a>',
            '</div>'
        ].join(''));
    }

    $(document).ready(function() {
        var orderId = getParam('orderId');
        var orderNumber = getParam('orderNumber');

        if (!orderId) {
            // No orderId — show generic success if we at least have orderNumber
            if (orderNumber) {
                $('#confirmation-content').html([
                    '<div style="padding:60px 20px;">',
                    '  <div style="width:80px;height:80px;background:#d4edda;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">',
                    '    <i class="fa fa-check" style="font-size:36px;color:#28a745;"></i>',
                    '  </div>',
                    '  <h2>Hvala na porudžbini!</h2>',
                    '  <p style="color:#666;">Broj porudžbine: <strong style="color:#D10024;">' + decodeURIComponent(orderNumber) + '</strong></p>',
                    '  <a href="store.html" class="primary-btn" style="margin-top:20px;">Nastavi kupovinu</a>',
                    '</div>'
                ].join(''));
            } else {
                renderError();
            }
            return;
        }

        $.ajax({
            url: API_BASE + '/api/orders/' + orderId,
            method: 'GET',
            success: function(order) {
                renderConfirmation(order);
            },
            error: function() {
                renderError();
            }
        });
    });

})(jQuery);
