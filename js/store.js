/**
 * Store page — dynamic product loading from backend API
 */
(function ($) {
    'use strict';

    var API_BASE = 'https://webshop-backend-473383712022.europe-west1.run.app';

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

    function calcDiscount(price, oldPrice) {
        if (!oldPrice || parseFloat(oldPrice) <= parseFloat(price)) return '';
        return '-' + Math.round((1 - price / oldPrice) * 100) + '%';
    }

    function buildProductCard(p) {
        var imgSrc   = p.mainImageUrl ? p.mainImageUrl : './img/product01.png';
        var discount = calcDiscount(p.price, p.oldPrice);
        var labels   = '';
        if (discount) labels += '<span class="sale">' + discount + '</span>';
        if (p.isNew)  labels += '<span class="new">NEW</span>';
        var oldPriceHtml = p.oldPrice
            ? '<del class="product-old-price">$' + parseFloat(p.oldPrice).toFixed(2) + '</del>'
            : '';

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
            '      <h4 class="product-price">$' + parseFloat(p.price).toFixed(2) + ' ' + oldPriceHtml + '</h4>',
            '      <div class="product-rating"></div>',
            '      <div class="product-btns">',
            '        <button class="add-to-wishlist"><i class="fa fa-heart-o"></i><span class="tooltipp">add to wishlist</span></button>',
            '        <button class="add-to-compare"><i class="fa fa-exchange"></i><span class="tooltipp">add to compare</span></button>',
            '        <button class="quick-view"><i class="fa fa-eye"></i><span class="tooltipp">quick view</span></button>',
            '      </div>',
            '    </div>',
            '    <div class="add-to-cart">',
            '      <button class="add-to-cart-btn" data-id="' + p.id + '"><i class="fa fa-shopping-cart"></i> add to cart</button>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('\n');
    }

    function buildPagination(current, totalPages) {
        if (totalPages <= 1) return '';
        var html = '';
        if (current > 0) {
            html += '<li><a href="#" data-page="' + (current - 1) + '"><i class="fa fa-angle-left"></i></a></li>';
        }
        for (var i = 0; i < totalPages; i++) {
            if (i === current) {
                html += '<li class="active">' + (i + 1) + '</li>';
            } else {
                html += '<li><a href="#" data-page="' + i + '">' + (i + 1) + '</a></li>';
            }
        }
        if (current < totalPages - 1) {
            html += '<li><a href="#" data-page="' + (current + 1) + '"><i class="fa fa-angle-right"></i></a></li>';
        }
        return html;
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
                $('#store-pagination').html(buildPagination(data.currentPage, data.totalPages));
            },
            error: function () {
                $grid.html('<div class="col-md-12 text-center" style="padding:40px;"><p>Could not load products. Is the backend running?</p></div>');
            }
        });
    }

    $(document).ready(function () {

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
