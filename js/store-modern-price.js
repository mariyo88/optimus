/**
 * Price Range Filter — preset buttons only
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;
    var globalMin = 0;
    var globalMax = 100000;

    var PRICE_PRESETS = [
        { label: '0 – 1k',   min: 0,     max: 1000  },
        { label: '1 – 5k',   min: 1000,  max: 5000  },
        { label: '5 – 15k',  min: 5000,  max: 15000 },
        { label: '15 – 30k', min: 15000, max: 30000 },
        { label: '30 – 50k', min: 30000, max: 50000 },
        { label: '50k+',     min: 50000, max: null   }
    ];

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

        // Preset buttons
        var $presets = $('<div class="price-presets">');
        PRICE_PRESETS.forEach(function (p) {
            if (p.min >= maxVal) return; // skip presets out of range
            var effectiveMax = p.max !== null ? p.max : maxVal;
            var $btn = $('<button class="price-preset-btn">')
                .text(p.label)
                .data('min', p.min)
                .data('max', p.max === null ? 'null' : p.max);

            $btn.on('click', function () {
                var isActive = $(this).hasClass('active');
                $presets.find('.price-preset-btn').removeClass('active');

                if (isActive) {
                    // toggle off = reset
                    $reset.hide();
                    if (window.storePageState) {
                        window.storePageState.minPrice = null;
                        window.storePageState.maxPrice = null;
                        window.storePageState.page = 0;
                        if (window.loadStoreProducts) window.loadStoreProducts();
                    }
                    return;
                }

                $(this).addClass('active');
                $reset.show();

                var apiMax = p.max !== null ? effectiveMax : null;
                if (window.storePageState) {
                    window.storePageState.minPrice = p.min > minVal ? p.min : null;
                    window.storePageState.maxPrice = apiMax;
                    window.storePageState.page = 0;
                    if (window.loadStoreProducts) window.loadStoreProducts();
                }
            });

            $presets.append($btn);
        });
        $wrap.append($presets);

        // Reset button
        var $reset = $('<button class="price-reset-btn">');
        $reset.html('<i class="fa fa-times-circle"></i> Resetuj cenu').hide();
        $reset.on('click', function () {
            $presets.find('.price-preset-btn').removeClass('active');
            $(this).hide();
            if (window.storePageState) {
                window.storePageState.minPrice = null;
                window.storePageState.maxPrice = null;
                window.storePageState.page = 0;
                if (window.loadStoreProducts) window.loadStoreProducts();
            }
        });
        $wrap.append($reset);

        $container.append($wrap);
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
                buildPriceFilter(0, 100000);
            }
        });
    }

    window.resetPriceFilter = function () {
        $('#price-filter-modern .price-preset-btn').removeClass('active');
        $('#price-filter-modern .price-reset-btn').hide();
        if (window.storePageState) {
            window.storePageState.minPrice = null;
            window.storePageState.maxPrice = null;
        }
    };

    $(document).ready(function () {
        loadPriceRange();
    });

})(jQuery);
