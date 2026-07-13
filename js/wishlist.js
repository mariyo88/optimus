/**
 * Wish List - localStorage implementation
 * Manages wishlist operations (add, remove, view, UI updates)
 * Pattern mirrors OptimusCart — stored as lightweight items, product details fetched on demand.
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;
    var WISHLIST_KEY = 'optimus_wishlist';

    var Wishlist = {

        // ── Storage ──────────────────────────────────────────────────────────

        get: function () {
            try {
                var raw = localStorage.getItem(WISHLIST_KEY);
                return raw ? JSON.parse(raw) : [];
            } catch (e) {
                console.error('Error reading wishlist:', e);
                return [];
            }
        },

        save: function (list) {
            try {
                localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
                this.updateUI();
            } catch (e) {
                console.error('Error saving wishlist:', e);
            }
        },

        // ── CRUD ─────────────────────────────────────────────────────────────

        /**
         * Add a product to the wishlist.
         * If it already exists, shows a "already in list" notification instead.
         */
        add: function (productId, productSlug) {
            var self = this;
            var list = this.get();

            var exists = list.some(function (item) { return item.productId === productId; });
            if (exists) {
                self.showToast('Proizvod je već u listi želja.', 'info');
                return;
            }

            list.push({
                productId: productId,
                productSlug: productSlug || null,
                addedAt: new Date().toISOString()
            });

            this.save(list);

            // Fetch product info for the confirmation modal
            var identifier = productSlug || productId;
            $.ajax({
                url: API_BASE + '/api/products/' + identifier,
                method: 'GET',
                success: function (product) {
                    self.showAddedModal(product);
                },
                error: function () {
                    self.showAddedModal(null);
                }
            });

            // Update any on-page wishlist buttons for this product
            self.refreshButtonState(productId, true);
        },

        /**
         * Remove a product from the wishlist by productId.
         */
        remove: function (productId) {
            var list = this.get();
            var newList = list.filter(function (item) { return item.productId !== productId; });
            if (newList.length !== list.length) {
                this.save(newList);
                this.refreshButtonState(productId, false);
            }
        },

        /**
         * Toggle: add if not present, remove if already there.
         * Returns true if item was added, false if removed.
         */
        toggle: function (productId, productSlug) {
            if (this.has(productId)) {
                this.remove(productId);
                return false;
            } else {
                this.add(productId, productSlug);
                return true;
            }
        },

        /**
         * Check whether a product is in the wishlist.
         */
        has: function (productId) {
            return this.get().some(function (item) { return item.productId === productId; });
        },

        /**
         * Clear the entire wishlist.
         */
        clear: function () {
            localStorage.removeItem(WISHLIST_KEY);
            this.updateUI();
        },

        /**
         * Total number of unique products in the wishlist.
         */
        getCount: function () {
            return this.get().length;
        },

        // ── Product details ───────────────────────────────────────────────────

        /**
         * Load full product details for every wishlist item.
         * Calls callback(enrichedItems) where each item has { product, addedAt }.
         */
        loadDetails: function (callback) {
            var list = this.get();
            if (list.length === 0) {
                callback([]);
                return;
            }

            var loaded = 0;
            var enriched = [];

            list.forEach(function (item) {
                var identifier = item.productSlug || item.productId;

                $.ajax({
                    url: API_BASE + '/api/products/' + identifier,
                    method: 'GET',
                    success: function (product) {
                        enriched.push({
                            product: product,
                            addedAt: item.addedAt
                        });
                    },
                    error: function () {
                        console.warn('Wishlist product not found:', identifier);
                    },
                    complete: function () {
                        loaded++;
                        if (loaded === list.length) {
                            // Preserve add-order (newest first)
                            enriched.sort(function (a, b) {
                                return new Date(b.addedAt) - new Date(a.addedAt);
                            });
                            callback(enriched);
                        }
                    }
                });
            });
        },

        // ── UI helpers ────────────────────────────────────────────────────────

        /**
         * Update the wishlist count badge in the header.
         */
        updateUI: function () {
            var count = this.getCount();
            $('.wishlist-count').text(count);
        },

        /**
         * Flip the heart icon / active class on all add-to-wishlist buttons
         * that target a specific productId.
         */
        refreshButtonState: function (productId, isInList) {
            $('[data-wishlist-id="' + productId + '"], .add-to-wishlist[data-id="' + productId + '"]').each(function () {
                var $btn = $(this);
                if (isInList) {
                    $btn.addClass('wishlisted');
                    $btn.find('i').removeClass('fa-heart-o').addClass('fa-heart');
                } else {
                    $btn.removeClass('wishlisted');
                    $btn.find('i').removeClass('fa-heart').addClass('fa-heart-o');
                }
            });
        },

        /**
         * On any page load, mark buttons whose products are already wishlisted.
         */
        syncButtonStates: function () {
            var self = this;
            var list = this.get();
            list.forEach(function (item) {
                self.refreshButtonState(item.productId, true);
            });
        },

        // ── Toast notification ────────────────────────────────────────────────

        showToast: function (message, type) {
            var bgColor = type === 'info' ? '#555' : '#4274D9';
            var $toast = $('<div class="wishlist-toast">')
                .html('<i class="fa fa-heart" style="margin-right:8px;"></i>' + message)
                .css({
                    position: 'fixed',
                    top: '80px',
                    right: '20px',
                    background: bgColor,
                    color: '#fff',
                    padding: '12px 20px',
                    borderRadius: '4px',
                    zIndex: 9999,
                    fontSize: '13px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                    maxWidth: '300px'
                });

            $('body').append($toast);
            setTimeout(function () {
                $toast.fadeOut(300, function () { $(this).remove(); });
            }, 2500);
        },

        // ── "Added to wishlist" modal ─────────────────────────────────────────

        showAddedModal: function (product) {
            $('#wishlist-added-modal').remove();

            var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%23bbb'%3ESlika%3C/text%3E%3C/svg%3E";

            var imgSrc      = product && product.mainImageUrl ? product.mainImageUrl : IMG_PLACEHOLDER;
            var productName = product ? product.name : 'Proizvod';
            var productHref = product && product.slug ? 'product.html?slug=' + product.slug : '#';
            var wishCount   = this.getCount();

            var modalHtml = [
                '<div id="wishlist-added-modal" style="',
                '  position:fixed;top:0;left:0;width:100%;height:100%;',
                '  background:rgba(0,0,0,0.45);z-index:10000;',
                '  display:flex;align-items:center;justify-content:center;',
                '  animation:fadeInOverlay 0.2s ease;">',
                '  <div style="',
                '    background:#fff;border-radius:8px;',
                '    max-width:440px;width:90%;',
                '    box-shadow:0 10px 40px rgba(0,0,0,0.2);',
                '    animation:slideInModal 0.25s ease;overflow:hidden;">',

                '    <!-- Header -->',
                '    <div style="background:#293681;color:#fff;padding:14px 20px;',
                '      display:flex;align-items:center;justify-content:space-between;">',
                '      <div style="display:flex;align-items:center;gap:10px;">',
                '        <i class="fa fa-heart" style="color:#4274D9;font-size:18px;"></i>',
                '        <span style="font-size:15px;font-weight:600;">Dodato u listu želja</span>',
                '      </div>',
                '      <button id="wl-modal-close" style="background:none;border:none;color:#fff;',
                '        font-size:20px;cursor:pointer;line-height:1;opacity:0.8;">&times;</button>',
                '    </div>',

                '    <!-- Product row -->',
                '    <div style="padding:20px;display:flex;gap:16px;align-items:center;border-bottom:1px solid #f0f0f0;">',
                '      <a href="' + productHref + '" style="flex-shrink:0;">',
                '        <img src="' + imgSrc + '" alt="' + productName + '" style="',
                '          width:80px;height:80px;object-fit:contain;',
                '          border:1px solid #eee;border-radius:4px;background:#fafafa;">',
                '      </a>',
                '      <div style="flex:1;min-width:0;">',
                '        <a href="' + productHref + '" style="color:#293681;text-decoration:none;',
                '          font-size:14px;font-weight:600;',
                '          display:-webkit-box;-webkit-line-clamp:2;',
                '          -webkit-box-orient:vertical;overflow:hidden;">',
                '          ' + productName,
                '        </a>',
                '      </div>',
                '    </div>',

                '    <!-- Count row -->',
                '    <div style="padding:12px 20px;background:#f9f9f9;',
                '      display:flex;align-items:center;justify-content:space-between;',
                '      font-size:13px;color:#666;border-bottom:1px solid #eee;">',
                '      <span><i class="fa fa-heart-o" style="margin-right:6px;color:#4274D9;"></i>',
                '        Lista želja: <strong style="color:#293681;">' + wishCount + ' ' +
                            (wishCount === 1 ? 'artikal' : 'artikala') + '</strong>',
                '      </span>',
                '    </div>',

                '    <!-- Buttons -->',
                '    <div style="padding:16px 20px;display:flex;gap:10px;">',
                '      <button id="wl-modal-continue" style="',
                '        flex:1;padding:11px 16px;',
                '        border:2px solid #4274D9;background:#fff;',
                '        color:#4274D9;font-size:13px;font-weight:600;',
                '        border-radius:4px;cursor:pointer;transition:all 0.2s;">',
                '        <i class="fa fa-arrow-left" style="margin-right:6px;"></i>Nastavi kupovinu',
                '      </button>',
                '      <a href="wishlist.html" style="',
                '        flex:1;padding:11px 16px;',
                '        background:#4274D9;color:#fff;',
                '        font-size:13px;font-weight:600;',
                '        border-radius:4px;cursor:pointer;',
                '        text-align:center;text-decoration:none;',
                '        border:2px solid #4274D9;transition:all 0.2s;display:block;">',
                '        <i class="fa fa-heart" style="margin-right:6px;"></i>Vidi listu',
                '      </a>',
                '    </div>',

                '  </div>',
                '</div>',

                '<style>',
                '@keyframes fadeInOverlay { from{opacity:0} to{opacity:1} }',
                '@keyframes slideInModal { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }',
                '#wl-modal-continue:hover{background:#4274D9 !important;color:#fff !important;}',
                '#wl-modal-close:hover{opacity:1 !important;}',
                '.add-to-wishlist.wishlisted i{color:#4274D9;}',
                '</style>'
            ].join('');

            $('body').append(modalHtml);

            var self = this;

            $('#wl-modal-close, #wl-modal-continue').on('click', function () {
                self.closeAddedModal();
            });

            $('#wishlist-added-modal').on('click', function (e) {
                if ($(e.target).is('#wishlist-added-modal')) {
                    self.closeAddedModal();
                }
            });

            this._modalTimer = setTimeout(function () {
                self.closeAddedModal();
            }, 6000);
        },

        closeAddedModal: function () {
            clearTimeout(this._modalTimer);
            $('#wishlist-added-modal').fadeOut(200, function () { $(this).remove(); });
        }
    };

    // ── Global event handlers ─────────────────────────────────────────────────

    $(document).ready(function () {
        Wishlist.updateUI();
        Wishlist.syncButtonStates();

        // Delegated handler for any .add-to-wishlist button on the page
        $(document).on('click', '.add-to-wishlist', function (e) {
            e.preventDefault();
            var $btn = $(this);
            var productId   = parseInt($btn.data('id'));
            var productSlug = $btn.data('slug');

            if (!productId) return;

            Wishlist.toggle(productId, productSlug);
        });
    });

    // Expose globally (mirrors window.OptimusCart pattern)
    window.OptimusWishlist = Wishlist;

})(jQuery);
