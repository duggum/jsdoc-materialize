$(function docSearch() {
	$("#search").on("keyup", function(e) {
		var value = $(this).val();
		var $el = $(".nav-menu");
		if (value) {
			var regexp = new RegExp(value, "i");
			$el.find("div, .all-items").hide();
			$el.find("div").each(function(i, v) {
				var $item = $(v);
				if ($item.data("name") && regexp.test($item.data("name"))) {
					$item.show();
					$item.closest(".all-items").show();
					$item.closest(".nav-item").show();
				}
			});
		} else {
			$el.find(".nav-item, .all-items").show();
		}
		$el.find(".nav-menu").scrollTop(0);
	});
});

$(function navToggle() {
	// Toggle when click an item element
	$(".nav-menu")
		.on("click", ".nav-title", function(e) {
			$(this).parent().find(".all-items").toggle();
		});
	// Show an item related to current documentation automatically
	var filename = $(".page-title").data("filename").replace(/\.[a-z]+$/, "").replace("-", ":");
	if (filename === "global") {
		filename = "Global";
	}
	var $currentItem = $('.nav-menu .nav-item[data-name*="' + filename + '"]:eq(0)');
	if ($currentItem.length) {
		$currentItem.show().find(".all-items").show();
	}
});

$(function autoResize() {
	var _onResize = function() {
		var height = $(window).height();
		var $el = $(".navigation");
		$el.height(height).find(".nav-menu").height(height - 133);
	};
	$(window).on("resize", _onResize);
	_onResize();
});
