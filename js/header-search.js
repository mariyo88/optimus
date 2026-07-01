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
