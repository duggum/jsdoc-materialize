(function ($) {
    $(function () {

        var window_width = $(window).width();

        // convert rgb to hex value string
        function rgb2hex(rgb) {
            if (/^#[0-9A-F]{6}$/i.test(rgb)) {
                return rgb;
            }

            rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

            if (rgb === null) {
                return "N/A";
            }

            function hex(x) {
          return ("0" + parseInt(x).toString(16)).slice(-2);
      }

            return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
        }

        $('.dynamic-color .col').each(function () {
            $(this).children().each(function () {
                var color = $(this).css('background-color'),
                    classes = $(this).attr('class');
                $(this).html(rgb2hex(color) + " " + classes);
                if (classes.indexOf("darken") >= 0 || $(this).hasClass('black')) {
                    $(this).css('color', 'rgba(255,255,255,.9');
                }
            });
        });

        // Floating-Fixed table of contents
        if ($('nav').length) {
            $('.toc-wrapper').pushpin({ top: $('nav').height() });
        } else if ($('#index-banner').length) {
            $('.toc-wrapper').pushpin({ top: $('#index-banner').height() });
        } else {
            $('.toc-wrapper').pushpin({ top: 0 });
        }

        // Github Latest Commit
        if ($('.github-commit').length) { // Checks if widget div exists (Index only)
            $.ajax({
                url: "https://api.github.com/repos/duggum/jsdoc-materialize/commits/master",
                dataType: "json",
                success: function (data) {
                    var sha = data.sha,
                        date = jQuery.timeago(data.commit.author.date);
                    if (window_width < 1120) {
                        sha = sha.substring(0, 7);
                    }
                    $('.github-commit').find('.date').html(date);
                    $('.github-commit').find('.sha').html(sha).attr('href', data.html_url);
                }
            });
        }

        // Detect touch screen and enable scrollbar if necessary
        function is_touch_device() {
            try {
                document.createEvent("TouchEvent");
                return true;
            } catch (e) {
                return false;
            }
        }
        if (is_touch_device()) {
            $('#nav-mobile').css({ overflow: 'auto'});
        }

        // Plugin initialization
        $('.carousel.carousel-slider').carousel({full_width: true});
        $('.carousel').carousel();
        $('.slider').slider({full_width: true});
        $('.parallax').parallax();
        $('.modal-trigger').leanModal();
        $('.scrollspy').scrollSpy();
        $('.button-collapse').sideNav({'edge': 'left'});
        $('.datepicker').pickadate({selectYears: 20});
        $('select').not('.disabled').material_select();
        $('ul.tab-menu').tabs();

    }); // end of document ready
})(jQuery); // end of jQuery name space
