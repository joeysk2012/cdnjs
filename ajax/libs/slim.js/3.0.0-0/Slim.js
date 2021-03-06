'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _CustomElement() {
  return Reflect.construct(HTMLElement, [], this.__proto__.constructor);
}

;
Object.setPrototypeOf(_CustomElement.prototype, HTMLElement.prototype);
Object.setPrototypeOf(_CustomElement, HTMLElement);

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (window, document, HTMLElement) {

  var __flags = {
    isWCSupported: 'customElements' in window && 'import' in document.createElement('link') && 'content' in document.createElement('template'),
    isIE11: !!window['MSInputMethodContext'] && !!document['documentMode']
  };

  var selectorToArr = __flags.isWCSupported && NodeList.prototype.hasOwnProperty('forEach') ? function (target, selector) {
    return target.querySelectorAll(selector);
  } : function (target, selector) {
    return Array.prototype.slice.call(target.querySelectorAll(selector));
  };

  var _$2 = Symbol('Slim');

  var Internals = function Internals() {
    _classCallCheck(this, Internals);

    this.hasCustomTemplate = undefined;
    this.uniqueIndex = null;
    this.isDestoyed = false;
    this.boundParent = null;
    this.repeater = {};
    this.bindings = {};
    this.eventHandlers = {};
    this.internetExploderClone = null;
    this.rootElement = null;
    this.createdCallbackInvoked = false;
    this.sourceText = null;
  };

  var Binding = function () {
    _createClass(Binding, null, [{
      key: 'executePending',
      value: function executePending() {
        if (this.isExecuting) return;
        this.isExecuting = true;
        Binding.running = Binding.pending.concat();
        Binding.pending = [];
        Binding.running.forEach(function (x) {
          return x();
        });
        this.isExecuting = false;
        if (Binding.pending.length) {
          Binding.executePending();
        }
      }
    }]);

    function Binding(source, target, expression, executor) {
      _classCallCheck(this, Binding);

      this.source = source;
      this.target = target;
      this.expression = expression;
      this.executor = executor;

      this._destroy = this.destroy.bind(this);
      this._execute = this.execute.bind(this);

      this.init();
    }

    _createClass(Binding, [{
      key: 'execute',
      value: function execute() {
        if (this.target[_$2].isDestoyed) {
          this.destroy();
          return;
        }
        Binding.pending.push(this.executor.bind(this.source, this.target, Slim.extract(this.source, this.expression, this.target)));
        Binding.executePending();
        // Slim.asap( () => {
        // })
      }
    }, {
      key: 'init',
      value: function init() {
        this.pName = this.expression.split('.')[0];
        this.source.addEventListener('__' + this.pName + '-changed', this._execute);
        this.source.addEventListener('__clear-bindings', this._destroy);
      }
    }, {
      key: 'destroy',
      value: function destroy() {
        this.source.removeEventListener('__' + this.pName + '-changed', this._execute);
        this.source.removeEventListener('__clear-bindings', this._destroy);
        delete this.source;
        delete this.target;
        delete this.expression;
        delete this.executor;
        delete this._destroy;
        delete this._execute;
      }
    }]);

    return Binding;
  }();

  Binding.pending = [];
  Binding.running = [];
  Binding.isExecuting = false;

  var SlimError = function (_Error) {
    _inherits(SlimError, _Error);

    function SlimError(message) {
      _classCallCheck(this, SlimError);

      var _this = _possibleConstructorReturn(this, (SlimError.__proto__ || Object.getPrototypeOf(SlimError)).call(this, message));

      _this.flags = __flags;
      return _this;
    }

    return SlimError;
  }(Error);

  var Slim = function (_CustomElement2) {
    _inherits(Slim, _CustomElement2);

    _createClass(Slim, null, [{
      key: 'dashToCamel',
      value: function dashToCamel(dash) {
        return dash.indexOf('-') < 0 ? dash : dash.replace(/-[a-z]/g, function (m) {
          return m[1].toUpperCase();
        });
      }
    }, {
      key: 'camelToDash',
      value: function camelToDash(camel) {
        return camel.replace(/([A-Z])/g, '-$1').toLowerCase();
      }
    }, {
      key: 'search',
      value: function search( /* object */obj, /* string */path) {
        var arr = path.split('.');
        var prop = path[0];
        while (obj && arr.length) {
          obj = obj[prop = arr.shift()];
        }
        return {
          path: path,
          prop: prop,
          obj: obj,
          value: value
        };
      }
    }, {
      key: 'lookup',
      value: function lookup(target, expression, maybeRepeated) {
        var chain = expression.split('.');
        var o = void 0;
        if (maybeRepeated[_$2].repeater[chain[0]]) {
          o = maybeRepeated[_$2].repeater;
        } else {
          o = target;
        }
        var i = 0;
        while (o && i < chain.length) {
          o = o[chain[i++]];
        }
        return o;
      }
    }, {
      key: 'extract',
      value: function extract(target, expression, maybeRepeated) {
        var rxP = this.rxProp.exec(expression);
        if (rxP) {
          return Slim.lookup(target, rxP[1], maybeRepeated);
        }
        var rxM = this.rxMethod.exec(expression);
        if (rxM) {
          var fn = Slim.lookup(target, rxM[1]);
          var args = rxM[3].replace(' ', '').split(',').map(function (arg) {
            return Slim.lookup(target, arg, maybeRepeated);
          });
          fn.apply(target, args);
        }
      }
      // noinspection JSUnresolvedVariable

    }, {
      key: '_$',
      value: function _$(target) {
        target[_$2] = target[_$2] || new Internals();
        return target[_$2];
      }
    }, {
      key: 'polyFill',
      value: function polyFill(url) {
        if (!__flags.isWCSupported) {
          var existingScript = document.querySelector('script[data-is-slim-polyfill="true"]');
          if (!existingScript) {
            var script = document.createElement('script');
            script.setAttribute('data-is-slim-polyfill', 'true');
            script.src = url;
            document.head.appendChild(script);
          }
        }
      }
    }, {
      key: 'tag',
      value: function tag(tagName, tplOrClazz, clazz) {
        if (this.tagToClassDict.has(tagName)) {
          throw new SlimError('Unable to define tag: ' + tagName + ' already defined');
        }
        if (clazz === undefined) {
          clazz = tplOrClazz;
        } else {
          Slim.tagToTemplateDict.set(tagName, tplOrClazz);
        }
        this.tagToClassDict.set(tagName, clazz);
        this.classToTagDict.set(clazz, tagName);
        customElements.define(tagName, clazz);
      }
    }, {
      key: 'tagOf',
      value: function tagOf(clazz) {
        return this.classToTagDict.get(clazz);
      }
    }, {
      key: 'classOf',
      value: function classOf(tag) {
        return this.tagToClassDict.get(tag);
      }
    }, {
      key: 'createUniqueIndex',
      value: function createUniqueIndex() {
        this[_$2].uniqueCounter++;
        return this[_$2].uniqueCounter.toString(16);
      }
    }, {
      key: 'plugin',
      value: function plugin(phase, _plugin) {
        if (!this.plugins[phase]) {
          throw new SlimError('Cannot attach plugin: ' + phase + ' is not a supported phase');
        }
        this.plugins[phase].push(_plugin);
      }
    }, {
      key: 'customDirective',
      value: function customDirective(directiveStr, fn) {
        if (this[_$2].customDirectives.has(directiveStr)) {
          throw new SlimError('Cannot register custom directive: ' + directiveStr + ' already registered');
        }
        this[_$2].customDirectives.set(directiveStr, fn);
      }
    }, {
      key: 'executePlugins',
      value: function executePlugins(phase, target) {
        this.plugins[phase].forEach(function (fn) {
          fn(target);
        });
      }
    }, {
      key: 'unbind',
      value: function unbind(source, target) {
        var bindings = source[_$2].bindings;
        Object.keys(bindings).forEach(function (key) {
          var chain = bindings[key].chain.filter(function (binding) {
            if (binding.target === target) {
              binding.destroy();
              return false;
            }
            return true;
          });
          bindings[key].chain = chain;
        });
      }
    }, {
      key: 'selectRecursive',
      value: function selectRecursive(target, excludeParent) {
        if (excludeParent) {
          return Slim.qSelectAll(target, '*');
        }
        return [target].concat(Slim.qSelectAll(target, '*'));
      }
    }, {
      key: 'removeChild',
      value: function removeChild(target) {
        if (typeof target.remove === 'function') {
          target.remove();
        }
        if (target.parentNode) {
          target.parentNode.removeChild(target);
        }
        if (this._$(target).internetExploderClone) {
          this.removeChild(this._$(target).internetExploderClone);
        }
      }
    }, {
      key: 'moveChildrenBefore',
      value: function moveChildrenBefore(source, target) {
        while (source.firstChild) {
          target.parentNode.insertBefore(source.firstChild, target);
        }
      }
    }, {
      key: 'moveChildren',
      value: function moveChildren(source, target) {
        while (source.firstChild) {
          target.appendChild(source.firstChild);
        }
      }
    }, {
      key: 'convertToComment',
      value: function convertToComment(target) {
        target.outerHTML = '<!-- [slim:if]' + target.outerHTML + ' -->';
        return target;
      }
    }, {
      key: 'wrapGetterSetter',
      value: function wrapGetterSetter(element, expression) {
        var pName = expression.split('.')[0];
        var oSetter = element.__lookupSetter__(pName);
        if (oSetter && oSetter[_$2]) return pName;
        if (typeof oSetter === 'undefined') {
          oSetter = function oSetter() {};
        }

        var srcValue = element[pName];
        this._$(element).bindings[pName] = element[_$2].bindings[pName] || {
          chain: [],
          value: srcValue
        };
        element[_$2].bindings[pName].value = srcValue;
        var newSetter = function newSetter(v) {
          if (this[pName] === v) return;
          oSetter(v);
          this[_$2].bindings[pName].value = v;
          this.dispatchEvent(new Event('__' + pName + '-changed'));
        };
        newSetter[_$2] = true;
        element.__defineGetter__(pName, function () {
          return element[_$2].bindings[pName].value;
        });
        element.__defineSetter__(pName, newSetter);
        return pName;
      }
    }, {
      key: 'bindOwn',
      value: function bindOwn(target, expression, executor) {
        Slim._$(target);
        var pName = this.wrapGetterSetter(target, expression);
        var binding = new Binding(target, target, expression, executor);
        target[_$2].bindings[pName].chain.push(binding);
        return binding;
      }
    }, {
      key: 'bind',
      value: function bind(source, target, expression, executor) {
        Slim._$(source);
        var pName = this.wrapGetterSetter(source, expression);
        var binding = new Binding(source, target, expression, executor);
        source[_$2].bindings[pName].chain.push(binding);
        return binding;
      }

      /*
        Class instance
       */

    }, {
      key: 'rxInject',
      get: function get() {
        return (/\{(.+[^(\((.+)\))])\}/
        );
      }
    }, {
      key: 'rxProp',
      get: function get() {
        return (/(.+[^(\((.+)\))])/
        );
      }
    }, {
      key: 'rxMethod',
      get: function get() {
        return (/(.+)(\((.+)\)){1}/
        );
      }
    }]);

    function Slim() {
      _classCallCheck(this, Slim);

      var _this2 = _possibleConstructorReturn(this, (Slim.__proto__ || Object.getPrototypeOf(Slim)).call(this));

      _this2.createdCallback();
      return _this2;
    }

    // Native DOM Api

    _createClass(Slim, [{
      key: 'createdCallback',
      value: function createdCallback() {
        var _this3 = this;

        Slim._$(this);
        if (this[_$2].createdCallbackInvoked) return;
        if (!this._isInContext) return;
        this._initialize();
        this.onBeforeCreated();
        Slim.executePlugins('create', this);
        this._render();
        this[_$2].createdCallbackInvoked = true;
        Slim.asap(function () {
          _this3.onCreated();
        });
      }
    }, {
      key: 'connectedCallback',
      value: function connectedCallback() {
        this.onAdded();
        Slim.executePlugins('added', this);
      }
    }, {
      key: 'disconnectedCallback',
      value: function disconnectedCallback() {
        this.onRemoved();
        Slim.executePlugins('removed', this);
      }

      // Slim internal API

    }, {
      key: '_executeBindings',
      value: function _executeBindings(prop) {
        var all = this[_$2].bindings;
        if (prop) {
          all = _defineProperty({}, prop, true);
        }
        for (var pName in all) {
          var o = this[_$2].bindings[pName];
          o.chain.forEach(function (binding) {
            binding.execute();
          });
        }
      }
    }, {
      key: '_bindChildren',
      value: function _bindChildren(children, exclude) {
        var _this4 = this;

        if (!children) {
          children = Slim.qSelectAll(this, '*');
        }

        var _loop = function _loop(child) {
          Slim._$(child);
          if (child[_$2].boundParent === _this4) return 'continue';
          child[_$2].boundParent = _this4;

          // todo: child.localName === 'style' && this.useShadow -> processStyleNodeInShadowMode
          // todo: handle slim-id

          if (child.attributes) {
            var _loop2 = function _loop2(i, n) {
              var source = _this4;
              var attribute = child.attributes[i];
              var attributeName = attribute.localName;
              if (exclude && exclude.directive && exclude.directives.indexOf(attributeName) >= 0) return 'continue';
              if (exclude && exclude.values && exclude.values.indexOf(attribute.nodeValue) >= 0) return 'continue';
              Slim[_$2].customDirectives.forEach(function (fn, matcher) {
                var match = new RegExp(matcher).exec(attributeName);
                if (match) {
                  fn(source, child, attribute, match);
                }
              });
            };

            for (var i = 0, n = child.attributes.length; i < n; i++) {
              var _ret2 = _loop2(i, n);

              if (_ret2 === 'continue') continue;
            }
          }
        };

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var child = _step.value;

            var _ret = _loop(child);

            if (_ret === 'continue') continue;
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    }, {
      key: '_captureBindings',
      value: function _captureBindings() {
        var _this5 = this;

        var template = this[_$2].hasCustomTemplate || this.template;
        if (!template) {
          return;
        }
        var frag = void 0;
        if (template && typeof template === 'string') {
          frag = document.createRange().createContextualFragment(template);
        }
        Slim.asap(function () {
          Slim.moveChildren(frag, _this5[_$2].rootElement || _this5);
        });
        var allChildren = Slim.qSelectAll(frag, '*');
        this._bindChildren(allChildren);
      }
    }, {
      key: '_resetBindings',
      value: function _resetBindings() {
        this[_$2].bindings = {};
        this.dispatchEvent(new CustomEvent('__reset-bindings'));
      }
    }, {
      key: '_render',
      value: function _render(customTemplate) {
        Slim.executePlugins('beforeRender', this);
        this.onBeforeRender();
        this[_$2].hasCustomTemplate = customTemplate;
        this._resetBindings();
        if (typeof customTemplate === 'string') {
          this.innerHTML = '';
        }
        this._captureBindings();
        this._executeBindings();
        this.onRender();
        Slim.executePlugins('afterRender', this);
      }
    }, {
      key: '_initialize',
      value: function _initialize() {
        var _this6 = this;

        this[_$2].uniqueIndex = Slim.createUniqueIndex();
        if (this.useShadow) {
          this.createShadowRoot();
          this[_$2].rootElement = this.shadowRoot;
        } else {
          this[_$2].rootElement = this;
        }
        this.setAttribute('slim-uq', this[_$2].uniqueIndex);
        var observedAttributes = this.constructor.observedAttributes;
        if (observedAttributes) {
          observedAttributes.forEach(function (attr) {
            var pName = Slim.dashToCamel(attr);
            _this6[pName] = _this6.getAttribute(attr);
          });
        }
      }

      // Slim public / protected API

    }, {
      key: 'render',
      value: function render(tpl) {
        this._render(tpl);
      }
    }, {
      key: 'onBeforeRender',
      value: function onBeforeRender() {}
    }, {
      key: 'onRender',
      value: function onRender() {}
    }, {
      key: 'onBeforeCreated',
      value: function onBeforeCreated() {}
    }, {
      key: 'onCreated',
      value: function onCreated() {}
    }, {
      key: 'onAdded',
      value: function onAdded() {}
    }, {
      key: 'onRemoved',
      value: function onRemoved() {}
    }, {
      key: 'find',
      value: function find(selector) {
        return (this[_$2].rootElement || this).querySelector(selector);
      }
    }, {
      key: 'findAll',
      value: function findAll(selector) {
        return Slim.qSelectAll(this[_$2].rootElement, selector);
      }
    }, {
      key: 'callAttribute',
      value: function callAttribute(attr, data) {
        var fnName = this.getAttribute(attr);
        if (fnName) {
          this[_$2].boundParent[fnName](data);
        }
      }
    }, {
      key: '_isInContext',
      get: function get() {
        var node = this;
        while (node) {
          node = node.parentNode;
          if (!node) {
            return false;
          }
          if (node instanceof Document) {
            return true;
          }
        }
        return false;
      }
    }, {
      key: 'useShadow',
      get: function get() {
        return false;
      }
    }, {
      key: 'template',
      get: function get() {
        return Slim.tagToTemplateDict.get(Slim.tagOf(this.constructor));
      }
    }]);

    return Slim;
  }(_CustomElement);

  Slim.uniqueIndex = 0;
  Slim.qSelectAll = selectorToArr;
  Slim.tagToClassDict = new Map();
  Slim.classToTagDict = new Map();
  Slim.tagToTemplateDict = new Map();
  Slim.plugins = {
    'create': [],
    'added': [],
    'beforeRender': [],
    'afterRender': [],
    'removed': []
  };

  Slim.asap = window && window.requestAnimationFrame ? function (cb) {
    return window.requestAnimationFrame(cb);
  } : typeof setImmediate !== 'undefined' ? setImmediate : function (cb) {
    return setTimeout(cb, 0);
  };

  Slim[_$2] = {
    customDirectives: new Map(),
    uniqueCounter: 0,
    supportedNativeEvents: ['click', 'mouseover', 'mouseout', 'mousemove', 'mouseenter', 'mousedown', 'mouseup', 'dblclick', 'contextmenu', 'wheel', 'mouseleave', 'select', 'pointerlockchange', 'pointerlockerror', 'focus', 'blur', 'input', 'error', 'invalid', 'animationstart', 'animationend', 'animationiteration', 'reset', 'submit', 'resize', 'scroll', 'keydown', 'keypress', 'keyup', 'change']

    // supported events (i.e. click, mouseover, change...)
  };Slim.customDirective('^' + Slim[_$2].supportedNativeEvents.join('|') + '+$', function (source, target, attribute, match) {
    var eventName = match[0];
    var delegate = attribute.nodeValue;
    Slim._$(target).eventHandlers = target[_$2].eventHandlers || {};
    var allHandlers = target[_$2].eventHandlers;
    allHandlers[eventName] = allHandlers[eventName] || [];
    var handler = function handler(e) {
      try {
        source[delegate].call(source, e);
      } catch (err) {
        err.message = 'Could not respond to event "' + eventName + '" on ' + target.localName + ' -> "' + delegate + '" on ' + source.localName + ' ... ' + err.message;
        console.warn(err);
      }
    };
    allHandlers[eventName].push(handler);
    target.addEventListener(eventName, handler);
    handler = null;
  });

  Slim.customDirective(/^slim:repeat$/, function (source, target, attribute) {
    var repeaterId = Slim.createUniqueIndex();
    var hook = document.createElement('slim-repeater-hook');
    var path = attribute.nodeValue;
    var tProp = 'data';
    if (path.indexOf(' as')) {
      tProp = path.split(' as ')[1] || tProp;
      path = path.split(' as ')[0];
    }
    var template = target.cloneNode(true);
    template.removeAttribute('slim:repeat');
    template.setAttribute('slim-repeat-hook', repeaterId);
    var startAnchor = document.createComment('repeat:' + path + ' start');
    var endAnchor = document.createComment('repeat:' + path + ' end');
    var clones = [];
    target.parentNode.insertBefore(startAnchor, target);
    target.parentNode.insertBefore(endAnchor, target);
    target.parentNode.insertBefore(hook, endAnchor);
    Slim.removeChild(target);
    var dataSourceChanged = function dataSourceChanged(target, dataSource) {
      // get rid of existing clones
      clones.forEach(function (clone) {
        Slim.selectRecursive(clone).forEach(function (e) {
          Slim.unbind(source, e);
          Slim.removeChild(e);
        });
      });
      // create new clones
      clones = dataSource.map(function (dataItem, index) {
        hook.insertAdjacentHTML('afterEnd', template.outerHTML);
        var clone = startAnchor.parentNode.querySelector('*[slim-repeat-hook="' + repeaterId + '"]');
        clone.removeAttribute('slim-repeat-hook');
        Slim._$(clone).repeater[tProp] = dataItem;
        clone.setAttribute('slim-repeat-index', index.toString());
        clone[tProp] = dataItem;
        Slim.selectRecursive(clone).forEach(function (e) {
          source._bindChildren([e], {
            values: [attribute.nodeValue],
            directives: [attribute.nodeName]
          });
        });
        startAnchor.parentNode.insertBefore(clone, endAnchor);
        return clone;
      });
      source.dispatchEvent(new Event('__' + tProp + '-changed'));
    };
    Slim.bind(source, target, path, dataSourceChanged);
  });

  Slim.customDirective(/^slim:if$/, function (source, target, attribute) {
    var path = attribute.nodeValue;
    var anchor = document.createComment('if:' + path);
    target.parentNode.insertBefore(anchor, target);
    var fn = function fn(target, value) {
      if (value) {
        anchor.parentNode.insertBefore(target, anchor.nextSibling);
      } else {
        Slim.removeChild(target);
      }
    };
    Slim.bind(source, target, path, fn);
  });

  // bind (text nodes)
  Slim.customDirective(/^bind$/, function (source, target) {
    Slim._$(target);
    target[_$2].sourceText = target.innerText;
    var matches = target.innerText.match(/\{\{([^\}\}]+)+\}\}/g);
    var aggProps = {};
    var textBinds = {};
    if (matches) {
      matches.forEach(function (expression) {
        var rxM = /\{\{(.+)(\((.+)\)){1}\}\}/.exec(expression);
        if (rxM) {
          var fnName = rxM[1];
          var pNames = rxM[3].replace(' ', '').split(',');
          pNames.map(function (path) {
            return path.split('.')[0];
          }).forEach(function (p) {
            return aggProps[p] = true;
          });
          textBinds[expression] = function (target) {
            try {
              var args = pNames.map(function (path) {
                return Slim.lookup(source, path, target);
              });
              var _value = source[fnName].apply(source, args);
              target.innerText = target.innerText.split(expression).join(_value);
            } catch (err) {}
          };
          return;
        }
        var rxP = /\{\{(.+[^(\((.+)\))])\}\}/.exec(expression);
        if (rxP) {
          var path = rxP[1];
          aggProps[path] = true;
          textBinds[expression] = function (target) {
            try {
              var _value2 = Slim.lookup(source, path, target);
              target.innerText = target.innerText.replace(new RegExp(expression, 'g'), _value2);
            } catch (err) {}
          };
        }
      });
      var chainExecutor = function chainExecutor(target) {
        target.innerText = target[_$2].sourceText;
        Object.keys(textBinds).forEach(function (expression) {
          textBinds[expression](target);
        });
      };
      Object.keys(aggProps).forEach(function (prop) {
        Slim.bind(source, target, prop, chainExecutor);
      });
    }
  });

  // bind:property
  Slim.customDirective(/^(bind):(\S+)/, function (source, target, attribute, match) {
    var tAttr = match[2];
    var tProp = Slim.dashToCamel(tAttr);
    var expression = attribute.nodeValue;
    var rxM = Slim.rxMethod.exec(expression);
    if (rxM) {
      var pNames = rxM[3].replace(' ', '').split(',');
      pNames.forEach(function (pName) {
        Slim.bind(source, target, pName, function (target) {
          var fn = Slim.extract(source, rxM[1], target);
          var args = pNames.map(function (prop) {
            return Slim.extract(source, prop, target);
          });
          var value = fn.apply(source, args);
          target[tProp] = value;
          target.setAttribute(tAttr, value);
        });
      });
      return;
    }
    var rxP = Slim.rxProp.exec(expression);
    if (rxP) {
      var prop = rxP[1];
      Slim.bind(source, target, prop, function (target, value) {
        target.setAttribute(tAttr, value);
        target[tProp] = value;
      });
    }
  });

  if (window) {
    window['Slim'] = Slim;
  }
  if (typeof module !== 'undefined') {
    module.exports.Slim = Slim;
  }
})(window, document, HTMLElement);

