/**
 * Shopping Cart - localStorage implementation
 * Manages cart operations for both mobile and web
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;
    var CART_KEY = 'optimus_cart';

    // Cart object with localStorage persistence
    var Cart = {
        // Get cart from localStorage
        get: function() {
            try {
                var cart = localStorage.getItem(CART_KEY);
                return cart ? JSON.parse(cart) : [];
            } catch (e) {
                console.error('Error reading cart:', e);
                return [];
            }
        },

        // Save cart to localStorage
        save: function(cart) {
            try {
                localStorage.setItem(CART_KEY, JSON.stringify(cart));
                this.updateUI();
            } catch (e) {
                console.error('Error saving cart:', e);
            }
        },

        // Add item to cart
        add: function(productId, quantity, productSlug) {
            var self = this;
            quantity = quantity || 1;
            var cart = this.get();
            
            // Check if product already exists (by ID)
            var existingItem = cart.find(function(item) { return item.productId === productId; });
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                // Get the highest order number and increment
                var maxOrderNumber = cart.reduce(function(max, item) {
                    return Math.max(max, item.orderNumber || 0);
                }, 0);
                
                cart.push({
                    productId: productId,
                    productSlug: productSlug || null,
                    quantity: quantity,
                    addedAt: new Date().toISOString(),
                    orderNumber: maxOrderNumber + 1
                });
            }
            
            this.save(cart);

            // Fetch product info for modal
            var identifier = productSlug || productId;
            $.ajax({
                url: API_BASE + '/api/products/' + identifier,
                method: 'GET',
                success: function(product) {
                    self.showCartModal(product, quantity);
                },
                error: function() {
                    self.showCartModal(null, quantity);
                }
            });
        },

        // Remove item from cart
        remove: function(productId) {
            var cart = this.get();
            var initialLength = cart.length;
            
            cart = cart.filter(function(item) { 
                return item.productId !== productId; 
            });
            
            if (initialLength !== cart.length) {
                this.save(cart);
            }
        },

        // Update item quantity
        updateQuantity: function(productId, quantity) {
            var cart = this.get();
            var item = cart.find(function(item) { return item.productId === productId; });
            
            if (item) {
                if (quantity <= 0) {
                    this.remove(productId);
                } else {
                    item.quantity = quantity;
                    this.save(cart);
                }
            }
        },

        // Clear cart
        clear: function() {
            localStorage.removeItem(CART_KEY);
            this.updateUI();
        },

        // Get cart item count
        getCount: function() {
            var cart = this.get();
            return cart.reduce(function(total, item) { return total + item.quantity; }, 0);
        },

        // Load full product details for cart items
        loadDetails: function(callback) {
            var cart = this.get();
            if (cart.length === 0) {
                callback([]);
                return;
            }
            
            var loadedCount = 0;
            var cartItems = [];
            
            cart.forEach(function(cartItem) {
                // Try slug first if available, otherwise use ID
                var identifier = cartItem.productSlug || cartItem.productId;
                
                $.ajax({
                    url: API_BASE + '/api/products/' + identifier,
                    method: 'GET',
                    success: function(product) {
                        cartItems.push({
                            product: product,
                            quantity: cartItem.quantity,
                            addedAt: cartItem.addedAt,
                            orderNumber: cartItem.orderNumber || 0
                        });
                    },
                    error: function() {
                        console.warn('Product not found:', identifier);
                    },
                    complete: function() {
                        loadedCount++;
                        if (loadedCount === cart.length) {
                            // Sort by order number before returning
                            cartItems.sort(function(a, b) {
                                return (a.orderNumber || 0) - (b.orderNumber || 0);
                            });
                            callback(cartItems);
                        }
                    }
                });
            });
        },

        // Calculate cart total
        calculateTotal: function(cartItems) {
            return cartItems.reduce(function(total, item) {
                var price = item.product.bestOurWebPrice || item.product.bestRetailPrice || 0;
                return total + (parseFloat(price) * item.quantity);
            }, 0);
        },

        // Recalculate cart - refresh product data from server
        recalculate: function(callback) {
            var self = this;
            var cart = this.get();
            
            if (cart.length === 0) {
                if (callback) callback([]);
                return;
            }
            
            var loadedCount = 0;
            var cartItemsWithProducts = [];
            var removedProductNames = [];
            
            cart.forEach(function(cartItem) {
                var identifier = cartItem.productSlug || cartItem.productId;
                
                $.ajax({
                    url: API_BASE + '/api/products/' + identifier,
                    method: 'GET',
                    success: function(product) {
                        // Remove inactive products from cart
                        if (product.active === false) {
                            removedProductNames.push(product.name || identifier);
                            self.remove(cartItem.productId);
                            return;
                        }

                        cartItemsWithProducts.push({
                            product: product,
                            quantity: cartItem.quantity,
                            addedAt: cartItem.addedAt,
                            orderNumber: cartItem.orderNumber || 0
                        });
                    },
                    error: function() {
                        // Product not found (404) - remove from cart
                        console.warn('Product not found during recalculation, removing:', identifier);
                        removedProductNames.push(String(identifier));
                        self.remove(cartItem.productId);
                    },
                    complete: function() {
                        loadedCount++;
                        
                        if (loadedCount === cart.length) {
                            // Notify user about removed items
                            if (removedProductNames.length > 0) {
                                self.showRemovedItemsNotification(removedProductNames);
                            }

                            // Sort by order number before callback
                            cartItemsWithProducts.sort(function(a, b) {
                                return (a.orderNumber || 0) - (b.orderNumber || 0);
                            });
                            
                            self.updateUI();
                            
                            if (callback) {
                                callback(cartItemsWithProducts);
                            }
                        }
                    }
                });
            });
        },

        // Show notification for removed inactive items
        showRemovedItemsNotification: function(productNames) {
            var message = productNames.length === 1
                ? 'Artikal "' + productNames[0] + '" je uklonjen iz korpe jer više nije dostupan.'
                : productNames.length + ' artikla su uklonjena iz korpe jer više nisu dostupna.';

            var $notification = $('<div class="cart-notification cart-notification--warning">')
                .text(message)
                .css({
                    position: 'fixed',
                    top: '80px',
                    right: '20px',
                    background: '#e67e22',
                    color: '#fff',
                    padding: '15px 25px',
                    borderRadius: '3px',
                    zIndex: 9999,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    maxWidth: '360px',
                    lineHeight: '1.4'
                });

            $('body').append($notification);

            setTimeout(function() {
                $notification.fadeOut(function() {
                    $(this).remove();
                });
            }, 5000);
        },

        // Update cart UI in header
        updateUI: function() {
            var count = this.getCount();
            $('.header-ctn .dropdown .qty').text(count);
            
            // Only update dropdown if it's currently visible
            if ($('.cart-dropdown').is(':visible')) {
                this.updateDropdown();
            }
        },

        // Update cart dropdown in header
        updateDropdown: function() {
            var self = this;
            this.loadDetails(function(cartItems) {
                var $cartList = $('.cart-dropdown .cart-list');
                
                if (cartItems.length === 0) {
                    $cartList.html(`
                        <div style="
                            padding: 50px 20px;
                            text-align: center;
                        ">
                            <div style="
                                width: 70px;
                                height: 70px;
                                margin: 0 auto 20px;
                                background: #f8f9fa;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">
                                <i class="fa fa-shopping-cart" style="
                                    font-size: 32px;
                                    color: #ccc;
                                "></i>
                            </div>
                            <p style="
                                color: #999;
                                font-size: 14px;
                                margin: 0;
                            ">Korpa je prazna</p>
                        </div>
                    `);
                    $('.cart-summary').hide();
                    $('.cart-btns').hide();
                    return;
                }
                
                $('.cart-summary').show();
                $('.cart-btns').show();
                
                var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23eee' width='100' height='100'/%3E%3C/svg%3E";
                
                var html = cartItems.map(function(item) {
                    var imgSrc = item.product.mainImageUrl || IMG_PLACEHOLDER;
                    var price = item.product.bestOurWebPrice || item.product.bestRetailPrice || 0;
                    
                    return [
                        '<div class="product-widget" data-product-id="' + item.product.id + '">',
                        '  <div class="product-img">',
                        '    <img src="' + imgSrc + '" alt="">',
                        '  </div>',
                        '  <div class="product-body">',
                        '    <h3 class="product-name"><a href="product.html?slug=' + item.product.slug + '">' + item.product.name + '</a></h3>',
                        '    <h4 class="product-price"><span class="qty">' + item.quantity + 'x</span>' + formatPrice(price) + '</h4>',
                        '  </div>',
                        '  <button class="delete" data-product-id="' + item.product.id + '" onclick="window.OptimusCart.remove(' + item.product.id + '); return false;"><i class="fa fa-close"></i></button>',
                        '</div>'
                    ].join('');
                }).join('');
                
                $cartList.html(html);
                
                // Update totals
                var total = self.calculateTotal(cartItems);
                $('.cart-summary small').text(cartItems.length + ' stavki izabrano');
                $('.cart-summary h5').text('MEĐUZBIR: ' + formatPrice(total));
            });
        },

        // Show notification
        showNotification: function(message) {
            // Simple notification - can be enhanced with better UI
            var $notification = $('<div class="cart-notification">')
                .text(message)
                .css({
                    position: 'fixed',
                    top: '80px',
                    right: '20px',
                    background: '#D10024',
                    color: '#fff',
                    padding: '15px 25px',
                    borderRadius: '3px',
                    zIndex: 9999,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                });
            
            $('body').append($notification);
            
            setTimeout(function() {
                $notification.fadeOut(function() {
                    $(this).remove();
                });
            }, 2000);
        },

        // Show add-to-cart modal
        showCartModal: function(product, quantity) {
            // Remove any existing modal
            $('#cart-added-modal').remove();

            var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%23bbb'%3ESlika%3C/text%3E%3C/svg%3E";

            var imgSrc = product && product.mainImageUrl ? product.mainImageUrl : IMG_PLACEHOLDER;
            var productName = product ? product.name : 'Proizvod';
            var price = product ? (product.bestOurWebPrice || product.bestRetailPrice || 0) : 0;
            var priceHtml = price > 0
                ? '<span style="color:#D10024;font-weight:700;font-size:16px;">' + formatPrice(price) + '</span>'
                : '';
            var productHref = product && product.slug ? 'product.html?slug=' + product.slug : '#';
            var cartCount = this.getCount();

            var modalHtml = [
                '<div id="cart-added-modal" style="',
                '  position:fixed;top:0;left:0;width:100%;height:100%;',
                '  background:rgba(0,0,0,0.45);z-index:10000;',
                '  display:flex;align-items:center;justify-content:center;',
                '  animation:fadeInOverlay 0.2s ease;">',
                '  <div style="',
                '    background:#fff;border-radius:8px;',
                '    max-width:480px;width:90%;',
                '    box-shadow:0 10px 40px rgba(0,0,0,0.2);',
                '    animation:slideInModal 0.25s ease;',
                '    overflow:hidden;">',

                '    <!-- Header -->',
                '    <div style="',
                '      background:#2c3e50;color:#fff;',
                '      padding:14px 20px;',
                '      display:flex;align-items:center;justify-content:space-between;">',
                '      <div style="display:flex;align-items:center;gap:10px;">',
                '        <i class="fa fa-check-circle" style="color:#2ecc71;font-size:20px;"></i>',
                '        <span style="font-size:15px;font-weight:600;">Dodato u korpu</span>',
                '      </div>',
                '      <button id="cart-modal-close" style="',
                '        background:none;border:none;color:#fff;',
                '        font-size:20px;cursor:pointer;line-height:1;opacity:0.8;">',
                '        &times;',
                '      </button>',
                '    </div>',

                '    <!-- Product row -->',
                '    <div style="padding:20px;display:flex;gap:16px;align-items:center;border-bottom:1px solid #f0f0f0;">',
                '      <a href="' + productHref + '" style="flex-shrink:0;">',
                '        <img src="' + imgSrc + '" alt="' + productName + '" style="',
                '          width:80px;height:80px;object-fit:contain;',
                '          border:1px solid #eee;border-radius:4px;background:#fafafa;">',
                '      </a>',
                '      <div style="flex:1;min-width:0;">',
                '        <a href="' + productHref + '" style="',
                '          color:#2c3e50;text-decoration:none;',
                '          font-size:14px;font-weight:600;',
                '          display:-webkit-box;-webkit-line-clamp:2;',
                '          -webkit-box-orient:vertical;overflow:hidden;">',
                '          ' + productName,
                '        </a>',
                '        <div style="margin-top:6px;display:flex;align-items:center;gap:12px;">',
                '          ' + priceHtml,
                '          <span style="color:#888;font-size:13px;">Kol: ' + quantity + '</span>',
                '        </div>',
                '      </div>',
                '    </div>',

                '    <!-- Cart summary -->',
                '    <div style="',
                '      padding:12px 20px;background:#f9f9f9;',
                '      display:flex;align-items:center;justify-content:space-between;',
                '      font-size:13px;color:#666;border-bottom:1px solid #eee;">',
                '      <span><i class="fa fa-shopping-cart" style="margin-right:6px;"></i>',
                '        Ukupno u korpi: <strong style="color:#2c3e50;">' + cartCount + ' ' + (cartCount === 1 ? 'artikal' : 'artikala') + '</strong>',
                '      </span>',
                '    </div>',

                '    <!-- Buttons -->',
                '    <div style="padding:16px 20px;display:flex;gap:10px;">',
                '      <button id="cart-modal-continue" style="',
                '        flex:1;padding:11px 16px;',
                '        border:2px solid #D10024;background:#fff;',
                '        color:#D10024;font-size:13px;font-weight:600;',
                '        border-radius:4px;cursor:pointer;',
                '        transition:all 0.2s;">',
                '        <i class="fa fa-arrow-left" style="margin-right:6px;"></i>Nastavi kupovinu',
                '      </button>',
                '      <a href="cart.html" style="',
                '        flex:1;padding:11px 16px;',
                '        background:#D10024;color:#fff;',
                '        font-size:13px;font-weight:600;',
                '        border-radius:4px;cursor:pointer;',
                '        text-align:center;text-decoration:none;',
                '        border:2px solid #D10024;',
                '        transition:all 0.2s;display:block;">',
                '        <i class="fa fa-shopping-cart" style="margin-right:6px;"></i>Idi u korpu',
                '      </a>',
                '    </div>',

                '  </div>',
                '</div>',

                '<style>',
                '@keyframes fadeInOverlay { from { opacity:0; } to { opacity:1; } }',
                '@keyframes slideInModal { from { transform:translateY(-20px);opacity:0; } to { transform:translateY(0);opacity:1; } }',
                '#cart-modal-continue:hover { background:#D10024 !important; color:#fff !important; }',
                '#cart-modal-close:hover { opacity:1 !important; }',
                '</style>'
            ].join('');

            $('body').append(modalHtml);

            var self = this;

            // Close on X button
            $('#cart-modal-close, #cart-modal-continue').on('click', function() {
                self.closeCartModal();
            });

            // Close on overlay click
            $('#cart-added-modal').on('click', function(e) {
                if ($(e.target).is('#cart-added-modal')) {
                    self.closeCartModal();
                }
            });

            // Auto-close after 6 seconds
            this._modalTimer = setTimeout(function() {
                self.closeCartModal();
            }, 6000);
        },

        closeCartModal: function() {
            clearTimeout(this._modalTimer);
            $('#cart-added-modal').fadeOut(200, function() {
                $(this).remove();
            });
        }
    };

    // Initialize cart on page load
    $(document).ready(function() {
        Cart.updateUI();

        // Add to cart button handler (delegated for dynamic content)
        $(document).on('click', '.add-to-cart-btn', function(e) {
            e.preventDefault();
            var productId = parseInt($(this).data('id'));
            var productSlug = $(this).data('slug');
            
            if (!productId || $(this).is(':disabled')) {
                return;
            }
            
            // Check if quantity input exists (product detail page)
            var $qtyInput = $(this).closest('.add-to-cart').find('input[type="number"]');
            var quantity = $qtyInput.length ? parseInt($qtyInput.val()) || 1 : 1;
            
            Cart.add(productId, quantity, productSlug);
        });

        // Remove from cart (in dropdown) - kept for backward compatibility
        $(document).on('click', '.cart-dropdown .delete', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var productId = parseInt($(this).attr('data-product-id'));
            
            if (productId && !isNaN(productId)) {
                Cart.remove(productId);
            }
        });

        // Prevent dropdown from closing when clicking inside
        $('.cart-dropdown').on('click', function(e) {
            e.stopPropagation();
        });
    });

    // Expose Cart globally
    window.OptimusCart = Cart;

})(jQuery);
