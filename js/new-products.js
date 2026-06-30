/**
 * New Products - dynamic loading from backend API
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;

    var NEW_TABS = [];
    var TOP_TABS = [];

    // Load categories dynamically from backend
    function loadNewProductsCategories(callback) {
        $.ajax({
            url: API_BASE + '/api/categories/public',
            success: function (categories) {
                // Get subcategories that have "New products category" flag checked
                NEW_TABS = [];
                $.each(categories, function(i, parentCat) {
                    // If parent (root) is marked as new products (inherited from children)
                    // get only those children that have newProductsCategory checked
                    if (parentCat.newProductsCategory && parentCat.children && parentCat.children.length > 0) {
                        $.each(parentCat.children, function(j, childCat) {
                            // Only include children that have newProductsCategory flag
                            if (childCat.newProductsCategory) {
                                // Koristi displayName ako postoji, inače fallback na name
                                var categoryName = childCat.displayName || childCat.name;
                                NEW_TABS.push({ label: categoryName, category: childCat.slug });
                            }
                        });
                    }
                });
                if (callback) callback();
            },
            error: function (err) {
                console.error('Failed to load new products categories', err);
                if (callback) callback();
            }
        });
    }

    function loadTopSellingCategories(callback) {
        $.ajax({
            url: API_BASE + '/api/categories/public',
            success: function (categories) {
                // Get subcategories that have "Top selling category" flag checked
                TOP_TABS = [];
                $.each(categories, function(i, parentCat) {
                    // If parent (root) is marked as top selling (inherited from children)
                    // get only those children that have topSellingCategory checked
                    if (parentCat.topSellingCategory && parentCat.children && parentCat.children.length > 0) {
                        $.each(parentCat.children, function(j, childCat) {
                            // Only include children that have topSellingCategory flag
                            if (childCat.topSellingCategory) {
                                // Koristi displayName ako postoji, inače fallback na name
                                var categoryName = childCat.displayName || childCat.name;
                                TOP_TABS.push({ label: categoryName, category: childCat.slug });
                            }
                        });
                    }
                });
                if (callback) callback();
            },
            error: function () {
                console.error('Failed to load top selling categories');
                if (callback) callback();
            }
        });
    }

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
        var IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23eff2f6'/%3E%3Cpath d='M100 280l100-140 120 140' fill='%23cbd0dd' stroke='%23cbd0dd' stroke-width='2'/%3E%3Ccircle cx='150' cy='120' r='30' fill='%23cbd0dd'/%3E%3Ctext x='200' y='360' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle'%3ESlika nije dostupna%3C/text%3E%3C/svg%3E";
        var imgSrc = p.mainImageUrl ? p.mainImageUrl : IMG_PLACEHOLDER;
        var labels = '';
        if (p.isNew) labels += '<span class="new">NOVO</span>';
        
        // Build retail price display
        var priceHtml = '';
        if (p.bestRetailPrice) {
            priceHtml = '<h3 class="product-price">' + formatPrice(p.bestRetailPrice) + '</h3>';
        } else {
            priceHtml = '<span class="text-muted">Nije dostupno</span>';
        }
        
        var inStockClass = p.inStock ? '' : ' out-of-stock-disabled';
        var inStockBadge = !p.inStock ? '<span class="out-of-stock">Nema na stanju</span>' : '';

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
            '<button class="add-to-wishlist"><i class="fa fa-heart-o"></i><span class="tooltipp">dodaj u listu želja</span></button>' +
            '<button class="add-to-compare"><i class="fa fa-exchange"></i><span class="tooltipp">dodaj za poređenje</span></button>' +
            '<button class="quick-view"><i class="fa fa-eye"></i><span class="tooltipp">brzi pregled</span></button>' +
            '</div>' +
            '</div>' +
            '<div class="add-to-cart">' +
            '<button class="add-to-cart-btn' + inStockClass + '" data-id="' + p.id + '" data-slug="' + p.slug + '" ' + (!p.inStock ? 'disabled' : '') + '><i class="fa fa-shopping-cart"></i> dodaj u korpu</button>' +
            '</div>' +
            '</div>';
    }

    function initSlick($container, config) {
        $container.slick(config);
    }

    function loadProducts(category, $container, slickConfig, sort) {
        sort = sort || 'createdAt,desc';
        
        // Destroy slick before clearing content
        if ($container.hasClass('slick-initialized')) {
            $container.slick('unslick');
        }
        
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
                
                // Adjust slick config based on number of products
                var adjustedConfig = $.extend({}, slickConfig);
                adjustedConfig.infinite = products.length > adjustedConfig.slidesToShow;
                
                initSlick($container, adjustedConfig);
            },
            error: function (xhr, status, error) {
                console.error('Error loading products:', error, xhr);
                $container.html('<p class="text-center" style="padding:20px;">Greska pri ucitavanju proizvoda.</p>');
            }
        });
    }

    function buildTabNav(tabs, $nav, $container, slickConfig, sort) {
        $nav.empty();
        $.each(tabs, function (i, tab) {
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
            var category = $(this).data('category');
            loadProducts(category, $container, slickConfig, sort);
        });

        // Load initial products if tabs exist
        if (tabs.length > 0) {
            loadProducts(tabs[0].category, $container, slickConfig, sort);
        } else {
            console.warn('No tabs available for:', $nav.attr('id'));
        }
    }

    $(document).ready(function () {
        if ($('#new-products-slick').length) {
            loadNewProductsCategories(function() {
                buildTabNav(NEW_TABS, $('#new-products-tab-nav'), $('#new-products-slick'), SLICK_CONFIG_NEW, 'createdAt,desc');
            });
        }

        if ($('#top-selling-slick').length) {
            loadTopSellingCategories(function() {
                buildTabNav(TOP_TABS, $('#top-selling-tab-nav'), $('#top-selling-slick'), SLICK_CONFIG_TOP, 'createdAt,desc');
            });
        }
    });

})(jQuery);
