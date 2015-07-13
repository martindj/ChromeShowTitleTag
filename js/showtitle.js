var chrome_title_tag_last_change = 0;

var chrome_title_tag = {
    div: document.createElement('div'),
    
    /**
     * Updates the title text with the new title, unless it's been less than 1 second since last update
     * @return (void)
     */
    set_title: function () {
        var tolong_cutoff = 65;
        var ts = Math.round((new Date()).getTime() / 1000); // unix timestamp in seconds
        if (chrome_title_tag_last_change > ts - 1) {
            return false;
        }
        chrome_title_tag_last_change = ts;

        var htmltitle = document.title;

        if (htmltitle.length > tolong_cutoff) {
            htmltitle = htmltitle.slice(0, tolong_cutoff) + 'TOLONGCUTOFF' + htmltitle.slice(tolong_cutoff);
        }

        htmltitle = htmlspecialchars(htmltitle);

        if (htmltitle.length > tolong_cutoff) {
            htmltitle = htmltitle.replace('TOLONGCUTOFF', '<span class="tolong">') + '</span>';
        }

        var titlelength = parseInt(document.title.length);
        var showtitle_title = document.getElementById('showtitle-title');
        if (showtitle_title !== null) {
            showtitle_title.setAttribute('title', 'Length: ' + titlelength + ' chars');
            showtitle_title.innerHTML = htmltitle;
        }
    },

    /**
     * Toggle whether the title box is shown or hidden. Stores the state in localStorage to remember state for each domain.
     * @return (void)
     */
    toggle_hide: function () {
        if (this.div.className.match(/\bhide\b/)) {
            this.div.className = this.div.className.replace(/hide/g, '');
            localStorage["showtitle-hide"] = "false";
        } else {
            this.div.className += ' hide';
            localStorage["showtitle-hide"] = "true";
        }
    },

    /**
     * Get the position setting (global)
     * @return (void)
     */
    get_position: function () {
        chrome.extension.sendRequest({
            type: "get",
            key: 'position'
        }, function (response) {
            chrome_title_tag.set_position(response);
        });
    },

    /**
     * Move the title bar to the correct place and save the setting (global)
     * @param {string} position     Where to put the title bar
     * @return (void)
     */
    set_position: function (position) {
        var showtitlewrapper = document.getElementById('showtitlewrapper');
        if (showtitlewrapper !== null) {
            showtitlewrapper.className = position;
            if (localStorage["showtitle-hide"] == "true") {
                showtitlewrapper.className += ' hide';
            };
        }
        chrome.extension.sendRequest({
            type: "move",
            position: position
        }, function (response) {});
    },

    /**
     * Add event handlers (click on buttons etc)
     * @return (void)
     */
    add_handlers: function () {
        var this_obj = this;
        document.getElementById('showtitleremovelink').onclick = function () {
            this_obj.toggle_hide();
            return false;
        };
        document.getElementById('showtitlemove').onclick = function () {
            chrome.extension.sendRequest({
                type: "get",
                key: 'position'
            }, function (response) {
                var new_pos = '';
                if (response == 'bottom_right') {
                    new_pos = 'bottom_left';
                } else if (response == 'bottom_left') {
                    new_pos = 'top_left';
                } else if (response == 'top_left') {
                    new_pos = 'top_right';
                } else {
                    new_pos = 'bottom_right';
                }
                chrome.extension.sendRequest({
                    type: "move",
                    position: new_pos
                }, function (response) {
                    this_obj.get_position();
                });
            });
            return false;
        };
    },

    /**
     * Initialize the plugin
     * @return (cake)
     */
    init: function () {
        var this_obj = this;
        this.div.id = "showtitlewrapper";
        this.div.className = "not-initialized";
        this.div.innerHTML = '<p><span id="showtitle-title"></span> <span class="link" id="showtitlemove" title="Move this bar"><i class="icon-hand-down"></i><i class="icon-hand-up"></i><i class="icon-hand-right"></i><i class="icon-hand-left"></i></span> <span id="showtitleremovelink" class="link" title="Hide this bar"><i class="icon-eye-open"></i><i class="icon-eye-close"></i></span></p>';
        document.body.appendChild(this.div);

        this.set_title();
        this.get_position();
        this.add_handlers();

        var observer = new MutationObserver(this.set_title);
        observer.observe(document.querySelector('title'), { childList: true });

        setInterval("chrome_title_tag.get_position()", 2000);
    }
};
/* Initialize the plugin */
chrome_title_tag.init();
