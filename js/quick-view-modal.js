/**
 * Quick View Modal - Brzi pregled proizvoda
 * Omogućava brzi pregled proizvoda bez odlaska na stranicu proizvoda
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;
    var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23eff2f6'/%3E%3Cpath d='M100 280l100-140 120 140' fill='%23cbd0dd' stroke='%23cbd0dd' stroke-width='2'/%3E%3Ccircle cx='150' cy='120' r='30' fill='%23cbd0dd'/%3E%3Ctext x='200' y='360' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle'%3ESlika nije dostupna%3C/text%3E%3C/svg%3E";

    var currentProductData = null;

    // Helper function for correct plural form of "recenzija"
    function pluralRecenzija(n) {
        var lastTwo = n % 100;
        var lastOne = n % 10;
        if (lastOne === 1 && lastTwo !== 11) return 'recenzija';
        if (lastOne >= 2 && lastOne <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'recenzije';
        return 'recenzija';
    }

    // Create modal HTML structure
    function createModalHTML() {
        return [
            '<div id="quick-view-overlay" class="quick-view-overlay" role="dialog" aria-modal="true">',
            '  <div class="quick-view-modal">',
            '    <button class="quick-view-close" aria-label="Zatvori">&times;</button>',
            '    <div id="quick-view-body" class="quick-view-content">',
            '      <div class="quick-view-loading">',
            '        <i class="fa fa-spinner fa-spin"></i>',
            '      </div>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('\n');
    }

    // Initialize modal
    function initModal() {
        // Check if modal already exists
        if ($('#quick-view-overlay').length) {
            return;
        }

        // Append modal to body
        $('body').append(createModalHTML());

        // Close modal on overlay click
        $(document).on('click', '#quick-view-overlay', function (e) {
            if (e.target === this) {
                closeModal();
            }
        });

        // Close modal on close button click
        $(document).on('click', '.quick-view-close', function (e) {
            e.preventDefault();
            closeModal();
        });

        // Close modal on ESC key
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape' && $('#quick-view-overlay').hasClass('active')) {
                closeModal();
            }
        });
    }

    // Open modal
    function openModal(productSlug) {
        initModal();
        
        var $overlay = $('#quick-view-overlay');
        var $body = $('#quick-view-body');

        // Show loading state
        $body.html('<div class="quick-view-loading"><i class="fa fa-spinner fa-spin"></i></div>');
        $overlay.addClass('active');
        
        // Prevent body scroll
        $('body').css('overflow', 'hidden');

        // Load product data
        loadProductData(productSlug);
    }

    // Close modal
    function closeModal() {
        var $overlay = $('#quick-view-overlay');
        $overlay.removeClass('active');
        
        // Restore body scroll
        $('body').css('overflow', '');
        
        // Clear current product data
        currentProductData = null;
    }

    // Load product data from API
    function loadProductData(slug) {
        $.ajax({
            url: API_BASE + '/api/products/' + slug,
            success: function (product) {
                currentProductData = product;
                renderProductContent(product);
            },
            error: function (xhr, status, error) {
                console.error('Error loading product:', error);
                showError();
            }
        });
    }

    // Show error state
    function showError() {
        var html = [
            '<div class="quick-view-error">',
            '  <i class="fa fa-exclamation-triangle"></i>',
            '  <h4>Greška pri učitavanju</h4>',
            '  <p>Nije moguće učitati podatke o proizvodu. Pokušajte ponovo.</p>',
            '  <button class="quick-view-btn quick-view-btn-primary" onclick="$(\'#quick-view-overlay\').removeClass(\'active\');">Zatvori</button>',
            '</div>'
        ].join('\n');
        
        $('#quick-view-body').html(html);
    }

    // Build stars rating HTML
    function buildStars(rating) {
        var stars = '';
        var fullStars = Math.floor(rating);
        var hasHalfStar = rating % 1 >= 0.5;
        
        for (var i = 0; i < fullStars; i++) {
            stars += '<i class="fa fa-star"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fa fa-star-half-o"></i>';
        }
        var emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (var j = 0; j < emptyStars; j++) {
            stars += '<i class="fa fa-star-o"></i>';
        }
        
        return stars;
    }

    // Extract key features from specifications (first 2 only)
    function extractKeyFeatures(product) {
        var features = [];
        
        // Extract first 2 specifications (same as product detail page)
        if (product.specifications && product.specifications.length > 0) {
            features = product.specifications.slice(0, 2).map(function(spec) {
                return { name: spec.name, value: spec.value };
            });
        }
        
        // If no specs, use fallback data
        if (features.length === 0) {
            if (product.brand && product.brand.name) {
                features.push({ name: 'Brend', value: product.brand.name });
            }
            if (product.category) {
                var categoryName = product.category.displayName || product.category.name;
                features.push({ name: 'Kategorija', value: categoryName });
            }
        }
        
        // Limit to 2 features
        return features.slice(0, 2);
    }

    // Render product content
    function renderProductContent(product) {
        var imgSrc = product.mainImageUrl || IMG_PLACEHOLDER;
        var images = product.images || [];
        
        // Determine stock status (same logic as product-detail.js)
        var stock = product.stock || 0;
        var inStock = product.active && stock > 0;
        
        // Build image labels
        var labels = '';
        if (product.isNew) {
            labels += '<span class="new">NOVO</span>';
        }
        if (!inStock) {
            labels += '<span class="out-of-stock">Nema na stanju</span>';
        }
        
        // Build price HTML
        var priceHtml = '';
        if (product.bestOurWebPrice) {
            priceHtml = '<span class="quick-view-price-current">' + formatPrice(product.bestOurWebPrice) + '</span>';
            if (product.bestRetailPrice && product.bestRetailPrice > product.bestOurWebPrice) {
                priceHtml += '<span class="quick-view-price-old">' + formatPrice(product.bestRetailPrice) + '</span>';
            }
        } else if (product.bestRetailPrice) {
            priceHtml = '<span class="quick-view-price-current">' + formatPrice(product.bestRetailPrice) + '</span>';
        } else {
            priceHtml = '<span class="text-muted">Cena nije dostupna</span>';
        }
        
        // Availability status with stock info
        var availabilityStatus;
        if (!product.active || stock <= 0) {
            availabilityStatus = '<span class="quick-view-availability-status out-of-stock">Trenutno nedostupno</span>';
        } else if (stock <= 3) {
            var stockText = stock === 1 
                ? 'Poslednji komad na stanju' 
                : 'Brzo ponestaje — ostalo još ' + stock + ' komada';
            availabilityStatus = '<span class="quick-view-availability-status low-stock">' + stockText + '</span>';
        } else {
            availabilityStatus = '<span class="quick-view-availability-status in-stock">Na stanju (' + stock + ' komada)</span>';
        }
        
        // Build thumbnails (limit to first 4)
        var thumbnailsHtml = '';
        if (images.length > 0) {
            thumbnailsHtml = '<div class="quick-view-thumbnails">';
            images.slice(0, 4).forEach(function(img, index) {
                var activeClass = index === 0 ? ' active' : '';
                thumbnailsHtml += '<div class="quick-view-thumbnail' + activeClass + '" data-index="' + index + '">';
                thumbnailsHtml += '<img src="' + (img.imageUrl || IMG_PLACEHOLDER) + '" alt="' + product.name + '">';
                thumbnailsHtml += '</div>';
            });
            thumbnailsHtml += '</div>';
        }
        
        // Extract key features (first 2 specs)
        var features = extractKeyFeatures(product);
        var featuresHtml = '';
        if (features.length > 0) {
            featuresHtml = '<div class="quick-view-features">';
            featuresHtml += '<h5>Ključne karakteristike:</h5>';
            featuresHtml += '<ul>';
            features.forEach(function(feature) {
                featuresHtml += '<li><i class="fa fa-check"></i><strong>' + feature.name + ':</strong> ' + feature.value + '</li>';
            });
            featuresHtml += '</ul>';
            featuresHtml += '</div>';
        }
        
        // Build average rating
        var avgRating = product.averageRating || 0;
        var reviewCount = product.reviewCount || 0;
        var starsHtml = buildStars(avgRating);
        var reviewText = reviewCount === 0 ? 'Nema recenzija' : reviewCount + ' ' + pluralRecenzija(reviewCount);
        
        // Build full HTML
        var html = [
            '<div class="quick-view-row">',
            '  <div class="quick-view-col quick-view-col-left">',
            '    <div class="quick-view-images">',
            '      <div class="quick-view-main-image">',
            '        <img id="quick-view-main-img" src="' + imgSrc + '" alt="' + product.name + '">',
            '        <div class="quick-view-image-label">' + labels + '</div>',
            '      </div>',
            '      ' + thumbnailsHtml,
            '    </div>',
            '  </div>',
            '  <div class="quick-view-col quick-view-col-right">',
            '    <div class="quick-view-details">',
            '      <span class="quick-view-category">' + (product.brand && product.brand.name ? product.brand.name : 'Proizvod') + '</span>',
            '      <h2 class="quick-view-title">' + product.name + '</h2>',
            '      <div class="quick-view-rating">',
            '        <div class="quick-view-stars">' + starsHtml + '</div>',
            '        <span class="quick-view-review-text">' + reviewText + '</span>',
            '      </div>',
            '      <div class="quick-view-price">' + priceHtml + '</div>',
            '      <div class="quick-view-availability">',
            '        <span class="quick-view-availability-label">Dostupnost:</span>',
            '        ' + availabilityStatus,
            '      </div>',
            '      ' + featuresHtml,
            '      <div class="quick-view-purchase-section">',
            '        <button class="quick-view-btn quick-view-btn-buy" ' + (!inStock ? 'disabled' : '') + ' data-id="' + product.id + '" data-slug="' + product.slug + '">',
            '          <i class="fa fa-shopping-cart"></i> Kupi',
            '        </button>',
            '      </div>',
            '      <div class="quick-view-actions">',
            '        <button class="quick-view-btn quick-view-btn-wishlist quick-view-add-to-wishlist" data-id="' + product.id + '" data-slug="' + product.slug + '">',
            '          <i class="fa fa-heart-o"></i> Lista želja',
            '        </button>',
            '        <button class="quick-view-btn quick-view-btn-view quick-view-view-details" data-slug="' + product.slug + '">',
            '          <i class="fa fa-info-circle"></i> Vidi detalje',
            '        </button>',
            '      </div>',
            '      <div class="quick-view-share">',
            '        <span class="quick-view-share-label">Podeli:</span>',
            '        <a href="#" class="quick-view-share-btn quick-view-share-facebook" data-slug="' + product.slug + '" title="Podeli na Facebook"><i class="fa fa-facebook"></i></a>',
            '        <a href="#" class="quick-view-share-btn quick-view-share-whatsapp" data-slug="' + product.slug + '" title="Podeli na WhatsApp"><i class="fa fa-whatsapp"></i></a>',
            '        <a href="#" class="quick-view-share-btn quick-view-share-copy" data-slug="' + product.slug + '" title="Kopiraj link"><i class="fa fa-link"></i></a>',
            '      </div>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('\n');

        $('#quick-view-body').html(html);
        
        // Initialize interactions
        initProductInteractions(product);
    }

    // Initialize product interactions
    function initProductInteractions(product) {
        var $body = $('#quick-view-body');
        
        // Image thumbnails click
        $body.on('click', '.quick-view-thumbnail', function() {
            var index = $(this).data('index');
            var images = product.images || [];
            
            if (images[index]) {
                $('#quick-view-main-img').attr('src', images[index].imageUrl || IMG_PLACEHOLDER);
                $('.quick-view-thumbnail').removeClass('active');
                $(this).addClass('active');
            }
        });
        
        // Buy button (quantity = 1) - silent mode (no modal)
        $body.on('click', '.quick-view-btn-buy', function() {
            var stock = product.stock || 0;
            var inStock = product.active && stock > 0;
            if (!inStock) return;
            
            var qty = 1; // Always 1 for quick view
            var $btn = $(this);
            var originalText = $btn.html();
            
            // Disable button and show loading
            $btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Dodavanje...');
            
            // Silent add to cart (no modal)
            if (window.OptimusCart) {
                try {
                    // Get cart directly from localStorage
                    var CART_KEY = 'optimus_cart';
                    var cart = localStorage.getItem(CART_KEY);
                    cart = cart ? JSON.parse(cart) : [];
                    
                    // Check if product already exists
                    var existingItem = cart.find(function(item) { return item.productId === product.id; });
                    
                    if (existingItem) {
                        existingItem.quantity += qty;
                    } else {
                        var maxOrderNumber = cart.reduce(function(max, item) {
                            return Math.max(max, item.orderNumber || 0);
                        }, 0);
                        
                        cart.push({
                            productId: product.id,
                            productSlug: product.slug,
                            quantity: qty,
                            addedAt: new Date().toISOString(),
                            orderNumber: maxOrderNumber + 1
                        });
                    }
                    
                    // Save to localStorage
                    localStorage.setItem(CART_KEY, JSON.stringify(cart));
                    
                    // Update cart UI
                    if (window.OptimusCart.updateUI) {
                        window.OptimusCart.updateUI();
                    }
                    
                    // Success feedback
                    $btn.html('<i class="fa fa-check"></i> Dodato u korpu');
                    setTimeout(function() {
                        $btn.prop('disabled', false).html(originalText);
                    }, 2000);
                    
                } catch (e) {
                    console.error('Error adding to cart:', e);
                    $btn.html('<i class="fa fa-times"></i> Greška');
                    setTimeout(function() {
                        $btn.prop('disabled', false).html(originalText);
                    }, 2000);
                }
            } else {
                console.error('OptimusCart is not available');
                $btn.prop('disabled', false).html(originalText);
            }
        });
        
        // Add to wishlist (silent mode - no modal)
        $body.on('click', '.quick-view-add-to-wishlist', function() {
            var $btn = $(this);
            var $icon = $btn.find('i');
            
            if (window.OptimusWishlist) {
                try {
                    // Get wishlist directly from localStorage
                    var WISHLIST_KEY = 'optimus_wishlist';
                    var list = localStorage.getItem(WISHLIST_KEY);
                    list = list ? JSON.parse(list) : [];
                    
                    var isInWishlist = list.some(function(item) { return item.productId === product.id; });
                    
                    if (isInWishlist) {
                        // Remove from wishlist
                        list = list.filter(function(item) { return item.productId !== product.id; });
                        localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
                        $icon.removeClass('fa-heart').addClass('fa-heart-o');
                        
                        // Show feedback
                        var originalText = $btn.html();
                        $btn.html('<i class="fa fa-check"></i> Uklonjeno');
                        setTimeout(function() {
                            $btn.html('<i class="fa fa-heart-o"></i> Lista želja');
                        }, 1500);
                    } else {
                        // Add to wishlist
                        list.push({
                            productId: product.id,
                            productSlug: product.slug,
                            addedAt: new Date().toISOString()
                        });
                        localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
                        $icon.removeClass('fa-heart-o').addClass('fa-heart');
                        
                        // Show feedback
                        var originalText = $btn.html();
                        $btn.html('<i class="fa fa-heart"></i> Dodato');
                        setTimeout(function() {
                            $btn.html('<i class="fa fa-heart"></i> Lista želja');
                        }, 1500);
                    }
                    
                    // Update wishlist UI
                    if (window.OptimusWishlist.updateUI) {
                        window.OptimusWishlist.updateUI();
                    }
                    
                } catch (e) {
                    console.error('Error toggling wishlist:', e);
                }
            }
        });
        
        // View full details
        $body.on('click', '.quick-view-view-details', function() {
            var slug = $(this).data('slug');
            window.location.href = 'product.html?slug=' + slug;
        });
        
        // Share buttons
        $body.on('click', '.quick-view-share-facebook', function(e) {
            e.preventDefault();
            var slug = $(this).data('slug');
            var productUrl = window.location.origin + '/product.html?slug=' + slug;
            var facebookUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(productUrl);
            window.open(facebookUrl, '_blank', 'noopener,noreferrer');
        });
        
        $body.on('click', '.quick-view-share-whatsapp', function(e) {
            e.preventDefault();
            var slug = $(this).data('slug');
            var productUrl = window.location.origin + '/product.html?slug=' + slug;
            var whatsappUrl = 'https://wa.me/?text=' + encodeURIComponent(productUrl);
            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        });
        
        $body.on('click', '.quick-view-share-copy', function(e) {
            e.preventDefault();
            var slug = $(this).data('slug');
            var productUrl = window.location.origin + '/product.html?slug=' + slug;
            var $btn = $(this);
            var origHtml = $btn.html();
            
            navigator.clipboard.writeText(productUrl).then(function() {
                $btn.html('<i class="fa fa-check"></i>');
                setTimeout(function() {
                    $btn.html(origHtml);
                }, 1800);
            }).catch(function(err) {
                console.error('Failed to copy:', err);
            });
        });
        
        // Sync wishlist state on modal open
        try {
            var WISHLIST_KEY = 'optimus_wishlist';
            var list = localStorage.getItem(WISHLIST_KEY);
            list = list ? JSON.parse(list) : [];
            var isInWishlist = list.some(function(item) { return item.productId === product.id; });
            
            if (isInWishlist) {
                $('.quick-view-add-to-wishlist i').removeClass('fa-heart-o').addClass('fa-heart');
            }
        } catch (e) {
            console.error('Error syncing wishlist state:', e);
        }
    }

    // Attach event to all quick-view buttons
    $(document).on('click', '.quick-view', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Try to get product slug from various sources
        var $productCard = $(this).closest('.product');
        var $productLink = $productCard.find('.product-name a').first();
        var slug = '';
        
        if ($productLink.length) {
            var href = $productLink.attr('href');
            var match = href.match(/slug=([^&]+)/);
            if (match) {
                slug = match[1];
            }
        }
        
        if (slug) {
            openModal(slug);
        } else {
            console.error('Could not determine product slug');
            alert('Greška: Nije moguće pronaći proizvod.');
        }
    });

    // Public API
    window.QuickViewModal = {
        open: openModal,
        close: closeModal
    };

})(jQuery);
