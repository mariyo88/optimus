/**
 * Horizontal Brand Filter Bar - shown when a category is selected
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;

    function buildBrandChip(brand) {
        var $item = $('<div class="modern-brand-item">');
        $item.attr('data-brand-id', brand.id);

        var $link = $('<a class="brand-link" href="#">');

        if (brand.logoUrl) {
            $link.append('<span class="brand-logo"><img src="' + brand.logoUrl + '" alt="' + brand.name + '"></span>');
        } else {
            $link.append('<span class="brand-icon"><i class="fa fa-tag"></i></span>');
        }

        $link.append('<span class="brand-name-text">' + brand.name + '</span>');
        $item.append($link);
        return $item;
    }

    function loadBrandsForCategory(categorySlug) {
        var $filter = $('#brand-filter');
        var $bar = $('#brand-filter-bar');
        if (!$filter.length) return;

        if (!categorySlug) {
            $filter.empty();
            $bar.removeClass('has-brands');
            return;
        }

        $filter.html('<div class="brand-loading"><i class="fa fa-spinner fa-spin"></i></div>');
        $bar.addClass('has-brands');

        $.ajax({
            url: API_BASE + '/api/brands',
            data: { categorySlug: categorySlug },
            success: function (brands) {
                $filter.empty();

                if (!brands || brands.length === 0) {
                    $bar.removeClass('has-brands');
                    return;
                }

                brands.sort(function (a, b) { return a.name.localeCompare(b.name); });

                var $modernFilter = $('<div class="modern-brand-filter">');
                $modernFilter.append('<span class="brand-bar-label">Brendovi:</span>');

                var $list = $('<div class="brand-list">');
                brands.forEach(function (brand) {
                    $list.append(buildBrandChip(brand));
                });
                $modernFilter.append($list);

                $filter.append($modernFilter);

                // Restore active brand if state already has one
                if (window.storePageState && window.storePageState.brand) {
                    var $active = $filter.find('[data-brand-id="' + window.storePageState.brand + '"]');
                    if ($active.length) {
                        $active.addClass('selected');
                        $active.find('.brand-link').addClass('active');
                    }
                }
            },
            error: function () {
                $filter.empty();
                $bar.removeClass('has-brands');
            }
        });
    }

    // Expose globally
    window.loadBrandsForCategory = loadBrandsForCategory;

    $(document).ready(function () {
        var $filter = $('#brand-filter');
        if (!$filter.length) return;

        // Brand chip click - delegated
        $filter.on('click', '.brand-link', function (e) {
            e.preventDefault();
            e.stopPropagation();

            var $item = $(this).closest('.modern-brand-item');
            var brandId = $item.data('brand-id');
            var isSelected = $item.hasClass('selected');

            $filter.find('.modern-brand-item').removeClass('selected');
            $filter.find('.brand-link').removeClass('active');

            if (!isSelected) {
                $item.addClass('selected');
                $(this).addClass('active');
                if (window.storePageState) {
                    window.storePageState.brand = brandId;
                    window.storePageState.page = 0;
                    if (window.loadStoreProducts) window.loadStoreProducts();
                }
            } else {
                if (window.storePageState) {
                    window.storePageState.brand = '';
                    window.storePageState.page = 0;
                    if (window.loadStoreProducts) window.loadStoreProducts();
                }
            }
        });

        // Load brands if page opened with category already in URL
        if (window.storePageState && window.storePageState.category) {
            loadBrandsForCategory(window.storePageState.category);
        }
    });

})(jQuery);
