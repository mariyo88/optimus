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
                $header.append('<div class="category-header-title">All Departments</div>');
                $modernFilter.append($header);
                
                // GoD Category list
                var $list = $('<div class="god-category-list">');
                
                // Build each GoD category
                godCategories.forEach(function(godCat) {
                    var $godItem = $('<div class="god-category-item">');
                    $godItem.attr('data-id', godCat.id);
                    $godItem.attr('data-slug', godCat.slug);
                    
                    var categoryName = godCat.displayName || godCat.name;
                    var icon = godCat.iconClass || 'fa-folder';
                    var hasMappings = godCat.mappedCategories && godCat.mappedCategories.length > 0;
                    
                    if (hasMappings) {
                        $godItem.addClass('has-mappings');
                    }
                    
                    // GoD Category header
                    var $godHeader = $('<div class="god-category-header">');
                    $godHeader.append('<span class="god-icon"><i class="fa ' + icon + '"></i></span>');
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
                            
                            var $mappedLink = $('<a class="mapped-category-link">');
                            $mappedLink.text(mappedCat.displayName || mappedCat.name);
                            
                            if (hasChildren) {
                                $mappedLink.append('<span class="mapped-chevron"><i class="fa fa-angle-right"></i></span>');
                            }
                            
                            $mappedItem.append($mappedLink);
                            
                            // Add sub-categories (children) if any
                            if (hasChildren) {
                                var $subList = $('<div class="sub-categories-list">');
                                
                                fullCategory.children.forEach(function(child) {
                                    var $subItem = $('<a class="sub-category-item">');
                                    $subItem.attr('data-slug', child.slug);
                                    $subItem.attr('data-id', child.id);
                                    $subItem.text(child.displayName || child.name);
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
                
                $modernFilter.append($list);
                $filter.append($modernFilter);
                
                // Event handlers
                
                // Header click - reset filter (show all products)
                $header.on('click', function() {
                    $('.god-category-item').removeClass('expanded');
                    $('.mapped-category-item').removeClass('selected');
                    $('.god-category-header').removeClass('active');
                    
                    if (window.storePageState) {
                        window.storePageState.category = '';
                        window.storePageState.page = 0;
                        if (window.updateStoreBreadcrumb) window.updateStoreBreadcrumb();
                        if (window.loadStoreProducts) window.loadStoreProducts();
                    }
                });
                
                // GoD Category header click - expand/collapse
                $filter.on('click', '.god-category-header', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    var $header = $(this);
                    var $godItem = $header.closest('.god-category-item');
                    var $mappedList = $godItem.find('.mapped-categories-list');
                    var isExpanded = $godItem.hasClass('expanded');
                    
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
                });
                
                // Mapped category click - expand/collapse sub-categories OR filter if no children
                $filter.on('click', '.mapped-category-link', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    var $link = $(this);
                    var $mappedItem = $link.closest('.mapped-category-item');
                    var $subList = $mappedItem.find('.sub-categories-list');
                    var hasChildren = $mappedItem.hasClass('has-children');
                    
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
                    } else {
                        // No children - filter by this category
                        var slug = $mappedItem.data('slug');
                        
                        // Update UI
                        $('.mapped-category-item').removeClass('selected');
                        $('.sub-category-item').removeClass('selected');
                        $mappedItem.addClass('selected');
                        
                        // Update state and reload products
                        if (window.storePageState) {
                            window.storePageState.category = slug;
                            window.storePageState.page = 0;
                            if (window.updateStoreBreadcrumb) window.updateStoreBreadcrumb();
                            if (window.loadStoreProducts) window.loadStoreProducts();
                        }
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
                    $item.addClass('selected');
                    
                    // Update state and reload products
                    if (window.storePageState) {
                        window.storePageState.category = slug;
                        window.storePageState.page = 0;
                        if (window.updateStoreBreadcrumb) window.updateStoreBreadcrumb();
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
            $filter.html('<p class="text-danger">Could not load categories. Check console for details.</p>');
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
