/**
 * Store page - dynamic product loading from backend API
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;

    var state = {
        category: getParam('category') || '',
        search:   getParam('search')   || '',
        page:     parseInt(getParam('page') || '0', 10),
        size:     20,
        sort:     'name,asc'
    };

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
                        $('#breadcrumb-category').text(cat.name);
                    }
                },
                error: function () {
                    $('#breadcrumb-category').text('Products');
                }
            });
        } else {
            $('#breadcrumb-category').text('All Products');
        }
    }

    function buildProductCard(p) {
        var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23eff2f6'/%3E%3Cpath d='M100 280l100-140 120 140' fill='%23cbd0dd' stroke='%23cbd0dd' stroke-width='2'/%3E%3Ccircle cx='150' cy='120' r='30' fill='%23cbd0dd'/%3E%3Ctext x='200' y='360' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle'%3ENo image available%3C/text%3E%3C/svg%3E";
        var imgSrc   = p.mainImageUrl ? p.mainImageUrl : IMG_PLACEHOLDER;
        var labels   = '';
        if (p.isNew)  labels += '<span class="new">NEW</span>';
        
        // Build price display with both B2B and Retail prices
        var priceHtml = '';
        if (p.bestB2bPrice || p.bestRetailPrice) {
            priceHtml = '<div class="product-price-container">';
            
            // B2B cena
            if (p.bestB2bPrice) {
                priceHtml += '<div class="price-row">';
                priceHtml += '<span class="price-label">B2B:</span>';
                priceHtml += '<span class="product-price-value">' + parseFloat(p.bestB2bPrice).toFixed(2) + '</span>';
                priceHtml += '</div>';
            }
            
            // Retail cena
            if (p.bestRetailPrice) {
                priceHtml += '<div class="price-row">';
                priceHtml += '<span class="price-label">Retail:</span>';
                priceHtml += '<span class="product-price-value">' + parseFloat(p.bestRetailPrice).toFixed(2) + '</span>';
                priceHtml += '</div>';
            }
            
            priceHtml += '</div>';
        } else {
            priceHtml = '<span class="text-muted">N/A</span>';
        }
        
        var inStockClass = p.inStock ? '' : ' out-of-stock-disabled';
        var inStockBadge = !p.inStock ? '<div class="out-of-stock">Out of Stock</div>' : '';

        return [
            '<div class="col-md-4 col-xs-6">',
            '  <div class="product">',
            '    <div class="product-img">',
            '      <img src="' + imgSrc + '" alt="' + p.name + '" onerror="this.src=\'' + IMG_PLACEHOLDER + '\'">',
            '      <div class="product-label">' + labels + '</div>',
            '    </div>',
            '    <div class="product-body">',
            '      <p class="product-category">' + (p.brandName || '') + '</p>',
            '      <h3 class="product-name"><a href="product.html?slug=' + p.slug + '">' + p.name + '</a></h3>',
            '      <h4 class="product-price">' + priceHtml + '</h4>',
            '      ' + inStockBadge,
            '      <div class="product-rating"></div>',
            '      <div class="product-btns">',
            '        <button class="add-to-wishlist"><i class="fa fa-heart-o"></i><span class="tooltipp">add to wishlist</span></button>',
            '        <button class="add-to-compare"><i class="fa fa-exchange"></i><span class="tooltipp">add to compare</span></button>',
            '        <button class="quick-view"><i class="fa fa-eye"></i><span class="tooltipp">quick view</span></button>',
            '      </div>',
            '    </div>',
            '    <div class="add-to-cart">',
            '      <button class="add-to-cart-btn' + inStockClass + '" data-id="' + p.id + '" ' + (!p.inStock ? 'disabled' : '') + '><i class="fa fa-shopping-cart"></i> add to cart</button>',
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
                    
                    if (hasChildren) {
                        // Parent category - only for expand/collapse
                        $line.append(
                            $('<span class="category-toggle">')
                                .html('<i class="fa fa-chevron-right"></i>')
                        );
                        $line.append(
                            $('<span class="category-name category-parent">')
                                .text(cat.name)
                        );
                    } else {
                        // Leaf category - use checkbox style like Brand filter
                        var $checkDiv = $('<div class="input-checkbox">');
                        $checkDiv.append(
                            $('<input type="checkbox" name="cat-filter" id="cat-' + cat.id + '">')
                                .val(cat.slug)
                        );
                        var $label = $('<label for="cat-' + cat.id + '">')
                            .html('<span></span>' + cat.name);
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
                category: state.category || undefined,
                search:   state.search   || undefined,
                page:     state.page,
                size:     state.size,
                sort:     state.sort
            },
            success: function (data) {
                var products = data.content || [];

                if (products.length === 0) {
                    $grid.html('<div class="col-md-12 text-center" style="padding:40px;"><p>No products found.</p></div>');
                    $('#store-qty').text('0 products');
                    $('#store-pagination').html('');
                    return;
                }

                $grid.html(products.map(buildProductCard).join(''));

                var from = state.page * state.size + 1;
                var to   = Math.min(from + products.length - 1, data.totalElements);
                $('#store-qty').text('Showing ' + from + '-' + to + ' of ' + data.totalElements + ' products');
                $('#store-pagination').html(buildPagination(data.page, data.totalPages));
            },
            error: function () {
                $grid.html('<div class="col-md-12 text-center" style="padding:40px;"><p>Could not load products. Is the backend running?</p></div>');
            }
        });
    }

    $(document).ready(function () {

        buildCategoryFilter();
        updateBreadcrumb();

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

        // Search form in header
        $('.header-search form').on('submit', function (e) {
            e.preventDefault();
            state.search = $(this).find('.input').val().trim();
            state.page   = 0;
            loadProducts();
        });

        loadProducts();
    });

})(jQuery);
