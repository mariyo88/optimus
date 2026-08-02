/**
 * Price Range Filter — Range slider with input fields
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;
    var globalMin = 0;
    var globalMax = 100000;
    var priceSlider = null;

    /**
     * Format price for display with Serbian format (e.g., 1000 -> 1.000,00, 15000 -> 15.000,00)
     */
    function formatPrice(price) {
        var rounded = Math.round(price);
        var formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return formatted + ',00';
    }

    /**
     * Parse formatted price string back to number
     */
    function parsePrice(priceStr) {
        // Remove dots (thousands separator), remove ",00" decimals, and parse
        return parseInt(priceStr.replace(/\./g, '').replace(',00', ''), 10) || 0;
    }

    /**
     * Update the price range display
     */
    function updatePriceDisplay(min, max) {
        $('#price-range-display').html(formatPrice(min) + ' &mdash; ' + formatPrice(max));
    }

    /**
     * Apply price filter to products
     */
    function applyPriceFilter(min, max) {
        if (window.storePageState) {
            window.storePageState.minPrice = min > globalMin ? min : null;
            window.storePageState.maxPrice = max < globalMax ? max : null;
            window.storePageState.page = 0;
            if (window.loadStoreProducts) window.loadStoreProducts();
        }
    }

    function buildPriceFilter(minVal, maxVal) {
        globalMin = minVal;
        globalMax = maxVal;

        var $container = $('#price-filter-modern');
        if (!$container.length) return;
        $container.empty();

        var $wrap = $('<div class="modern-price-filter">');

        // Header with collapse toggle
        var $header = $('<div class="price-filter-header">');
        $header.append('<span class="price-filter-icon price-filter-currency">RSD</span>');
        $header.append('<span class="price-filter-title">Opseg Cene</span>');
        $header.append('<span class="price-chevron"><i class="fa fa-angle-down"></i></span>');
        $wrap.append($header);

        // Content wrapper for collapsible content
        var $content = $('<div class="price-filter-content expanded">');

        // Price range display
        var $display = $('<div class="price-range-display" id="price-range-display">');
        updatePriceDisplay(minVal, maxVal);
        $content.append($display);

        // Range slider container
        var $sliderContainer = $('<div class="price-slider-container">');
        var $slider = $('<div id="price-range-slider" class="price-range-slider">');
        $sliderContainer.append($slider);
        $content.append($sliderContainer);

        // Input fields container
        var $inputs = $('<div class="price-inputs">');
        
        var $minInputWrapper = $('<div class="price-input-wrapper">');
        $minInputWrapper.append('<label class="price-input-label">Min</label>');
        var $minInput = $('<input type="text" id="price-min-input" class="price-input" placeholder="Min">');
        $minInput.val(formatPrice(minVal));
        $minInputWrapper.append($minInput);
        
        var $maxInputWrapper = $('<div class="price-input-wrapper">');
        $maxInputWrapper.append('<label class="price-input-label">Max</label>');
        var $maxInput = $('<input type="text" id="price-max-input" class="price-input" placeholder="Max">');
        $maxInput.val(formatPrice(maxVal));
        $maxInputWrapper.append($maxInput);
        
        $inputs.append($minInputWrapper);
        $inputs.append($maxInputWrapper);
        $content.append($inputs);

        $wrap.append($content);
        $container.append($wrap);

        // Initialize noUiSlider
        if (priceSlider) {
            priceSlider.destroy();
        }

        priceSlider = noUiSlider.create($slider[0], {
            start: [minVal, maxVal],
            connect: true,
            range: {
                'min': minVal,
                'max': maxVal
            },
            step: 1, // Step of 1 RSD for complete freedom
            tooltips: false,
            format: {
                to: function(value) {
                    return Math.round(value);
                },
                from: function(value) {
                    return Number(value);
                }
            }
        });

        // Slider event handlers
        priceSlider.on('update', function(values, handle) {
            var min = parseInt(values[0]);
            var max = parseInt(values[1]);
            
            updatePriceDisplay(min, max);
            $minInput.val(formatPrice(min));
            $maxInput.val(formatPrice(max));
        });

        priceSlider.on('change', function(values, handle) {
            var min = parseInt(values[0]);
            var max = parseInt(values[1]);
            applyPriceFilter(min, max);
        });

        // Input field handlers
        $minInput.on('change blur', function() {
            var value = parsePrice($(this).val());
            value = Math.max(globalMin, Math.min(value, globalMax));
            
            // Format the input
            $(this).val(formatPrice(value));
            
            // Update slider
            var currentMax = parseInt(priceSlider.get()[1]);
            priceSlider.set([value, currentMax]);
            
            // Apply filter
            applyPriceFilter(value, currentMax);
        });

        $maxInput.on('change blur', function() {
            var value = parsePrice($(this).val());
            value = Math.max(globalMin, Math.min(value, globalMax));
            
            // Format the input
            $(this).val(formatPrice(value));
            
            // Update slider
            var currentMin = parseInt(priceSlider.get()[0]);
            priceSlider.set([currentMin, value]);
            
            // Apply filter
            applyPriceFilter(currentMin, value);
        });

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

        var minPrice = window.storePageState.minPrice || globalMin;
        var maxPrice = window.storePageState.maxPrice || globalMax;

        if (priceSlider) {
            priceSlider.set([minPrice, maxPrice]);
        }
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
                
                buildPriceFilter(min, max);
            },
            error: function (xhr, status, error) {
                console.error('[Price Filter] Failed to load price range:', status, error);
                // Fallback to default range
                buildPriceFilter(0, 100000);
            }
        });
    }

    // Expose globally
    window.loadPriceRangesForCategory = loadPriceRangesForCategory;

    window.resetPriceFilter = function () {
        if (priceSlider) {
            priceSlider.set([globalMin, globalMax]);
        }
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
