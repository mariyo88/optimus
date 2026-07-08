/**
 * Compare — localStorage implementation
 * Manages product comparison (add, remove, view, UI updates).
 * Max 4 products at a time.
 * Pattern mirrors OptimusWishlist.
 */
(function ($) {
    'use strict';

    var API_BASE    = window.APP_CONFIG.API_BASE;
    var COMPARE_KEY = 'optimus_compare';
    var MAX_ITEMS   = 4;

    var Compare = {

        // ── Storage ──────────────────────────────────────────────────────────

        get: function () {
            try {
                var raw = localStorage.getItem(COMPARE_KEY);
                return raw ? JSON.parse(raw) : [];
            } catch (e) {
                return [];
            }
        },

        save: function (list) {
            try {
                localStorage.setItem(COMPARE_KEY, JSON.stringify(list));
                this.updateUI();
            } catch (e) {
                console.error('Error saving compare list:', e);
            }
        },

        // ── CRUD ─────────────────────────────────────────────────────────────

        add: function (productId, productSlug) {
            var self = this;
            var list = this.get();

            if (list.some(function (i) { return i.productId === productId; })) {
                self.showToast('Proizvod je već dodat za poređenje.', 'info');
                return;
            }

            if (list.length >= MAX_ITEMS) {
                self.showToast('Možete porediti najviše ' + MAX_ITEMS + ' proizvoda.', 'warn');
                return;
            }

            list.push({
                productId:   productId,
                productSlug: productSlug || null,
                addedAt:     new Date().toISOString()
            });

            this.save(list);
            self.refreshButtonState(productId, true);
            self.showToast('Dodato za poređenje!', 'ok');
        },

        remove: function (productId) {
            var list    = this.get();
            var newList = list.filter(function (i) { return i.productId !== productId; });
            if (newList.length !== list.length) {
                this.save(newList);
                this.refreshButtonState(productId, false);
            }
        },

        toggle: function (productId, productSlug) {
            if (this.has(productId)) {
                this.remove(productId);
                return false;
            } else {
                this.add(productId, productSlug);
                return true;
            }
        },

        has: function (productId) {
            return this.get().some(function (i) { return i.productId === productId; });
        },

        clear: function () {
            localStorage.removeItem(COMPARE_KEY);
            this.updateUI();
        },

        getCount: function () {
            return this.get().length;
        },

        // ── Product details ───────────────────────────────────────────────────

        /**
         * Load full product details for every compare item.
         * Calls callback(enrichedItems) where each item has the full product object.
         */
        loadDetails: function (callback) {
            var list = this.get();
            if (list.length === 0) {
                callback([]);
                return;
            }

            var loaded   = 0;
            var enriched = [];

            list.forEach(function (item) {
                var identifier = item.productSlug || item.productId;

                $.ajax({
                    url:    API_BASE + '/api/products/' + identifier,
                    method: 'GET',
                    success: function (product) {
                        enriched.push({
                            product: product,
                            addedAt: item.addedAt
                        });
                    },
                    error: function () {
                        console.warn('Compare product not found:', identifier);
                    },
                    complete: function () {
                        loaded++;
                        if (loaded === list.length) {
                            // Preserve add-order
                            enriched.sort(function (a, b) {
                                return new Date(a.addedAt) - new Date(b.addedAt);
                            });
                            callback(enriched);
                        }
                    }
                });
            });
        },

        // ── UI helpers ────────────────────────────────────────────────────────

        /**
         * Update the compare count badge in the header (if present).
         */
        updateUI: function () {
            var count = this.getCount();
            $('.compare-count').text(count);

            // Show/hide floating compare bar if it exists
            if ($('#compare-float-bar').length) {
                if (count > 0) {
                    $('#compare-float-bar').addClass('visible');
                    $('#compare-float-count').text(count);
                } else {
                    $('#compare-float-bar').removeClass('visible');
                }
            }
        },

        refreshButtonState: function (productId, isInList) {
            $('[data-compare-id="' + productId + '"], .add-to-compare[data-id="' + productId + '"]').each(function () {
                var $btn = $(this);
                if (isInList) {
                    $btn.addClass('comparing');
                    $btn.find('i').removeClass('fa-exchange').addClass('fa-check');
                    $btn.find('.tooltipp').text('ukloni iz poređenja');
                } else {
                    $btn.removeClass('comparing');
                    $btn.find('i').removeClass('fa-check').addClass('fa-exchange');
                    $btn.find('.tooltipp').text('dodaj za poređenje');
                }
            });
        },

        syncButtonStates: function () {
            var self = this;
            // Reset all first
            $('.add-to-compare').each(function () {
                $(this).removeClass('comparing');
                $(this).find('i').removeClass('fa-check').addClass('fa-exchange');
                $(this).find('.tooltipp').text('dodaj za poređenje');
            });
            // Then mark the ones that are in the list
            this.get().forEach(function (item) {
                self.refreshButtonState(item.productId, true);
            });
        },

        // ── Toast notification ────────────────────────────────────────────────

        showToast: function (message, type) {
            var bgColor = type === 'info'  ? '#555'    :
                          type === 'warn'  ? '#e67e22' : '#27ae60';
            var icon    = type === 'info'  ? 'fa-info-circle' :
                          type === 'warn'  ? 'fa-exclamation-triangle' : 'fa-exchange';

            var $toast = $('<div class="compare-toast">')
                .html('<i class="fa ' + icon + '" style="margin-right:8px;"></i>' + message)
                .css({
                    position:     'fixed',
                    top:          '80px',
                    right:        '20px',
                    background:   bgColor,
                    color:        '#fff',
                    padding:      '12px 20px',
                    borderRadius: '4px',
                    zIndex:       9999,
                    fontSize:     '13px',
                    boxShadow:    '0 2px 12px rgba(0,0,0,0.2)',
                    maxWidth:     '300px'
                });

            $('body').append($toast);
            setTimeout(function () {
                $toast.fadeOut(300, function () { $(this).remove(); });
            }, 2500);
        }
    };

    // ── Global event handlers ─────────────────────────────────────────────────

    $(document).ready(function () {
        Compare.updateUI();
        Compare.syncButtonStates();

        // Delegated handler for any .add-to-compare button on the page
        $(document).on('click', '.add-to-compare', function (e) {
            e.preventDefault();
            var $btn        = $(this);
            var productId   = parseInt($btn.data('id'));
            var productSlug = $btn.data('slug');

            if (!productId) return;

            Compare.toggle(productId, productSlug);
        });
    });

    // Expose globally
    window.OptimusCompare = Compare;

})(jQuery);
