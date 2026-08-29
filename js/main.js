// Global price formatting function
function formatPrice(val) {
	if (val == null) return '—';
	return Number(val).toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' RSD';
}

(function($) {
	"use strict"

	// Mobile Nav toggle
	$('.menu-toggle > a').on('click', function (e) {
		e.preventDefault();
		$('#responsive-nav').toggleClass('active');
	})

	// Mobile Store Filter drawer toggle
	var _scrollY = 0;

	function openFilterDrawer() {
		_scrollY = window.scrollY || window.pageYOffset;
		$('#aside').addClass('filter-open');
		$('#filter-backdrop').addClass('active');
		// Koristimo klasu na html elementu — ne diramo body position
		// (body position:fixed kvari position:sticky na header-u)
		$('html').addClass('filter-drawer-open');
		$('html').css('--scroll-y', '-' + _scrollY + 'px');
	}

	function closeFilterDrawer() {
		$('#aside').removeClass('filter-open');
		$('#filter-backdrop').removeClass('active');
		$('html').removeClass('filter-drawer-open');
		$('html').css('--scroll-y', '');
		window.scrollTo(0, _scrollY);
	}

	$('#mobile-filter-toggle').on('click', function () {
		openFilterDrawer();
	});

	$('#filter-close-btn').on('click', function () {
		closeFilterDrawer();
	});

	$('#filter-backdrop').on('click', function () {
		closeFilterDrawer();
	});

	// Zatvori drawer na ESC
	$(document).on('keydown', function (e) {
		if (e.key === 'Escape') {
			closeFilterDrawer();
		}
	});

	// Mobile Search toggle
	$('.search-toggle-btn').on('click', function (e) {
		e.preventDefault();
		var $searchCol = $('#header .col-md-6');
		var $icon = $(this).find('i');
		var isOpen = $searchCol.hasClass('search-open');

		$searchCol.toggleClass('search-open');
		$(this).toggleClass('active');

		if (!isOpen) {
			// Fokusiraj input kad se otvori
			setTimeout(function () {
				$searchCol.find('.input').focus();
			}, 320);
		}
	})

	// Zatvori search bar klikom van headera
	$(document).on('click', function (e) {
		if (!$(e.target).closest('header').length) {
			$('#header .col-md-6').removeClass('search-open');
			$('.search-toggle-btn').removeClass('active');
		}
	})

	/////////////////////////////////////////

	// Products Slick
	$('.products-slick').each(function() {
		var $this = $(this),
				$nav = $this.attr('data-nav');

		$this.slick({
			slidesToShow: 4,
			slidesToScroll: 1,
			autoplay: true,
			infinite: true,
			speed: 300,
			dots: false,
			arrows: true,
			appendArrows: $nav ? $nav : false,
			responsive: [{
	        breakpoint: 991,
	        settings: {
	          slidesToShow: 2,
	          slidesToScroll: 1,
	        }
	      },
	      {
	        breakpoint: 480,
	        settings: {
	          slidesToShow: 1,
	          slidesToScroll: 1,
	        }
	      },
	    ]
		});
	});

	// Products Widget Slick
	$('.products-widget-slick').each(function() {
		var $this = $(this),
				$nav = $this.attr('data-nav');

		$this.slick({
			infinite: true,
			autoplay: true,
			speed: 300,
			dots: false,
			arrows: true,
			appendArrows: $nav ? $nav : false,
		});
	});

	/////////////////////////////////////////

	// Product Main img Slick — only init if product-detail.js is NOT present
	var zoomMainProduct = document.getElementById('product-main-img');
	if (zoomMainProduct && !document.querySelector('script[src*="product-detail"]')) {
		$('#product-main-img').slick({
	    infinite: true,
	    speed: 300,
	    dots: false,
	    arrows: true,
	    fade: true,
	    asNavFor: '#product-imgs',
	  });

		$('#product-imgs').slick({
	    slidesToShow: 3,
	    slidesToScroll: 1,
	    arrows: true,
	    centerMode: true,
	    focusOnSelect: true,
			centerPadding: 0,
			vertical: true,
	    asNavFor: '#product-main-img',
			responsive: [{
	        breakpoint: 991,
	        settings: {
						vertical: false,
						arrows: false,
						dots: true,
	        }
	      },
	    ]
	  });

		$('#product-main-img .product-preview').zoom();
	}

	/////////////////////////////////////////

	// Input number
	$('.input-number').each(function() {
		var $this = $(this),
		$input = $this.find('input[type="number"]'),
		up = $this.find('.qty-up'),
		down = $this.find('.qty-down');

		down.on('click', function () {
			var value = parseInt($input.val()) - 1;
			value = value < 1 ? 1 : value;
			$input.val(value);
			$input.change();
			updatePriceSlider($this , value)
		})

		up.on('click', function () {
			var value = parseInt($input.val()) + 1;
			var max = parseInt($input.attr('max'));
			if (!isNaN(max) && value > max) value = max;
			$input.val(value);
			$input.change();
			updatePriceSlider($this , value)
		})
	});

	var priceInputMax = document.getElementById('price-max'),
			priceInputMin = document.getElementById('price-min');

	if (priceInputMax) {
		priceInputMax.addEventListener('change', function(){
			updatePriceSlider($(this).parent() , this.value)
		});
	}

	if (priceInputMin) {
		priceInputMin.addEventListener('change', function(){
			updatePriceSlider($(this).parent() , this.value)
		});
	}

	function updatePriceSlider(elem , value) {
		if ( elem.hasClass('price-min') ) {
			priceSlider.noUiSlider.set([value, null]);
		} else if ( elem.hasClass('price-max')) {
			priceSlider.noUiSlider.set([null, value]);
		}
	}

	// Price Slider
	var priceSlider = document.getElementById('price-slider');
	if (priceSlider) {
		noUiSlider.create(priceSlider, {
			start: [1, 999],
			connect: true,
			step: 1,
			range: {
				'min': 1,
				'max': 999
			}
		});

		priceSlider.noUiSlider.on('update', function( values, handle ) {
			var value = values[handle];
			handle ? priceInputMax.value = value : priceInputMin.value = value
		});
	}

})(jQuery);
