/**
 * New Products - dynamic loading from backend API
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;

    var TABS = [
        { label: 'Laptops',              category: 'laptops'               },
        { label: 'Miševi',               category: 'misevi'                },
        { label: 'Cameras',              category: 'cameras'               },
        { label: 'Accessories',          category: 'accessories'           },
        { label: 'Slušalice i mikrofoni', category: 'slusalice-i-mikrofoni' },
        { label: 'Web kamere',            category: 'web-kamere'            },
        { label: 'Brend racunari',        category: 'brend-racunari'        }
    ];

    var SLICK_CONFIG_NEW = {
        slidesToShow: 4,
        slidesToScroll: 1,
        autoplay: true,
        infinite: true,
        speed: 300,
        dots: false,
        arrows: true,
        appendArrows: '#slick-nav-1',
        responsive: [
            { breakpoint: 991, settings: { slidesToShow: 2, slidesToScroll: 1 } },
            { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } }
        ]
    };

    var SLICK_CONFIG_TOP = {
        slidesToShow: 4,
        slidesToScroll: 1,
        autoplay: true,
        infinite: true,
        speed: 300,
        dots: false,
        arrows: true,
        appendArrows: '#slick-nav-2',
        responsive: [
            { breakpoint: 991, settings: { slidesToShow: 2, slidesToScroll: 1 } },
            { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } }
        ]
    };

    function buildProductCard(p) {
        var imgSrc = p.mainImageUrl ? p.mainImageUrl : './img/product01.png';
        var labels = '';
        if (p.isNew) labels += '<span class="new">NEW</span>';
        
        // Build price display with both B2B (web price) and retail price
        var priceHtml = '';
        if (p.bestWebPrice || p.bestRetailPrice) {
            priceHtml = '<div class="product-price-container">';
            
            // B2B cijena (Web price)
            if (p.bestWebPrice) {
                priceHtml += '<div class="price-row">';
                priceHtml += '<span class="price-label">B2B:</span>';
                priceHtml += '<span class="product-price-value">' + parseFloat(p.bestWebPrice).toFixed(2) + '</span>';
                priceHtml += '</div>';
            }
            
            // Retail cijena
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
        var inStockBadge = !p.inStock ? '<span class="out-of-stock">Out of Stock</span>' : '';

        return '<div class="product">' +
            '<div class="product-img">' +
            '<img src="' + imgSrc + '" alt="' + p.name + '">' +
            '<div class="product-label">' + labels + '</div>' +
            '</div>' +
            '<div class="product-body">' +
            '<p class="product-category">' + (p.brandName || '') + '</p>' +
            '<h3 class="product-name"><a href="product.html?slug=' + p.slug + '">' + p.name + '</a></h3>' +
            '<h4 class="product-price">' + priceHtml + '</h4>' +
            inStockBadge +
            '<div class="product-rating"></div>' +
            '<div class="product-btns">' +
            '<button class="add-to-wishlist"><i class="fa fa-heart-o"></i><span class="tooltipp">add to wishlist</span></button>' +
            '<button class="add-to-compare"><i class="fa fa-exchange"></i><span class="tooltipp">add to compare</span></button>' +
            '<button class="quick-view"><i class="fa fa-eye"></i><span class="tooltipp">quick view</span></button>' +
            '</div>' +
            '</div>' +
            '<div class="add-to-cart">' +
            '<button class="add-to-cart-btn' + inStockClass + '" data-id="' + p.id + '" ' + (!p.inStock ? 'disabled' : '') + '><i class="fa fa-shopping-cart"></i> add to cart</button>' +
            '</div>' +
            '</div>';
    }

    function initSlick($container, config) {
        if ($container.hasClass('slick-initialized')) {
            $container.slick('unslick');
        }
        $container.slick(config);
    }

    function loadProducts(category, $container, slickConfig, sort) {
        sort = sort || 'createdAt,desc';
        $.ajax({
            url: API_BASE + '/api/products',
            data: { category: category, size: 10, sort: sort },
            success: function (data) {
                var products = data.content || [];
                if (products.length === 0) {
                    $container.html('<p class="text-center" style="padding:20px;">Nema proizvoda.</p>');
                    return;
                }
                $container.html(products.map(buildProductCard).join(''));
                initSlick($container, slickConfig);
            },
            error: function () {
                $container.html('<p class="text-center" style="padding:20px;">Greska pri ucitavanju proizvoda.</p>');
            }
        });
    }

    function buildTabNav($nav, $container, slickConfig, sort) {
        $nav.empty();
        $.each(TABS, function (i, tab) {
            var $li = $('<li>');
            if (i === 0) $li.addClass('active');
            var $a = $('<a href="#">').text(tab.label).data('category', tab.category);
            $li.append($a);
            $nav.append($li);
        });

        $nav.on('click', 'a', function (e) {
            e.preventDefault();
            $nav.find('li').removeClass('active');
            $(this).parent().addClass('active');
            loadProducts($(this).data('category'), $container, slickConfig, sort);
        });
    }

    $(document).ready(function () {
        if ($('#new-products-slick').length) {
            buildTabNav($('#new-products-tab-nav'), $('#new-products-slick'), SLICK_CONFIG_NEW, 'createdAt,desc');
            loadProducts(TABS[0].category, $('#new-products-slick'), SLICK_CONFIG_NEW, 'createdAt,desc');
        }

        if ($('#top-selling-slick').length) {
            buildTabNav($('#top-selling-tab-nav'), $('#top-selling-slick'), SLICK_CONFIG_TOP, 'createdAt,desc');
            loadProducts(TABS[0].category, $('#top-selling-slick'), SLICK_CONFIG_TOP, 'createdAt,desc');
        }
    });

})(jQuery);
