/**
 * Header Search - handles search form submission across all pages.
 */
(function ($) {
    'use strict';

    function initHeaderSearch() {
        // Pre-fill search input from URL param
        var searchParam = new URLSearchParams(window.location.search).get('search');
        if (searchParam) {
            $('.header-search .input').val(searchParam);
        }

        // Wrap button content in animated label span on init
        $('.header-search form .search-btn').each(function () {
            var $btn = $(this);
            // Determine initial label based on whether input already has value (URL param)
            var $input = $btn.closest('form').find('.input');
            var hasVal = $input.val().trim().length > 0;
            var initialIcon = hasVal ? 'fa-search' : 'fa-th-large';
            var initialText = hasVal ? 'Pretraži' : 'Prodavnica';
            $btn.html('<span class="search-btn-label is-visible"><i class="fa ' + initialIcon + '"></i> <span class="btn-text">' + initialText + '</span></span>');
        });

        function setSearchBtnText($input) {
            var $btn = $input.closest('form').find('.search-btn');
            var $label = $btn.find('.search-btn-label');
            var hasText = $input.val().trim().length > 0;
            var newText = hasText ? 'Pretraži' : 'Prodavnica';
            var currentText = $btn.find('.btn-text').text();

            if (currentText === newText) return;

            // Step 1: slide current label out
            $label.removeClass('is-visible').addClass('is-leaving');

            setTimeout(function () {
                // Step 2: swap text and prepare new label to enter from below
                var icon = hasText ? 'fa-search' : 'fa-th-large';
                var label = hasText ? 'Pretraži' : 'Prodavnica';
                $btn.html('<span class="search-btn-label is-entering"><i class="fa ' + icon + '"></i> <span class="btn-text">' + label + '</span></span>');

                // Step 3: trigger reflow then animate in
                var $newLabel = $btn.find('.search-btn-label');
                $newLabel[0].getBoundingClientRect(); // force reflow
                $newLabel.removeClass('is-entering').addClass('is-visible');
            }, 220);
        }

        // Dynamically update button text based on input content
        $('.header-search .input').on('input', function () {
            setSearchBtnText($(this));
        });

        // Handle search form submit
        $('.header-search form').on('submit', function (e) {
            e.preventDefault();
            var searchTerm = $(this).find('.input').val().trim();

            // If already on store.html, update state directly
            if (window.storePageState && window.loadStoreProducts) {
                window.storePageState.search = searchTerm;
                window.storePageState.godCategory = '';
                window.storePageState.page = 0;
                window.loadStoreProducts();
            } else {
                var params = new URLSearchParams();
                if (searchTerm) params.set('search', searchTerm);
                window.location.href = 'store.html' + (params.toString() ? '?' + params.toString() : '');
            }
        });
    }

    $(document).ready(initHeaderSearch);

})(jQuery);
