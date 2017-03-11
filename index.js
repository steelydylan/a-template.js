"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $ = require("zepto-browserify").$;
var morphdom = require('morphdom');
var objs = [];
var eventType = "input paste copy click change keydown keyup contextmenu mouseup mousedown mousemove touchstart touchend touchmove compositionstart compositionend";
var dataAction = eventType.replace(/([a-z]+)/g, "[data-action-$1],") + "[data-action]";
var getObjectById = function getObjectById(id) {
  for (var i = 0, n = objs.length; i < n; i++) {
    var obj = objs[i];
    var templates = obj.templates;
    for (var t = 0, m = templates.length; t < m; t++) {
      if (templates[t] == id) {
        return obj;
      }
    }
  }
  return null;
};

if (typeof jQuery !== "undefined") {
  // for IE
  $ = jQuery;
}

if (!Array.prototype.find) {
  Array.prototype.find = function (predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value = void 0;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

if (typeof document !== "undefined") {
  //data binding
  $(document).on("input change click", "[data-bind]", function (e) {
    var data = $(this).data("bind");
    var val = $(this).val();
    var attr = $(this).attr("href");
    if (attr) {
      val = attr.replace("#", "");
    }
    var id = $(this).parents("[data-id]").data("id");
    if (id) {
      var obj = getObjectById(id);
      if ($(e.target).attr("type") == "radio") {
        if ($(this).is(":checked")) {
          obj.updateDataByString(data, val);
        } else {
          obj.updateDataByString(data, '');
        }
      } else if ($(e.target).attr("type") == "checkbox") {
        (function () {
          var arr = [];
          $("[data-bind=\"" + data + "\"]").each(function () {
            if ($(this).is(":checked")) {
              arr.push($(this).val());
            }
          });
          obj.updateDataByString(data, arr);
        })();
      } else {
        obj.updateDataByString(data, val);
      }
    }
  });
  //action
  $(document).on(eventType, dataAction, function (e) {
    if (e.type == "click" && $(e.target).is("select")) {
      return;
    }
    if (e.type == "input" && $(e.target).attr("type") == "button") {
      return;
    }
    var events = eventType.split(" ");
    var $self = $(this);
    var action = "action";
    events.forEach(function (event) {
      if ($self.data("action-" + event)) {
        if (e.type === event) {
          action += "-" + event;
        }
      }
    });
    var string = $self.data(action);
    if (!string) {
      return;
    }
    var method = string.replace(/\(.*?\);?/, "");
    var parameter = string.replace(/(.*?)\((.*?)\);?/, "$2");
    var pts = parameter.split(","); //引き数
    var id = $self.parents("[data-id]").data("id");
    if (id) {
      var obj = getObjectById(id);
      obj.e = e;
      if (obj.method && obj.method[method]) {
        obj.method[method].apply(obj, pts);
      } else if (obj[method]) {
        obj[method].apply(obj, pts);
      }
    }
  });
}

var aTemplate = function () {
  function aTemplate(opt) {
    _classCallCheck(this, aTemplate);

    this.atemplate = [];
    objs.push(this);
    for (var i in opt) {
      this[i] = opt[i];
    }
    if (!this.data) {
      this.data = {};
    }
    if (!this.templates) {
      this.templates = [];
    }
    var templates = this.templates;
    for (var _i = 0, n = this.templates.length; _i < n; _i++) {
      var template = this.templates[_i];
      this.atemplate.push({ id: template, html: $("#" + template).html() });
    }
    this.setId();
  }

  _createClass(aTemplate, [{
    key: "addTemplate",
    value: function addTemplate(id, html) {
      this.atemplate.push({ id: id, html: html });
      this.templates.push(id);
    }
  }, {
    key: "loadHtml",
    value: function loadHtml() {
      var templates = this.templates;
      var promises = [];
      templates.forEach(function (template) {
        var d = new $.Deferred();
        promises.push(d);
        var src = $("#" + template).attr("src");
        $.ajax({
          url: src,
          type: 'GET',
          dataType: 'text'
        }).success(function (data) {
          $("#" + template).html(data);
          d.resolve();
        });
      });
      return $.when.apply($, promises);
    }
  }, {
    key: "getData",
    value: function getData() {
      return JSON.parse(JSON.stringify(this.data));
    }
  }, {
    key: "saveData",
    value: function saveData(key) {
      var data = JSON.stringify(this.data);
      localStorage.setItem(key, data);
    }
  }, {
    key: "setData",
    value: function setData(val) {
      for (var i in val) {
        if (typeof val[i] !== "function") {
          this.data[i] = val[i];
        }
      }
    }
  }, {
    key: "loadData",
    value: function loadData(key) {
      var data = JSON.parse(localStorage.getItem(key));
      if (data) {
        for (var i in data) {
          if (typeof data[i] !== "function") {
            this.data[i] = data[i];
          }
        }
      }
    }
  }, {
    key: "getRand",
    value: function getRand(a, b) {
      return ~~(Math.random() * (b - a + 1)) + a;
    }
  }, {
    key: "getRandText",
    value: function getRandText(limit) {
      var ret = "";
      var strings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      var length = strings.length;
      for (var i = 0; i < limit; i++) {
        ret += strings.charAt(Math.floor(this.getRand(0, length)));
      }
      return ret;
    }
  }, {
    key: "setId",
    value: function setId() {
      var text = void 0;
      var ids = aTemplate.ids;
      var flag = false;
      while (1) {
        text = this.getRandText(10);
        for (var i = 0, n = aTemplate.ids; i < n; i++) {
          if (aTemplate.ids[i] === text) {
            flag = true;
          }
        }
        if (flag === false) {
          break;
        }
      }
      this.data.aTemplate_id = text;
    }
  }, {
    key: "getDataFromObj",
    value: function getDataFromObj(s, o) {
      s = s.replace(/\[([a-zA-Z0-9._-]+)\]/g, '.$1'); // convert indexes to properties
      s = s.replace(/^\./, ''); // strip leading dot
      var a = s.split('.');
      while (a.length) {
        var n = a.shift();
        if (n in o) {
          o = o[n];
        } else {
          return;
        }
      }
      return o;
    }
  }, {
    key: "getDataByString",
    value: function getDataByString(s) {
      var o = this.data;
      return this.getDataFromObj(s, o);
    }
  }, {
    key: "updateDataByString",
    value: function updateDataByString(path, newValue) {
      var object = this.data;
      var stack = path.split('.');
      while (stack.length > 1) {
        object = object[stack.shift()];
      }
      object[stack.shift()] = newValue;
    }
  }, {
    key: "removeDataByString",
    value: function removeDataByString(path) {
      var object = this.data;
      var stack = path.split('.');
      while (stack.length > 1) {
        object = object[stack.shift()];
      }
      var shift = stack.shift();
      if (shift.match(/^\d+$/)) {
        object.splice(Number(shift), 1);
      } else {
        delete object[shift];
      }
    }
  }, {
    key: "resolveBlock",
    value: function resolveBlock(html, item, i) {
      var that = this;
      var touchs = html.match(/<!-- BEGIN ([a-zA-Z0-9._-]+):touch#([a-zA-Z0-9._-]+) -->/g);
      var touchnots = html.match(/<!-- BEGIN ([a-zA-Z0-9._-]+):touchnot#([a-zA-Z0-9._-]+) -->/g);
      var exists = html.match(/<!-- BEGIN ([a-zA-Z0-9._-]+):exist -->/g);
      var empties = html.match(/<!-- BEGIN ([a-zA-Z0-9._-]+):empty -->/g);
      /*タッチブロック解決*/
      if (touchs) {
        for (var k = 0, n = touchs.length; k < n; k++) {
          var start = touchs[k];
          start = start.replace(/([a-zA-Z0-9._-]+):touch#([a-zA-Z0-9._-]+)/, "($1):touch#($2)");
          var end = start.replace(/BEGIN/, "END");
          var reg = new RegExp(start + "(([\\n\\r\\t]|.)*?)" + end, "g");
          html = html.replace(reg, function (m, key2, val, next) {
            var itemkey = typeof item[key2] === "function" ? item[key2].apply(that) : that.getDataFromObj(key2, item);
            if (itemkey == val) {
              return next;
            } else {
              return "";
            }
          });
        }
      }
      /*タッチノットブロック解決*/
      if (touchnots) {
        for (var _k = 0, _n = touchnots.length; _k < _n; _k++) {
          var _start = touchnots[_k];
          _start = _start.replace(/([a-zA-Z0-9._-]+):touchnot#([a-zA-Z0-9._-]+)/, "($1):touchnot#($2)");
          var _end = _start.replace(/BEGIN/, "END");
          var _reg = new RegExp(_start + "(([\\n\\r\\t]|.)*?)" + _end, "g");
          html = html.replace(_reg, function (m, key2, val, next) {
            var itemkey = typeof item[key2] === "function" ? item[key2].apply(that) : that.getDataFromObj(key2, item);
            if (itemkey != val) {
              return next;
            } else {
              return "";
            }
          });
        }
      }
      /*existブロックを解決*/
      if (exists) {
        for (var _k2 = 0, _n2 = exists.length; _k2 < _n2; _k2++) {
          var _start2 = exists[_k2];
          _start2 = _start2.replace(/([a-zA-Z0-9._-]+):exist/, "($1):exist");
          var _end2 = _start2.replace(/BEGIN/, "END");
          var _reg2 = new RegExp(_start2 + "(([\\n\\r\\t]|.)*?)" + _end2, "g");
          html = html.replace(_reg2, function (m, key2, next) {
            var itemkey = typeof item[key2] === "function" ? item[key2].apply(that) : that.getDataFromObj(key2, item);
            if (itemkey) {
              return next;
            } else {
              return "";
            }
          });
        }
      }
      /*emptyブロックを解決*/
      if (empties) {
        for (var _k3 = 0, _n3 = empties.length; _k3 < _n3; _k3++) {
          var _start3 = empties[_k3];
          _start3 = _start3.replace(/([a-zA-Z0-9._-]+):empty/, "($1):empty");
          var _end3 = _start3.replace(/BEGIN/, "END");
          var empty = new RegExp(_start3 + "(([\\n\\r\\t]|.)*?)" + _end3, "g");
          html = html.replace(empty, function (m, key2, next) {
            var itemkey = typeof item[key2] === "function" ? item[key2].apply(that) : that.getDataFromObj(key2, item);
            if (!itemkey) {
              return next;
            } else {
              return "";
            }
          });
        }
      }
      /*変数解決*/
      html = html.replace(/{([a-zA-Z0-9._-]+)}(\[([a-zA-Z0-9._-]+)\])*/g, function (n, key3, key4, converter) {
        var data = void 0;
        if (key3 == "i") {
          data = i;
        } else {
          if (item[key3]) {
            if (typeof item[key3] === "function") {
              data = item[key3].apply(that);
            } else {
              data = item[key3];
            }
          } else {
            if (converter && that.convert && that.convert[converter]) {
              return that.convert[converter].call(that, "");
            } else {
              return "";
            }
          }
        }
        if (converter && that.convert && that.convert[converter]) {
          return that.convert[converter].call(that, data);
        } else {
          return data;
        }
      });
      return html;
    }
    /*絶対パス形式の変数を解決*/

  }, {
    key: "resolveAbsBlock",
    value: function resolveAbsBlock(html) {
      var that = this;
      html = html.replace(/{(.*?)}/g, function (n, key3) {
        var data = that.getDataByString(key3);
        if (typeof data !== "undefined") {
          if (typeof data === "function") {
            return data.apply(that);
          } else {
            return data;
          }
        } else {
          return n;
        }
      });
      return html;
    }
  }, {
    key: "resolveInclude",
    value: function resolveInclude(html) {
      var include = /<!-- #include id="(.*?)" -->/g;
      html = html.replace(include, function (m, key) {
        return $("#" + key).html();
      });
      return html;
    }
  }, {
    key: "resolveWith",
    value: function resolveWith(html) {
      var width = /<!-- BEGIN ([a-zA-Z0-9._-]+):with -->(([\n\r\t]|.)*?)<!-- END ([a-zA-Z0-9._-]+):with -->/g;
      html = html.replace(width, function (m, key, val) {
        m = m.replace(/data\-bind=['"](.*?)['"]/g, "data-bind='" + key + ".$1'");
        return m;
      });
      return html;
    }
  }, {
    key: "resolveLoop",
    value: function resolveLoop(html) {
      var loop = /<!-- BEGIN (.+?):loop -->(([\n\r\t]|.)*?)<!-- END (.+?):loop -->/g;
      var that = this;
      /*ループ文解決*/
      html = html.replace(loop, function (m, key, val) {
        var keyItem = that.getDataByString(key);
        var keys = [];
        if (typeof keyItem === "function") {
          keys = keyItem.apply(that);
        } else {
          keys = keyItem;
        }
        var ret = "";
        if (keys instanceof Array) {
          for (var i = 0, n = keys.length; i < n; i++) {
            ret += that.resolveBlock(val, keys[i], i);
          }
        }
        /*エスケープ削除*/
        ret = ret.replace(/\\([^\\])/g, "$1");
        return ret;
      });
      return html;
    }
  }, {
    key: "removeData",
    value: function removeData(arr) {
      var data = this.data;
      for (var i in data) {
        for (var t = 0, n = arr.length; t < n; t++) {
          if (i === arr[t]) {
            delete data[i];
          }
        }
      }
      return this;
    }
  }, {
    key: "hasLoop",
    value: function hasLoop(txt) {
      var loop = /<!-- BEGIN (.+?):loop -->(([\n\r\t]|.)*?)<!-- END (.+?):loop -->/g;
      if (txt.match(loop)) {
        return true;
      } else {
        return false;
      }
    }
  }, {
    key: "getHtml",
    value: function getHtml(selector, row) {
      var template = this.atemplate.find(function (item) {
        return item.id === selector;
      });
      var html = "";
      if (template && template.html) {
        html = template.html;
      }
      if (row) {
        html = selector;
      }
      if (!html) {
        return "";
      }
      var data = this.data;
      /*インクルード解決*/
      html = this.resolveInclude(html);
      /*with解決*/
      html = this.resolveWith(html);
      /*ループ解決*/
      while (this.hasLoop(html)) {
        html = this.resolveLoop(html);
      }
      /*変数解決*/
      html = this.resolveBlock(html, data);
      /*エスケープ削除*/
      html = html.replace(/\\([^\\])/g, "$1");
      /*絶対パスで指定された変数を解決*/
      html = this.resolveAbsBlock(html);
      /*空行削除*/
      return html.replace(/^([\t ])*\n/gm, "");
    }
  }, {
    key: "update",
    value: function update(txt, part) {
      var html = this.getHtml();
      var templates = this.templates;
      var renderWay = txt || "html";
      if (this.beforeUpdated) {
        this.beforeUpdated();
      }
      for (var i = 0, n = templates.length; i < n; i++) {
        var tem = templates[i];
        var selector = "#" + tem;
        var _html = this.getHtml(tem);
        var $target = $("[data-id='" + tem + "']");
        if (!part || part == tem) {
          if ($target.length == 0) {
            var $newitem = $("<div data-id='" + tem + "'></div>");
            $newitem[renderWay](_html);
            $(selector).after($newitem);
          } else {
            if (renderWay === 'text') {
              $target.text(_html);
            } else {
              morphdom($target.get(0), "<div data-id='" + tem + "'>" + _html + "</div>");
            }
          }
          if (part) {
            break;
          }
        }
      }
      this.updateBindingData(part);
      if (this.onUpdated) {
        this.onUpdated(part);
      }
      return this;
    }
  }, {
    key: "updateBindingData",
    value: function updateBindingData(part) {
      var that = this;
      var templates = that.templates;
      for (var i = 0, n = templates.length; i < n; i++) {
        var temp = templates[i];
        if (!part || part == temp) {
          var $template = $("[data-id='" + temp + "']");
          $template.find("[data-bind]").each(function () {
            var data = that.getDataByString($(this).data("bind"));
            if ($(this).attr("type") == "checkbox" || $(this).attr("type") == "radio") {
              if (data == $(this).val()) {
                $(this).prop("checked", true);
              }
            } else {
              $(this).val(data);
            }
          });
          if (part) {
            break;
          }
        }
      }
      return this;
    }
  }, {
    key: "copyToClipBoard",
    value: function copyToClipBoard() {
      var copyArea = $("<textarea/>");
      $("body").append(copyArea);
      copyArea.text(this.getHtml());
      copyArea.select();
      document.execCommand("copy");
      copyArea.remove();
      return this;
    }
  }, {
    key: "applyMethod",
    value: function applyMethod(method) {
      var args = [].splice.call(arguments, 0);
      args.shift();
      return this.method[method].apply(this, args);
    }
  }, {
    key: "getComputedProp",
    value: function getComputedProp(prop) {
      return this.data[prop].apply(this);
    }
  }, {
    key: "remove",
    value: function remove(path) {
      var object = this.data;
      var stack = path.split('.');
      while (stack.length > 1) {
        object = object[stack.shift()];
      }
      var shift = stack.shift();
      if (shift.match(/^\d+$/)) {
        object.splice(Number(shift), 1);
      } else {
        delete object[shift];
      }
      return this;
    }
  }]);

  return aTemplate;
}();

module.exports = aTemplate;
