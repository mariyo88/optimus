/**
 * QR Code Share — modal logic for product detail page
 * Depends on: jQuery, window.APP_CONFIG.API_BASE
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;
    var currentSlug = null;

    // ── helpers ──────────────────────────────────────────────────────────────

    function getProductUrl(slug) {
        return window.location.origin + '/product.html?slug=' + encodeURIComponent(slug);
    }

    function getQrImageUrl(slug) {
        var siteUrl = encodeURIComponent(window.location.origin);
        return API_BASE + '/api/qr/' + encodeURIComponent(slug) + '?siteUrl=' + siteUrl;
    }

    // ── modal open / close ───────────────────────────────────────────────────

    function openModal() {
        var $overlay = $('#qr-modal');
        var $img     = $('#qr-img');
        var $spinner = $('#qr-loading');
        var $errMsg  = $overlay.find('.qr-error-msg');

        // reset state
        $errMsg.remove();
        $img.hide().attr('src', '');
        $spinner.show();

        // show overlay via class (not display:flex inline, avoids specificity fight)
        $overlay.addClass('qr-modal-open');
        $('#qr-modal-close').focus();

        // load image
        var src = getQrImageUrl(currentSlug);
        var tempImg = new Image();
        tempImg.onload = function () {
            $spinner.hide();
            $img.attr('src', src).show();
        };
        tempImg.onerror = function () {
            $spinner.hide();
            $overlay.find('.qr-modal-img-wrap').append(
                '<p class="qr-error-msg" style="color:#4274D9;font-size:13px;margin:0;">Greška pri učitavanju QR koda.</p>'
            );
        };
        tempImg.src = src;
    }

    function closeModal() {
        var $overlay = $('#qr-modal');
        $overlay.addClass('qr-modal-hiding');
        setTimeout(function () {
            $overlay.removeClass('qr-modal-open qr-modal-hiding');
            $('#qr-modal .qr-error-msg').remove();
        }, 180);
    }

    // ── download ─────────────────────────────────────────────────────────────

    function downloadQr() {
        var src      = getQrImageUrl(currentSlug);
        var filename = 'product-' + currentSlug + '-qr.png';

        fetch(src)
            .then(function (resp) { return resp.blob(); })
            .then(function (blob) {
                var url = URL.createObjectURL(blob);
                var a   = document.createElement('a');
                a.href     = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
    }

    // ── share actions ────────────────────────────────────────────────────────

    function initShareButtons(slug) {
        currentSlug = slug;
        var productUrl = getProductUrl(slug);

        $('#share-facebook')
            .attr('href', 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(productUrl))
            .attr('target', '_blank')
            .attr('rel', 'noopener');

        $('#share-whatsapp')
            .attr('href', 'https://wa.me/?text=' + encodeURIComponent(productUrl))
            .attr('target', '_blank')
            .attr('rel', 'noopener');

        $('#share-copy-link').off('click').on('click', function (e) {
            e.preventDefault();
            navigator.clipboard.writeText(productUrl).then(function () {
                var $btn     = $('#share-copy-link');
                var origHtml = $btn.html();
                $btn.html('<i class="fa fa-check"></i>');
                setTimeout(function () { $btn.html(origHtml); }, 1800);
            });
        });
    }

    // ── init ─────────────────────────────────────────────────────────────────

    $(document).ready(function () {

        // Open modal
        $(document).on('click', '#share-qr-btn', function (e) {
            e.preventDefault();
            if (!currentSlug) return;
            openModal();
        });

        // Close — X button
        $(document).on('click', '#qr-modal-close', function () {
            closeModal();
        });

        // Close — click outside card
        $(document).on('click', '#qr-modal', function (e) {
            if ($(e.target).is('#qr-modal')) closeModal();
        });

        // Close — ESC key
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape' && $('#qr-modal').hasClass('qr-modal-open')) closeModal();
        });

        // Download
        $(document).on('click', '#qr-download-btn', function () {
            if (!currentSlug) return;
            downloadQr();
        });

        // Expose init so product-detail.js can call it after product loads
        window.initQrShare = initShareButtons;
    });

})(jQuery);
