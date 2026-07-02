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

                // Determine active nav item based on current page
                var currentPage = window.location.pathname.split('/').pop() || 'index.html';

                function navItem(href, label) {
                    var currentCategory = new URLSearchParams(window.location.search).get('category') || '';
                    var hrefCategory = href.indexOf('?category=') !== -1 ? href.split('?category=')[1] : '';
                    var isActive;
                    if (hrefCategory) {
                        // Category link: active only if current category matches
                        isActive = currentPage === 'store.html' && currentCategory === hrefCategory;
                    } else {
                        isActive = (href === currentPage) ||
                            (currentPage === '' && href === 'index.html') ||
                            (currentPage === 'store.html' && href === 'store.html' && !currentCategory);
                    }
                    return '<li' + (isActive ? ' class="active"' : '') + '><a href="' + href + '">' + label + '</a></li>';
                }

                // Build navigation items
                var navHtml = navItem('index.html', 'Početna') +
                    navItem('#', 'Akcije') +
                    navItem('store.html', 'Kategorije');

                visibleCategories.forEach(function (cat) {
                    // Koristi displayName ako postoji, inače fallback na name
                    var categoryName = cat.displayName || cat.name;
                    navHtml += navItem('store.html?category=' + cat.slug, categoryName);
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
        // Set active nav item immediately from existing HTML (fallback before AJAX)
        var currentPage = window.location.pathname.split('/').pop() || 'index.html';
        $('.main-nav li').each(function () {
            var href = $(this).find('a').attr('href') || '';
            var hrefPage = href.split('/').pop().split('?')[0];
            if (hrefPage === currentPage || (currentPage === '' && hrefPage === 'index.html')) {
                $(this).addClass('active');
            } else {
                $(this).removeClass('active');
            }
        });
        initMainNav();
    });

})(jQuery);
