/**
 * Brands Carousel - Displays top brands in a rotating carousel
 */
(function($) {
    'use strict';

    const BrandsCarousel = {
        limit: 10,
        containerSelector: '#brands-carousel-container',
        
        init: function() {
            this.loadBrands();
        },

        loadBrands: function() {
            const self = this;
            const apiUrl = (window.APP_CONFIG ? window.APP_CONFIG.API_BASE : '') + '/api/brands/top';
            
            $.ajax({
                url: `${apiUrl}?limit=${this.limit}`,
                method: 'GET',
                success: function(brands) {
                    if (brands && brands.length > 0) {
                        self.renderCarousel(brands);
                        self.initSlick();
                    } else {
                        console.log('No brands found');
                        $(self.containerSelector).html('<p style="text-align: center; color: #8D99AE;">Trenutno nema dostupnih brendova</p>');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Failed to load brands:', {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        error: error,
                        response: xhr.responseText
                    });
                    // Hide the entire section on error
                    $('#brands-section').hide();
                }
            });
        },

        renderCarousel: function(brands) {
            const container = $(this.containerSelector);
            container.empty();
            
            brands.forEach(brand => {
                const brandHtml = this.createBrandItem(brand);
                container.append(brandHtml);
            });
        },

        createBrandItem: function(brand) {
            const logoHtml = brand.logoUrl 
                ? `<img src="${brand.logoUrl}" alt="${brand.name}" class="brand-logo">`
                : `<div class="brand-name-fallback">${brand.name}</div>`;
            
            return `
                <div class="brand-item">
                    ${logoHtml}
                    <span class="brand-name">${brand.name}</span>
                </div>
            `;
        },

        initSlick: function() {
            $(this.containerSelector).slick({
                infinite: true,
                speed: 500,
                slidesToShow: 6,
                slidesToScroll: 1,
                autoplay: true,
                autoplaySpeed: 3000,
                arrows: true,
                dots: false,
                pauseOnHover: true,
                responsive: [
                    {
                        breakpoint: 1024,
                        settings: {
                            slidesToShow: 5,
                            slidesToScroll: 1
                        }
                    },
                    {
                        breakpoint: 768,
                        settings: {
                            slidesToShow: 3,
                            slidesToScroll: 1
                        }
                    },
                    {
                        breakpoint: 480,
                        settings: {
                            slidesToShow: 2,
                            slidesToScroll: 1,
                            arrows: false
                        }
                    }
                ]
            });
        }
    };

    // Initialize when document is ready
    $(document).ready(function() {
        if ($(BrandsCarousel.containerSelector).length) {
            BrandsCarousel.init();
        }
    });

})(jQuery);
