/*!
 * Fancy Input v0.2.1
 *
 * Copyright (c) 2011 Jim Myhrberg.
 * Released under the MIT license.
 */
(function($){
  $.fn.fancy_input = {
    
    timeout: null,
    
    default_options: {},
    
    keys: {
      BACKSPACE: 8,
      TAB: 9,
      RETURN: 13,
      ENTER: 13,
      SHIFT: 16,
      CTRL: 17,
      ALT: 18,
      PAUSE: 19,
      BREAK: 19,
      CAPSLOCK: 20,
      ESC: 27,
      PAGEUP: 33,
      PAGEDOWN: 34,
      END: 35,
      HOME: 36,
      ARROW_LEFT: 37,
      ARROW_UP: 38,
      ARROW_RIGHT: 39,
      ARROW_DOWN: 40,
      INSERT: 45,
      DELETE: 46,
      SPECIALS_END: 47
    },

    elm_uid: function(elm){
      if (elm.attr("id") !== "") {
        return "ID_" + elm.attr("id");
      } else if (elm.attr("class") !== "") {
        return "CL_" + elm.attr("class");
      } else if (elm.attr("name") !== "") {
        return "NA_" + elm.attr("name");
      };
      return "";
    },
    
    setTimeout: function(callback, delay){
      this.clearTimeout();
      this.timeout = setTimeout(callback, delay);
    },

    clearTimeout: function(){
      if (this.timeout !== null) {
        clearTimeout(this.timeout);
        this.timeout = null;
      };
    },
    
    mustache: function(string, data){
      if (typeof(string) === "string" && typeof(data) === "object") {
        for (var key in data) {
          string = string.replace(new RegExp("{{\\s*" + key + "\\s*}}", "g"), data[key]);
        }
      };
      return string;
    },
    
    replace_elm: function(target, replacement){
      if (typeof(target.attr("id")) !== "undefined" && target.attr("id") !== "") {
        replacement = replacement.attr("id", target.attr("id"));
      };
      if (typeof(target.attr("class")) !== "undefined" && target.attr("class") !== "") {
        replacement = replacement.attr("class", target.attr("class"));
      };
      target.replaceWith(replacement);
      return replacement;
    },
    
    /*
      redirect_to method from: http://gist.github.com/327227
    */
    redirect_to: function(url, location){
      var redirect_to = "";
      if (typeof(location) == "undefined") location = window.location;
      if (url.match(/^[a-zA-Z]+\:\/\/.+/) === null) {
        redirect_to += location.protocol + "//" + location.hostname;
        if (location.port != "") redirect_to += ":" + location.port;
        if (url.charAt(0) !== "/") redirect_to += location.pathname.substr(0, location.pathname.lastIndexOf("/")+1);
        window.location.href = redirect_to + url;
      } else {
        window.location.href = url;
      };
    },
    
    // "borrowed" from PutCursorAtEnd plugin: http://plugins.jquery.com/project/PutCursorAtEnd
    putCursorAtEnd: function(){
      return this.each(function(){
        $(this).focus();
        if (this.setSelectionRange) {
          var len = $(this).val().length * 2;
          this.setSelectionRange(len, len);
        } else {
          $(this).val($(this).val());
        }
        this.scrollTop = 999999;
      });
    }
    
    
  };
})(jQuery);


/*
  Crossbrowser hasOwnProperty solution, based on answers from:
  http://stackoverflow.com/questions/135448/how-do-i-check-to-see-if-an-object-has-an-attribute-in-javascript
*/
if ( !Object.prototype.hasOwnProperty ) {
  Object.prototype.hasOwnProperty = function(prop){
    var proto = obj.__proto__ || obj.constructor.prototype;
    return (prop in this) && (!(prop in proto) || proto[prop] !== this[prop]);
  };
}
