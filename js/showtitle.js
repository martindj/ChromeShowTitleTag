var chrome_title_tag_last_change = 0;
var chrome_title_tag = {

  div: document.createElement('div'),
  
  create_markup: function() {
    this.div.id = "showtitlewrapper";
    this.div.className = "not-initialized";
    this.div.innerHTML = '<p><span id="showtitle-title"></span> <span class="link" id="showtitlemove" title="Move this bar"><i class="icon-hand-down"></i><i class="icon-hand-up"></i><i class="icon-hand-right"></i><i class="icon-hand-left"></i></span> <span id="showtitleremovelink" class="link" title="Hide this bar"><i class="icon-eye-open"></i><i class="icon-eye-close"></i></span></p>';
    document.body.appendChild(this.div);
  },
  
  new_title: function() {
    var ts = Math.round((new Date()).getTime() / 1000);
    
    if (chrome_title_tag_last_change > ts-1) {
      return false;
    }
    
    chrome_title_tag_last_change = ts;
    chrome_title_tag.set_title();
        
  },

  delayed_title: function() {
    setTimeout('chrome_title_tag.new_title()', 100);
  },
  
  set_title: function() {
    var htmltitle = htmlspecialchars(document.title);
    var titlelength = parseInt(document.title.length);
    
    var showtitle_title = document.getElementById('showtitle-title');
    if (showtitle_title !== null) {
        showtitle_title.setAttribute('title', 'Length: ' + titlelength + ' chars');
        showtitle_title.innerHTML = htmltitle;
    }
  },
  
  toggle_hide: function() {
    if (this.div.className.match(/\bhide\b/)) {
        this.div.className = this.div.className.replace(/hide/g , '');
        localStorage["showtitle-hide"] = "false";
    } else {
        this.div.className += ' hide';
        localStorage["showtitle-hide"] = "true";
    }
  },
  
  blacklist: function() {
    chrome.extension.sendRequest({type: "blacklist", url:location.hostname}, function(response) { });
  },
  
  check_pos: function() {
    chrome.extension.sendRequest({type: "get", key: 'position'}, function(response) {
      chrome_title_tag.update_pos_class(response);
    });
  },

  update_pos_class: function(pos) {
    var showtitlewrapper = document.getElementById('showtitlewrapper');
    if (showtitlewrapper !== null) {
        showtitlewrapper.className = pos;
        if (localStorage["showtitle-hide"] == "true") {
            showtitlewrapper.className += ' hide';
        };
    }
    chrome.extension.sendRequest({type: "move", position: pos}, function(response) {});
  },
  
  add_handlers: function() {
    var this_obj = this;
    document.getElementById('showtitleremovelink').onclick = function () {
      this_obj.toggle_hide();
      return false;
    };

    document.getElementById('showtitlemove').onclick = function () {
      chrome.extension.sendRequest({type: "get", key: 'position'}, function(response) {
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
        
        chrome.extension.sendRequest({type: "move", position: new_pos}, function(response) {
            this_obj.check_pos();
        });

      });
    
      
      
      return false;
    };

  },
  
  init: function() {
    var this_obj = this;
    this.create_markup();
    
    chrome.extension.sendRequest({type: "settings"}, function(response) {
        this_obj.update_pos_class(response.position)
        this_obj.set_title();
        this_obj.add_handlers();
        
        document.addEventListener('DOMSubtreeModified', this_obj.delayed_title, 'false');
        setInterval("chrome_title_tag.check_pos()",5000);
    }); // sendRequest
  } // init
  
};

chrome_title_tag.init();

