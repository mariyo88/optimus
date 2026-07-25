/**
 * Modern Specification Filter - shown when a category is selected
 * Displays dynamic specification filters (e.g., RAM, Processor, HDMI) with multi-select checkboxes
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;

    /**
     * Build a single specification filter section
     */
    function buildSpecificationSection(spec) {
        var $section = $('<div class="specification-filter-section">');
        $section.attr('data-spec-name', spec.name);
        
        // Header (clickable to expand/collapse)
        var $header = $('<div class="spec-header">');
        $header.append('<span class="spec-icon"><i class="fa fa-cog"></i></span>');
        $header.append('<span class="spec-name">' + escapeHtml(spec.name) + '</span>');
        $header.append('<span class="spec-count">(' + spec.productCount + ')</span>');
        $header.append('<span class="spec-chevron"><i class="fa fa-angle-down"></i></span>');
        
        // Values list (collapsible, initially hidden)
        var $values = $('<div class="spec-values">');
        spec.values.forEach(function(value) {
            var checkboxId = 'spec-' + slugify(spec.name) + '-' + slugify(value);
            var $checkboxWrapper = $('<div class="spec-value-item">');
            var $checkbox = $('<input type="checkbox" class="spec-checkbox">');
            $checkbox.attr('id', checkboxId);
            $checkbox.attr('data-spec-name', spec.name);
            $checkbox.attr('data-spec-value', value);
            
            var $label = $('<label>').attr('for', checkboxId).text(value);
            
            $checkboxWrapper.append($checkbox).append($label);
            $values.append($checkboxWrapper);
        });
        
        $section.append($header).append($values);
        return $section;
    }

    /**
     * Load specifications for a given category slug
     */
    function loadSpecificationsForCategory(categorySlug, godCategorySlug) {
        var $filter = $('#specification-filter');
        var $container = $('#specification-filter-container');
        
        if (!$filter.length) {
            console.warn('Specification filter element not found');
            return;
        }

        // If no category/godCategory selected, clear and hide
        if (!categorySlug && !godCategorySlug) {
            $filter.empty();
            if ($container.length) $container.hide();
            return;
        }

        // Show loading indicator
        $filter.html('<div class="spec-loading"><i class="fa fa-spinner fa-spin"></i> Učitavanje filtera...</div>');
        if ($container.length) $container.show();

        // Prepare API request
        var params = {};
        if (godCategorySlug) {
            params.godCategorySlug = godCategorySlug;
        } else {
            params.categorySlug = categorySlug;
        }

        $.ajax({
            url: API_BASE + '/api/products/specifications',
            data: params,
            success: function (specifications) {
                $filter.empty();

                // If no specifications, hide the container
                if (!specifications || specifications.length === 0) {
                    if ($container.length) $container.hide();
                    return;
                }

                // Build specification filters
                var $wrapper = $('<div class="modern-specification-filter">');
                
                // Header with collapse toggle
                var $filterHeader = $('<div class="spec-filter-header">');
                $filterHeader.append('<span class="spec-filter-icon"><i class="fa fa-filter"></i></span>');
                $filterHeader.append('<span class="spec-filter-title">Specifikacije</span>');
                $filterHeader.append('<span class="spec-filter-chevron"><i class="fa fa-angle-down"></i></span>');
                $wrapper.append($filterHeader);

                // Content wrapper for collapsible content
                var $filterContent = $('<div class="spec-filter-content expanded">');

                // Specification sections
                specifications.forEach(function(spec) {
                    $filterContent.append(buildSpecificationSection(spec));
                });

                $wrapper.append($filterContent);
                $filter.append($wrapper);
                if ($container.length) $container.show();

                // Restore selected specifications from state
                restoreSelectedSpecifications();
            },
            error: function(xhr, status, error) {
                console.error('Failed to load specifications:', error);
                $filter.empty();
                if ($container.length) $container.hide();
            }
        });
    }

    /**
     * Restore selected specifications from window.storePageState
     */
    function restoreSelectedSpecifications() {
        if (!window.storePageState || !window.storePageState.specifications) {
            return;
        }

        var specs = window.storePageState.specifications;
        for (var specName in specs) {
            var values = specs[specName];
            values.forEach(function(value) {
                var $checkbox = $('#specification-filter')
                    .find('input[data-spec-name="' + specName + '"][data-spec-value="' + value + '"]');
                if ($checkbox.length) {
                    $checkbox.prop('checked', true);
                }
            });
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

    /**
     * Helper function to create URL-friendly slug
     */
    function slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Expose globally
    window.loadSpecificationsForCategory = loadSpecificationsForCategory;

    $(document).ready(function () {
        var $filter = $('#specification-filter');
        if (!$filter.length) return;

        // Main header click - collapse/expand all specifications
        $filter.on('click', '.spec-filter-header', function(e) {
            e.preventDefault();
            e.stopPropagation();

            var $content = $(this).siblings('.spec-filter-content');
            var $chevron = $(this).find('.spec-filter-chevron i');
            
            if ($content.hasClass('expanded')) {
                $content.removeClass('expanded').slideUp(200);
                $chevron.css('transform', 'rotate(-90deg)');
            } else {
                $content.addClass('expanded').slideDown(200);
                $chevron.css('transform', 'rotate(0deg)');
            }
        });

        // Individual specification header click - expand/collapse
        $filter.on('click', '.spec-header', function(e) {
            e.preventDefault();
            e.stopPropagation();

            var $section = $(this).closest('.specification-filter-section');
            var $values = $section.find('.spec-values');
            var isExpanded = $section.hasClass('expanded');

            if (isExpanded) {
                // Collapse
                $section.removeClass('expanded');
                $values.slideUp(200);
            } else {
                // Expand
                $section.addClass('expanded');
                $values.slideDown(200);
            }
        });

        // Checkbox change - update state and reload products
        $filter.on('change', '.spec-checkbox', function(e) {
            var specName = $(this).data('spec-name');
            var specValue = $(this).data('spec-value');
            var isChecked = $(this).is(':checked');

            if (!window.storePageState) {
                console.error('storePageState not found');
                return;
            }

            // Initialize specifications object if not exists
            if (!window.storePageState.specifications) {
                window.storePageState.specifications = {};
            }

            // Initialize array for this spec name if not exists
            if (!window.storePageState.specifications[specName]) {
                window.storePageState.specifications[specName] = [];
            }

            if (isChecked) {
                // Add value if not already present
                if (window.storePageState.specifications[specName].indexOf(specValue) === -1) {
                    window.storePageState.specifications[specName].push(specValue);
                }
            } else {
                // Remove value
                var index = window.storePageState.specifications[specName].indexOf(specValue);
                if (index > -1) {
                    window.storePageState.specifications[specName].splice(index, 1);
                }

                // Remove empty arrays
                if (window.storePageState.specifications[specName].length === 0) {
                    delete window.storePageState.specifications[specName];
                }
            }

            // Reset to first page and reload products
            window.storePageState.page = 0;
            if (window.loadStoreProducts) {
                window.loadStoreProducts();
            }
        });
    });

})(jQuery);
