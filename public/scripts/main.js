$(document).ready(function() {
	var skip = 6;
	var hide_items = $('.hide').size();
	var roundRandom = rund(500, 200);
	var itemsRandom = rund(hide_items, 0);

	function preload(arrayOfImages) {
		$(arrayOfImages).each(function(){
			$('<img />')[0].src = this;
		});
	}

	function rund(len, min) {
		function shuffle(arr) {
				for (var i = len = arr.length, elem; elem = arr[--i];) {
						var num = Math.floor(Math.random() * len);
								arr[i] = arr[num];
								arr[num] = elem;
				}
				return arr
		} //функция для перемешивания массива
		var base = [], // основной массив
				temp = [], // запасной массив
				i ;
		for (i = 0; i < len; i++) base[i] = i + min; // формирование значений основного массива[1, 2, 3, 4, 5]
		shuffle(base); // первый раз перемешали основной массив [4, 3, 2, 1, 5]
		return function () {
				var elem = base.shift(); // берём первый элемент основного массива
				temp.push(elem); //добавляем в запасной
				1 == base.length && (shuffle(temp), base = base.concat(temp), temp = []);
				// если в основном остался 1 элемент, перемешиваем запасной и добавляем к основному, очищаем запасной
				return elem
		}
	};

	function generatePoster () {

		var rand_items = itemsRandom();
		var rand_radius = roundRandom();

		var atr = $('.hide').eq(rand_items).attr('src');
		$('.image').attr('src', atr);

		$('.main_poster_cal').hide();
		$('.main_poster_cal').eq(rand_items).show();

		$('.round').animate({
			width: rand_radius,
			height: rand_radius
		}, {duration: 400, queue: false})
	}
	generatePoster();

	$('.layer').parallax({
		mouseport: $('.main_poster_img')
	}, {frameDuration:'50'}, {xparallax: '600px', yparallax: '600px'});

	function trimString (str) {
		for (var i = 150; i < str.length; i++) {
			if (str[i] == '.' || str[i] == '?' || str[i] == '!') {
				return str.substr(0, i+1); // ошибка если нет точки в конце
			}
		}
	}

	function ItemConstructor(data, event) {
		skip = skip + event.data.offset;
		var t = 0;

		if (data != 'exit') {
			for (var i in data) {
				var data_date = new Date(data[i].date)
						var d3 = data_date.getDate() < 10 ? '0' + data_date.getDate() : data_date.getDate();
						var month = (data_date.getMonth() + 1) < 10 ? '0' + (data_date.getMonth() + 1) : data_date.getMonth() + 1


				if (t == 3) t = 0;
				var item = $('<div />', {'class':'infinite-item'});
				var link = $('<a />', {'class':'item_link', 'href':'/news/' + data[i]._id});
				var title = $('<div />', {'class':'item_title', 'text': data[i].ru.title.toUpperCase()});
				var date = $('<div />', {'class':'item_date', 'text': d3 + ' ⋅ ' + month});

				if (data[i].poster)
					var img = $('<img />', {'class':'item_img', 'src': data[i].poster});
				else
					if(data[i].ru.title.length < 20)
						var img = $('<div />', {'class':'item_body', 'lang':'ru', 'html': trimString(data[i].ru.body)});

				$('.infinite-column').eq(t).append(item.append(link.append(title)).append(date, img));

				t++;
			}
			$('.loader').hide();
		}
		else {
			$('.loader').text('больше нет новостей').show();
			$('.maket').off('scroll', ScrollLoader);
			$('.footer_block, .banner_block').show();
		}
	}

	function TagLoader(event) {
		var tag = this.className.slice(9);
		skip = 0;

		$('.footer_block, .banner_block').hide();
		$('.maket').off('scroll', ScrollLoader);
		$('.maket').animate({
			scrollTop: $('.infinite-container').offset().top + $('.maket').scrollTop()
		}, 400, function() {
			$('.infinite-item').hide().promise().done(function() {
				$('.infinite-column').empty();
				$('.loader').text('загрузка...').show();
				$.ajax({
					url: '/',
					data: {tag : tag, offset: skip},
					type: 'POST'
				}).done(function(data) {
					skip = 6;

					ItemConstructor(data, event);
					$('.infinite-item').show(function() {
						$('.maket').on('scroll', {tag: tag, offset: 6}, ScrollLoader);
					});
				});
			});
		});
	}

	function ScrollLoader(event) {
		var maket = $('.maket').height();
		var cont = $('.infinite-container').height();

		if (cont - maket <= $('.maket').scrollTop() - 350) {
			$('.loader').text('загрузка...').show();
			$.ajax({
				url: '/',
				async: false,
				data: {tag : event.data.tag, offset: skip},
				type: 'POST'
			}).done(function(data) {
				ItemConstructor(data, event);
			});
		}
	}

	function StickyTags() {
		var offset = 0;
		var sticky = false;
		var top = $('.maket').scrollTop();

		if ($('.infinite-container').offset().top < top - 743) {
			$('.tag_navigator').addClass('tag_navigator_sroll');
			sticky = true;
		} else {
			$('.tag_navigator').removeClass('tag_navigator_sroll');
		}
	};

	$('.layer').on('click', generatePoster);
	$('.maket').on('scroll', StickyTags);
	$('.maket').on('scroll', {tag:'all', offset: 6}, ScrollLoader);
	$('.tag_item').on('click', {offset: 0}, TagLoader);
});