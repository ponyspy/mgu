$(document).ready(function() {
	var count = $('.child').size();
	var eng = true;
	var event = false;
	var project = false;
	var news = false;


// ------------------------
// *** Toggles Block ***
// ------------------------


	function checkEnglish () {
		if (eng == true)
			$('.en').prop('disabled', true);
		else
			$('.en').prop('disabled', false).show();
	}

	function toggleEnglish () {
		if (eng = !eng) {
			eng = true;
			$('.en').prop('disabled', eng).hide();
			$('.ru').css('float','none');
		}
		else {
			eng = false;
			$('.en').prop('disabled', eng).show();
			$('.ru').css('float','left');
		}
	}


// ------------------------
// *** Navigator Block ***
// ------------------------


	$('.nav_item').click(function(event) {
		index = $(this).index('.nav_item');

		$('.form_section').eq(index).scrollintoview();
	});


// ------------------------
// *** Constructors Block ***
// ------------------------


	function snakeForward () {
		var elem = $(this).parent().find('select');
		elem.first().clone().insertAfter(elem.last())
	}

	function snakeBack () {
		if ($(this).parent().find('select').size() == 1) return null;
		$(this).parent().find('select :last').remove();
	}

	function StickyTags() {
		var offset = 0;
		var sticky = false;
		var top = $(window).scrollTop();

		if ($(".form_block").offset().top < top) {
			$(".navigator").css('position', 'fixed').css('margin-left', '950px').css('top', '0px');
			sticky = true;
		} else {
			$(".navigator").css('position', 'relative').css('margin-left', '0px');
		}
	};

	$(window).on('scroll', StickyTags);
	$('.toggle_eng').on('click', toggleEnglish);
	$('.back').on('click', snakeBack);
	$('.forward').on('click', snakeForward);

	$('.form_submit').click(function() {
		var areas = $('textarea');
		areas.each(function() {
			var newValue = $(this).val().replace(/\n/g, "<br />");
			$(this).val(newValue);
		});
		$('form').submit();
	});
});