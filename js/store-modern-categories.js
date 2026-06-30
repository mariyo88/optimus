/**
 * Modern Category Filter - Icon-based design
 */
(function ($) {
    'use strict';

    var API_BASE = window.APP_CONFIG.API_BASE;
    
    // Icon mapping for categories (by slug or name pattern)
    var CATEGORY_ICONS = {
        'headphone': 'fa-headphones',
        'headphones': 'fa-headphones',
        'earbuds': 'fa-headphones',
        'smartphone': 'fa-mobile',
        'phone': 'fa-mobile',
        'mobile': 'fa-mobile',
        'camera': 'fa-camera',
        'video': 'fa-video-camera',
        'smartwatch': 'fa-clock-o',
        'watch': 'fa-clock-o',
        'storage': 'fa-hdd-o',
        'digital': 'fa-hdd-o',
        'gaming': 'fa-gamepad',
        'game': 'fa-gamepad',
        'furniture': 'fa-bed',
        'server': 'fa-server',
        'workstation': 'fa-desktop',
        'screen': 'fa-desktop',
        'tv': 'fa-television',
        'computer': 'fa-laptop',
        'laptop': 'fa-laptop',
        'tablet': 'fa-tablet',
        'audio': 'fa-volume-up',
        'accessories': 'fa-plug',
        'keyboard': 'fa-keyboard-o',
        'mouse': 'fa-mouse-pointer',
        'monitor': 'fa-desktop'
    };

    function getCategoryIcon(category) {
        var slug = category.slug.toLowerCase();
        var name = category.name.toLowerCase();
        
        // Try to find icon by slug first
        for (var key in CATEGORY_ICONS) {
            if (slug.includes(key) || name.includes(key)) {
                return CATEGORY_ICONS[key];
            }
        }
        
        // Default icon
        return 'fa-folder-o';
    }

    function buildModernCategoryFilter() {
        var $filter = $('#category-filter');
        if (!$filter.length) {
            console.error('Category filter element not found');
            return;
        }

        $.ajax({
            url: API_BASE + '/api/categories/public',
            success: function (categories) {
                $filter.empty();
                
                // Add modern category filter structure
                var $modernFilter = $('<div class="modern-category-filter">');
                
                // Header with "All Departments"
                var $header = $('<div class="category-header">');
                $header.append('<div class="category-header-icon"><i></i><i></i><i></i></div>');
                $header.append('<div class="category-header-title">Sve kategorije/div>');
                $modernFilter.append($header);
                
                // Category list
                var $list = $('<div class="category-list">');
                
                function buildCategoryItem(cat, level) {
                    var hasChildren = cat.children && cat.children.length > 0;
                    var categoryName = cat.displayName || cat.name;
                    var icon = getCategoryIcon(cat);
                    
                    var $item = $('<div class="modern-category-item">');
                    if (hasChildren) {
                        $item.addClass('has-children');
                    }
                    $item.attr('data-slug', cat.slug);
                    $item.attr('data-level', level);
                    
                    var $link = $('<a class="category-link">');
                    
                    // Icon
                    $link.append('<span class="category-icon"><i class="fa ' + icon + '"></i></span>');
                    
                    // Name
                    $link.append('<span class="category-name-text">' + categoryName + '</span>');
                    
                    // Chevron for parent categories
                    if (hasChildren) {
                        $link.append('<span class="category-chevron"><i class="fa fa-angle-right"></i></span>');
                    }
                    
                    $item.append($link);
                    
                    // Add children if any
                    if (hasChildren) {
                        var $children = $('<div class="category-children">');
                        cat.children.forEach(function(child) {
                            $children.append(buildCategoryItem(child, level + 1));
                        });
                        $item.append($children);
                    }
                    
                    return $item;
                }
                
                // Build all categories
                categories.forEach(function(cat) {
                    $list.append(buildCategoryItem(cat, 0));
                });
                
                $modernFilter.append($list);
                $filter.append($modernFilter);
                
                // Event handlers
                
                // Header click - reset filter (show all products)
                $header.on('click', function() {
                    $('.modern-category-item').removeClass('selected');
                    $('.category-link').removeClass('active');
                    if (window.storePageState) {
                        window.storePageState.category = '';
                        window.storePageState.brand = '';
                        window.storePageState.page = 0;
                        if (window.updateStoreBreadcrumb) window.updateStoreBreadcrumb();
                        if (window.loadBrandsForCategory) window.loadBrandsForCategory('');
                        if (window.loadStoreProducts) window.loadStoreProducts();
                    }
                });
                
                // Category click
                $filter.on('click', '.category-link', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    var $this = $(this);
                    var $item = $this.closest('.modern-category-item');
                    var $children = $item.find('> .category-children');
                    var hasChildren = $children.length > 0;
                    
                    if (hasChildren) {
                        // Toggle expand/collapse for parent categories
                        var isExpanded = $children.hasClass('expanded');
                        
                        if (isExpanded) {
                            $children.removeClass('expanded').addClass('collapsing');
                            $this.find('.category-chevron i').removeClass('fa-angle-down').addClass('fa-angle-right');
                            setTimeout(function() {
                                $children.removeClass('collapsing').slideUp(200);
                            }, 50);
                        } else {
                            $children.addClass('expanding').slideDown(200, function() {
                                $children.removeClass('expanding').addClass('expanded');
                            });
                            $this.find('.category-chevron i').removeClass('fa-angle-right').addClass('fa-angle-down');
                        }
                    } else {
                        // Select leaf category (filter products)
                        var slug = $item.data('slug');
                        
                        // Update UI
                        $('.modern-category-item').removeClass('selected');
                        $('.category-link').removeClass('active');
                        $item.addClass('selected');
                        $this.addClass('active');
                        
                        // Update state and reload products
                        if (window.storePageState) {
                            window.storePageState.category = slug;
                            window.storePageState.brand = '';
                            window.storePageState.page = 0;
                            if (window.updateStoreBreadcrumb) window.updateStoreBreadcrumb();
                            if (window.loadBrandsForCategory) window.loadBrandsForCategory(slug);
                            if (window.loadStoreProducts) window.loadStoreProducts();
                        }
                    }
                });
                
                // Highlight active category based on current state
                if (window.storePageState && window.storePageState.category) {
                    var $activeItem = $filter.find('[data-slug="' + window.storePageState.category + '"]');
                    if ($activeItem.length) {
                        $activeItem.addClass('selected');
                        $activeItem.find('> .category-link').addClass('active');
                        
                        // Expand parent categories
                        $activeItem.parents('.category-children').each(function() {
                            $(this).addClass('expanded').show();
                            $(this).prev('.category-link').find('.category-chevron i')
                                .removeClass('fa-angle-right').addClass('fa-angle-down');
                        });
                    }
                }
            },
            error: function () {
                $filter.html('<p class="text-danger">Nije moguće učitati kategorije</p>');
            }
        });
    }

    // Expose function globally
    window.buildModernCategoryFilter = buildModernCategoryFilter;

    // Auto-initialize when DOM is ready
    $(document).ready(function() {
        var $filter = $('#category-filter');
        if ($filter.length && $filter.hasClass('modern-enabled')) {
            buildModernCategoryFilter();
        }
    });

})(jQuery);
