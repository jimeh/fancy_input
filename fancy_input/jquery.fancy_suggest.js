/*!
 * Fancy Suggest
 *
 * Copyright (c) 2011 Jim Myhrberg.
 * Released under the MIT license.
 */
(function($){
  
  var Super = $.fn.fancy_input;
  var Self = $.fn.fancy_suggest = function(options){
    
    var $options = $.extend({}, Self.default_options, options);
    
    return this.each(function(){
      var $e = $(this);
      Self.init_suggest($e, $options);
      $e.focus(function(){
        Self.attach_suggest_box($e, $options);
        if ($e.val().length > 0) {
          Self.setTimeout(function(){
            Self.suggest($e, $options);
          }, $options.delay);
        };
      }).blur(function(){
        Self.hide();
      }).keydown(function(e){
        switch(e.keyCode) {
          case Self.keys.ARROW_UP:
            Self.select_prev($e, $options);
            return false;
          case Self.keys.ARROW_DOWN:
            Self.select_next($e, $options);
            return false;
          case Self.keys.ESC:
            Self.clear($e, $options);
            break;
          case Self.keys.RETURN:
            if (Self.selected_result !== null) {
              Self.activate_selected($e, $options);
              return false;
            }
            break;
        }
      }).keyup(function(e){
        var key = e.keyCode;
        Self.align_suggest_box($e, $options);
        if (key > Self.keys.SPECIALS_END || key == Self.keys.BACKSPACE || key == Self.keys.DELETE) {
          Self.clearTimeout();
          Self.suggest($e, $options);
        };
      });
    });
  };
  
  $.extend(Self, Super, {
    
    box: null,
    list: null,
    attached_to: null,
    current_results: [],
    selected_result: null,
    query_cache: [],
    
    default_options: $.extend({}, Super.default_options, {
      name: "",
      exact_match: true,
      limit: 6,
      no_results: true,
      no_results_label: "No Results",
      url: null,
      url_method: "get",
      url_query_var: "search",
      pos_top: 0,
      pos_left: 0,
      hide_delay: 0,
      data: null,
      tpl_container_id: "fancy_suggest",
      tpl_container_class: "fancy_suggest",
      tpl_container: '<div id="{{id}}"><ol></ol></div>',
      tpl_result_begin: '<li class="result {{class}}" id="{{id}}" result_id="{{result_id}}"><a href="{{href}}">',
      tpl_result_body: '<span class="title">{{title}}</span>',
      tpl_result_end: '</a></li>',
      tpl_label: '<li class="label {{class}}">{{label}}</li>',
      tpl_highlight: '<b class="highlight">$1</b>'      
    }),
    
    init_suggest: function(elm, options){
      this.box = $("#" + options.tpl_container_id);
      if (this.box.length == 0) {
        $("body").append($(options.tpl_container).attr("id", options.tpl_container_id).attr("class", options.tpl_container_class));
        this.box = $("#" + options.tpl_container_id);
      };
      this.list = this.box.children("ol");
    },
    
    attach_suggest_box: function(elm, options){
      var elm_uid = this.elm_uid(elm);
      this.align_suggest_box(elm, options);
      if (elm_uid !== this.attached_to) {
        if (typeof(options.name) == "string" && options.name != "") {
          this.box.hide().addClass(options.name);
        };
        this.attached_to = elm_uid;
      };
    },
    
    align_suggest_box: function(elm, options){
      var offset = elm.offset();
      
      // left
      this.box.css("left", (offset.left + options.pos_left));
      
      // top
      var top = offset.top + elm.innerHeight();
      top += parseInt(elm.css("border-top-width"), 10) + parseInt(elm.css("border-bottom-width"), 10);
      top += options.pos_top;
      this.box.css("top", top);
      
      // width
      if (typeof(options.width) === "number" || (typeof(options.width) === "string" && options.width != "")) {
        this.box.css("width", options.width);
      } else {
        var width = elm.innerWidth();
        width += parseInt(elm.css("border-left-width"), 10) + parseInt(elm.css("border-right-width"), 10);
        width -= parseInt(this.box.css("border-left-width"), 10) + parseInt(this.box.css("border-right-width"), 10);
        this.box.css("width", width);
      };
    },
    
    suggest: function(elm, options){
      var terms = $.trim(this.get_value(elm, options));
      if (options.exact_match) terms = terms.split(/\s/);
      if ((typeof(terms) == "string" && terms != "") || (typeof(terms) == "object" && terms.length > 0)) {
        this.selected_result = null;
        if (typeof(options.url) === "string" && options.url !== "") {
          this.query_for_data(elm, options);
        } else {
          this.current_results = this.filter_data(terms, options.data, options);
          this.prerender(elm, this.current_results, options);
        };
      };
    },
    
    filter_data: function(terms, data, options){
      if (typeof(terms) === "string") { terms = [terms]; };
      var matched = "";
      var results = [];
      var terms_length = terms.length;
      for (var i=0; i < terms_length; i++) {
        var term = terms[i];
        term = term.toLowerCase();
        if (data !== null && typeof(term) !== "undefined" && term !== "") {
          var data_length = data.length;
          for (var n=0; n < data_length; n++) {
            var title = data[n].title.toLowerCase();
            var match = (typeof(data[n].match) !== "undefined") ? data[n].match.toLowerCase() : "" ;
            if (title.indexOf(term) !== -1 || match.indexOf(term) !== -1) {
              if (matched.indexOf(":" + n + ":") == -1) {
                results.push(data[n]);
                matched += ":" + n + ":";
                if (results.length >= options.limit) {
                  return results;
                };
              };
            };
          };
        };
      };
      return results;
    },
    
    query_for_data: function(elm, options){
      var term = this.get_value(elm, options);
      var uid = options.url + "?" + term + ":" + options.limit;
      if (term !== "") {
        if (this.query_cache.hasOwnProperty(uid)) {
          this.current_results = this.query_cache[uid];
          this.prerender(elm, this.current_results, options);
        } else {
          var data = { limit: options.limit };
          data[options.url_query_var] = term;
          var Self = this;
          $.ajax({
            type: options.url_method,
            url: options.url,
            data: data,
            dataType: "json",
            success: function(response){
              Self.current_results = response.results;
              Self.query_cache[uid] = Self.current_results;
              Self.prerender(elm, Self.current_results, options);
            }
          });
        };
      } else {
        this.no_results(elm, options);
      };
    },
    
    clear: function(elm, options){
      this.set_value(elm, "");
      this.hide();
      this.selected_result = null;
    },
    
    no_results: function(elm, options){
      if (options.no_results && this.get_value(elm, options) !== "") {
        var meta = {label: options.no_results_label, "class": "last"};
        this.list.html(this.mustache(options.tpl_label, meta));
        this.show();
      } else {
        this.hide(0);
      };
    },
    
    prerender: function(elm, results, options){
      if (results.length > 0) {
        this.render(elm, results, options);
        this.show();
        if (results.length == 1) {
          this.select_next(elm, options);
        };
      } else {
        this.no_results(elm, options);
      };
    },
    
    render: function(elm, results, options){
      var results_length = results.length;
      var html = "";
      for (var i=0; i < results_length; i++) {
        var elm_id = "fancy_suggest_result_" + i;
        var meta = $.extend({}, results[i], {id: elm_id, "class": "", result_id: i});
        if (i == 0) { $.extend(meta, {"class": "first"}); };
        if (i == results_length - 1) { $.extend(meta, {"class": "last"}); };
        meta["title"] = meta["title"].replace(new RegExp("(" + this.get_value(elm, options) + ")", "ig"), options.tpl_highlight);
        html += this.mustache(options.tpl_result_begin, meta);
        html += this.mustache(options.tpl_result_body, meta);
        html += this.mustache(options.tpl_result_end, meta);
      };
      this.list.html(html);
      var Self = this;
      $(".result a", this.list).mousedown(function(){
        Self.selected_result = parseInt($(this).parent().attr("result_id"), 10);
        Self.activate_selected(elm, options);
      }).click(function(){
        return false;
      });
      $(".result", this.list).hover(function(){
        $(".selected", Self.list).removeClass("selected");
        Self.selected_result = $(this).addClass("selected").attr("result_id");
      },function(){
        $(this).removeClass("selected");
        Self.selected_result = null;
      });
    },
    
    show: function(){
      this.box.show();
    },

    hide: function(delay){
      if (typeof(delay) !== "number") { delay = this.default_options.hide_delay; };
      this.selected_result = null;
      var Self = this;
      this.setTimeout(function(){
        Self.selected_result = null;
        $(".selected", this.list).removeClass("selected");
        Self.box.hide();
      }, delay);
    },
    
    select_next: function(elm, options){
      var limit = this.current_results.length;
      var result_id = "fancy_suggest_result_";
      if (limit > 0) {
        if (this.selected_result === null) {
          $(".selected", this.list).removeClass("selected");
          this.selected_result = 0;
          $("#" + result_id + this.selected_result).addClass("selected");
        } else if (this.selected_result + 1 < limit) {
          $(".selected", this.list).removeClass("selected");
          this.selected_result++;
          $("#" + result_id + this.selected_result).addClass("selected");
        } else {
          $(".selected", this.list).removeClass("selected");
          this.selected_result = null;
          elm.putCursorAtEnd();
        };
      };
      return false;
    },

    select_prev: function(elm, options){
      var limit = this.current_results.length;
      var result_id = "fancy_suggest_result_";
      if (limit > 0) {
        if (this.selected_result === null) {
          $(".selected", this.list).removeClass("selected");
          this.selected_result = limit - 1;
          $("#" + result_id + this.selected_result).addClass("selected");
        } else if (this.selected_result > 0) {
          $(".selected", this.list).removeClass("selected");
          this.selected_result--;
          $("#" + result_id + this.selected_result).addClass("selected");
        } else {
          $(".selected", this.list).removeClass("selected");
          this.selected_result = null;
          elm.putCursorAtEnd();
        };  
      };
      return false;
    },
    
    activate_selected: function(elm, options){
      if (this.selected_result !== null) {
        this.redirect_to(this.current_results[this.selected_result].href);
      };
    },
    
    get_value: function(elm, options) {
      return elm.val();
    },
    
    set_value: function(elm, value, options) {
      elm.val(value);
    }
    
  });
})(jQuery);
