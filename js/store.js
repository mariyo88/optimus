/**
 * Store page - dynamic product loading from backend API
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;

    var CATEGORIES = [
        { label: 'All',                   slug: ''                      },
        { label: 'Laptops',               slug: 'laptops'               },
        { label: 'Smartphones',           slug: 'smartphones'           },
        { label: 'Cameras',               slug: 'cameras'               },
        { label: 'Accessories',           slug: 'accessories'           },
        { label: 'Slushalice i mikrofoni', slug: 'slusalice-i-mikrofoni' },
        { label: 'Web kamere',            slug: 'web-kamere'            },
        { label: 'Brend racunari',        slug: 'brend-racunari'        }
    ];

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

    function buildProductCard(p) {
        var imgSrc   = p.mainImageUrl ? p.mainImageUrl : './img/product01.png';
        var labels   = '';
        if (p.isNew)  labels += '<span class="new">NEW</span>';
        
        // Build price display with both B2B (web price) and retail price
        var priceHtml = '';
        if (p.bestWebPrice || p.bestRetailPrice) {
            priceHtml = '<div class="product-price-container">';
            
            // B2B cijena (Web price) - show if available
            if (p.bestWebPrice) {
                priceHtml += '<div class="price-row">';
                priceHtml += '<span class="price-label">B2B:</span>';
                priceHtml += '<span class="product-price-value">' + parseFloat(p.bestWebPrice).toFixed(2) + '</span>';
                priceHtml += '</div>';
            }
            
            // Retail cijena - always show if available
            if (p.bestRetailPrice) {
                priceHtml += '<div class="price-row">';
                // Use different label depending on whether we have web price
                var label = p.bestWebPrice ? 'Retail:' : 'Cijena:';
                priceHtml += '<span class="price-label">' + label + '</span>';
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
            '      <img src="' + imgSrc + '" alt="' + p.name + '">',
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

        $filter.empty();
        $.each(CATEGORIES, function (i, cat) {
            var isActive = (state.category === cat.slug);
            var $div = $('<div class="input-checkbox">');
            var $input = $('<input type="radio" name="cat-filter">')
                .attr('id', 'cat-' + i)
                .val(cat.slug)
                .prop('checked', isActive);
            var $label = $('<label>')
                .attr('for', 'cat-' + i)
                .html('<span></span>' + cat.label);
            $div.append($input).append($label);
            $filter.append($div);
        });

        $filter.on('change', 'input[type="radio"]', function () {
            state.category = $(this).val();
            state.page = 0;
            loadProducts();
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
