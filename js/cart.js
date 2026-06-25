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
            quantity = quantity || 1;
            var cart = this.get();
            
            // Check if product already exists (by ID)
            var existingItem = cart.find(function(item) { return item.productId === productId; });
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({
                    productId: productId,
                    productSlug: productSlug || null,
                    quantity: quantity,
                    addedAt: new Date().toISOString()
                });
            }
            
            this.save(cart);
            this.showNotification('Proizvod dodat u korpu');
        },

        // Remove item from cart
        remove: function(productId) {
            var cart = this.get();
            cart = cart.filter(function(item) { return item.productId !== productId; });
            this.save(cart);
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

            // Load products by slug (backend uses slug for product lookup)
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
                            addedAt: cartItem.addedAt
                        });
                    },
                    error: function() {
                        console.warn('Product not found:', identifier);
                    },
                    complete: function() {
                        loadedCount++;
                        if (loadedCount === cart.length) {
                            callback(cartItems);
                        }
                    }
                });
            });
        },

        // Calculate cart total
        calculateTotal: function(cartItems, priceType) {
            priceType = priceType || 'retail'; // 'retail' or 'b2b'
            
            return cartItems.reduce(function(total, item) {
                var price = 0;
                if (priceType === 'b2b' && item.product.bestB2bPrice) {
                    price = parseFloat(item.product.bestB2bPrice);
                } else if (item.product.bestRetailPrice) {
                    price = parseFloat(item.product.bestRetailPrice);
                }
                return total + (price * item.quantity);
            }, 0);
        },

        // Update cart UI in header
        updateUI: function() {
            var count = this.getCount();
            $('.header-ctn .qty').text(count);
            
            // Update cart dropdown
            this.updateDropdown();
        },

        // Update cart dropdown in header
        updateDropdown: function() {
            var self = this;
            this.loadDetails(function(cartItems) {
                var $cartList = $('.cart-dropdown .cart-list');
                
                if (cartItems.length === 0) {
                    $cartList.html('<p style="padding:20px;text-align:center;color:#999;">Korpa je prazna</p>');
                    $('.cart-summary').hide();
                    $('.cart-btns').hide();
                    return;
                }
                
                $('.cart-summary').show();
                $('.cart-btns').show();
                
                var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23eee' width='100' height='100'/%3E%3C/svg%3E";
                
                var html = cartItems.map(function(item) {
                    var imgSrc = item.product.mainImageUrl || IMG_PLACEHOLDER;
                    var price = item.product.bestRetailPrice || item.product.bestB2bPrice || 0;
                    
                    return [
                        '<div class="product-widget" data-product-id="' + item.product.id + '">',
                        '  <div class="product-img">',
                        '    <img src="' + imgSrc + '" alt="">',
                        '  </div>',
                        '  <div class="product-body">',
                        '    <h3 class="product-name"><a href="product.html?slug=' + item.product.slug + '">' + item.product.name + '</a></h3>',
                        '    <h4 class="product-price"><span class="qty">' + item.quantity + 'x</span>$' + parseFloat(price).toFixed(2) + '</h4>',
                        '  </div>',
                        '  <button class="delete" data-product-id="' + item.product.id + '"><i class="fa fa-close"></i></button>',
                        '</div>'
                    ].join('');
                }).join('');
                
                $cartList.html(html);
                
                // Update totals
                var total = self.calculateTotal(cartItems, 'retail');
                $('.cart-summary small').text(cartItems.length + ' Item(s) selected');
                $('.cart-summary h5').text('SUBTOTAL: $' + total.toFixed(2));
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

        // Remove from cart (in dropdown)
        $(document).on('click', '.cart-dropdown .delete', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var productId = parseInt($(this).data('product-id'));
            Cart.remove(productId);
        });

        // Prevent dropdown from closing when clicking inside
        $('.cart-dropdown').on('click', function(e) {
            e.stopPropagation();
        });
    });

    // Expose Cart globally
    window.OptimusCart = Cart;

})(jQuery);
