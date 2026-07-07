/**
 * Store page - dynamic product loading from backend API
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;

    var state = {
        category: getParam('category') || '',
        godCategory: getParam('godCategory') || '',
        brand:    getParam('brand')    || '',
        search:   getParam('search')   || '',
        page:     parseInt(getParam('page') || '0', 10),
        size:     21,  // 3x7 grid (3 columns x 7 rows)
        sort:     'id,desc',
        viewMode: 'grid', // 'grid' or 'list'
        minPrice: null,
        maxPrice: null
    };
    
    // Expose state globally for modern category filter
    window.storePageState = state;

    function getParam(name) {
        return new URLSearchParams(window.location.search).get(name) || '';
    }

    function updateBreadcrumb() {
        var categoryName = '';
        
        // Get active categories to find the name for the selected slug
        if (state.category) {
            // For now, we'll load categories to find the matching name
            $.ajax({
                url: API_BASE + '/api/categories/public',
                success: function (categories) {
                    function findCategoryBySlug(cats, slug) {
                        for (var i = 0; i < cats.length; i++) {
                            if (cats[i].slug === slug) return cats[i];
                            if (cats[i].children && cats[i].children.length > 0) {
                                var found = findCategoryBySlug(cats[i].children, slug);
                                if (found) return found;
                            }
                        }
                        return null;
                    }
                    
                    var cat = findCategoryBySlug(categories, state.category);
                    if (cat) {
                        // Koristi displayName ako postoji, inače fallback na name
                        var categoryName = cat.displayName || cat.name;
                        $('#breadcrumb-category').text(categoryName);
                    }
                },
                error: function () {
                    $('#breadcrumb-category').text('Products');
                }
            });
        } else {
            $('#breadcrumb-category').text('Svi proizvodi');
        }
    }
    
    // Expose functions globally for modern category filter
    window.updateStoreBreadcrumb = updateBreadcrumb;

    function buildProductCard(p) {
        var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23eff2f6'/%3E%3Cpath d='M100 280l100-140 120 140' fill='%23cbd0dd' stroke='%23cbd0dd' stroke-width='2'/%3E%3Ccircle cx='150' cy='120' r='30' fill='%23cbd0dd'/%3E%3Ctext x='200' y='360' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle'%3ESlika nije dostupna%3C/text%3E%3C/svg%3E";
        var imgSrc   = p.mainImageUrl ? p.mainImageUrl : IMG_PLACEHOLDER;
        var labels   = '';
        if (p.isNew)  labels += '<span class="new">NOVO</span>';
        
        // Build retail price display
        var priceHtml = '';
        if (p.bestOurWebPrice) {
            // Naša cena kao glavna + retailPrice kao stara prekrižena
            priceHtml = '<span class="product-price">' + formatPrice(p.bestOurWebPrice) + '</span>';
            if (p.bestRetailPrice && p.bestRetailPrice > p.bestOurWebPrice) {
                priceHtml += ' <del class="product-old-price">' + formatPrice(p.bestRetailPrice) + '</del>';
            }
        } else if (p.bestRetailPrice) {
            priceHtml = '<span class="product-price">' + formatPrice(p.bestRetailPrice) + '</span>';
        } else {
            priceHtml = '<span class="text-muted">Nije dostupno</span>';
        }
        
        var inStockClass = p.inStock ? '' : ' out-of-stock-disabled';
        var inStockBadge = !p.inStock ? '<div class="out-of-stock-overlay">Nema na stanju</div>' : '';

        return [
            '<div class="col-md-4 col-xs-6">',
            '  <div class="product' + (p.inStock ? '' : ' product-unavailable') + '">',
            '    <div class="product-img">',
            '      <img src="' + imgSrc + '" alt="' + p.name + '" onerror="this.src=\'' + IMG_PLACEHOLDER + '\'">',
            '      <div class="product-label">' + labels + '</div>',
            '      ' + inStockBadge,
            '    </div>',
            '    <div class="product-body">',
            '      <p class="product-category">' + (p.brandName || '') + '</p>',
            '      <h3 class="product-name"><a href="product.html?slug=' + p.slug + '">' + p.name + '</a></h3>',
            '      <h4 class="product-price">' + priceHtml + '</h4>',
            '      <div class="product-rating"></div>',
            '      <div class="product-btns">',
            '        <button class="add-to-wishlist" data-id="' + p.id + '" data-slug="' + p.slug + '"><i class="fa fa-heart-o"></i></button>',
            '        <button class="add-to-compare"><i class="fa fa-exchange"></i><span class="tooltipp">dodaj za poređenje</span></button>',
            '        <button class="quick-view"><i class="fa fa-eye"></i><span class="tooltipp">brzi pregled</span></button>',
            '      </div>',
            '    </div>',
            '    <div class="add-to-cart">',
            '      <button class="add-to-cart-btn' + inStockClass + '" data-id="' + p.id + '" data-slug="' + p.slug + '" ' + (!p.inStock ? 'disabled' : '') + '><i class="fa fa-shopping-cart"></i> dodaj u korpu</button>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('\n');
    }

    function buildProductListItem(p) {
        var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23eff2f6'/%3E%3Cpath d='M100 280l100-140 120 140' fill='%23cbd0dd' stroke='%23cbd0dd' stroke-width='2'/%3E%3Ccircle cx='150' cy='120' r='30' fill='%23cbd0dd'/%3E%3Ctext x='200' y='360' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle'%3ESlika nije dostupna%3C/text%3E%3C/svg%3E";
        var imgSrc   = p.mainImageUrl ? p.mainImageUrl : IMG_PLACEHOLDER;
        var labels   = '';
        if (p.isNew)  labels += '<span class="new">NOVO</span>';
        
        // Build retail price display
        var priceHtml = '';
        if (p.bestOurWebPrice) {
            priceHtml = '<span class="product-price">' + formatPrice(p.bestOurWebPrice) + '</span>';
            if (p.bestRetailPrice && p.bestRetailPrice > p.bestOurWebPrice) {
                priceHtml += ' <del class="product-old-price">' + formatPrice(p.bestRetailPrice) + '</del>';
            }
        } else if (p.bestRetailPrice) {
            priceHtml = '<span class="product-price">' + formatPrice(p.bestRetailPrice) + '</span>';
        } else {
            priceHtml = '<span class="text-muted">Nije dostupno</span>';
        }
        
        var inStockClass = p.inStock ? '' : ' out-of-stock-disabled';
        var inStockBadge = !p.inStock ? '<span class="out-of-stock-badge">Nema na stanju</span>' : '<span class="in-stock-badge">Na stanju</span>';
        
        // Truncate description if exists
        var description = p.description ? p.description.substring(0, 200) + '...' : 'Opis nije dostupan.';

        return [
            '<div class="col-md-12">',
            '  <div class="product product-list">',
            '    <div class="product-img">',
            '      <img src="' + imgSrc + '" alt="' + p.name + '" onerror="this.src=\'' + IMG_PLACEHOLDER + '\'">',
            '      <div class="product-label">' + labels + '</div>',
            '    </div>',
            '    <div class="product-body">',
            '      <p class="product-category">' + (p.brandName || '') + '</p>',
            '      <h3 class="product-name"><a href="product.html?slug=' + p.slug + '">' + p.name + '</a></h3>',
            '      <h4 class="product-price">' + priceHtml + '</h4>',
            '      <div class="product-stock-status">' + inStockBadge + '</div>',
            '      <div class="product-rating"></div>',
            '      <p class="product-description">' + description + '</p>',
            '      <div class="product-actions">',
            '        <button class="add-to-cart-btn' + inStockClass + '" data-id="' + p.id + '" data-slug="' + p.slug + '" ' + (!p.inStock ? 'disabled' : '') + '><i class="fa fa-shopping-cart"></i> dodaj u korpu</button>',
            '        <button class="add-to-wishlist" data-id="' + p.id + '" data-slug="' + p.slug + '"><i class="fa fa-heart-o"></i> Lista želja</button>',
            '        <button class="add-to-compare"><i class="fa fa-exchange"></i> Poređenje</button>',
            '      </div>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('\n');
    }

    function buildPagination(current, totalPages) {
        if (totalPages <= 1) return '';
        
        var html = '';
        var maxVisible = 7; // Show max 7 page numbers at a time
        var startPage = Math.max(0, current - Math.floor(maxVisible / 2));
        var endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
        
        // Adjust startPage if we're near the end
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(0, endPage - maxVisible + 1);
        }
        
        // Previous button
        if (current > 0) {
            html += '<li><a href="#" data-page="' + (current - 1) + '"><i class="fa fa-angle-left"></i></a></li>';
        }
        
        // First page
        if (startPage > 0) {
            html += '<li><a href="#" data-page="0">1</a></li>';
        }
        
        // Ellipsis before
        if (startPage > 1) {
            html += '<li class="disabled"><span>...</span></li>';
        }
        
        // Page numbers
        for (var i = startPage; i <= endPage; i++) {
            if (i === current) {
                html += '<li class="active"><span>' + (i + 1) + '</span></li>';
            } else {
                html += '<li><a href="#" data-page="' + i + '">' + (i + 1) + '</a></li>';
            }
        }
        
        // Ellipsis after
        if (endPage < totalPages - 2) {
            html += '<li class="disabled"><span>...</span></li>';
        }
        
        // Last page
        if (endPage < totalPages - 1) {
            html += '<li><a href="#" data-page="' + (totalPages - 1) + '">' + totalPages + '</a></li>';
        }
        
        // Next button
        if (current < totalPages - 1) {
            html += '<li><a href="#" data-page="' + (current + 1) + '"><i class="fa fa-angle-right"></i></a></li>';
        }
        
        return html;
    }

    function buildCategoryFilter() {
        var $filter = $('#category-filter');
        if (!$filter.length) return;
        
        // Check if modern filter is enabled - if so, skip this function
        if ($filter.hasClass('modern-enabled')) {
            return;
        }

        // Load categories from API - use /public endpoint for active categories only
        $.ajax({
            url: API_BASE + '/api/categories/public',
            success: function (categories) {
                $filter.empty();

                // Add separator
                $filter.append($('<div class="category-separator">'));

                // Recursively add categories with expandable structure
                function addCategoryOptions(cats) {
                    $.each(cats, function (i, cat) {
                        $filter.append(buildCategoryItem(cat, 0));
                    });
                }
                
                function buildCategoryItem(cat, level) {
                    var hasChildren = cat.children && cat.children.length > 0;
                    var $item = $('<div class="category-item" data-level="' + level + '">');
                    var $line = $('<div class="category-line">');
                    
                    // Koristi displayName ako postoji, inače fallback na name
                    var categoryName = cat.displayName || cat.name;
                    
                    if (hasChildren) {
                        // Parent category - only for expand/collapse
                        $line.append(
                            $('<span class="category-toggle">')
                                .html('<i class="fa fa-chevron-right"></i>')
                        );
                        $line.append(
                            $('<span class="category-name category-parent">')
                                .text(categoryName)
                        );
                    } else {
                        // Leaf category - use checkbox style like Brand filter
                        var $checkDiv = $('<div class="input-checkbox">');
                        $checkDiv.append(
                            $('<input type="checkbox" name="cat-filter" id="cat-' + cat.id + '">')
                                .val(cat.slug)
                        );
                        var $label = $('<label for="cat-' + cat.id + '">')
                            .html('<span></span>' + categoryName);
                        $checkDiv.append($label);
                        $line.append($checkDiv);
                    }
                    
                    $item.append($line);
                    
                    if (hasChildren) {
                        var $children = $('<div class="category-children" style="display: none;">');
                        cat.children.forEach(function(child) {
                            $children.append(buildCategoryItem(child, level + 1));
                        });
                        $item.append($children);
                    }
                    
                    return $item;
                }
                
                addCategoryOptions(categories);
                
                // Toggle expand/collapse on chevron click
                $filter.on('click', '.category-toggle', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var $item = $(this).closest('.category-item');
                    var $children = $item.find('> .category-children');
                    var $icon = $(this).find('i');
                    
                    $children.slideToggle(200, function() {
                        $icon.toggleClass('fa-chevron-right fa-chevron-down');
                    });
                });
                
                // Toggle expand/collapse on parent category name click
                $filter.on('click', '.category-parent', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var $item = $(this).closest('.category-item');
                    var $toggle = $item.find('.category-toggle');
                    $toggle.click();
                });
                
                // Category selection
                $filter.on('change', 'input[type="checkbox"]', function () {
                    // Uncheck other checkboxes (make it radio-like behavior)
                    $filter.find('input[type="checkbox"]').not(this).prop('checked', false);
                    
                    state.category = $(this).is(':checked') ? $(this).val() : '';
                    state.page = 0;
                    updateBreadcrumb();
                    loadProducts();
                });
            },
            error: function () {
                var $filter = $('#category-filter');
                $filter.html('<p class="text-danger">Could not load categories</p>');
            }
        });
    }

    function loadProducts() {
        var $grid = $('#store-products');
        $grid.html('<div class="col-md-12 text-center" style="padding:40px;"><i class="fa fa-spinner fa-spin fa-2x"></i></div>');

        $.ajax({
            url: API_BASE + '/api/products',
            data: {
                category:    state.category    || undefined,
                godCategory: state.godCategory || undefined,
                brand:       state.brand       || undefined,
                search:      state.search      || undefined,
                minPrice: state.minPrice != null ? state.minPrice : undefined,
                maxPrice: state.maxPrice != null ? state.maxPrice : undefined,
                page:     state.page,
                size:     state.size,
                sort:     state.sort
            },
            success: function (data) {
                var products = data.content || [];

                if (products.length === 0) {
                    $grid.html('<div class="col-md-12 text-center" style="padding:40px;"><p>Nema pronađenih proizvoda.</p></div>');
                    $('#store-qty').text('0 products');
                    $('#store-pagination').html('');
                    return;
                }

                $grid.html(products.map(state.viewMode === 'list' ? buildProductListItem : buildProductCard).join(''));

                // Sync wishlist heart state on newly rendered cards
                if (window.OptimusWishlist) {
                    window.OptimusWishlist.syncButtonStates();
                }

                var from = state.page * state.size + 1;
                var to   = Math.min(from + products.length - 1, data.totalElements);
                $('#store-qty').text('Prikaz ' + from + '-' + to + ' od ' + data.totalElements + ' proizvoda');
                $('#store-pagination').html(buildPagination(data.page, data.totalPages));
            },
            error: function () {
                $grid.html('<div class="col-md-12 text-center" style="padding:40px;"><p>Nije moguće učitati proizvode. Proverite konzolu za detalje.</p></div>');
            }
        });
    }
    
    // Expose function globally for modern category filter
    window.loadStoreProducts = loadProducts;

    $(document).ready(function () {

        // Check if modern or GoD category filter is enabled
        var $filter = $('#category-filter');
        var useModernCategories = $filter.hasClass('modern-enabled');
        var useGodCategories = $filter.hasClass('god-enabled');
        
        if (useModernCategories) {
            // Modern categories will be loaded by store-modern-categories.js
        } else if (useGodCategories) {
            // GoD categories will be loaded by store-god-categories.js
        } else {
            // Use traditional checkbox filter
            buildCategoryFilter();
        }
        
        updateBreadcrumb();

        // View mode toggle (grid vs list)
        $('.store-grid li').on('click', function (e) {
            e.preventDefault();
            var $this = $(this);
            
            // Update active state
            $('.store-grid li').removeClass('active');
            $this.addClass('active');
            
            // Set view mode based on icon
            if ($this.find('i').hasClass('fa-th')) {
                state.viewMode = 'grid';
            } else if ($this.find('i').hasClass('fa-th-list')) {
                state.viewMode = 'list';
            }
            
            loadProducts();
        });

        // Sort change
        $('#sort-select').on('change', function () {
            state.sort = $(this).val();
            state.page = 0;
            loadProducts();
        });

        // Pagination click
        $(document).on('click', '#store-pagination a[data-page]', function (e) {
            e.preventDefault();
            state.page = parseInt($(this).data('page'), 10);
            loadProducts();
            $('html, body').animate({ scrollTop: $('#store').offset().top - 20 }, 300);
        });

        // Search form in header is handled by header-search.js
        // which updates window.storePageState and calls window.loadStoreProducts()

        loadProducts();
    });

})(jQuery);
