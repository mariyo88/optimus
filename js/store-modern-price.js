/**
 * Modern Price Range Filter using noUiSlider
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;
    var slider = null;
    var globalMin = 0;
    var globalMax = 100000;

    var PRICE_PRESETS = [
        { label: '0 – 10k',  min: 0,     max: 10000 },
        { label: '10 – 30k', min: 10000, max: 30000 },
        { label: '30 – 50k', min: 30000, max: 50000 },
        { label: '50k+',     min: 50000, max: null  }
    ];

    function formatPrice(val) {
        return parseFloat(val).toLocaleString('sr-RS', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }) + ' RSD';
    }

    function applyPriceState(lo, hi, isFiltered, $reset) {
        $reset.toggle(isFiltered);
        if (window.storePageState) {
            window.storePageState.minPrice = isFiltered ? lo : null;
            window.storePageState.maxPrice = isFiltered ? hi : null;
            window.storePageState.page = 0;
            if (window.loadStoreProducts) window.loadStoreProducts();
        }
    }

    function updatePresetActive($presets, lo, hi) {
        $presets.each(function () {
            var pMin = parseInt($(this).data('min'), 10);
            var pMax = $(this).data('max') === 'null' ? null : parseInt($(this).data('max'), 10);
            var effectiveMax = pMax !== null ? pMax : globalMax;
            $(this).toggleClass('active', lo === pMin && hi === effectiveMax);
        });
    }

    function buildPriceFilter(minVal, maxVal) {
        globalMin = minVal;
        globalMax = maxVal;

        var $container = $('#price-filter-modern');
        if (!$container.length) return;

        $container.empty();

        var $wrap = $('<div class="modern-price-filter">');

        // Header
        var $header = $('<div class="price-filter-header">');
        $header.append('<span class="price-filter-icon"><i class="fa fa-tag"></i></span>');
        $header.append('<span class="price-filter-title">Cena</span>');
        $wrap.append($header);

        // Preset range buttons
        var $presets = $('<div class="price-presets">');
        PRICE_PRESETS.forEach(function (p) {
            var effectiveMax = p.max !== null ? p.max : maxVal;
            var $btn = $('<button class="price-preset-btn">')
                .text(p.label)
                .data('min', p.min)
                .data('max', p.max === null ? 'null' : p.max);
            $btn.on('click', function () {
                slider.set([p.min, effectiveMax]);
                updatePresetActive($presets.find('.price-preset-btn'), p.min, effectiveMax);
                // When max is null (50k+), send null to API — no upper limit
                var apiMax = p.max !== null ? effectiveMax : null;
                var isFiltered = p.min > minVal || apiMax === null || apiMax < maxVal;
                if (window.storePageState) {
                    window.storePageState.minPrice = p.min > minVal ? p.min : null;
                    window.storePageState.maxPrice = apiMax;
                    window.storePageState.page = 0;
                    $reset.toggle(isFiltered);
                    if (window.loadStoreProducts) window.loadStoreProducts();
                }
            });
            $presets.append($btn);
        });
        $wrap.append($presets);

        // Slider
        var $sliderEl = $('<div id="price-slider-nouislider">');
        $wrap.append($sliderEl);

        // Value display
        var $display = $('<div class="price-display">');
        var $minDisplay = $('<span class="price-display-min">');
        var $maxDisplay = $('<span class="price-display-max">');
        $display.append($minDisplay).append('<span class="price-display-sep"> – </span>').append($maxDisplay);
        $wrap.append($display);

        // Reset button
        var $reset = $('<button class="price-reset-btn" style="display:none;">');
        $reset.html('<i class="fa fa-times-circle"></i> Resetuj cenu');
        $wrap.append($reset);

        $container.append($wrap);

        // Init noUiSlider
        var sliderEl = document.getElementById('price-slider-nouislider');
        if (!sliderEl) return;

        noUiSlider.create(sliderEl, {
            start: [minVal, maxVal],
            connect: true,
            step: 100,
            range: { min: minVal, max: maxVal },
            format: {
                to: function (v) { return Math.round(v); },
                from: function (v) { return Math.round(Number(v)); }
            }
        });

        slider = sliderEl.noUiSlider;

        // Update display on slide
        slider.on('update', function (values) {
            var lo = parseInt(values[0], 10);
            var hi = parseInt(values[1], 10);
            $minDisplay.text(formatPrice(lo));
            $maxDisplay.text(formatPrice(hi));
            updatePresetActive($presets.find('.price-preset-btn'), lo, hi);
        });

        // Apply filter on change
        slider.on('change', function (values) {
            var lo = parseInt(values[0], 10);
            var hi = parseInt(values[1], 10);
            var isFiltered = lo > minVal || hi < maxVal;
            applyPriceState(lo, hi, isFiltered, $reset);
        });

        // Reset
        $reset.on('click', function () {
            slider.set([minVal, maxVal]);
            $presets.find('.price-preset-btn').removeClass('active');
            $(this).hide();
            if (window.storePageState) {
                window.storePageState.minPrice = null;
                window.storePageState.maxPrice = null;
                window.storePageState.page = 0;
                if (window.loadStoreProducts) window.loadStoreProducts();
            }
        });
    }

    function loadPriceRange() {
        var $container = $('#price-filter-modern');
        if (!$container.length) return;

        $container.html('<div class="price-loading"><i class="fa fa-spinner fa-spin"></i></div>');

        $.ajax({
            url: API_BASE + '/api/products/price-range',
            success: function (data) {
                var min = data.min != null ? Math.floor(data.min) : 0;
                var max = data.max != null ? Math.ceil(data.max) : 100000;
                if (min === max) max = min + 1000;
                buildPriceFilter(min, max);
            },
            error: function () {
                // Fallback: build with sensible defaults
                buildPriceFilter(0, 100000);
            }
        });
    }

    // Reset price filter (called when category changes)
    window.resetPriceFilter = function () {
        if (slider) {
            slider.set([globalMin, globalMax]);
            $('#price-filter-modern .price-preset-btn').removeClass('active');
            $('#price-filter-modern .price-reset-btn').hide();
        }
        if (window.storePageState) {
            window.storePageState.minPrice = null;
            window.storePageState.maxPrice = null;
        }
    };

    $(document).ready(function () {
        loadPriceRange();
    });

})(jQuery);
