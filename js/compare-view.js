/**
 * Compare View — renders the compare.html page
 * Reads products from OptimusCompare (localStorage) and builds the comparison table.
 */
(function ($) {
    'use strict';

    var MAX_SLOTS = 4;

    var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f0f0f0' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='13' fill='%23bbb'%3ESlika%3C/text%3E%3C/svg%3E";

    // ── Helpers ───────────────────────────────────────────────────────────────

    function formatPrice(val) {
        if (!val && val !== 0) return '';
        return new Intl.NumberFormat('sr-RS', {
            style: 'currency',
            currency: 'RSD',
            maximumFractionDigits: 0
        }).format(val);
    }

    function esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── Static spec rows (always shown) ──────────────────────────────────────
    // key = dot-path or special _handler

    var STATIC_ROWS = [
        { section: 'Osnovno',   label: 'Brend',       key: '_brand'  },
        { section: null,        label: 'Kategorija',  key: '_category' },
        { section: null,        label: 'SKU / Šifra', key: 'sku' },
        { section: 'Cena',      label: 'Naša cena',   key: '_ourPrice' },
        { section: null,        label: 'Kataloška',   key: '_retailPrice' },
        { section: null,        label: 'Dostupnost',  key: '_stock' }
    ];

    function getStaticValue(product, row) {
        switch (row.key) {
            case '_brand':
                return (product.brand && product.brand.name) ? esc(product.brand.name) : null;
            case '_category':
                return (product.category && product.category.name) ? esc(product.category.name) : null;
            case '_ourPrice': {
                var p = product.bestOurWebPrice || null;
                return p ? formatPrice(p) : null;
            }
            case '_retailPrice': {
                var r = product.bestRetailPrice || null;
                return r ? formatPrice(r) : null;
            }
            case '_stock': {
                if (!product.active) return '<span class="cv-badge cv-badge--out">Neaktivan</span>';
                var s = product.stock;
                if (!s || s <= 0) return '<span class="cv-badge cv-badge--out">Nije dostupno</span>';
                return '<span class="cv-badge cv-badge--in">Na stanju (' + s + ')</span>';
            }
            default: {
                // dot-path
                var keys = row.key.split('.');
                var val = product;
                for (var k = 0; k < keys.length; k++) {
                    if (val == null) break;
                    val = val[keys[k]];
                }
                return (val !== undefined && val !== null && val !== '') ? esc(String(val)) : null;
            }
        }
    }

    // ── Collect all unique specification names across products ────────────────

    function collectSpecNames(products) {
        var seen  = {};
        var names = [];
        products.forEach(function (item) {
            var specs = item.product.specifications || [];
            specs.forEach(function (s) {
                if (s.name && !seen[s.name]) {
                    seen[s.name] = true;
                    names.push(s.name);
                }
            });
        });
        return names;
    }

    function getSpecValue(product, specName) {
        var specs = product.specifications || [];
        for (var i = 0; i < specs.length; i++) {
            if (specs[i].name === specName) {
                return esc(specs[i].value);
            }
        }
        return null;
    }

    // ── Product header card ───────────────────────────────────────────────────

    function buildProductCard(item) {
        var p      = item.product;
        var imgSrc = p.mainImageUrl || IMG_PLACEHOLDER;
        var href   = 'product.html?slug=' + (p.slug || '');
        var ourPrc = p.bestOurWebPrice || null;
        var retPrc = p.bestRetailPrice || null;
        var inStock = !!(p.active && p.stock && p.stock > 0);

        var html = '<div class="cv-card">';
        html += '<button class="cv-card__remove" data-product-id="' + p.id + '" title="Ukloni">&times;</button>';
        html += '<a href="' + href + '" class="cv-card__img-wrap">';
        html += '<img class="cv-card__img" src="' + esc(imgSrc) + '" alt="' + esc(p.name) + '" onerror="this.src=\'' + IMG_PLACEHOLDER + '\'">';
        html += '</a>';
        html += '<div class="cv-card__name"><a href="' + href + '">' + esc(p.name) + '</a></div>';

        html += '<div class="cv-card__price-wrap">';
        if (ourPrc) {
            html += '<div class="cv-card__price">' + formatPrice(ourPrc) + '</div>';
            if (retPrc && retPrc > ourPrc) {
                html += '<div class="cv-card__old-price">' + formatPrice(retPrc) + '</div>';
            } else {
                html += '<div class="cv-card__old-price cv-card__old-price--hidden">&nbsp;</div>';
            }
        } else if (retPrc) {
            html += '<div class="cv-card__price">' + formatPrice(retPrc) + '</div>';
            html += '<div class="cv-card__old-price cv-card__old-price--hidden">&nbsp;</div>';
        } else {
            html += '<div class="cv-card__price cv-card__price--unavailable">Cena na upit</div>';
            html += '<div class="cv-card__old-price cv-card__old-price--hidden">&nbsp;</div>';
        }
        html += '</div>';

        html += '<span class="cv-badge ' + (inStock ? 'cv-badge--in' : 'cv-badge--out') + '">' +
            (inStock ? 'Na stanju' : 'Nije dostupno') + '</span>';

        html += '<button class="cv-card__cart' + (inStock ? '' : ' cv-card__cart--disabled') + '" ' +
            'data-id="' + p.id + '" data-slug="' + esc(p.slug || '') + '"' +
            (inStock ? '' : ' disabled') + '>' +
            '<i class="fa fa-shopping-cart"></i> Dodaj u korpu</button>';

        html += '</div>';
        return html;
    }

    function buildEmptySlot() {
        return '<div class="cv-card cv-card--empty">' +
            '<i class="fa fa-plus-circle cv-card__empty-icon"></i>' +
            '<span>Dodaj proizvod<br>za poređenje</span>' +
            '</div>';
    }

    // ── Table builder ─────────────────────────────────────────────────────────

    function buildTable(products) {
        var specNames = collectSpecNames(products);

        var html = '<div class="cv-table-wrap">';

        // ── Product header row ────────────────────────────────────────────────
        html += '<div class="cv-header">';
        html += '<div class="cv-header__label"></div>';
        for (var ci = 0; ci < MAX_SLOTS; ci++) {
            html += '<div class="cv-header__col">';
            html += ci < products.length ? buildProductCard(products[ci]) : buildEmptySlot();
            html += '</div>';
        }
        html += '</div>'; // .cv-header

        // ── Static rows ───────────────────────────────────────────────────────
        var lastSection = null;
        STATIC_ROWS.forEach(function (row) {
            // Section divider
            if (row.section && row.section !== lastSection) {
                lastSection = row.section;
                html += '<div class="cv-section-header">' +
                    '<span>' + row.section.toUpperCase() + '</span>' +
                    '</div>';
            }

            var vals = products.map(function (item) {
                return getStaticValue(item.product, row);
            });

            var nonNull  = vals.filter(function (v) { return v !== null && v.indexOf('<') === -1; });
            var allMatch = nonNull.length > 1 && nonNull.every(function (v) { return v === nonNull[0]; });

            html += '<div class="cv-row">';
            html += '<div class="cv-row__label">' + row.label + '</div>';
            for (var vi = 0; vi < MAX_SLOTS; vi++) {
                var val     = vi < products.length ? vals[vi] : null;
                var isEmpty = vi >= products.length;
                var cls     = 'cv-row__val';
                if (!isEmpty && val !== null && val.indexOf('<') === -1) {
                    if (allMatch) cls += ' cv-row__val--match';
                }
                html += '<div class="' + cls + (isEmpty ? ' cv-row__val--empty' : '') + '">' +
                    (isEmpty ? '' : (val !== null ? val : '<span class="cv-na">&mdash;</span>')) +
                    '</div>';
            }
            html += '</div>'; // .cv-row
        });

        // ── Dynamic specification rows ────────────────────────────────────────
        if (specNames.length > 0) {
            html += '<div class="cv-section-header"><span>SPECIFIKACIJE</span></div>';

            specNames.forEach(function (specName) {
                var vals = products.map(function (item) {
                    return getSpecValue(item.product, specName);
                });

                var nonNull  = vals.filter(function (v) { return v !== null; });
                var allMatch = nonNull.length > 1 && nonNull.every(function (v) { return v === nonNull[0]; });

                html += '<div class="cv-row">';
                html += '<div class="cv-row__label">' + esc(specName) + '</div>';
                for (var vi = 0; vi < MAX_SLOTS; vi++) {
                    var val     = vi < products.length ? vals[vi] : null;
                    var isEmpty = vi >= products.length;
                    var cls     = 'cv-row__val';
                    if (!isEmpty && val !== null && allMatch) cls += ' cv-row__val--match';
                    if (!isEmpty && val !== null && !allMatch && nonNull.length > 1) cls += ' cv-row__val--diff';
                    html += '<div class="' + cls + (isEmpty ? ' cv-row__val--empty' : '') + '">' +
                        (isEmpty ? '' : (val !== null ? val : '<span class="cv-na">&mdash;</span>')) +
                        '</div>';
                }
                html += '</div>';
            });
        }

        html += '</div>'; // .cv-table-wrap
        return html;
    }

    // ── Empty state ───────────────────────────────────────────────────────────

    function buildEmpty() {
        return [
            '<div id="compare-empty">',
            '  <div class="compare-empty-icon"><i class="fa fa-exchange"></i></div>',
            '  <h3>Lista poređenja je prazna</h3>',
            '  <p>Dodajte proizvode za poređenje klikom na ikonu <i class="fa fa-exchange"></i> na kartici proizvoda.</p>',
            '  <a href="store.html" class="primary-btn"><i class="fa fa-arrow-left"></i> Idi u prodavnicu</a>',
            '</div>'
        ].join('');
    }

    // ── Render ────────────────────────────────────────────────────────────────

    function render() {
        var $container = $('#compare-container');
        if (!$container.length) return;

        $container.html('<div class="text-center" style="padding:60px;"><i class="fa fa-spinner fa-spin fa-2x"></i></div>');

        window.OptimusCompare.loadDetails(function (items) {
            if (items.length === 0) {
                $container.html(buildEmpty());
                return;
            }

            $('#compare-product-count').text(items.length);

            $container.html(buildTable(items));

            // Remove product
            $container.on('click', '.cv-card__remove', function () {
                window.OptimusCompare.remove(parseInt($(this).data('product-id')));
                render();
            });

            // Add to cart
            $container.on('click', '.cv-card__cart:not(.cv-card__cart--disabled)', function () {
                var $btn = $(this);
                if (window.OptimusCart) {
                    window.OptimusCart.add(parseInt($btn.data('id')), 1, $btn.data('slug'));
                }
            });
        });
    }

    // ── Init ─────────────────────────────────────────────────────────────────

    $(document).ready(function () {
        render();

        // Open confirmation modal
        $(document).on('click', '#compare-clear-btn', function () {
            if (window.OptimusCompare.getCount() === 0) return;
            $('#cmp-confirm-modal').addClass('active');
        });

        // Close modal — cancel / X / backdrop click
        $(document).on('click', '#cmp-modal-cancel, #cmp-modal-close-x', function () {
            $('#cmp-confirm-modal').removeClass('active');
        });

        $(document).on('click', '#cmp-confirm-modal', function (e) {
            if ($(e.target).is('#cmp-confirm-modal')) {
                $('#cmp-confirm-modal').removeClass('active');
            }
        });

        // Confirm — clear and re-render
        $(document).on('click', '#cmp-modal-confirm', function () {
            $('#cmp-confirm-modal').removeClass('active');
            window.OptimusCompare.clear();
            render();
        });
    });

})(jQuery);
