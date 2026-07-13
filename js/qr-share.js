/**
 * QR Code Share — inline QR code display for product detail page
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

    // ── load inline QR code ──────────────────────────────────────────────────

    function loadInlineQr() {
        var $img     = $('#qr-img-inline');
        var $spinner = $('#qr-loading-inline');
        var $error   = $('#qr-error-inline');
        var $desc    = $('#qr-desc-inline');

        // Only load if not already loaded
        if ($img.attr('src')) {
            return;
        }

        // reset state
        $error.hide();
        $desc.hide();
        $img.hide().attr('src', '');
        $spinner.show();

        // load image
        var src = getQrImageUrl(currentSlug);
        var tempImg = new Image();
        tempImg.onload = function () {
            $spinner.hide();
            $img.attr('src', src).show();
            $desc.show(); // Show description text when QR loads
        };
        tempImg.onerror = function () {
            $spinner.hide();
            $error.show();
        };
        tempImg.src = src;
    }

    // ── toggle QR popup ──────────────────────────────────────────────────────

    function toggleQrPopup(e) {
        e.preventDefault();
        var $popup = $('#qr-popup');
        
        if ($popup.is(':visible')) {
            $popup.fadeOut(200);
        } else {
            // Load QR code if not already loaded
            loadInlineQr();
            $popup.fadeIn(200);
        }
    }

    // Close popup when clicking outside
    function closeQrPopup(e) {
        var $popup = $('#qr-popup');
        var $toggle = $('#share-qr-toggle');
        
        if ($popup.is(':visible') && 
            !$(e.target).closest('#qr-popup').length && 
            !$(e.target).closest('#share-qr-toggle').length) {
            $popup.fadeOut(200);
        }
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

        // QR toggle button
        $('#share-qr-toggle').off('click').on('click', toggleQrPopup);
    }

    // ── init ─────────────────────────────────────────────────────────────────

    $(document).ready(function () {

        // Close QR popup when clicking outside
        $(document).on('click', closeQrPopup);

        // Expose init so product-detail.js can call it after product loads
        window.initQrShare = initShareButtons;
    });

})(jQuery);
