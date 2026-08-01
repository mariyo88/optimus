/**
 * Price Range Filter — dynamic preset buttons based on category
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;
    var globalMin = 0;
    var globalMax = 100000;

    /**
     * Generate price presets based on min and max values
     * Always returns 5-6 options maximum
     */
    function generatePricePresets(min, max) {
        var presets = [];
        var range = max - min;
        var targetCount = 5; // Target number of price ranges

        // Calculate optimal step size for 5 ranges
        var step = Math.ceil(range / targetCount);
        
        // Round step to nice numbers
        step = roundToNiceNumber(step);

        // Generate ranges
        var currentMin = roundDown(min, step);
        
        for (var i = 0; i < targetCount; i++) {
            var rangeMin = currentMin + (step * i);
            var rangeMax = currentMin + (step * (i + 1));
            
            // Skip if completely out of bounds
            if (rangeMin >= max) break;
            
            // Last range is open-ended (e.g., "50k+")
            if (i === targetCount - 1 || rangeMax >= max) {
                presets.push({
                    label: formatPrice(rangeMin) + '+',
                    min: rangeMin,
                    max: null
                });
                break;
            } else {
                presets.push({
                    label: formatPrice(rangeMin) + ' – ' + formatPrice(rangeMax),
                    min: rangeMin,
                    max: rangeMax
                });
            }
        }

        return presets;
    }

    /**
     * Round number to "nice" values (e.g., 1000, 5000, 10000, 20000)
     */
    function roundToNiceNumber(num) {
        if (num < 1000) {
            // Round to nearest 100
            return Math.ceil(num / 100) * 100;
        } else if (num < 5000) {
            // Round to nearest 1000
            return Math.ceil(num / 1000) * 1000;
        } else if (num < 10000) {
            // Round to nearest 5000
            return Math.ceil(num / 5000) * 5000;
        } else if (num < 50000) {
            // Round to nearest 10000
            return Math.ceil(num / 10000) * 10000;
        } else {
            // Round to nearest 20000
            return Math.ceil(num / 20000) * 20000;
        }
    }

    /**
     * Round down to nearest step
     */
    function roundDown(num, step) {
        return Math.floor(num / step) * step;
    }



    /**
     * Format price for display with thousand separator (e.g., 1000 -> 1.000, 15000 -> 15.000)
     */
    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function buildPriceFilter(minVal, maxVal, presets) {
        globalMin = minVal;
        globalMax = maxVal;

        var $container = $('#price-filter-modern');
        if (!$container.length) return;
        $container.empty();

        var $wrap = $('<div class="modern-price-filter">');

        // Header with collapse toggle
        var $header = $('<div class="price-filter-header">');
        $header.append('<span class="price-filter-icon price-filter-currency">RSD</span>');
        $header.append('<span class="price-filter-title">Cena</span>');
        $header.append('<span class="price-chevron"><i class="fa fa-angle-down"></i></span>');
        $wrap.append($header);

        // Content wrapper for collapsible content
        var $content = $('<div class="price-filter-content expanded">');

        // Preset buttons
        var $presets = $('<div class="price-presets">');
        presets.forEach(function (p) {
            var $btn = $('<button class="price-preset-btn">');
            
            // Currency label
            var $icon = $('<span class="price-icon price-currency-label">RSD</span>');
            $btn.append($icon);
            
            // Label
            var $label = $('<span class="price-label">').text(p.label);
            $btn.append($label);
            
            // Check icon (shown only when active)
            var $check = $('<span class="price-check">').html('<i class="fa fa-check"></i>');
            $btn.append($check);
            
            $btn.data('min', p.min);
            $btn.data('max', p.max === null ? 'null' : p.max);

            $btn.on('click', function () {
                var isActive = $(this).hasClass('active');
                $presets.find('.price-preset-btn').removeClass('active');

                if (isActive) {
                    // toggle off = reset
                    if (window.storePageState) {
                        window.storePageState.minPrice = null;
                        window.storePageState.maxPrice = null;
                        window.storePageState.page = 0;
                        if (window.loadStoreProducts) window.loadStoreProducts();
                    }
                    return;
                }

                $(this).addClass('active');

                var apiMax = p.max !== null ? p.max : null;
                if (window.storePageState) {
                    window.storePageState.minPrice = p.min > minVal ? p.min : null;
                    window.storePageState.maxPrice = apiMax;
                    window.storePageState.page = 0;
                    if (window.loadStoreProducts) window.loadStoreProducts();
                }
            });

            $presets.append($btn);
        });
        $content.append($presets);

        $wrap.append($content);
        $container.append($wrap);

        // Header click handler for collapse/expand
        $header.on('click', function() {
            var $chevron = $(this).find('.price-chevron i');
            if ($content.hasClass('expanded')) {
                $content.removeClass('expanded').slideUp(200);
                $chevron.css('transform', 'rotate(-90deg)');
            } else {
                $content.addClass('expanded').slideDown(200);
                $chevron.css('transform', 'rotate(0deg)');
            }
        });

        // Restore selected price range from state
        restoreSelectedPriceRange();
    }

    /**
     * Restore selected price range from window.storePageState
     */
    function restoreSelectedPriceRange() {
        if (!window.storePageState || (!window.storePageState.minPrice && !window.storePageState.maxPrice)) {
            return;
        }

        var minPrice = window.storePageState.minPrice;
        var maxPrice = window.storePageState.maxPrice;

        $('#price-filter-modern .price-preset-btn').each(function() {
            var btnMin = $(this).data('min');
            var btnMax = $(this).data('max');
            
            // Convert 'null' string to actual null
            if (btnMax === 'null') btnMax = null;
            
            // Check if this button matches the current price range
            if (btnMin === minPrice && btnMax === maxPrice) {
                $(this).addClass('active');
                return false; // break
            }
        });
    }

    /**
     * Load price ranges for a given category
     */
    function loadPriceRangesForCategory(categorySlug, godCategorySlug) {
        var $container = $('#price-filter-modern');
        if (!$container.length) return;

        console.log('[Price Filter] Loading price ranges for category:', categorySlug, 'godCategory:', godCategorySlug);

        $container.html('<div class="price-loading"><i class="fa fa-spinner fa-spin"></i> Učitavanje cena...</div>');

        // Reset price filter in state when changing category
        if (window.storePageState) {
            window.storePageState.minPrice = null;
            window.storePageState.maxPrice = null;
        }

        var ajaxData = {};
        if (categorySlug) ajaxData.category = categorySlug;
        if (godCategorySlug) ajaxData.godCategory = godCategorySlug;

        console.log('[Price Filter] AJAX request data:', ajaxData);

        $.ajax({
            url: API_BASE + '/api/products/price-range',
            data: ajaxData,
            success: function (data) {
                console.log('[Price Filter] Received price range:', data);
                var min = data.min != null ? Math.floor(data.min) : 0;
                var max = data.max != null ? Math.ceil(data.max) : 100000;
                
                // Ensure we have a valid range
                if (min === max) max = min + 1000;
                if (max - min < 100) max = min + 1000;

                console.log('[Price Filter] Adjusted range - min:', min, 'max:', max);

                // Generate dynamic presets based on the actual price range
                var presets = generatePricePresets(min, max);
                
                buildPriceFilter(min, max, presets);
            },
            error: function (xhr, status, error) {
                console.error('[Price Filter] Failed to load price range:', status, error);
                // Fallback to default range
                var presets = generatePricePresets(0, 100000);
                buildPriceFilter(0, 100000, presets);
            }
        });
    }

    // Expose globally
    window.loadPriceRangesForCategory = loadPriceRangesForCategory;

    window.resetPriceFilter = function () {
        $('#price-filter-modern .price-preset-btn').removeClass('active');
        if (window.storePageState) {
            window.storePageState.minPrice = null;
            window.storePageState.maxPrice = null;
        }
    };

    $(document).ready(function () {
        // Load prices if page opened with category already in URL
        if (window.storePageState && window.storePageState.category) {
            loadPriceRangesForCategory(window.storePageState.category, '');
        } else if (window.storePageState && window.storePageState.godCategory) {
            loadPriceRangesForCategory('', window.storePageState.godCategory);
        } else {
            // Load default prices for all products
            loadPriceRangesForCategory('', '');
        }
    });

})(jQuery);
