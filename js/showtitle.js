var chrome_title_tag_last_change = 0;
var chrome_title_tag_current_pos = '';
var chrome_title_tag = {

  div: document.createElement('div'),
  
  create_markup: function() {
    this.div.id = "showtitlewrapper";
    this.div.className = 'bottomright';
    this.div.innerHTML = '<p><span id="showtitle-title"></span> <span id="showtitleremovelink" class="link" title="Hide this bar">x</span> <span class="link" id="showtitlemove" title="Move this bar">(m)</span></p>';
    
  },
  
  new_title: function() {
    var ts = Math.round((new Date()).getTime() / 1000);
    
    if (chrome_title_tag_last_change > ts-1) {
      return false;
    }
    
    chrome_title_tag_last_change = ts;
    
    chrome_title_tag.set_title();
        
  },
  
  set_title: function() {
    var htmltitle = htmlspecialchars(document.title);
    var titlelength = parseInt(document.title.length);
    var lengthdiff = 75 - titlelength;
    
    if (lengthdiff == 0) {
      lengthdiff = '';
    } else if (lengthdiff > 0) {
      lengthdiff = '(' + lengthdiff + ' less than 75)';
    } else {
      lengthdiff = '(' + (lengthdiff*-1) + ' more than 75)';
    }
    
    lengthdiff = htmlspecialchars(lengthdiff);
    
    var showtitle_title = document.getElementById('showtitle-title');
    showtitle_title.setAttribute('title', 'Length: ' + titlelength + ' chars ' + lengthdiff);
    showtitle_title.innerHTML = htmltitle;
  },
  
  display: function(settings) {
    chrome_title_tag_current_pos = settings.position;
    this.div.setAttribute("class", chrome_title_tag_current_pos);
  
    document.body.appendChild(this.div);
  },
  
  hide: function() {
    this.div.parentNode.removeChild(this.div);
    /*
    var blacklist = confirm('Always hide on this domain?');
    if (blacklist) {
      this.blacklist();
    }
    */
    
  },
  
  blacklist: function() {
    chrome.extension.sendRequest({type: "blacklist", url:location.hostname}, function(response) { });
  },
  
  check_pos: function() {
    chrome.extension.sendRequest({type: "get", key: 'position'}, function(response) {
      var showtitlewrapper = document.getElementById('showtitlewrapper');
      showtitlewrapper.setAttribute("class", response);
    });
  },
  
  add_handlers: function() {
    var this_obj = this;
    document.getElementById('showtitleremovelink').onclick = function () {
      this_obj.hide();
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
        
        chrome_title_tag_current_pos = new_pos;
        this_obj.div.setAttribute("class", new_pos);
        
        chrome.extension.sendRequest({type: "move", position: new_pos}, function(response) {});
      });
    
      
      
      return false;
    };
    
    
    
  },
  
  init: function() {
    var this_obj = this;
    this.create_markup();
    
    
    chrome.extension.sendRequest({type: "settings"}, function(response) {
      console.log('settings:', response);
      if ( ! response.is_blacklisted) {
        this_obj.display(response);
        this_obj.set_title();
        this_obj.add_handlers();
        
        document.addEventListener('DOMSubtreeModified', this_obj.new_title, 'false');
        
        setInterval("chrome_title_tag.check_pos()",500);
        
      }
      
      if (response.move_help) {
        document.getElementById('showtitlemove').onmouseover = function () {
          alert('Now, you can move the Title Bar around. Just keep clicking the arrow to switch corners :-)');
          document.getElementById('showtitlemove').onmouseover = function() {};
          chrome.extension.sendRequest({type: "set", key: 'move_help', value: false}, function(response) {  });
        };
        
      }
      
    });
    
  }
  
};

chrome_title_tag.init();

