/**
 * Modern Brand Filter - Collapsible sidebar filter with checkboxes
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;

    /**
     * Build brand button item (modern card-style)
     */
    function buildBrandItem(brand) {
        var $item = $('<div class="brand-item">');
        $item.attr('data-brand-id', brand.id);
        $item.attr('data-brand-name', escapeHtml(brand.name));
        
        // If brand has logo, use logo-only mode (full-width image)
        if (brand.logoUrl) {
            $item.addClass('brand-item-logo');
            var $logoFull = $('<span class="brand-logo-full"><img src="' + brand.logoUrl + '" alt="' + brand.name + '"></span>');
            $item.append($logoFull);
            $item.append('<span class="brand-check-logo"><i class="fa fa-check-circle"></i></span>');
        } else {
            // Fallback: show icon + name
            var $icon = $('<span class="brand-icon"><i class="fa fa-tag"></i></span>');
            $item.append($icon);
            $item.append('<span class="brand-name">' + escapeHtml(brand.name) + '</span>');
            $item.append('<span class="brand-check"><i class="fa fa-check-circle"></i></span>');
        }
        
        return $item;
    }

    /**
     * Load brands for a given category slug
     */
    function loadBrandsForCategory(categorySlug, godCategorySlug) {
        var $filter = $('#brand-filter');
        var $container = $('#brand-filter-container');
        
        if (!$filter.length) {
            console.warn('Brand filter element not found');
            return;
        }

        // If no category selected, clear and hide
        if (!categorySlug && !godCategorySlug) {
            $filter.empty();
            if ($container.length) $container.hide();
            return;
        }

        // Show loading indicator
        $filter.html('<div class="brand-loading"><i class="fa fa-spinner fa-spin"></i> Učitavanje brendova...</div>');
        if ($container.length) $container.show();

        $.ajax({
            url: API_BASE + '/api/brands',
            data: { categorySlug: categorySlug || godCategorySlug },
            success: function (brands) {
                $filter.empty();

                if (!brands || brands.length === 0) {
                    if ($container.length) $container.hide();
                    return;
                }

                // Sort brands alphabetically
                brands.sort(function (a, b) { return a.name.localeCompare(b.name); });

                var $wrapper = $('<div class="modern-brand-filter">');
                
                // Header
                var $header = $('<div class="brand-filter-header">');
                $header.append('<span class="brand-filter-icon"><i class="fa fa-bookmark"></i></span>');
                $header.append('<span class="brand-filter-title">Brendovi</span>');
                $header.append('<span class="brand-filter-count">(' + brands.length + ')</span>');
                $header.append('<span class="brand-chevron"><i class="fa fa-angle-down"></i></span>');
                $wrapper.append($header);

                // Brand list (collapsible)
                var $list = $('<div class="brand-list expanded">');
                brands.forEach(function (brand) {
                    $list.append(buildBrandItem(brand));
                });
                $wrapper.append($list);

                $filter.append($wrapper);
                if ($container.length) $container.show();

                // Restore selected brand from state
                restoreSelectedBrand();
            },
            error: function (xhr, status, error) {
                console.error('Failed to load brands:', error);
                $filter.empty();
                if ($container.length) $container.hide();
            }
        });
    }

    /**
     * Restore selected brand from window.storePageState
     */
    function restoreSelectedBrand() {
        if (!window.storePageState || !window.storePageState.brand) {
            return;
        }

        var brandId = window.storePageState.brand;
        var $brandItem = $('#brand-filter').find('.brand-item[data-brand-id="' + brandId + '"]');
        if ($brandItem.length) {
            $brandItem.addClass('active');
        }
    }

    /**
     * Helper function to escape HTML
     */
    function escapeHtml(text) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // Expose globally
    window.loadBrandsForCategory = loadBrandsForCategory;

    $(document).ready(function () {
        var $filter = $('#brand-filter');
        if (!$filter.length) return;

        // Header click - expand/collapse
        $filter.on('click', '.brand-filter-header', function(e) {
            e.preventDefault();
            e.stopPropagation();

            var $wrapper = $(this).closest('.modern-brand-filter');
            var $list = $wrapper.find('.brand-list');
            var $chevron = $(this).find('.brand-chevron i');
            var isExpanded = $list.hasClass('expanded');

            if (isExpanded) {
                // Collapse
                $list.removeClass('expanded').slideUp(200);
                $chevron.removeClass('fa-angle-down').addClass('fa-angle-right');
            } else {
                // Expand
                $list.addClass('expanded').slideDown(200);
                $chevron.removeClass('fa-angle-right').addClass('fa-angle-down');
            }
        });

        // Brand item click - update state and reload products
        $filter.on('click', '.brand-item', function(e) {
            e.preventDefault();
            e.stopPropagation();

            var $clickedItem = $(this);
            var brandId = $clickedItem.data('brand-id');
            var isActive = $clickedItem.hasClass('active');

            if (!window.storePageState) {
                console.error('storePageState not found');
                return;
            }

            // Single-select behavior: remove active class from all other items
            $filter.find('.brand-item').removeClass('active');

            // Toggle current item
            if (!isActive) {
                $clickedItem.addClass('active');
                window.storePageState.brand = brandId;
            } else {
                // If clicking on already active brand, deselect it
                window.storePageState.brand = '';
            }

            // Reset to first page and reload products
            window.storePageState.page = 0;
            if (window.loadStoreProducts) {
                window.loadStoreProducts();
            }
        });

        // Load brands if page opened with category already in URL
        if (window.storePageState && window.storePageState.category) {
            loadBrandsForCategory(window.storePageState.category, '');
        }
    });

})(jQuery);
