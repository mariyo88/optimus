/**
 * Dynamic Main Navigation - loads top-level categories from backend API
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;

    function initLogo() {
        // Make logo clickable and navigate to home page from all pages
        $('.header-logo a.logo').attr('href', 'index.html');
    }

    function initMainNav() {
        $.ajax({
            url: API_BASE + '/api/categories',
            success: function (categories) {
                
                // Flatten all categories and filter those marked to show in nav
                var allCats = flattenCategories(categories);
                var visibleCategories = allCats.filter(function (cat) {
                    return cat.showInNav === true || (cat.showInNav === undefined);
                });

                // Build navigation items
                var navHtml = '<li class="active"><a href="index.html">Početna</a></li>' +
                    '<li><a href="#">Akcije</a></li>' +
                    '<li><a href="store.html">Kategorije</a></li>';

                visibleCategories.forEach(function (cat) {
                    // Koristi displayName ako postoji, inače fallback na name
                    var categoryName = cat.displayName || cat.name;
                    navHtml += '<li><a href="store.html?category=' + cat.slug + '">' + categoryName + '</a></li>';
                });

                // Update all navigation elements
                $('.main-nav').html(navHtml);

                // Also update footer navigation
                updateFooterNav(visibleCategories);
            },
            error: function () {
                // Could not load categories for navigation
            }
        });
    }

    function flattenCategories(categories) {
        var result = [];
        function traverse(cats) {
            if (!cats || cats.length === 0) return;
            cats.forEach(function (cat) {
                result.push(cat);
                if (cat.children && cat.children.length > 0) {
                    traverse(cat.children);
                }
            });
        }
        traverse(categories);
        return result;
    }

    function updateFooterNav(categories) {
        var footerHtml = '<li><a href="#">Akcije</a></li>';

        categories.forEach(function (cat) {
            // Koristi displayName ako postoji, inače fallback na name
            var categoryName = cat.displayName || cat.name;
            footerHtml += '<li><a href="store.html?category=' + cat.slug + '">' + categoryName + '</a></li>';
        });

        // Update only the categories section in footer (2nd footer-links)
        var footerLinks = $('.footer-links');
        if (footerLinks.length > 1) {
            footerLinks.eq(1).html(footerHtml);
        }
    }

    $(document).ready(function () {
        initLogo();
        initMainNav();
    });

})(jQuery);
