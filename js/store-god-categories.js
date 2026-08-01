/**
 * GoD Category Filter - Group of Departments with icon-based design
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;

    function buildGodCategoryFilter() {
        var $filter = $('#category-filter');
        if (!$filter.length) {
            console.error('Category filter element not found');
            return;
        }

        // Load both GoD categories and full category tree
        $.when(
            $.ajax({ url: API_BASE + '/api/god-categories' }),
            $.ajax({ url: API_BASE + '/api/categories/public' })
        ).done(function(godResponse, categoriesResponse) {
            var godCategories = godResponse[0];
            var allCategories = categoriesResponse[0];
            
            // Build category lookup map
            var categoryMap = {};
            function buildCategoryMap(categories) {
                categories.forEach(function(cat) {
                    categoryMap[cat.id] = cat;
                    if (cat.children && cat.children.length > 0) {
                        buildCategoryMap(cat.children);
                    }
                });
            }
            buildCategoryMap(allCategories);
            
            $filter.empty();
                
                // Add modern category filter structure
                var $modernFilter = $('<div class="god-category-filter">');
                
                // Header with "All Departments"
                var $header = $('<div class="category-header">');
                $header.append('<div class="category-header-icon"><i></i><i></i><i></i></div>');
                $header.append('<div class="category-header-title">Sve kategorije</div>');
                $header.append('<span class="category-collapse-toggle"><i class="fa fa-angle-down"></i></span>');
                $modernFilter.append($header);
                
                // GoD Category list - wrapped in collapsible container
                var $listWrapper = $('<div class="god-category-list-wrapper expanded">');
                var $list = $('<div class="god-category-list">');
                
                // Build each GoD category
                godCategories.forEach(function(godCat) {
                    var $godItem = $('<div class="god-category-item">');
                    $godItem.attr('data-id', godCat.id);
                    $godItem.attr('data-slug', godCat.slug);
                    
                    var categoryName = godCat.displayName || godCat.name;
                    var icon = godCat.iconClass || 'fa-folder';
                    var imageUrl = godCat.imageUrl || null;
                    var hasMappings = godCat.mappedCategories && godCat.mappedCategories.length > 0;
                    
                    if (hasMappings) {
                        $godItem.addClass('has-mappings');
                    }
                    
                    // GoD Category header
                    var $godHeader = $('<div class="god-category-header">');
                    
                    // Icon or image
                    var $godIcon = $('<span class="god-icon">');
                    if (imageUrl) {
                        $godIcon.addClass('god-icon--image');
                        $godIcon.append('<img src="' + imageUrl + '" alt="' + categoryName + '">');
                    } else {
                        $godIcon.append('<i class="fa ' + icon + '"></i>');
                    }
                    $godHeader.append($godIcon);
                    $godHeader.append('<span class="god-name">' + categoryName + '</span>');
                    
                    if (hasMappings) {
                        $godHeader.append('<span class="god-chevron"><i class="fa fa-angle-right"></i></span>');
                    }
                    
                    $godItem.append($godHeader);
                    
                    // Mapped categories (if any)
                    if (hasMappings) {
                        var $mappedList = $('<div class="mapped-categories-list">');
                        
                        godCat.mappedCategories.forEach(function(mappedCat) {
                            // Find full category data with children
                            var fullCategory = categoryMap[mappedCat.id];
                            var hasChildren = fullCategory && fullCategory.children && fullCategory.children.length > 0;
                            
                            var $mappedItem = $('<div class="mapped-category-item">');
                            $mappedItem.attr('data-slug', mappedCat.slug);
                            $mappedItem.attr('data-id', mappedCat.id);
                            
                            if (hasChildren) {
                                $mappedItem.addClass('has-children');
                            }
                            
                            // href allows crawlers to follow the link without JS
                            var $mappedLink = $('<a class="mapped-category-link">');
                            $mappedLink.attr('href', 'store.html?category=' + mappedCat.slug);
                            
                            // Add image if available
                            if (fullCategory && fullCategory.imageUrl) {
                                $mappedLink.addClass('has-image');
                                var $catImg = $('<span class="mapped-category-icon mapped-category-icon--image">');
                                $catImg.append('<img src="' + fullCategory.imageUrl + '" alt="' + (mappedCat.displayName || mappedCat.name) + '">');
                                $mappedLink.append($catImg);
                            }
                            
                            $mappedLink.append('<span class="mapped-category-name">' + (mappedCat.displayName || mappedCat.name) + '</span>');
                            
                            if (hasChildren) {
                                $mappedLink.append('<span class="mapped-chevron"><i class="fa fa-angle-right"></i></span>');
                            }
                            
                            $mappedItem.append($mappedLink);
                            
                            // Add sub-categories (children) if any
                            if (hasChildren) {
                                var $subList = $('<div class="sub-categories-list">');
                                
                                fullCategory.children.forEach(function(child) {
                                    // href allows crawlers to follow without JS
                                    var $subItem = $('<a class="sub-category-item">');
                                    $subItem.attr('href', 'store.html?category=' + child.slug);
                                    $subItem.attr('data-slug', child.slug);
                                    $subItem.attr('data-id', child.id);
                                    
                                    // Add image if available
                                    if (child.imageUrl) {
                                        $subItem.addClass('has-image');
                                        var $subImg = $('<span class="sub-category-icon sub-category-icon--image">');
                                        $subImg.append('<img src="' + child.imageUrl + '" alt="' + (child.displayName || child.name) + '">');
                                        $subItem.append($subImg);
                                    }
                                    
                                    $subItem.append('<span class="sub-category-name">' + (child.displayName || child.name) + '</span>');
                                    $subList.append($subItem);
                                });
                                
                                $mappedItem.append($subList);
                            }
                            
                            $mappedList.append($mappedItem);
                        });
                        
                        $godItem.append($mappedList);
                    }
                    
                    $list.append($godItem);
                });
                
                $listWrapper.append($list);
                $modernFilter.append($listWrapper);
                $filter.append($modernFilter);
                
                // Event handlers
                
                // Toggle button click - collapse/expand entire category filter
                $header.find('.category-collapse-toggle').on('click', function(e) {
                    e.stopPropagation();
                    var $wrapper = $modernFilter.find('.god-category-list-wrapper');
                    var $icon = $(this).find('i');
                    var isExpanded = $wrapper.hasClass('expanded');
                    
                    if (isExpanded) {
                        // Collapse entire filter
                        $wrapper.removeClass('expanded').slideUp(200);
                        $icon.removeClass('fa-angle-down').addClass('fa-angle-up');
                    } else {
                        // Expand entire filter
                        $wrapper.addClass('expanded').slideDown(200);
                        $icon.removeClass('fa-angle-up').addClass('fa-angle-down');
                    }
                });
                
                // Header click (excluding toggle button) - reset filter (show all products)
                $header.on('click', function(e) {
                    // Don't reset if clicking the toggle button
                    if ($(e.target).closest('.category-collapse-toggle').length) {
                        return;
                    }
                    
                    $('.god-category-item').removeClass('expanded');
                    $('.mapped-category-item').removeClass('selected');
                    $('.god-category-header').removeClass('active');
                    
                    // Expand the category list if it was collapsed
                    var $wrapper = $modernFilter.find('.god-category-list-wrapper');
                    if (!$wrapper.hasClass('expanded')) {
                        $wrapper.addClass('expanded').slideDown(200);
                        $header.find('.category-collapse-toggle i').removeClass('fa-angle-up').addClass('fa-angle-down');
                    }
                    
                    if (window.storePageState) {
                        window.storePageState.category = '';
                        window.storePageState.godCategory = '';
                        window.storePageState.brand = '';
                        window.storePageState.specifications = {};
                        window.storePageState.page = 0;
                        if (window.updateStoreBreadcrumb) window.updateStoreBreadcrumb();
                        if (window.loadBrandsForCategory) window.loadBrandsForCategory('', '');
                        if (window.loadPriceRangesForCategory) window.loadPriceRangesForCategory('', '');
                        if (window.loadSpecificationsForCategory) window.loadSpecificationsForCategory('', '');
                        if (window.loadStoreProducts) window.loadStoreProducts();
                    }
                });
                
                // GoD Category header click - expand/collapse and load products
                $filter.on('click', '.god-category-header', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    var $header = $(this);
                    var $godItem = $header.closest('.god-category-item');
                    var $mappedList = $godItem.find('.mapped-categories-list');
                    var isExpanded = $godItem.hasClass('expanded');
                    var godSlug = $godItem.data('slug');
                    
                    if ($mappedList.length === 0) {
                        return; // No mapped categories, do nothing
                    }
                    
                    if (isExpanded) {
                        // Collapse
                        $godItem.removeClass('expanded');
                        $mappedList.slideUp(200);
                        $header.find('.god-chevron i').removeClass('fa-angle-down').addClass('fa-angle-right');
                    } else {
                        // Collapse all other GoD categories first
                        $('.god-category-item').removeClass('expanded');
                        $('.mapped-categories-list').slideUp(200);
                        $('.god-chevron i').removeClass('fa-angle-down').addClass('fa-angle-right');
                        
                        // Expand this one
                        $godItem.addClass('expanded');
                        $mappedList.slideDown(200);
                        $header.find('.god-chevron i').removeClass('fa-angle-right').addClass('fa-angle-down');
                    }
                    
                    // Load products for this God category
                    $('.mapped-category-item').removeClass('selected');
                    $('.sub-category-item').removeClass('selected');
                    $('.god-category-header').removeClass('active');
                    $header.addClass('active');
                    
                    if (window.storePageState) {
                        window.storePageState.godCategory = godSlug;
                        window.storePageState.category = '';
                        window.storePageState.brand = '';
                        window.storePageState.specifications = {};
                        window.storePageState.page = 0;
                        if (window.updateStoreBreadcrumb) window.updateStoreBreadcrumb();
                        if (window.loadBrandsForCategory) window.loadBrandsForCategory('', godSlug);
                        if (window.loadPriceRangesForCategory) window.loadPriceRangesForCategory('', godSlug);
                        if (window.loadSpecificationsForCategory) window.loadSpecificationsForCategory('', godSlug);
                        if (window.loadStoreProducts) window.loadStoreProducts();
                    }
                });
                
                // Mapped category click - expand/collapse sub-categories AND filter products
                $filter.on('click', '.mapped-category-link', function(e) {
                    e.preventDefault();
                    e.stopPropagation();                    
                    var $link = $(this);
                    var $mappedItem = $link.closest('.mapped-category-item');
                    var $subList = $mappedItem.find('.sub-categories-list');
                    var hasChildren = $mappedItem.hasClass('has-children');
                    var slug = $mappedItem.data('slug');
                    
                    if (hasChildren) {
                        // Toggle expand/collapse for sub-categories
                        var isExpanded = $subList.hasClass('expanded');
                        
                        if (isExpanded) {
                            $subList.removeClass('expanded').slideUp(200);
                            $link.find('.mapped-chevron i').removeClass('fa-angle-down').addClass('fa-angle-right');
                        } else {
                            // Collapse all other mapped categories first
                            $('.sub-categories-list').removeClass('expanded').slideUp(200);
                            $('.mapped-chevron i').removeClass('fa-angle-down').addClass('fa-angle-right');
                            
                            // Expand this one
                            $subList.addClass('expanded').slideDown(200);
                            $link.find('.mapped-chevron i').removeClass('fa-angle-right').addClass('fa-angle-down');
                        }
                    }
                    
                    // Always filter by this root category (whether it has children or not)
                    // Update UI
                    $('.mapped-category-item').removeClass('selected');
                    $('.sub-category-item').removeClass('selected');
                    $('.god-category-header').removeClass('active');
                    $mappedItem.addClass('selected');
                    
                    // Update state and reload products
                    if (window.storePageState) {
                        window.storePageState.category = slug;
                        window.storePageState.godCategory = '';
                        window.storePageState.brand = '';
                        window.storePageState.specifications = {};
                        window.storePageState.page = 0;
                        if (window.updateStoreBreadcrumb) window.updateStoreBreadcrumb();
                        if (window.loadBrandsForCategory) window.loadBrandsForCategory(slug, '');
                        if (window.loadPriceRangesForCategory) window.loadPriceRangesForCategory(slug, '');
                        if (window.loadSpecificationsForCategory) window.loadSpecificationsForCategory(slug, '');
                        if (window.loadStoreProducts) window.loadStoreProducts();
                    }
                });
                
                // Sub-category click - filter products
                $filter.on('click', '.sub-category-item', function(e) {
                    e.preventDefault();
                    e.stopPropagation();                    
                    var $item = $(this);
                    var slug = $item.data('slug');
                    
                    // Update UI
                    $('.mapped-category-item').removeClass('selected');
                    $('.sub-category-item').removeClass('selected');
                    $('.god-category-header').removeClass('active');
                    $item.addClass('selected');
                    
                    // Update state and reload products
                    if (window.storePageState) {
                        window.storePageState.category = slug;
                        window.storePageState.godCategory = '';
                        window.storePageState.brand = '';
                        window.storePageState.specifications = {};
                        window.storePageState.page = 0;
                        if (window.updateStoreBreadcrumb) window.updateStoreBreadcrumb();
                        if (window.loadBrandsForCategory) window.loadBrandsForCategory(slug, '');
                        if (window.loadPriceRangesForCategory) window.loadPriceRangesForCategory(slug, '');
                        if (window.loadSpecificationsForCategory) window.loadSpecificationsForCategory(slug, '');
                        if (window.loadStoreProducts) window.loadStoreProducts();
                    }
                });
                
                // Highlight active category based on current state
                if (window.storePageState && window.storePageState.category) {
                    var activeSlug = window.storePageState.category;
                    
                    // Check if it's a sub-category
                    var $activeSub = $filter.find('.sub-category-item[data-slug="' + activeSlug + '"]');
                    if ($activeSub.length) {
                        $activeSub.addClass('selected');
                        
                        // Expand parent mapped category
                        var $mappedItem = $activeSub.closest('.mapped-category-item');
                        var $subList = $mappedItem.find('.sub-categories-list');
                        $subList.addClass('expanded').show();
                        $mappedItem.find('.mapped-chevron i').removeClass('fa-angle-right').addClass('fa-angle-down');
                        
                        // Expand parent GoD category
                        var $godItem = $mappedItem.closest('.god-category-item');
                        $godItem.addClass('expanded');
                        $godItem.find('.mapped-categories-list').show();
                        $godItem.find('.god-chevron i').removeClass('fa-angle-right').addClass('fa-angle-down');
                    } else {
                        // Check if it's a mapped category (root)
                        var $activeMapped = $filter.find('.mapped-category-item[data-slug="' + activeSlug + '"]');
                        if ($activeMapped.length) {
                            $activeMapped.addClass('selected');
                            
                            // Expand parent GoD category
                            var $godItem = $activeMapped.closest('.god-category-item');
                            $godItem.addClass('expanded');
                            $godItem.find('.mapped-categories-list').show();
                            $godItem.find('.god-chevron i').removeClass('fa-angle-right').addClass('fa-angle-down');
                        }
                    }
                }
        }).fail(function() {
            console.error('Failed to load category data');
            $filter.html('<p class="text-danger">Nije moguće učitati kategorije. Proverite konzolu za detalje.</p>');
        });
    }

    // Expose function globally
    window.buildGodCategoryFilter = buildGodCategoryFilter;

    // Auto-initialize when DOM is ready
    $(document).ready(function() {
        var $filter = $('#category-filter');
        if ($filter.length && $filter.hasClass('god-enabled')) {
            buildGodCategoryFilter();
        }
    });

})(jQuery);
