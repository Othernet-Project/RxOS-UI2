window.OSjs = window.OSjs || {};
/**
 * @preserve OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */

(function() {
  'use strict';
  (function() {
    window.console    = window.console    || {};
    console.log       = console.log       || function() {};
    console.debug     = console.debug     || console.log;
    console.error     = console.error     || console.log;
    console.warn      = console.warn      || console.log;
    console.group     = console.group     || console.log;
    console.groupEnd  = console.groupEnd  || console.log;
  })();
  (['forEach', 'every', 'map']).forEach(function(n) {
    (['HTMLCollection', 'NodeList', 'FileList']).forEach(function(p) {
      if ( window[p] ) {
        window[p].prototype[n] = Array.prototype[n];
      }
    });
  });
  (function() {
    function CustomEvent(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: undefined };
      var evt = document.createEvent( 'CustomEvent' );
      evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
      return evt;
    }
    if ( window.navigator.userAgent.match(/MSIE|Edge|Trident/) ) {
      CustomEvent.prototype = window.Event.prototype;
      window.CustomEvent = CustomEvent;
    }
  })();
})();

(function() {
  'use strict';
  var handler    = null;
  var loaded     = false;
  var inited     = false;
  var signingOut = false;
  (['Utils', 'API', 'GUI', 'Core', 'Dialogs', 'Helpers', 'Applications', 'Locales', 'VFS', 'Extensions']).forEach(function(ns) {
    OSjs[ns] = OSjs[ns] || {};
  });
  (['Elements', 'Helpers']).forEach(function(ns) {
    OSjs.GUI[ns] = OSjs.GUI[ns] || {};
  });
  (['Helpers', 'Transports']).forEach(function(ns) {
    OSjs.VFS[ns] = OSjs.VFS[ns] || {};
  });
  function checkForbiddenKeyCombo(ev) {
    return false;
  }
  var events = {
    body_contextmenu: function(ev) {
      ev.stopPropagation();
      if ( !OSjs.Utils.$isFormElement(ev) ) {
        ev.preventDefault();
        return false;
      }
      return true;
    },
    body_click: function(ev) {
      OSjs.API.blurMenu();
      if ( ev.target === document.body ) {
        var wm = OSjs.Core.getWindowManager();
        var win = wm ? wm.getCurrentWindow() : null;
        if ( win ) {
          win._blur();
        }
      }
    },
    message: function(ev) {
      if ( ev && ev.data && typeof ev.data.message !== 'undefined' && typeof ev.data.pid === 'number' ) {
        var proc = OSjs.API.getProcess(ev.data.pid);
        if ( proc ) {
          if ( typeof proc.onPostMessage === 'function' ) {
            proc.onPostMessage(ev.data.message, ev);
          }
          if ( typeof proc._getWindow === 'function' ) {
            var win = proc._getWindow(ev.data.wid, 'wid');
            if ( win ) {
              win.onPostMessage(ev.data.message, ev);
            }
          }
        }
      }
    },
    fullscreen: function(ev) {
      var notif = OSjs.Core.getWindowManager().getNotificationIcon('_FullscreenNotification');
      if ( notif ) {
        if ( !document.fullScreen && !document.mozFullScreen && !document.webkitIsFullScreen && !document.msFullscreenElement ) {
          notif.opts._isFullscreen = false;
          notif.setImage(OSjs.API.getIcon('actions/gtk-fullscreen.png', '16x16'));
        } else {
          notif.opts._isFullscreen = true;
          notif.setImage(OSjs.API.getIcon('actions/gtk-leave-fullscreen.png', '16x16'));
        }
      }
    },
    keydown: function(ev) {
      var wm  = OSjs.Core.getWindowManager();
      var win = wm ? wm.getCurrentWindow() : null;
      var accept = [122, 123];
      function checkPrevent() {
        var d = ev.srcElement || ev.target;
        var doPrevent = d.tagName === 'BODY' ? true : false;
        if ( (ev.keyCode === OSjs.Utils.Keys.BACKSPACE) && !OSjs.Utils.$isFormElement(ev) ) { // Backspace
          doPrevent = true;
        } else if ( (ev.keyCode === OSjs.Utils.Keys.TAB) && OSjs.Utils.$isFormElement(ev) ) { // Tab
          doPrevent = true;
        } else {
          if ( accept.indexOf(ev.keyCode) !== -1 ) {
            doPrevent = false;
          } else if ( checkForbiddenKeyCombo(ev) ) {
            doPrevent = true;
          }
        }
        if ( doPrevent && (!win || !win._properties.key_capture) ) {
          return true;
        }
        return false;
      }
      var reacted = (function() {
        var combination = null;
        if ( wm ) {
          combination = wm.onKeyDown(ev, win);
          if ( win && !combination ) {
            win._onKeyEvent(ev, 'keydown');
          }
        }
        return combination;
      })();
      if ( checkPrevent() || reacted ) {
        ev.preventDefault();
      }
      return true;
    },
    keypress: function(ev) {
      var wm = OSjs.Core.getWindowManager();
      if ( checkForbiddenKeyCombo(ev) ) {
        ev.preventDefault();
      }
      if ( wm ) {
        var win = wm.getCurrentWindow();
        if ( win ) {
          return win._onKeyEvent(ev, 'keypress');
        }
      }
      return true;
    },
    keyup: function(ev) {
      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        wm.onKeyUp(ev, wm.getCurrentWindow());
        var win = wm.getCurrentWindow();
        if ( win ) {
          return win._onKeyEvent(ev, 'keyup');
        }
      }
      return true;
    },
    beforeunload: function(ev) {
      if ( signingOut ) {
        return;
      }
      try {
        if ( OSjs.API.getConfig('ShowQuitWarning') ) {
          return OSjs.API._('MSG_SESSION_WARNING');
        }
      } catch ( e ) {}
    },
    resize: (function() {
      var _timeout;
      function _resize(ev, wasInited) {
        var wm = OSjs.Core.getWindowManager();
        if ( !wm ) {
          return;
        }
        wm.resize(ev, wm.getWindowSpace(), wasInited);
      }
      return function(ev, wasInited) {
        if ( _timeout ) {
          clearTimeout(_timeout);
          _timeout = null;
        }
        var self = this;
        _timeout = setTimeout(function() {
          _resize.call(self, ev, wasInited);
        }, 100);
      };
    })(),
    scroll: function(ev) {
      if ( ev.target === document || ev.target === document.body ) {
        ev.preventDefault();
        ev.stopPropagation();
        return false;
      }
      document.body.scrollTop = 0;
      document.body.scrollLeft = 0;
      return true;
    },
    hashchange: function(ev) {
      var hash = window.location.hash.substr(1);
      var spl = hash.split(/^([\w\.\-_]+)\:(.*)/);
      function getArgs(q) {
        var args = {};
        q.split('&').forEach(function(a) {
          var b = a.split('=');
          var k = decodeURIComponent(b[0]);
          args[k] = decodeURIComponent(b[1] || '');
        });
        return args;
      }
      if ( spl.length === 4 ) {
        var root = spl[1];
        var args = getArgs(spl[2]);
        if ( root ) {
          OSjs.API.getProcess(root).forEach(function(p) {
            p._onMessage('hashchange', {
              hash: hash,
              args: args
            }, {source: null});
          });
        }
      }
    },
    orientationchange: function(ev) {
      var orientation = 'landscape';
      if ( window.screen && window.screen.orientation ) {
        if ( window.screen.orientation.type.indexOf('portrait') !== -1 ) {
          orientation = 'portrait';
        }
      }
      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        wm.onOrientationChange(ev, orientation);
      }
      document.body.setAttribute('data-orientation', orientation);
    }
  };
  function onError(msg) {
    OSjs.API.error(OSjs.API._('ERR_CORE_INIT_FAILED'), OSjs.API._('ERR_CORE_INIT_FAILED_DESC'), msg, null, true);
  }
  function initLayout() {
    if ( OSjs.API.getConfig('Watermark.enabled') ) {
      var ver = OSjs.API.getConfig('Version', 'unknown version');
      var html = OSjs.API.getConfig('Watermark.lines') || [];
      var el = document.createElement('div');
      el.id = 'DebugNotice';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = html.join('<br />').replace(/%VERSION%/, ver);
      document.body.appendChild(el);
    }
    document.getElementById('LoadingScreen').style.display = 'none';
  }
  function initHandler(config, callback) {
    handler = new OSjs.Core.Handler();
    function _done(error) {
      if ( error ) {
        onError(error);
        return;
      }
      if ( !inited ) {
        if ( !handler.loggedIn ) {
          if ( confirm(OSjs.API._('ERR_NO_SESSION')) ) {
            handler.init(_done);
          }
          return;
        }
      }
      inited = true;
      callback();
    }
    handler.init(_done);
  }
  function initEvents() {
    document.body.addEventListener('contextmenu', events.body_contextmenu, false);
    document.body.addEventListener('click', events.body_click, false);
    document.addEventListener('keydown', events.keydown, true);
    document.addEventListener('keypress', events.keypress, true);
    document.addEventListener('keyup', events.keyup, true);
    window.addEventListener('orientationchange', events.orientationchange, false);
    window.addEventListener('hashchange', events.hashchange, false);
    window.addEventListener('resize', events.resize, false);
    window.addEventListener('scroll', events.scroll, false);
    window.addEventListener('fullscreenchange', events.fullscreen, false);
    window.addEventListener('mozfullscreenchange', events.fullscreen, false);
    window.addEventListener('webkitfullscreenchange', events.fullscreen, false);
    window.addEventListener('msfullscreenchange', events.fullscreen, false);
    window.addEventListener('message', events.message, false);
    window.onbeforeunload = events.beforeunload;
    events.orientationchange();
    window.onerror = function(message, url, linenumber, column, exception) {
      if ( typeof exception === 'string' ) {
        exception = null;
      }
      console.warn('window::onerror()', arguments);
      OSjs.API.error(OSjs.API._('ERR_JAVASCRIPT_EXCEPTION'),
                    OSjs.API._('ERR_JAVACSRIPT_EXCEPTION_DESC'),
                    OSjs.API._('BUGREPORT_MSG'),
                    exception || {name: 'window::onerror()', fileName: url, lineNumber: linenumber + ':' + column, message: message},
                    true );
      return false;
    };
  }
  function initPreload(config, callback) {
    var list = [];
    function flatten(a) {
      a.forEach(function(i) {
        if ( i instanceof Array ) {
          flatten(i);
        } else {
          if ( typeof i === 'string' ) {
            i = OSjs.Utils.checkdir(i);
          } else {
            i.src = OSjs.Utils.checkdir(i.src);
          }
          list.push(i);
        }
      });
    }
    flatten(config.Preloads);
    OSjs.Utils.preload(list, function(total, failed) {
      if ( failed.length ) {
        console.warn('doInitialize()', 'some preloads failed to load:', failed);
      }
      setTimeout(function() {
        callback();
      }, 0);
    });
  }
  function initExtensions(config, callback) {
    var exts = Object.keys(OSjs.Extensions);
    var manifest =  OSjs.Core.getMetadata();
    OSjs.Utils.asyncs(exts, function(entry, idx, next) {
      try {
        var m = manifest[entry];
        OSjs.Extensions[entry].init(m, function() {
          next();
        });
      } catch ( e ) {
        console.warn('Extension init failed', e.stack, e);
        next();
      }
    }, function() {
      callback();
    });
  }
  function initSettingsManager(cfg, callback) {
    var pools = cfg.SettingsManager || {};
    var manager = OSjs.Core.getSettingsManager();
    Object.keys(pools).forEach(function(poolName) {
      manager.instance(poolName, pools[poolName] || {});
    });
    callback();
  }
  function initPackageManager(cfg, callback) {
    OSjs.Core.getPackageManager().load(function(result, error, pm) {
      if ( error ) {
        callback(error, result);
        return;
      }
      var list = OSjs.API.getConfig('PreloadOnBoot', []);
      OSjs.Utils.asyncs(list, function(iter, index, next) {
        var pkg = pm.getPackage(iter);
        if ( pkg && pkg.preload ) {
          OSjs.Utils.preload(pkg.preload, next);
        } else {
          next();
        }
      }, function() {
        setTimeout(function() {
          callback(false, true);
        }, 0);
      });
    });
  }
  function initVFS(config, callback) {
    OSjs.Core.getMountManager().init(callback);
  }
  function initSearch(config, callback) {
    OSjs.Core.getSearchEngine().init(callback);
  }
  function initWindowManager(config, callback) {
    if ( !config.WM || !config.WM.exec ) {
      onError(OSjs.API._('ERR_CORE_INIT_NO_WM'));
      return;
    }
    OSjs.API.launch(config.WM.exec, (config.WM.args || {}), function(app) {
      app.setup(callback);
    }, function(error, name, args, exception) {
      onError(OSjs.API._('ERR_CORE_INIT_WM_FAILED_FMT', error), exception);
    });
  }
  function initSession(config, callback) {
    OSjs.API.playSound('LOGIN');
    var list = [];
    try {
      list = config.AutoStart;
    } catch ( e ) {
      console.warn('initSession()->autostart()', 'exception', e, e.stack);
    }
    var checkMap = {};
    var skipMap = [];
    list.forEach(function(iter, idx) {
      if ( typeof iter === 'string' ) {
        iter = list[idx] = {name: iter};
      }
      if ( skipMap.indexOf(iter.name) === -1 ) {
        if ( !checkMap[iter.name] ) {
          checkMap[iter.name] = idx;
          skipMap.push(iter.name);
        }
      }
    });
    handler.getLastSession(function(err, adds) {
      if ( !err ) {
        adds.forEach(function(iter) {
          if ( typeof checkMap[iter.name] === 'undefined' ) {
            list.push(iter);
          } else {
            if ( iter.args ) {
              var refid = checkMap[iter.name];
              var ref = list[refid];
              if ( !ref.args ) {
                ref.args = {};
              }
              ref.args = OSjs.Utils.mergeObject(ref.args, iter.args);
            }
          }
        });
      }
      OSjs.API.launchList(list, null, null, callback);
    });
  }
  function initTestEnvironment(config, callback) {
    OSjs.Utils.preload([
      '/vendor/mocha/mocha.js',
      '/vendor/mocha/mocha.css',
      '/vendor/chai/chai.js'
    ], function() {
      var h1 = document.createElement('h1');
      h1.style.margin = '20px';
      h1.appendChild(document.createTextNode('OS.js Mocha Client Test Suite'));
      document.body.appendChild(h1);
      var el = document.createElement('div');
      el.id = 'mocha';
      document.body.appendChild(el);
      document.body.style.background = '#fff';
      document.body.style.overflow = 'auto';
      window.mocha.ui('bdd');
      window.mocha.reporter('html');
      (new OSjs.Core.WindowManager('MochaWM', null, {}, {}, {})).init();
      OSjs.Utils.$createCSS(OSjs.API.getThemeCSS('default'));
      OSjs.Utils.preload(['/client/test/test.js'], callback);
    });
    return true;
  }
  function init() {
    var config = OSjs.Core.getConfig();
    var splash = document.getElementById('LoadingScreen');
    var loading = OSjs.API.createSplash('OS.js', null, null, splash);
    var freeze = ['API', 'Core', 'Dialogs', 'Extensions', 'GUI', 'Helpers', 'Locales', 'Utils', 'VFS'];
    var queue = [
      initPreload,
      initHandler,
      initVFS,
      initPackageManager,
      initExtensions,
      initSettingsManager,
      initSearch,
      function(cfg, cb) {
        OSjs.Core.getMountManager().restore(cb);
      },
      function(cfg, cb) {
        return OSjs.GUI.DialogScheme.init(cb);
      }
    ];
    function _inited() {
      loading = loading.destroy();
      splash = OSjs.Utils.$remove(splash);
      var wm = OSjs.Core.getWindowManager();
      wm._fullyLoaded = true;
      OSjs.API.triggerHook('onWMInited');
    }
    function _done() {
      OSjs.API.triggerHook('onInited');
      loading.update(queue.length - 1, queue.length + 1);
      freeze.forEach(function(f) {
        if ( typeof OSjs[f] === 'object' ) {
          Object.freeze(OSjs[f]);
        }
      });
      if ( config.DEVMODE || config.MOCHAMODE ) {
        _inited();
      }
      if ( config.MOCHAMODE ) {
        window.mocha.run();
      } else {
        initWindowManager(config, function() {
          initEvents();
          _inited();
          initSession(config, function() {
            OSjs.API.triggerHook('onSessionLoaded');
          });
        });
      }
    }
    initLayout();
    if ( config.MOCHAMODE ) {
      queue.push(initTestEnvironment);
    }
    OSjs.Utils.asyncs(queue, function(entry, index, next) {
      if ( index < 1 ) {
        OSjs.API.triggerHook('onInitialize');
      }
      loading.update(index + 1, queue.length + 1);
      entry(config, next);
    }, _done);
  }
  OSjs.API.shutdown = function() {
    if ( !inited || !loaded ) {
      return;
    }
    signingOut = true;
    document.body.removeEventListener('contextmenu', events.body_contextmenu, false);
    document.body.removeEventListener('click', events.body_click, false);
    document.removeEventListener('keydown', events.keydown, true);
    document.removeEventListener('keypress', events.keypress, true);
    document.removeEventListener('keyup', events.keyup, true);
    window.removeEventListener('orientationchange', events.orientationchange, false);
    window.removeEventListener('hashchange', events.hashchange, false);
    window.removeEventListener('resize', events.resize, false);
    window.removeEventListener('scroll', events.scroll, false);
    window.removeEventListener('message', events.message, false);
    window.onerror = null;
    window.onbeforeunload = null;
    OSjs.API.toggleFullscreen();
    OSjs.API.blurMenu();
    OSjs.API.killAll();
    OSjs.GUI.DialogScheme.destroy();
    var ring = OSjs.API.getServiceNotificationIcon();
    if ( ring ) {
      ring.destroy();
    }
    var handler = OSjs.Core.getHandler();
    if ( handler ) {
      handler.destroy();
      handler = null;
    }
    OSjs.API.triggerHook('onShutdown');
    console.warn('OS.js was shut down!');
    if ( OSjs.API.getConfig('Connection.Type') === 'nw' ) {
      try {
        var gui = require('nw.gui');
        var win = gui.Window.get();
        setTimeout(function() {
          win.close();
        }, 500);
      } catch ( e ) {
      }
    } else {
      if ( OSjs.API.getConfig('ReloadOnShutdown') === true ) {
        window.location.reload();
      }
    }
    Object.keys(OSjs).forEach(function(k) {
      try {
        delete OSjs[k];
      } catch ( e ) {}
    });
  };
  OSjs.Core.getConfig = OSjs.Core.getConfig || function() {
    return {};
  };
  OSjs.Core.getMetadata = OSjs.Core.getMetadata || function() {
    return {};
  };
  OSjs.API.isShuttingDown = OSjs.API.isShuttingDown || function() {
    return signingOut;
  };
  (function() {
    function onLoad() {
      if ( loaded ) {
        return;
      }
      loaded = true;
      init();
    }
    function onUnload() {
      OSjs.API.shutdown();
    }
    document.addEventListener('DOMContentLoaded', onLoad);
    document.addEventListener('load', onLoad);
    document.addEventListener('unload', onUnload);
  })();
})();

(function() {
  'use strict';
  OSjs.Utils.getCompability = (function() {
    function _checkSupport(enabled, check, isSupported) {
      var supported = {};
      Object.keys(check).forEach(function(key) {
        var chk = check[key];
        var value = false;
        if ( chk instanceof Array ) {
          chk.forEach(function(c) {
            value = isSupported(c);
            return !value;
          });
        } else {
          value = isSupported(chk);
        }
        supported[key] = value;
      });
      return supported;
    }
    function getUpload() {
      try {
        var xhr = new XMLHttpRequest();
        return (!!(xhr && ('upload' in xhr) && ('onprogress' in xhr.upload)));
      } catch ( e ) {}
      return false;
    }
    function getCanvasSupported() {
      return document.createElement('canvas').getContext ? document.createElement('canvas') : null;
    }
    function getVideoSupported() {
      return document.createElement('video').canPlayType ? document.createElement('video') : null;
    }
    function canPlayCodec(support, check) {
      return _checkSupport(support, check, function(codec) {
        try {
          return !!support.canPlayType(codec);
        } catch ( e ) {
        }
        return false;
      });
    }
    function getVideoTypesSupported() {
      return canPlayCodec(getVideoSupported(), {
        webm     : 'video/webm; codecs="vp8.0, vorbis"',
        ogg      : 'video/ogg; codecs="theora"',
        h264     : [
          'video/mp4; codecs="avc1.42E01E"',
          'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
        ],
        mpeg     : 'video/mp4; codecs="mp4v.20.8"',
        mkv      : 'video/x-matroska; codecs="theora, vorbis"'
      });
    }
    function getAudioSupported() {
      return document.createElement('audio').canPlayType ? document.createElement('audio') : null;
    }
    function getAudioTypesSupported() {
      return canPlayCodec(getAudioSupported(), {
        ogg   : 'audio/ogg; codecs="vorbis',
        mp3   : 'audio/mpeg',
        wav   : 'audio/wav; codecs="1"'
      });
    }
    function getAudioContext() {
      if ( window.hasOwnProperty('AudioContext') || window.hasOwnProperty('webkitAudioContext') ) {
        return true;
      }
      return false;
    }
    var getCanvasContexts = (function() {
      var cache = [];
      return function() {
        if ( !cache.length ) {
          var canvas = getCanvasSupported();
          if ( canvas ) {
            var test = ['2d', 'webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl'];
            test.forEach(function(tst, i) {
              try {
                if ( !!canvas.getContext(tst) ) {
                  cache.push(tst);
                }
              } catch ( eee ) {}
            });
          }
        }
        return cache;
      };
    })();
    function getWebGL() {
      var result = false;
      var contexts = getCanvasContexts();
      try {
        result = (contexts.length > 1);
        if ( !result ) {
          if ( 'WebGLRenderingContext' in window ) {
            result = true;
          }
        }
      } catch ( e ) {}
      return result;
    }
    function detectCSSFeature(featurename) {
      var feature = false;
      var domPrefixes = 'Webkit Moz ms O'.split(' ');
      var elm = document.createElement('div');
      var featurenameCapital = null;
      featurename = featurename.toLowerCase();
      if ( elm.style[featurename] ) {
        feature = true;
      }
      if ( feature === false ) {
        featurenameCapital = featurename.charAt(0).toUpperCase() + featurename.substr(1);
        for ( var i = 0; i < domPrefixes.length; i++ ) {
          if ( elm.style[domPrefixes[i] + featurenameCapital ] !== undefined ) {
            feature = true;
            break;
          }
        }
      }
      return feature;
    }
    function getUserMedia() {
      var getMedia = false;
      if ( window.navigator ) {
        getMedia = ( navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia);
      }
      return !!getMedia;
    }
    function getRichText() {
      try {
        return !!document.createElement('textarea').contentEditable;
      } catch ( e ) {}
      return false;
    }
    function getTouch() {
      try {
        if ( navigator.userAgent.match(/Windows NT 6\.(2|3)/) ) {
          return false;
        }
      } catch ( e ) {}
      try {
        if ( navigator.userAgent.match(/iOS|Android|BlackBerry|IEMobile|iPad|iPhone|iPad/i) ) {
          return true;
        }
      } catch ( e ) {}
      return false;
    }
    function getDnD() {
      return !!('draggable' in document.createElement('span'));
    }
    function getSVG() {
      return (!!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect);
    }
    function getFileSystem() {
      return (('requestFileSystem' in window) || ('webkitRequestFileSystem' in window));
    }
    var checkWindow = {
      indexedDB      : 'indexedDB',
      localStorage   : 'localStorage',
      sessionStorage : 'sessionStorage',
      globalStorage  : 'globalStorage',
      openDatabase   : 'openDatabase',
      socket         : 'WebSocket',
      worker         : 'Worker',
      file           : 'File',
      blob           : 'Blob',
      orientation    : 'onorientationchange'
    };
    var compability = {
      touch          : getTouch(),
      upload         : getUpload(),
      getUserMedia   : getUserMedia(),
      fileSystem     : getFileSystem(),
      localStorage   : false,
      sessionStorage : false,
      globalStorage  : false,
      openDatabase   : false,
      socket         : false,
      worker         : false,
      file           : false,
      blob           : false,
      orientation    : false,
      dnd            : getDnD(),
      css            : {
        transition : detectCSSFeature('transition'),
        animation : detectCSSFeature('animation')
      },
      canvas         : !!getCanvasSupported(),
      canvasContext  : getCanvasContexts(),
      webgl          : getWebGL(),
      audioContext   : getAudioContext(),
      svg            : getSVG(),
      video          : !!getVideoSupported(),
      videoTypes     : getVideoTypesSupported(),
      audio          : !!getAudioSupported(),
      audioTypes     : getAudioTypesSupported(),
      richtext       : getRichText()
    };
    Object.keys(checkWindow).forEach(function(key) {
      compability[key] = (checkWindow[key] in window) && window[checkWindow[key]] !== null;
    });
    return function() {
      return compability;
    };
  })();
  OSjs.Utils.isIE = function() {
    var dm = parseInt(document.documentMode, 10);
    return dm <= 11 || !!navigator.userAgent.match(/(MSIE|Edge)/);
  };
  OSjs.Utils.getUserLocale = function() {
    var loc = ((window.navigator.userLanguage || window.navigator.language) || 'en-EN').replace('-', '_');
    var map = {
      'nb'    : 'no_NO',
      'es'    : 'es_ES',
      'ru'    : 'ru_RU',
      'en'    : 'en_EN'
    };
    var major = loc.split('_')[0] || 'en';
    var minor = loc.split('_')[1] || major.toUpperCase();
    if ( map[major] ) {
      return map[major];
    }
    return major + '_' + minor;
  };
  OSjs.Utils.getRect = function() {
    return {
      top    : 0,
      left   : 0,
      width  : document.body.offsetWidth,
      height : document.body.offsetHeight
    };
  };
})();

(function() {
  'use strict';
  OSjs.Utils.Keys = (function() {
    var list = {
      F1: 112,
      F2: 113,
      F3: 114,
      F4: 115,
      F6: 118,
      F7: 119,
      F8: 120,
      F9: 121,
      F10: 122,
      F11: 123,
      F12: 124,
      TILDE:      220,
      GRAVE:      192,
      CMD:        17,
      LSUPER:     91,
      RSUPER:     92,
      DELETE:     46,
      INSERT:     45,
      HOME:       36,
      END:        35,
      PGDOWN:     34,
      PGUP:       33,
      PAUSE:      19,
      BREAK:      19,
      CAPS_LOCK:  20,
      SCROLL_LOCK:186,
      BACKSPACE:  8,
      SPACE:      32,
      TAB:        9,
      ENTER:      13,
      ESC:        27,
      LEFT:       37,
      RIGHT:      39,
      UP:         38,
      DOWN:       40
    };
    for ( var n = 33; n <= 126; n++ ) {
      list[String.fromCharCode(n).toUpperCase()] = n;
    }
    return Object.freeze(list);
  })();
  OSjs.Utils.mousePosition = function(ev) {
    if ( ev.detail && typeof ev.detail.x !== 'undefined' && typeof ev.detail.y !== 'undefined' ) {
      return {x: ev.detail.x, y: ev.detail.y};
    }
    var touch = ev.touches || ev.changedTouches;
    if ( touch && touch[0] ) {
      return {x: touch[0].clientX, y: touch[0].clientY};
    }
    return {x: ev.clientX, y: ev.clientY};
  };
  OSjs.Utils.mouseButton = function(ev) {
    if ( typeof ev.button !== 'undefined' ) {
      if ( ev.button === 0 ) {
        return 'left';
      } else if ( ev.button === 1 ) {
        return 'middle';
      }
      return 'right';
    }
    if ( ev.which === 2 || ev.which === 4 ) {
      return 'middle';
    } else if ( ev.which === 1 ) {
      return 'left';
    }
    return 'right';
  };
  OSjs.Utils.keyCombination = (function() {
    var modifiers = {
      CTRL: function(ev) {
        return ev.ctrlKey;
      },
      SHIFT: function(ev) {
        return ev.shiftKey;
      },
      ALT: function(ev) {
        return ev.altKey;
      },
      META: function(ev) {
        return ev.metaKey;
      }
    };
    function getKeyName(keyCode) {
      var result = false;
      Object.keys(OSjs.Utils.Keys).forEach(function(k) {
        if ( !result && (keyCode === OSjs.Utils.Keys[k]) ) {
          result = k;
        }
      });
      return result;
    }
    return function(ev, checkFor) {
      var checks = checkFor.toUpperCase().split('+');
      var checkMods = {CTRL: false, SHIFT: false, ALT: false};
      var checkKeys = [];
      checks.forEach(function(f) {
        if ( modifiers[f] ) {
          checkMods[f] = true;
        } else {
          checkKeys.push(f);
        }
      });
      return Object.keys(checkMods).every(function(f) {
        var fk = !!modifiers[f](ev);
        return checkMods[f] === fk;
      }) && checkKeys.every(function(f) {
        return getKeyName(ev.keyCode) === f;
      });
    };
  })();
  OSjs.Utils.$bind = (function() {
    var TOUCH_CONTEXTMENU = 1000;
    var TOUCH_CLICK_MIN = 30;
    var TOUCH_CLICK_MAX = 1000;
    var TOUCH_DBLCLICK = 400;
    function addEventHandler(el, n, t, callback, handler, useCapture, realType) {
      var args = [t, handler, useCapture];
      el.addEventListener.apply(el, args);
      el._boundEvents[n].push({
        realType: realType,
        args: args,
        callback: callback
      });
    }
    function createWheelHandler(el, n, t, callback, useCapture) {
      function _wheel(ev) {
        var pos = OSjs.Utils.mousePosition(ev);
        var direction = (ev.detail < 0 || ev.wheelDelta > 0) ? 1 : -1;
        pos.z = direction;
        return callback(ev, pos);
      }
      addEventHandler(el, n, 'mousewheel', callback, _wheel, useCapture, 'mousewheel');
      addEventHandler(el, n, 'DOMMouseScroll', callback, _wheel, useCapture, 'DOMMouseScroll');
    }
    function createGestureHandler(el, n, t, callback, useCapture) {
      var started;
      var contextTimeout;
      var dblTimeout;
      var moved = false;
      var clicks = 0;
      function _done() {
        contextTimeout = clearTimeout(contextTimeout);
        started = null;
        moved = false;
        el.removeEventListener('touchend', _touchend, false);
        el.removeEventListener('touchmove', _touchmove, false);
        el.removeEventListener('touchcancel', _touchcancel, false);
      }
      function _touchstart(ev) {
        if ( ev.target === document.body ) {
          ev.preventDefault();
        }
        contextTimeout = clearTimeout(contextTimeout);
        started = new Date();
        moved = false;
        if ( t === 'contextmenu' ) {
          contextTimeout = setTimeout(function() {
            emitTouchEvent(ev, t, {button: 2, which: 3, buttons: 2});
            _done();
          }, TOUCH_CONTEXTMENU);
        } else if ( t === 'dblclick' ) {
          if ( clicks === 0 ) {
            dblTimeout = clearTimeout(dblTimeout);
            dblTimeout = setTimeout(function() {
              clicks = 0;
            }, TOUCH_DBLCLICK);
            clicks++;
          } else {
            if ( !moved ) {
              emitTouchEvent(ev, t);
            }
            clicks = 0;
          }
        }
        el.addEventListener('touchend', _touchend, false);
        el.addEventListener('touchmove', _touchmove, false);
        el.addEventListener('touchcancel', _touchcancel, false);
      }
      function _touchend(ev) {
        contextTimeout = clearTimeout(contextTimeout);
        if ( !started ) {
          return _done();
        }
        if ( !OSjs.Utils.$isFormElement(ev) ) {
          ev.preventDefault();
        }
        var now = new Date();
        var diff = now - started;
        if ( !moved && t === 'click' ) {
          if ( (diff > TOUCH_CLICK_MIN) && (diff < TOUCH_CLICK_MAX) ) {
            ev.stopPropagation();
            emitTouchEvent(ev, t);
          }
        }
        return _done();
      }
      function _touchmove(ev) {
        if ( ev.target === document.body || !moved ) {
          ev.preventDefault();
        }
        if ( !started ) {
          return;
        }
        contextTimeout = clearTimeout(contextTimeout);
        dblTimeout = clearTimeout(dblTimeout);
        clicks = 0;
        moved = true;
      }
      function _touchcancel(ev) {
        dblTimeout = clearTimeout(dblTimeout);
        clicks = 0;
        _done();
      }
      addEventHandler(el, n, 'touchstart', callback, _touchstart, false, 'touchstart');
    }
    function emitTouchEvent(ev, type, combineWith) {
      if ( ev.target === document.body ) {
        ev.preventDefault();
      }
      if ( !ev.currentTarget || ev.changedTouches.length > 1 || (ev.type === 'touchend' && ev.changedTouches > 0) ) {
        return;
      }
      var copy = ['ctrlKey', 'altKey', 'shiftKey', 'metaKey', 'screenX', 'screenY'];
      var touch = ev.changedTouches[0];
      var evtArgs = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        relatedTarget: ev.target
      };
      copy.forEach(function(k) {
        evtArgs[k] = ev[k];
      });
      if ( combineWith ) {
        Object.keys(combineWith).forEach(function(k) {
          evtArgs[k] = combineWith[k];
        });
      }
      ev.currentTarget.dispatchEvent(new MouseEvent(type, evtArgs));
    }
    var customEvents = {
      mousedown: 'touchstart',
      mouseup: 'touchend',
      mousemove: 'touchmove',
      mousewheel: createWheelHandler,
      contextmenu: createGestureHandler,
      click: createGestureHandler,
      dblclick: createGestureHandler
    };
    return function(el, evName, callback, useCapture, noBind) {
      useCapture = (useCapture === true);
      if ( arguments.length < 3 ) {
        throw new Error('$bind expects 3 or more arguments');
      }
      if ( typeof evName !== 'string' ) {
        throw new Error('Given event type was not a string');
      }
      if ( typeof callback !== 'function' ) {
        throw new Error('Given callback was not a function');
      }
      function addEvent(nsType, type) {
        addEventHandler(el, nsType, type, callback, function mouseEventHandler(ev) {
          if ( noBind ) {
            return callback(ev, OSjs.Utils.mousePosition(ev));
          }
          return callback.call(el, ev, OSjs.Utils.mousePosition(ev));
        }, useCapture);
        if ( customEvents[type] ) {
          if ( typeof customEvents[type] === 'function' ) {
            customEvents[type](el, nsType, type, callback, useCapture);
          } else {
            addEventHandler(el, nsType, customEvents[type], callback, function touchEventHandler(ev) {
              emitTouchEvent(ev, type);
            }, useCapture, customEvents[type]);
          }
        }
      }
      function initNamespace(ns) {
        if ( !el._boundEvents ) {
          el._boundEvents = {};
        }
        if ( !el._boundEvents[ns] ) {
          el._boundEvents[ns] = [];
        }
        var found = el._boundEvents[ns].filter(function(iter) {
          return iter.callback === callback;
        });
        return found.length === 0;
      }
      evName.replace(/\s/g, '').split(',').forEach(function(ns) {
        var type = ns.split(':')[0];
        if ( !initNamespace(ns) ) {
          console.warn('Utils::$bind()', 'This event was already bound, skipping');
          return;
        }
        addEvent(ns, type);
      });
    };
  })();
  OSjs.Utils.$unbind = function(el, evName, callback, param) {
    function unbindAll() {
      if ( el._boundEvents ) {
        Object.keys(el._boundEvents).forEach(function(type) {
          unbindNamed(type);
        });
        delete el._boundEvents;
      }
    }
    function unbindNamed(type) {
      if ( el._boundEvents ) {
        var list = el._boundEvents || {};
        if ( list[type] ) {
          for ( var i = 0; i < list[type].length; i++ ) {
            var iter = list[type][i];
            if ( callback && iter.callback !== callback ) {
              continue;
            }
            el.removeEventListener.apply(el, iter.args);
            list[type].splice(i, 1);
            i--;
          }
        }
      }
    }
    if ( el ) {
      if ( evName ) {
        evName.replace(/\s/g, '').split(',').forEach(function(type) {
          unbindNamed(type);
        });
      } else {
        unbindAll();
      }
    }
  };
})();

(function() {
  'use strict';
  OSjs.Utils.getCookie = function(k) {
    var map = {};
    document.cookie.split(/;\s+?/g).forEach(function(i) {
      var idx = i.indexOf('=');
      map[i.substr(i, idx)] = i.substr(idx + 1);
    });
    return k ? map[k] : map;
  };
  OSjs.Utils.format = function(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    var sprintfRegex = /\{(\d+)\}/g;
    function sprintf(match, number) {
      return number in args ? args[number] : match;
    }
    return format.replace(sprintfRegex, sprintf);
  };
  OSjs.Utils.cleanHTML = function(html) {
    return html.replace(/\n/g, '')
               .replace(/[\t ]+</g, '<')
               .replace(/\>[\t ]+</g, '><')
               .replace(/\>[\t ]+$/g, '>');
  };
  OSjs.Utils.parseurl = function(url, modify) {
    modify = modify || {};
    if ( !url.match(/^(\w+\:)\/\//) ) {
      url = '//' + url;
    }
    var protocol = url.split(/^(\w+\:)?\/\//);
    var splitted = (function() {
      var tmp = protocol[2].replace(/^\/\//, '').split('/');
      return {
        proto: (modify.protocol || protocol[1] || window.location.protocol || '').replace(/\:$/, ''),
        host: modify.host || tmp.shift(),
        path: modify.path || '/' + tmp.join('/')
      };
    })();
    function _parts() {
      var parts = [splitted.proto, '://'];
      if ( modify.username ) {
        var authstr = String(modify.username) + ':' + String(modify.password);
        parts.push(authstr);
        parts.push('@');
      }
      parts.push(splitted.host);
      parts.push(splitted.path);
      return parts.join('');
    }
    return {
      protocol: splitted.proto,
      host: splitted.host,
      path: splitted.path,
      url: _parts()
    };
  };
  OSjs.Utils.argumentDefaults = function(args, defaults, undef) {
    args = args || {};
    Object.keys(defaults).forEach(function(key) {
      if ( typeof defaults[key] === 'boolean' || typeof defaults[key] === 'number' ) {
        if ( typeof args[key] === 'undefined' || args[key] === null ) {
          args[key] = defaults[key];
        }
      } else {
        args[key] = args[key] || defaults[key];
      }
    });
    return args;
  };
  OSjs.Utils.mergeObject = function(obj1, obj2, opts) {
    opts = opts || {};
    for ( var p in obj2 ) {
      if ( obj2.hasOwnProperty(p) ) {
        try {
          if (opts.overwrite === false && obj1.hasOwnProperty(p)) {
            continue;
          }
          if ( obj2[p].constructor === Object ) {
            obj1[p] = OSjs.Utils.mergeObject(obj1[p], obj2[p]);
          } else {
            obj1[p] = obj2[p];
          }
        } catch (e) {
          obj1[p] = obj2[p];
        }
      }
    }
    return obj1;
  };
  OSjs.Utils.cloneObject = function(o) {
    return JSON.parse(JSON.stringify(o, function(key, value) {
      if ( value && typeof value === 'object' && value.tagName ) {
        return undefined;
      }
      return value;
    }));
  };
  OSjs.Utils.extend = function(obj, methods) {
    if ( obj && methods ) {
      Object.keys(methods).forEach(function(k) {
        obj[k] = methods[k];
      });
    }
  };
  OSjs.Utils.inherit = function(to, from, extend) {
    from.prototype = Object.create(to.prototype);
    from.constructor = to;
    if ( extend ) {
      OSjs.Utils.extend(from.prototype, extend);
    }
    return from;
  };
  OSjs.Utils.convertToRGB = function(hex) {
    var rgb = parseInt(hex.replace('#', ''), 16);
    var val = {};
    val.r = (rgb & (255 << 16)) >> 16;
    val.g = (rgb & (255 << 8)) >> 8;
    val.b = (rgb & 255);
    return val;
  };
  OSjs.Utils.convertToHEX = function(r, g, b) {
    if ( typeof r === 'object' ) {
      g = r.g;
      b = r.b;
      r = r.r;
    }
    if ( typeof r === 'undefined' || typeof g === 'undefined' || typeof b === 'undefined' ) {
      throw new Error('Invalid RGB supplied to convertToHEX()');
    }
    var hex = [
      parseInt(r, 10).toString( 16 ),
      parseInt(g, 10).toString( 16 ),
      parseInt(b, 10).toString( 16 )
    ];
    Object.keys(hex).forEach(function(i) {
      if ( hex[i].length === 1 ) {
        hex[i] = '0' + hex[i];
      }
    });
    return '#' + hex.join('').toUpperCase();
  };
  OSjs.Utils.invertHEX = function(hex) {
    var color = parseInt(hex.replace('#', ''), 16);
    color = 0xFFFFFF ^ color;
    color = color.toString(16);
    color = ('000000' + color).slice(-6);
    return '#' + color;
  };
  OSjs.Utils.asyncs = function(queue, onentry, ondone) {
    onentry = onentry || function(e, i, n) {
      return n();
    };
    ondone = ondone || function() {};
    var finished = [];
    var isdone = false;
    (function next(i) {
      if ( isdone || finished.indexOf(i) !== -1 ) {
        return;
      }
      finished.push(i);
      if ( i >= queue.length ) {
        isdone = true;
        return ondone();
      }
      try {
        onentry(queue[i], i, function() {
          next(i + 1);
        });
      } catch ( e ) {
        console.warn('Utils::asyncs()', 'Exception while stepping', e.stack, e);
        next(i + 1);
      }
    })(0);
  };
  OSjs.Utils.asyncp = function(queue, opts, onentry, ondone) {
    opts = opts || {};
    var running = 0;
    var max = opts.max || 3;
    var qleft = Object.keys(queue);
    var finished = [];
    var isdone = false;
    function spawn(i, cb) {
      function _done() {
        running--;
        cb();
      }
      if ( finished.indexOf(i) !== -1 ) {
        return;
      }
      finished.push(i);
      running++;
      try {
        onentry(queue[i], i, _done);
      } catch ( e ) {
        console.warn('Utils::asyncp()', 'Exception while stepping', e.stack, e);
        _done();
      }
    }
    (function check() {
      if ( !qleft.length ) {
        if ( running || isdone ) {
          return;
        }
        isdone = true;
        return ondone();
      }
      var d = Math.min(qleft.length, max - running);
      for ( var i = 0; i < d; i++ ) {
        spawn(qleft.shift(), check);
      }
    })();
  };
})();

(function() {
  'use strict';
  OSjs.Utils.$ = function(id) {
    return document.getElementById(id);
  };
  OSjs.Utils.$safeName = function(str) {
    return (str || '').replace(/[^a-zA-Z0-9]/g, '_');
  };
  OSjs.Utils.$remove = function(node) {
    if ( node && node.parentNode ) {
      node.parentNode.removeChild(node);
    }
    return null;
  };
  OSjs.Utils.$empty = function(myNode) {
    if ( myNode ) {
      while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
      }
    }
  };
  OSjs.Utils.$getStyle = function(oElm, strCssRule) {
    var strValue = '';
    if ( document.defaultView && document.defaultView.getComputedStyle ) {
      strValue = document.defaultView.getComputedStyle(oElm, '').getPropertyValue(strCssRule);
    } else if ( oElm.currentStyle ) {
      strCssRule = strCssRule.replace(/\-(\w)/g, function(strMatch, p1) {
        return p1.toUpperCase();
      });
      strValue = oElm.currentStyle[strCssRule];
    }
    return strValue;
  };
  OSjs.Utils.$position = function(el, parentEl) {
    if ( el ) {
      if ( parentEl ) {
        var result = {left:0, top:0, width: el.offsetWidth, height: el.offsetHeight};
        while ( true ) {
          result.left += el.offsetLeft;
          result.top  += el.offsetTop;
          if ( el.offsetParent ===  parentEl || el.offsetParent === null ) {
            break;
          }
          el = el.offsetParent;
        }
        return result;
      }
      return el.getBoundingClientRect();
    }
    return null;
  };
  OSjs.Utils.$parent = function(el, cb) {
    var result = null;
    if ( el && cb ) {
      var current = el;
      while ( current.parentNode ) {
        if ( cb(current) ) {
          result = current;
          break;
        }
        current = current.parentNode;
      }
    }
    return result;
  };
  OSjs.Utils.$index = function(el, parentEl) {
    if ( el ) {
      parentEl = parentEl || el.parentNode;
      if ( parentEl ) {
        var nodeList = Array.prototype.slice.call(parentEl.children);
        var nodeIndex = nodeList.indexOf(el, parentEl);
        return nodeIndex;
      }
    }
    return -1;
  };
  OSjs.Utils.$selectRange = function(field, start, end) {
    if ( !field ) {
      throw new Error('Cannot select range: missing element');
    }
    if ( typeof start === 'undefined' || typeof end === 'undefined' ) {
      throw new Error('Cannot select range: mising start/end');
    }
    if ( field.createTextRange ) {
      var selRange = field.createTextRange();
      selRange.collapse(true);
      selRange.moveStart('character', start);
      selRange.moveEnd('character', end);
      selRange.select();
      field.focus();
    } else if ( field.setSelectionRange ) {
      field.focus();
      field.setSelectionRange(start, end);
    } else if ( typeof field.selectionStart !== 'undefined' ) {
      field.selectionStart = start;
      field.selectionEnd = end;
      field.focus();
    }
  };
  OSjs.Utils.$addClass = function(el, name) {
    if ( el ) {
      name.split(' ').forEach(function(n) {
        el.classList.add(n);
      });
    }
  };
  OSjs.Utils.$removeClass = function(el, name) {
    if ( el ) {
      name.split(' ').forEach(function(n) {
        el.classList.remove(n);
      });
    }
  };
  OSjs.Utils.$hasClass = function(el, name) {
    if ( el && name ) {
      return name.split(' ').every(function(n) {
        return el.classList.contains(n);
      });
    }
    return false;
  };
  OSjs.Utils.$escape = function(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  };
  OSjs.Utils.$create = function(tagName, properties) {
    var element = document.createElement(tagName);
    function _foreach(dict, l) {
      dict = dict || {};
      Object.keys(dict).forEach(function(name) {
        l(name.replace(/_/g, '-'), String(dict[name]));
      });
    }
    _foreach(properties.style, function(key, val) {
      element.style[key] = val;
    });
    _foreach(properties.aria, function(key, val) {
      if ( (['role']).indexOf(key) !== -1 ) {
        key = 'aria-' + key;
      }
      element.setAttribute(key, val);
    });
    _foreach(properties.data, function(key, val) {
      element.setAttribute('data-' + key, val);
    });
    _foreach(properties, function(key, val) {
      if ( (['style', 'aria', 'data']).indexOf(key) === -1 ) {
        element[key] = val;
      }
    });
    return element;
  };
  OSjs.Utils.$createCSS = function(src, onload, onerror) {
    var link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.onload = onload || function() {};
    link.onerror = onerror || function() {};
    link.setAttribute('href', src);
    document.getElementsByTagName('head')[0].appendChild(link);
    return link;
  };
  OSjs.Utils.$createJS = function(src, onreadystatechange, onload, onerror, attrs) {
    var res = document.createElement('script');
    res.onreadystatechange = onreadystatechange || function() {};
    res.onerror = onerror || function() {};
    res.onload = onload || function() {};
    attrs = OSjs.Utils.mergeObject({
      type: 'text/javascript',
      charset: 'utf-8',
      src: src
    }, attrs || {});
    Object.keys(attrs).forEach(function(k) {
      res[k] = String(attrs[k]);
    });
    document.getElementsByTagName('head')[0].appendChild(res);
    return res;
  };
  OSjs.Utils.$isFormElement = function(input, types) {
    types = types || ['TEXTAREA', 'INPUT', 'SELECT'];
    if ( input instanceof window.Event ) {
      input = input.srcElement || input.target;
    }
    if ( input instanceof window.Element ) {
      if ( types.indexOf(input.tagName.toUpperCase()) >= 0 ) {
        if ( !(input.readOnly || input.disabled) ) {
          return true;
        }
      }
    }
    return false;
  };
  OSjs.Utils.$css = function(el, ink, inv) {
    function rep(k) {
      return k.replace(/\-(\w)/g, function(strMatch, p1) {
        return p1.toUpperCase();
      });
    }
    var obj = {};
    if ( arguments.length === 2 ) {
      if ( typeof ink === 'string' ) {
        return el.parentNode ? OSjs.Utils.$getStyle(el, ink) : el.style[rep(ink)];
      }
      obj = ink;
    } else if ( arguments.length === 3 ) {
      obj[ink] = inv;
    }
    Object.keys(obj).forEach(function(k) {
      el.style[rep(k)] = String(obj[k]);
    });
  };
})();

(function() {
  'use strict';
  OSjs.Utils.ajax = function(args) {
    var request;
    args = OSjs.Utils.argumentDefaults(args, {
      onerror          : function() {},
      onsuccess        : function() {},
      onprogress       : function() {},
      oncreated        : function() {},
      onfailed         : function() {},
      oncanceled       : function() {},
      ontimeout        : function() {},
      acceptcodes      : [200, 201, 304],
      method           : 'GET',
      responseType     : null,
      requestHeaders   : {},
      body             : null,
      timeout          : 0,
      json             : false,
      url              : '',
      jsonp            : false
    });
    function onReadyStateChange() {
      var result;
      function _onError(error) {
        error = OSjs.API._('ERR_UTILS_XHR_FMT', error);
        console.warn('Utils::ajax()', 'onReadyStateChange()', error);
        args.onerror(error, result, this, args.url);
      }
      if ( this.readyState === 4 ) {
        result = this.responseText;
        try {
          var ctype = this.getResponseHeader('content-type') || '';
          if ( args.json && ctype.match(/^application\/json/) ) {
            result = JSON.parse(this.responseText);
          }
        } catch (ex) {
          _onError.call(this, ex.toString());
          return;
        }
        if ( this.status === 200 || this.status === 201 ) {
          args.onsuccess(result, this, args.url);
        } else {
          _onError.call(this, String(this.status));
        }
      }
    }
    function requestJSONP() {
      var loaded  = false;
      OSjs.Utils.$createJS(args.url, function() {
        if ( (this.readyState === 'complete' || this.readyState === 'loaded') && !loaded) {
          loaded = true;
          args.onsuccess();
        }
      }, function() {
        if ( loaded ) {
          return;
        }
        loaded = true;
        args.onsuccess();
      }, function() {
        if ( loaded ) {
          return;
        }
        loaded = true;
        args.onerror();
      });
    }
    function cleanup() {
      if ( request.upload ) {
        request.upload.removeEventListener('progress', args.onprogress, false);
      } else {
        request.removeEventListener('progress', args.onprogress, false);
      }
      request.removeEventListener('error', args.onfailed, false);
      request.removeEventListener('abort', args.oncanceled, false);
      request.onerror = null;
      request.onload = null;
      request.onreadystatechange = null;
      request.ontimeut = null;
      request = null;
      args = null;
    }
    function requestJSON() {
      request = new XMLHttpRequest();
      try {
        request.timeout = args.timeout;
      } catch ( e ) {}
      if ( request.upload ) {
        request.upload.addEventListener('progress', args.onprogress, false);
      } else {
        request.addEventListener('progress', args.onprogress, false);
      }
      request.ontimeout = function(evt) {
        args.ontimeout(evt);
      };
      if ( args.responseType === 'arraybuffer' ) { // Binary
        request.onerror = function(evt) {
          var error = request.response || OSjs.API._('ERR_UTILS_XHR_FATAL');
          args.onerror(error, evt, request, args.url);
          cleanup();
        };
        request.onload = function(evt) {
          if ( args.acceptcodes.indexOf(request.status) >= 0 ) {
            args.onsuccess(request.response, request, args.url);
          } else {
            OSjs.VFS.Helpers.abToText(request.response, 'text/plain', function(err, txt) {
              var error = txt || err || OSjs.API._('ERR_UTILS_XHR_FATAL');
              args.onerror(error, evt, request, args.url);
              cleanup();
            });
            return;
          }
          cleanup();
        };
      } else {
        request.addEventListener('error', args.onfailed, false);
        request.addEventListener('abort', args.oncanceled, false);
        request.onreadystatechange = onReadyStateChange;
      }
      request.open(args.method, args.url, true);
      Object.keys(args.requestHeaders).forEach(function(h) {
        request.setRequestHeader(h, args.requestHeaders[h]);
      });
      request.responseType = args.responseType || '';
      args.oncreated(request);
      request.send(args.body);
    }
    if ( (OSjs.API.getConfig('Connection.Type') === 'standalone') ) {
      args.onerror('You are currently running locally and cannot perform this operation!', null, request, args.url);
      return;
    }
    if ( args.json && (typeof args.body !== 'string') && !(args.body instanceof FormData) ) {
      args.body = JSON.stringify(args.body);
      if ( typeof args.requestHeaders['Content-Type'] === 'undefined' ) {
        args.requestHeaders['Content-Type'] = 'application/json';
      }
    }
    return args.jsonp ? requestJSONP() : requestJSON();
  };
  OSjs.Utils.preload = (function() {
    var _LOADED = {};
    var _CACHE = {};
    function checkCache(item, args) {
      if ( item && _LOADED[item.src] === true ) {
        if ( item.force !== true && args.force !== true ) {
          return true;
        }
      }
      return false;
    }
    var preloadTypes = {
      stylesheet: function createStylesheet(item, cb) {
        var src = item.src;
        var loaded = false;
        var timeout;
        function _done(res) {
          timeout = clearTimeout(timeout);
          if ( !loaded ) {
            _LOADED[src] = true;
            loaded = true;
            cb(res, src);
          }
        }
        function _check(path) {
          var result = false;
          (document.styleSheet || []).forEach(function(iter, i) {
            if ( iter.href.indexOf(path) !== -1 ) {
              result = true;
              return false;
            }
            return true;
          });
          return result;
        }
        OSjs.Utils.$createCSS(src, function() {
          _done(true);
        }, function() {
          _done(false);
        });
        if ( typeof document.styleSheet === 'undefined' || (!loaded && _check(src)) ) {
          return _done(true);
        }
        timeout = setTimeout(function() {
          _done(false);
        }, 30000);
      },
      javascript: function createScript(item, cb) {
        var src = item.src;
        var loaded = false;
        function _done(res) {
          if ( !loaded ) {
            _LOADED[src] = true;
            loaded = true;
            cb(res, src);
          }
        }
        OSjs.Utils.$createJS(src, function() {
          if ( (this.readyState === 'complete' || this.readyState === 'loaded') ) {
            _done(true);
          }
        }, function() {
          _done(true);
        }, function() {
          _done(false);
        }, {async: false});
      },
      scheme: function createHTML(item, cb, args) {
        var scheme;
        function _cache(err, html) {
          if ( !err && html ) {
            _CACHE[item.src] = html;
          }
        }
        function _cb() {
          scheme = null;
          cb.apply(null, arguments);
        }
        if ( _CACHE[item.src] && item.force !== true && args.force !== true  ) {
          scheme = new OSjs.GUI.Scheme();
          scheme.loadString(_CACHE[item.src]);
          _cb(true, item.src, scheme);
        } else {
          if ( OSjs.API.isStandalone() ) {
            scheme = new OSjs.GUI.Scheme();
            preloadTypes.javascript({
              src: OSjs.Utils.pathJoin(OSjs.Utils.dirname(item.src), '_scheme.js'),
              type: 'javascript'
            }, function() {
              var look = item.src.replace(OSjs.API.getBrowserPath(), '/').replace(/^\/?packages/, '');
              var html = OSjs.STANDALONE.SCHEMES[look];
              scheme.loadString(html);
              _cache(false, html);
              _cb(true, item.src, scheme);
            });
          } else {
            scheme = new OSjs.GUI.Scheme(item.src);
            scheme.load(function(err, res) {
              _cb(err ? false : true, item.src, scheme);
            }, function(err, html) {
              _cache(err, html);
            });
          }
        }
      }
    };
    function getType(src) {
      if ( src.match(/\.js$/i) ) {
        return 'javascript';
      } else if ( src.match(/\.css$/i) ) {
        return 'stylesheet';
      }
      return 'unknown';
    }
    function getTypeCorrected(t) {
      var typemap = {
        script: 'javascript',
        js: 'javascript',
        style: 'stylesheet',
        css: 'stylesheet'
      };
      return typemap[t] || t;
    }
    function preloadList(list, ondone, onprogress, args) {
      args = args || {};
      ondone = ondone || function() {};
      onprogress = onprogress || function() {};
      var succeeded  = [];
      var failed = [];
      var len = list.length;
      var total = 0;
      list = (list || []).map(function(item) {
        if ( typeof item === 'string' ) {
          item = {src: item};
        }
        item._src = item.src;
        item.type = item.type ? getTypeCorrected(item.type) : getType(item.src);
        return item;
      });
      var data = [];
      OSjs.Utils.asyncp(list, {max: args.max || 1}, function(item, index, next) {
        function _onentryloaded(state, src, setData) {
          total++;
          (state ? succeeded : failed).push(src);
          onprogress(index, len, src, succeeded, failed, total);
          if ( setData ) {
            data.push({
              item: item,
              data: setData
            });
          }
          next();
        }
        if ( item ) {
          if ( checkCache(item, args) ) {
            return _onentryloaded(true, item.src);
          } else {
            if ( preloadTypes[item.type] ) {
              return preloadTypes[item.type](item, _onentryloaded, args);
            }
          }
          failed.push(item.src);
        }
        return next();
      }, function() {
        ondone(len, failed, succeeded, data);
      });
    }
    return preloadList;
  })();
})();

(function() {
  'use strict';
  OSjs.Utils.getPathProtocol = function getPathProtocol(orig) {
    var tmp = document.createElement('a');
    tmp.href = orig;
    return tmp.protocol.replace(/:$/, '');
  };
  OSjs.Utils.checkdir = function(path) {
    if ( path && window.location.href.match(/^file\:\/\//) ) {
      path = path.replace(/^\//, '');
    }
    return path;
  };
  OSjs.Utils.filext = function(d) {
    var ext = OSjs.Utils.filename(d).split('.').pop();
    return ext ? ext.toLowerCase() : null;
  };
  OSjs.Utils.dirname = function(f) {
    function _parentDir(p) {
      var pstr = p.split(/^(.*)\:\/\/(.*)/).filter(function(n) {
        return n !== '';
      });
      var args   = pstr.pop();
      var prot   = pstr.pop();
      var result = '';
      var tmp = args.split('/').filter(function(n) {
        return n !== '';
      });
      if ( tmp.length ) {
        tmp.pop();
      }
      result = tmp.join('/');
      if ( !result.match(/^\//) ) {
        result = '/' + result;
      }
      if ( prot ) {
        result = prot + '://' + result;
      }
      return result;
    }
    return f.match(/^((.*)\:\/\/)?\/$/) ? f : _parentDir(f.replace(/\/$/, ''));
  };
  OSjs.Utils.filename = function(p) {
    return (p || '').replace(/\/$/, '').split('/').pop();
  };
  OSjs.Utils.humanFileSize = function(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if (bytes < thresh) {
      return bytes + ' B';
    }
    var units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
      bytes /= thresh;
      ++u;
    } while (bytes >= thresh);
    return bytes.toFixed(1) + ' ' + units[u];
  };
  OSjs.Utils.escapeFilename = function(n) {
    return (n || '').replace(/[\|&;\$%@"<>\(\)\+,\*\/]/g, '').trim();
  };
  OSjs.Utils.replaceFileExtension = function(filename, rep) {
    var spl = filename.split('.');
    spl.pop();
    spl.push(rep);
    return spl.join('.');
  };
  OSjs.Utils.replaceFilename = function(orig, newname) {
    var spl = orig.split('/');
    spl.pop();
    spl.push(newname);
    return spl.join('/');
  };
  OSjs.Utils.pathJoin = function() {
    var parts = [];
    var prefix = '';
    var i, s;
    for ( i = 0; i < arguments.length; i++ ) {
      s = String(arguments[i]);
      if ( s.match(/^([A-z0-9\-_]+)\:\//) ) {
        prefix = s.replace(/\/+$/, '//');
        continue;
      }
      s = s.replace(/^\/+/, '').replace(/\/+$/, '');
      parts.push(s);
    }
    return prefix + '/' + parts.join('/');
  };
  OSjs.Utils.getFilenameRange = function(val) {
    val = val || '';
    var range = {min: 0, max: val.length};
    if ( val.match(/^\./) ) {
      if ( val.length >= 2 ) {
        range.min = 1;
      }
    } else {
      if ( val.match(/\.(\w+)$/) ) {
        var m = val.split(/\.(\w+)$/);
        for ( var i = m.length - 1; i >= 0; i-- ) {
          if ( m[i].length ) {
            range.max = val.length - m[i].length - 1;
            break;
          }
        }
      }
    }
    return range;
  };
  OSjs.Utils.btoaUrlsafe = function(str) {
    return (!str || !str.length) ? '' : btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };
  OSjs.Utils.atobUrlsafe = function(str) {
    if ( str && str.length ) {
      str = (str + '===').slice(0, str.length + (str.length % 4));
      return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    }
    return '';
  };
  OSjs.Utils.btoaUtf = function(str) { // Encode
    var _unescape = window.unescape || function(s) {
      function d(x, n) {
        return String.fromCharCode(parseInt(n, 16));
      }
      return s.replace(/%([0-9A-F]{2})/i, d);
    };
    str = _unescape(encodeURIComponent(str));
    return btoa(str);
  };
  OSjs.Utils.atobUtf = function(str) { // Decode
    var _escape = window.escape || function(s) {
      function q(c) {
        c = c.charCodeAt();
        return '%' + (c < 16 ? '0' : '') + c.toString(16).toUpperCase();
      }
      return s.replace(/[\x00-),:-?[-^`{-\xFF]/g, q);
    };
    var trans = _escape(atob(str));
    return decodeURIComponent(trans);
  };
  OSjs.Utils.checkAcceptMime = function(mime, list) {
    if ( mime && list.length ) {
      var re;
      for ( var i = 0; i < list.length; i++ ) {
        re = new RegExp(list[i]);
        if ( re.test(mime) === true ) {
          return true;
        }
      }
    }
    return false;
  };
})();

(function(Utils, API) {
  'use strict';
  var DefaultLocale = 'en_EN';
  var CurrentLocale = 'en_EN';
  var _CLIPBOARD;         // Current 'clipboard' data
  var _hooks = {
    'onInitialize':          [],
    'onInited':              [],
    'onWMInited':            [],
    'onSessionLoaded':       [],
    'onShutdown':            [],
    'onApplicationPreload':  [],
    'onApplicationLaunch':   [],
    'onApplicationLaunched': [],
    'onBlurMenu':            []
  };
  function ServiceNotificationIcon() {
    this.entries = {};
    this.size = 0;
    this.notif = null;
    this.init();
  }
  ServiceNotificationIcon.prototype.init = function() {
    var wm = OSjs.Core.getWindowManager();
    var self = this;
    function show(ev) {
      self.displayMenu(ev);
      return false;
    }
    if ( wm ) {
      this.notif = wm.createNotificationIcon('ServiceNotificationIcon', {
        image: API.getIcon('status/gtk-dialog-authentication.png'),
        onContextMenu: show,
        onClick: show,
        onInited: function(el, img) {
          self._updateIcon();
        }
      });
      this._updateIcon();
    }
  };
  ServiceNotificationIcon.prototype.destroy = function() {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.removeNotificationIcon('ServiceNotificationIcon');
    }
    this.size = 0;
    this.entries = {};
    this.notif = null;
  };
  ServiceNotificationIcon.prototype._updateIcon = function() {
    if ( this.notif ) {
      if ( this.notif.$container ) {
        this.notif.$container.style.display = this.size ? 'inline-block' : 'none';
      }
      this.notif.setTitle(API._('SERVICENOTIFICATION_TOOLTIP', this.size.toString()));
    }
  };
  ServiceNotificationIcon.prototype.displayMenu = function(ev) {
    var menu = [];
    var entries = this.entries;
    Object.keys(entries).forEach(function(name) {
      menu.push({
        title: name,
        menu: entries[name]
      });
    });
    API.createMenu(menu, ev);
  };
  ServiceNotificationIcon.prototype.add = function(name, menu) {
    if ( !this.entries[name] ) {
      this.entries[name] = menu;
      this.size++;
      this._updateIcon();
    }
  };
  ServiceNotificationIcon.prototype.remove = function(name) {
    if ( this.entries[name] ) {
      delete this.entries[name];
      this.size--;
      this._updateIcon();
    }
  };
  API._ = function _apiTranslate() {
    var s = arguments[0];
    var a = arguments;
    if ( OSjs.Locales[CurrentLocale][s] ) {
      a[0] = OSjs.Locales[CurrentLocale][s];
    } else {
      a[0] = OSjs.Locales[DefaultLocale][s] || s;
    }
    return a.length > 1 ? Utils.format.apply(null, a) : a[0];
  };
  API.__ = function _apiTranslateList() {
    var l = arguments[0];
    var s = arguments[1];
    var a = Array.prototype.slice.call(arguments, 1);
    if ( l[CurrentLocale] && l[CurrentLocale][s] ) {
      a[0] = l[CurrentLocale][s];
    } else {
      a[0] = l[DefaultLocale] ? (l[DefaultLocale][s] || s) : s;
      if ( a[0] && a[0] === s ) {
        a[0] = API._.apply(null, a);
      }
    }
    return a.length > 1 ? Utils.format.apply(null, a) : a[0];
  };
  API.getLocale = function _apiGetLocale() {
    return CurrentLocale;
  };
  API.setLocale = function _apiSetLocale(l) {
    var RTL = API.getConfig('LocaleOptions.RTL', []);
    if ( OSjs.Locales[l] ) {
      CurrentLocale = l;
    } else {
      console.warn('API::setLocale()', 'Invalid locale', l, '(Using default)');
      CurrentLocale = DefaultLocale;
    }
    var major = CurrentLocale.split('_')[0];
    var html = document.querySelector('html');
    if ( html ) {
      html.setAttribute('lang', l);
      html.setAttribute('dir', RTL.indexOf(major) !== -1 ? 'rtl' : 'ltr');
    }
  };
  API.curl = function _apiCurl(args, callback) {
    args = args || {};
    callback = callback || {};
    var opts = args.body;
    if ( typeof opts === 'object' ) {
      console.warn('DEPRECATION WARNING', 'The \'body\' wrapper is no longer needed');
    } else {
      opts = args;
    }
    API.call('curl', opts, callback, args.options);
  };
  var _CALL_INDEX = 1;
  API.call = function _apiCall(m, a, cb, options) {
    a = a || {};
    var lname = 'APICall_' + _CALL_INDEX;
    if ( typeof a.__loading === 'undefined' || a.__loading === true ) {
      API.createLoading(lname, {className: 'BusyNotification', tooltip: 'API Call'});
    }
    if ( typeof cb !== 'function' ) {
      throw new TypeError('call() expects a function as callback');
    }
    if ( options && typeof options !== 'object' ) {
      throw new TypeError('call() expects an object as options');
    }
    _CALL_INDEX++;
    var handler = OSjs.Core.getHandler();
    return handler.callAPI(m, a, function(response) {
      API.destroyLoading(lname);
      response = response || {};
      cb(response.error || false, response.result);
    }, function(err) {
      cb(err);
    }, options);
  };
  API.open = function _apiOpen(file, launchArgs) {
    launchArgs = launchArgs || {};
    if ( !file.path ) {
      throw new Error('Cannot API::open() without a path');
    }
    var settingsManager = OSjs.Core.getSettingsManager();
    var wm = OSjs.Core.getWindowManager();
    var args = {file: file};
    function getApplicationNameByFile(file, forceList, callback) {
      if ( !(file instanceof OSjs.VFS.File) ) {
        throw new Error('This function excepts a OSjs.VFS.File object');
      }
      var pacman = OSjs.Core.getPackageManager();
      var val = settingsManager.get('DefaultApplication', file.mime);
      if ( !forceList && val ) {
        if ( pacman.getPackage(val) ) {
          callback([val]);
          return;
        }
      }
      callback(pacman.getPackagesByMime(file.mime));
    }
    function setDefaultApplication(mime, app, callback) {
      callback = callback || function() {};
      settingsManager.set('DefaultApplication', mime, app);
      settingsManager.save('DefaultApplication', callback);
    }
    function _launch(name) {
      if ( name ) {
        API.launch(name, args, launchArgs.onFinished, launchArgs.onError, launchArgs.onConstructed);
      }
    }
    function _launchApp(name, ar) {
      API.launch(name, ar);
    }
    function _onDone(app) {
      if ( app.length ) {
        if ( app.length === 1 ) {
          _launch(app[0]);
        } else {
          if ( wm ) {
            API.createDialog('ApplicationChooser', {
              file: file,
              list: app
            }, function(ev, btn, result) {
              if ( btn !== 'ok' ) {
                return;
              }
              _launch(result.name);
              setDefaultApplication(file.mime, result.useDefault ? result.name : null);
            });
          } else {
            API.error(API._('ERR_FILE_OPEN'),
                           API._('ERR_FILE_OPEN_FMT', file.path),
                           API._('ERR_NO_WM_RUNNING') );
          }
        }
      } else {
        API.error(API._('ERR_FILE_OPEN'),
                       API._('ERR_FILE_OPEN_FMT', file.path),
                       API._('ERR_APP_MIME_NOT_FOUND_FMT', file.mime) );
      }
    }
    if ( file.mime === 'osjs/application' ) {
      _launchApp(Utils.filename(file.path), launchArgs);
    } else if ( file.type === 'dir' ) {
      var fm = settingsManager.instance('DefaultApplication').get('dir', 'ApplicationFileManager');
      _launchApp(fm, {path: file.path});
    } else {
      if ( launchArgs.args ) {
        Object.keys(launchArgs.args).forEach(function(i) {
          args[i] = launchArgs.args[i];
        });
      }
      getApplicationNameByFile(file, launchArgs.forceList, _onDone);
    }
  };
  API.relaunch = function _apiRelaunch(n) {
    function relaunch(p) {
      var data = null;
      var args = {};
      if ( p instanceof OSjs.Core.Application ) {
        data = p._getSessionData();
      }
      try {
        p.destroy(); // kill
      } catch ( e ) {
        console.warn('OSjs.API.relaunch()', e.stack, e);
      }
      if ( data !== null ) {
        args = data.args;
        args.__resume__ = true;
        args.__windows__ = data.windows || [];
      }
      args.__preload__ = {force: true};
      setTimeout(function() {
        API.launch(n, args);
      }, 500);
    }
    API.getProcess(n).forEach(relaunch);
  };
  API.launch = function _apiLaunch(name, args, ondone, onerror, onconstruct) {
    args = args || {};
    var err;
    var splash = null;
    var instance = null;
    var pargs = {};
    var packman = OSjs.Core.getPackageManager();
    var compability = Utils.getCompability();
    var metadata = packman.getPackage(name);
    var running = API.getProcess(name, true);
    var preloads = (function() {
      var list = (metadata.preload || []).slice(0);
      var additions = [];
      function _add(chk) {
        if ( chk && chk.preload ) {
          chk.preload.forEach(function(p) {
            additions.push(p);
          });
        }
      }
      if ( metadata.depends instanceof Array ) {
        metadata.depends.forEach(function(k) {
          if ( !OSjs.Applications[k] ) {
            _add(packman.getPackage(k));
          }
        });
      }
      var pkgs = packman.getPackages(false);
      Object.keys(pkgs).forEach(function(pn) {
        var p = pkgs[pn];
        if ( p.type === 'extension' && p.uses === name ) {
          _add(p);
        }
      });
      list = additions.concat(list);
      additions = [];
      if ( metadata.scope === 'user' ) {
        list = list.map(function(p) {
          if ( p.src.substr(0, 1) !== '/' && !p.src.match(/^(https?|ftp)/) ) {
            OSjs.VFS.url(p.src, function(error, url) {
              if ( !error ) {
                p.src = url;
              }
            });
          }
          return p;
        });
      }
      return list;
    })();
    function _createSplash() {
      API.createLoading(name, {className: 'StartupNotification', tooltip: API._('LBL_STARTING') + ' ' + name});
      if ( !OSjs.Applications[name] ) {
        if ( metadata.splash !== false ) {
          splash = API.createSplash(metadata.name, metadata.icon);
        }
      }
    }
    function _destroySplash() {
      API.destroyLoading(name);
      if ( splash ) {
        splash.destroy();
        splash = null;
      }
    }
    function _onError(err, exception) {
      _destroySplash();
      API.error(API._('ERR_APP_LAUNCH_FAILED'),
                  API._('ERR_APP_LAUNCH_FAILED_FMT', name),
                  err, exception, true);
      (onerror || function() {})(err, name, args, exception);
    }
    function _onFinished(skip) {
      _destroySplash();
      (ondone || function() {})(instance, metadata);
    }
    function _preLaunch(cb) {
      var isCompatible = (function() {
        var list = (metadata.compability || []).filter(function(c) {
          if ( typeof compability[c] !== 'undefined' ) {
            return !compability[c];
          }
          return false;
        });
        if ( list.length ) {
          return API._('ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT', name, list.join(', '));
        }
        return true;
      })();
      if ( isCompatible !== true ) {
        throw new Error(isCompatible);
      }
      if ( metadata.singular === true && running ) {
        if ( running instanceof OSjs.Core.Application ) {
          console.warn('API::launch()', 'detected that this application is a singular and already running...');
          running._onMessage('attention', args);
          _onFinished(true);
          return; // muy importante!
        } else {
          throw new Error(API._('ERR_APP_LAUNCH_ALREADY_RUNNING_FMT', name));
        }
      }
      Utils.asyncs(_hooks.onApplicationPreload, function(qi, i, n) {
        qi(name, args, preloads, function(p) {
          if ( p && (p instanceof Array) ) {
            preloads = p;
          }
          n();
        });
      }, function() {
        _createSplash();
        cb();
      });
      API.triggerHook('onApplicationLaunch', [name, args]);
    }
    function _preload(cb) {
      Utils.preload(preloads, function(total, failed, succeeded, data) {
        if ( failed.length ) {
          cb(API._('ERR_APP_PRELOAD_FAILED_FMT', name, failed.join(',')));
        } else {
          setTimeout(function() {
            cb(false, data);
          }, 0);
        }
      }, function(index, count, src, succeeded, failed, progress) {
        if ( splash ) {
          splash.update(progress, count);
        }
      }, pargs);
    }
    function _createProcess(preloadData, cb) {
      function __onprocessinitfailed() {
        if ( instance ) {
          try {
            instance.destroy();
            instance = null;
          } catch ( ee ) {
            console.warn('Something awful happened when trying to clean up failed launch Oo', ee);
            console.warn(ee.stack);
          }
        }
      }
      if ( typeof OSjs.Applications[name] === 'undefined' ) {
        throw new Error(API._('ERR_APP_RESOURCES_MISSING_FMT', name));
      }
      if ( typeof OSjs.Applications[name] === 'function' ) {
        OSjs.Applications[name]();
        cb(false, true);
        return;
      }
      function __onschemesloaded(scheme) {
        try {
          if ( metadata.classType === 'simple' ) {
            instance = new OSjs.Core.Application(name, args, metadata);
            OSjs.Applications[name].run(instance);
          } else {
            instance = new OSjs.Applications[name].Class(args, metadata);
          }
          (onconstruct || function() {})(instance, metadata);
        } catch ( e ) {
          console.warn('Error on constructing application', e, e.stack);
          __onprocessinitfailed();
          cb(API._('ERR_APP_CONSTRUCT_FAILED_FMT', name, e), e);
          return false;
        }
        try {
          var settings = OSjs.Core.getSettingsManager().get(instance.__pname) || {};
          instance.init(settings, metadata, scheme);
          API.triggerHook('onApplicationLaunched', [{
            application: instance,
            name: name,
            args: args,
            settings: settings,
            metadata: metadata
          }]);
        } catch ( ex ) {
          console.warn('Error on init() application', ex, ex.stack);
          __onprocessinitfailed();
          cb(API._('ERR_APP_INIT_FAILED_FMT', name, ex.toString()), ex);
          return false;
        }
        return true;
      }
      var scheme = null;
      if ( preloadData ) {
        preloadData.forEach(function(f) {
          if ( !scheme && f.item.type === 'scheme' ) {
            scheme = f.data;
          }
        });
      }
      if ( __onschemesloaded(scheme) ) {
        cb(false, true);
      }
    }
    if ( !name ) {
      err = 'Cannot API::launch() witout a application name';
      _onError(err);
      throw new Error(err);
    }
    if ( !metadata ) {
      err = API._('ERR_APP_LAUNCH_MANIFEST_FAILED_FMT', name);
      _onError(err);
      throw new Error(err);
    }
    console.group('API::launch()', {
      name: name,
      args: args,
      metadata: metadata,
      preloads: preloads
    });
    if ( args.__preload__ ) { // This is for relaunch()
      pargs = args.__preload__;
      delete args.__preload__;
    }
    pargs.max = (function(p) {
      if ( p === true ) {
        p = API.getConfig('Connection.PreloadParallel');
      }
      return p;
    })(metadata.preloadParallel);
    try {
      _preLaunch(function() {
        _preload(function(err, res) {
          if ( err ) {
            _onError(err, res);
          } else {
            try {
              _createProcess(res, function(err, res) {
                if ( err ) {
                  _onError(err, res);
                } else {
                  try {
                    _onFinished(res);
                  } catch ( e ) {
                    _onError(e.toString(), e);
                  }
                }
              });
            } catch ( e ) {
              _onError(e.toString(), e);
            }
          }
        });
      });
    } catch ( e ) {
      _onError(e.toString());
    }
  };
  API.launchList = function _apiLaunchList(list, onSuccess, onError, onFinished) {
    list        = list        || []; 
    onSuccess   = onSuccess   || function() {};
    onError     = onError     || function() {};
    onFinished  = onFinished  || function() {};
    Utils.asyncs(list, function(s, current, next) {
      if ( typeof s === 'string' ) {
        var args = {};
        var spl = s.split('@');
        var name = spl[0];
        if ( typeof spl[1] !== 'undefined' ) {
          try {
            args = JSON.parse(spl[1]);
          } catch ( e ) {}
        }
        s = {
          name: name,
          args: args
        };
      }
      var aname = s.name;
      var aargs = (typeof s.args === 'undefined') ? {} : (s.args || {});
      if ( !aname ) {
        console.warn('API::launchList() next()', 'No application name defined');
        next();
        return;
      }
      API.launch(aname, aargs, function(app, metadata) {
        onSuccess(app, metadata, aname, aargs);
        next();
      }, function(err, name, args) {
        console.warn('API::launchList() _onError()', err);
        onError(err, name, args);
        next();
      });
    }, onFinished);
  };
  API.getApplicationResource = function _apiGetAppResource(app, name, vfspath) {
    if ( name.match(/^\//) ) {
      return name;
    }
    name = name.replace(/^\.\//, '');
    function getName() {
      var appname = null;
      if ( app instanceof OSjs.Core.Process ) {
        appname = app.__pname;
      } else if ( typeof app === 'string' ) {
        appname = app;
      }
      return appname;
    }
    function getResultPath(path, userpkg) {
      path = Utils.checkdir(path);
      if ( vfspath ) {
        if ( userpkg ) {
          path = path.substr(API.getConfig('Connection.FSURI').length);
        } else {
          path = 'osjs:///' + path;
        }
      }
      return path;
    }
    return (function() {
      var pacman = OSjs.Core.getPackageManager();
      var appname = getName();
      var pkg = pacman.getPackage(appname);
      var path = '';
      if ( pkg ) {
        if ( pkg.scope === 'user' ) {
          path = API.getConfig('Connection.FSURI') + '/get/' + Utils.pathJoin(pkg.path, name);
        } else {
          path = API.getConfig('Connection.PackageURI') + '/' + pkg.path + '/' + name;
        }
      }
      return getResultPath(path, pkg.scope === 'user');
    })();
  };
  API.getThemeCSS = function _apiGetThemeCSS(name) {
    var root = API.getConfig('Connection.RootURI', '/');
    if ( name === null ) {
      return root + 'blank.css';
    }
    root = API.getConfig('Connection.ThemeURI');
    return Utils.checkdir(root + '/' + name + '.css');
  };
  API.getFileIcon = function _apiGetFileIcon(file, size, icon) {
    icon = icon || 'mimetypes/gnome-fs-regular.png';
    if ( typeof file === 'object' && !(file instanceof OSjs.VFS.File) ) {
      file = new OSjs.VFS.File(file);
    }
    if ( !file.filename ) {
      throw new Error('Filename is required for getFileIcon()');
    }
    var map = [
      {match: 'application/pdf', icon: 'mimetypes/gnome-mime-application-pdf.png'},
      {match: 'application/zip', icon: 'mimetypes/folder_tar.png'},
      {match: 'application/x-python', icon: 'mimetypes/stock_script.png'},
      {match: 'application/x-lua', icon: 'mimetypes/stock_script.png'},
      {match: 'application/javascript', icon: 'mimetypes/stock_script.png'},
      {match: 'text/html', icon: 'mimetypes/stock_script.png'},
      {match: 'text/xml', icon: 'mimetypes/stock_script.png'},
      {match: 'text/css', icon: 'mimetypes/stock_script.png'},
      {match: 'osjs/document', icon: 'mimetypes/gnome-mime-application-msword.png'},
      {match: 'osjs/draw', icon: 'mimetypes/image.png'},
      {match: /^text\//, icon: 'mimetypes/txt.png'},
      {match: /^audio\//, icon: 'mimetypes/sound.png'},
      {match: /^video\//, icon: 'mimetypes/video.png'},
      {match: /^image\//, icon: 'mimetypes/image.png'},
      {match: /^application\//, icon: 'mimetypes/binary.png'}
    ];
    if ( file.type === 'dir' ) {
      icon = 'places/folder.png';
    } else if ( file.type === 'trash' ) {
      icon = 'places/user-trash.png';
    } else {
      var mime = file.mime || 'application/octet-stream';
      map.every(function(iter) {
        var match = false;
        if ( typeof iter.match === 'string' ) {
          match = (mime === iter.match);
        } else {
          match = mime.match(iter.match);
        }
        if ( match ) {
          icon = iter.icon;
          return false;
        }
        return true;
      });
    }
    return API.getIcon(icon, size);
  };
  API.getThemeResource = function _apiGetThemeResource(name, type) {
    name = name || null;
    type = type || null;
    var root = API.getConfig('Connection.ThemeURI');
    if ( !root.match(/^\//) ) {
      root = API.getBrowserPath() + root;
    }
    function getName(str, theme) {
      if ( !str.match(/^\//) ) {
        if ( type === 'base' || type === null ) {
          str = root + '/' + theme + '/' + str;
        } else {
          str = root + '/' + theme + '/' + type + '/' + str;
        }
      }
      return str;
    }
    if ( name ) {
      var wm = OSjs.Core.getWindowManager();
      var theme = (wm ? wm.getSetting('theme') : 'default') || 'default';
      name = getName(name, theme);
    }
    return Utils.checkdir(name);
  };
  API.getSound = function _apiGetSound(name) {
    name = name || null;
    if ( name ) {
      var wm = OSjs.Core.getWindowManager();
      var theme = wm ? wm.getSoundTheme() : 'default';
      var root = API.getConfig('Connection.SoundURI');
      var compability = Utils.getCompability();
      if ( !name.match(/^\//) ) {
        var ext = 'oga';
        if ( !compability.audioTypes.ogg ) {
          ext = 'mp3';
        }
        name = root + '/' + theme + '/' + name + '.' + ext;
      }
    }
    return Utils.checkdir(name);
  };
  API.getIcon = function _apiGetIcon(name, size, app) {
    name = name || null;
    size = size || '16x16';
    app  = app  || null;
    var root = API.getConfig('Connection.IconURI');
    var wm = OSjs.Core.getWindowManager();
    var theme = wm ? wm.getIconTheme() : 'default';
    function checkIcon() {
      if ( name.match(/^\.\//) ) {
        name = name.replace(/^\.\//, '');
        if ( (app instanceof OSjs.Core.Application) || (typeof app === 'string') ) {
          return API.getApplicationResource(app, name);
        } else {
          if ( app !== null && typeof app === 'object' ) {
            return API.getApplicationResource(app.className, name);
          } else if ( typeof app === 'string' ) {
            return API.getApplicationResource(app, name);
          }
        }
      } else {
        if ( !name.match(/^\//) ) {
          name = root + '/' + theme + '/' + size + '/' + name;
        }
      }
      return null;
    }
    if ( name && !name.match(/^(http|\/\/)/) ) {
      var chk = checkIcon();
      if ( chk !== null ) {
        return chk;
      }
    }
    return Utils.checkdir(name);
  };
  API.getConfig = function _apiGetConfig(path, defaultValue) {
    var config = OSjs.Core.getConfig();
    if ( typeof path === 'string' ) {
      var result = config[path];
      if ( path.indexOf('.') !== -1 ) {
        var queue = path.split(/\./);
        var ns = config;
        queue.forEach(function(k, i) {
          if ( i >= queue.length - 1 ) {
            if ( ns ) {
              result = ns[k];
            }
          } else {
            ns = ns[k];
          }
        });
      }
      if ( typeof result === 'undefined' && typeof defaultValue !== 'undefined' ) {
        return defaultValue;
      }
      return typeof result === 'object' ? Utils.cloneObject(result) : result;
    }
    return config;
  };
  API.getDefaultPath = function _apiGetDefaultPath(fallback) {
    if ( fallback && fallback.match(/^\//) ) {
      fallback = null;
    }
    return API.getConfig('VFS.Home') || fallback || 'osjs:///';
  };
  API.createNotification = function _apiCreateNotification(opts) {
    var wm = OSjs.Core.getWindowManager();
    return wm.notification(opts);
  };
  API.createDialog = function _apiCreateDialog(className, args, callback, parentObj) {
    callback = callback || function() {};
    function cb() {
      if ( parentObj ) {
        if ( (parentObj instanceof OSjs.Core.Window) && parentObj._destroyed ) {
          console.warn('API::createDialog()', 'INGORED EVENT: Window was destroyed');
          return;
        }
        if ( (parentObj instanceof OSjs.Core.Process) && parentObj.__destroyed ) {
          console.warn('API::createDialog()', 'INGORED EVENT: Process was destroyed');
          return;
        }
      }
      callback.apply(null, arguments);
    }
    var win = typeof className === 'string' ? new OSjs.Dialogs[className](args, cb) : className(args, cb);
    if ( !parentObj ) {
      var wm = OSjs.Core.getWindowManager();
      wm.addWindow(win, true);
    } else if ( parentObj instanceof OSjs.Core.Window ) {
      win._on('destroy', function() {
        if ( parentObj ) {
          parentObj._focus();
        }
      });
      parentObj._addChild(win, true);
    } else if ( parentObj instanceof OSjs.Core.Application ) {
      parentObj._addWindow(win);
    }
    setTimeout(function() {
      win._focus();
    }, 10);
    return win;
  };
  API.createLoading = function _apiCreateLoading(name, opts, panelId) {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      if ( wm.createNotificationIcon(name, opts, panelId) ) {
        return name;
      }
    }
    return false;
  };
  API.destroyLoading = function _apiDestroyLoading(name, panelId) {
    var wm = OSjs.Core.getWindowManager();
    if ( name ) {
      if ( wm ) {
        if ( wm.removeNotificationIcon(name, panelId) ) {
          return true;
        }
      }
    }
    return false;
  };
  API.checkPermission = function _apiCheckPermission(group) {
    var user = OSjs.Core.getHandler().getUserData();
    var userGroups = user.groups || [];
    if ( !(group instanceof Array) ) {
      group = [group];
    }
    var result = true;
    if ( userGroups.indexOf('admin') < 0 ) {
      group.every(function(g) {
        if ( userGroups.indexOf(g) < 0 ) {
          result = false;
        }
        return result;
      });
    }
    return result;
  };
  API.createSplash = function _apiCreateSplash(name, icon, label, parentEl) {
    label = label || API._('LBL_STARTING');
    parentEl = parentEl || document.body;
    var splash = document.createElement('application-splash');
    splash.setAttribute('role', 'dialog');
    var img;
    if ( icon ) {
      img = document.createElement('img');
      img.alt = name;
      img.src = API.getIcon(icon);
    }
    var titleText = document.createElement('b');
    titleText.appendChild(document.createTextNode(name));
    var title = document.createElement('span');
    title.appendChild(document.createTextNode(label + ' '));
    title.appendChild(titleText);
    title.appendChild(document.createTextNode('...'));
    var splashBar = document.createElement('gui-progress-bar');
    OSjs.GUI.Elements['gui-progress-bar'].build(splashBar);
    if ( img ) {
      splash.appendChild(img);
    }
    splash.appendChild(title);
    splash.appendChild(splashBar);
    parentEl.appendChild(splash);
    return {
      destroy: function() {
        splash = Utils.$remove(splash);
        img = null;
        title = null;
        titleText = null;
        splashBar = null;
      },
      update: function(p, c) {
        if ( !splash || !splashBar ) {
          return;
        }
        var per = c ? 0 : 100;
        if ( c ) {
          per = (p / c) * 100;
        }
        (new OSjs.GUI.Element(splashBar)).set('value', per);
      }
    };
  };
  API.error = function _apiError(title, message, error, exception, bugreport) {
    bugreport = (function() {
      if ( API.getConfig('BugReporting.enabled') ) {
        return typeof bugreport === 'undefined' ? false : (bugreport ? true : false);
      }
      return false;
    })();
    function _dialog() {
      var wm = OSjs.Core.getWindowManager();
      if ( wm && wm._fullyLoaded ) {
        try {
          API.createDialog('Error', {
            title: title,
            message: message,
            error: error,
            exception: exception,
            bugreport: bugreport
          });
          return true;
        } catch ( e ) {
          console.warn('An error occured while creating Dialogs.Error', e);
          console.warn('stack', e.stack);
        }
      }
      return false;
    }
    API.blurMenu();
    if ( exception && (exception.message.match(/^Script Error/i) && String(exception.lineNumber).match(/^0/)) ) {
      console.error('VENDOR ERROR', {
        title: title,
        message: message,
        error: error,
        exception: exception
      });
      return;
    }
    if ( API.getConfig('MOCHAMODE') ) {
      console.error(title, message, error, exception);
    } else {
      if ( _dialog() ) {
        return;
      }
      window.alert(title + '\n\n' + message + '\n\n' + error);
    }
  };
  API.playSound = function _apiPlaySound(name, volume) {
    var compability = Utils.getCompability();
    var wm = OSjs.Core.getWindowManager();
    var filename = wm ? wm.getSoundFilename(name) : null;
    if ( !wm || !compability.audio || !wm.getSetting('enableSounds') || !filename ) {
      return false;
    }
    if ( typeof volume === 'undefined' ) {
      volume = 1.0;
    }
    var f = API.getSound(filename);
    var a = new Audio(f);
    a.volume = volume;
    a.play();
    return a;
  };
  API.setClipboard = function _apiSetClipboard(data) {
    _CLIPBOARD = data;
  };
  API.getClipboard = function _apiGetClipboard() {
    return _CLIPBOARD;
  };
  API.getServiceNotificationIcon = (function() {
    var _instance;
    return function _apiGetServiceNotificationIcon() {
      if ( !_instance ) {
        _instance = new ServiceNotificationIcon();
      }
      return _instance;
    };
  })();
  API.toggleFullscreen = (function() {
    var _prev;
    function trigger(el, state) {
      function _request() {
        if ( el.requestFullscreen ) {
          el.requestFullscreen();
        } else if ( el.mozRequestFullScreen ) {
          el.mozRequestFullScreen();
        } else if ( el.webkitRequestFullScreen ) {
          el.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        }
      }
      function _restore() {
        if ( el.webkitCancelFullScreen ) {
          el.webkitCancelFullScreen();
        } else if ( el.mozCancelFullScreen ) {
          el.mozCancelFullScreen();
        } else if ( el.exitFullscreen ) {
          el.exitFullscreen();
        }
      }
      if ( el ) {
        if ( state ) {
          _request();
        } else {
          _restore();
        }
      }
    }
    return function _apiToggleFullscreen(el, t) {
      if ( typeof t === 'boolean' ) {
        trigger(el, t);
      } else {
        if ( _prev && _prev !== el ) {
          trigger(_prev, false);
        }
        trigger(el, _prev !== el);
      }
      _prev = el;
    };
  })();
  API.isStandalone = function _apiIsStandlone() {
    return API.getConfig('Connection.Type') === 'standalone' && window.location.protocol === 'file:';
  };
  API.getBrowserPath = function _apiGetBrowserPath() {
    return (window.location.pathname || '/').replace(/index\.(.*)$/, '');
  }
  API.signOut = function _apiSignOut() {
    var handler = OSjs.Core.getHandler();
    var wm = OSjs.Core.getWindowManager();
    function signOut(save) {
      API.playSound('LOGOUT');
      handler.logout(save, function() {
        API.shutdown();
      });
    }
    if ( wm ) {
      var user = handler.getUserData() || {name: API._('LBL_UNKNOWN')};
      API.createDialog('Confirm', {
        title: API._('DIALOG_LOGOUT_TITLE'),
        message: API._('DIALOG_LOGOUT_MSG_FMT', user.name)
      }, function(ev, btn) {
        if ( btn === 'yes' ) {
          signOut(true);
        } else if ( btn === 'no' ) {
          signOut(false);
        }
      });
    } else {
      signOut(true);
    }
  };
  API.triggerHook = function _apiTriggerHook(name, args, thisarg) {
    thisarg = thisarg || OSjs;
    args = args || [];
    if ( _hooks[name] ) {
      _hooks[name].forEach(function(hook) {
        if ( typeof hook === 'function' ) {
          try {
            hook.apply(thisarg, args);
          } catch ( e ) {
            console.warn('Error on Hook', e, e.stack);
          }
        } else {
          console.warn('No such Hook', name);
        }
      });
    }
  };
  API.addHook = function _apiAddHook(name, fn) {
    if ( typeof _hooks[name] !== 'undefined' ) {
      return _hooks[name].push(fn) - 1;
    }
    return -1;
  };
  API.removeHook = function _apiRemoveHook(name, index) {
    if ( typeof _hooks[name] !== 'undefined' ) {
      if ( _hooks[name][index] ) {
        _hooks[name][index] = null;
        return true;
      }
    }
    return false;
  };
  API.shutdown = API.shutdown || function() {}; // init.js
  API.isShuttingDown = API.isShuttingDown || function() {}; // init.js
  API.createMenu = function() {
    return OSjs.GUI.Helpers.createMenu.apply(null, arguments);
  };
  API.blurMenu = function() {
    return OSjs.GUI.Helpers.blurMenu.apply(null, arguments);
  };
})(OSjs.Utils, OSjs.API);

(function(Utils, API) {
  'use strict';
  var _PROCS = [];        // Running processes
  function _kill(pid) {
    if ( pid >= 0 && _PROCS[pid] ) {
      var res = _PROCS[pid].destroy();
      console.warn('Killing application', pid, res);
      if ( res !== false ) {
        _PROCS[pid] = null;
        return true;
      }
    }
    return false;
  }
  function doKillAllProcesses(match) {
    if ( match ) {
      var isMatching;
      if ( match instanceof RegExp && _PROCS ) {
        isMatching = function(p) {
          return p.__pname && p.__pname.match(match);
        };
      } else if ( typeof match === 'string' ) {
        isMatching = function(p) {
          return p.__pname === match;
        };
      }
      if ( isMatching ) {
        _PROCS.forEach(function(p) {
          if ( p && isMatching(p) ) {
            _kill(p.__pid);
          }
        });
      }
      return;
    }
    _PROCS.forEach(function(proc, i) {
      if ( proc ) {
        proc.destroy(true);
      }
      _PROCS[i] = null;
    });
    _PROCS = [];
  }
  function doKillProcess(pid) {
    return _kill(pid);
  }
  function doProcessMessage(msg, obj, opts) {
    opts = opts || {};
    var filter = opts.filter || function() {
      return true;
    };
    if ( typeof filter === 'string' ) {
      var s = filter;
      filter = function(p) {
        return p.__pname === s;
      };
    }
    _PROCS.forEach(function(p, i) {
      if ( p && (p instanceof OSjs.Core.Application || p instanceof OSjs.Core.Process) ) {
        if ( filter(p) ) {
          p._onMessage(msg, obj, opts);
        }
      }
    });
  }
  function doGetProcess(name, first) {
    var result = first ? null : [];
    if ( typeof name === 'number' ) {
      return _PROCS[name];
    }
    _PROCS.every(function(p, i) {
      if ( p ) {
        if ( p.__pname === name ) {
          if ( first ) {
            result = p;
            return false;
          }
          result.push(p);
        }
      }
      return true;
    });
    return result;
  }
  function doGetProcesses() {
    return _PROCS;
  }
  function Process(name, args, metadata) {
    this.__pid = _PROCS.push(this) - 1;
    this.__pname = name;
    this.__args = args || {};
    this.__metadata = metadata || {};
    this.__started = new Date();
    this.__destroyed = false;
    this.__evHandler = new OSjs.Helpers.EventHandler(name, [
      'message', 'attention', 'hashchange', 'api', 'destroy', 'destroyWindow', 'vfs',
      'vfs:mount', 'vfs:unmount', 'vfs:mkdir', 'vfs:write', 'vfs:move',
      'vfs:copy', 'vfs:delete', 'vfs:upload', 'vfs:update'
    ]);
    this.__label    = this.__metadata.name;
    this.__path     = this.__metadata.path;
    this.__scope    = this.__metadata.scope || 'system';
    this.__iter     = this.__metadata.className;
  }
  Process.prototype.destroy = function() {
    if ( !this.__destroyed ) {
      this.__destroyed = true;
      this._emit('destroy', []);
      if ( this.__evHandler ) {
        this.__evHandler = this.__evHandler.destroy();
      }
      if ( this.__pid >= 0 ) {
        _PROCS[this.__pid] = null;
      }
      return true;
    }
    return false;
  };
  Process.prototype._onMessage = function(msg, obj, opts) {
    opts = opts || {};
    var sourceId = opts.source;
    if ( sourceId instanceof Process ) {
      sourceId = sourceId.__pid;
    } else if ( sourceId instanceof OSjs.Core.Window ) {
      sourceId = sourceId._app ? sourceId._app.__pid : -1;
    }
    if ( this.__evHandler && sourceId !== this.__pid ) {
      this.__evHandler.emit('message', [msg, obj, opts]);
      if ( msg.substr(0, 3) === 'vfs' ) {
        this.__evHandler.emit('vfs', [msg, obj, opts]);
      }
      this.__evHandler.emit(msg, [obj, opts, msg]);
    }
  };
  Process.prototype._emit = function(k, args) {
    return this.__evHandler.emit(k, args);
  };
  Process.prototype._on = function(k, func) {
    return this.__evHandler.on(k, func, this);
  };
  Process.prototype._off = function(k, idx) {
    return this.__evHandler.off(k, idx);
  };
  Process.prototype._api = function(method, args, callback, showLoading) {
    var self = this;
    function cb(err, res) {
      if ( self.__destroyed ) {
        console.warn('Process::_api()', 'INGORED RESPONSE: Process was closed');
        return;
      }
      callback(err, res);
    }
    this._emit('api', [method]);
    return OSjs.API.call('application', {
      application: this.__iter,
      path: this.__path,
      method: method,
      'arguments': args, __loading: showLoading
    }, cb);
  };
  Process.prototype._getArgument = function(k) {
    return typeof this.__args[k] === 'undefined' ? null : this.__args[k];
  };
  Process.prototype._getArguments = function() {
    return this.__args;
  };
  Process.prototype._getResource = function(src) {
    return API.getApplicationResource(this, src);
  };
  Process.prototype._setArgument = function(k, v) {
    this.__args[k] = v;
  };
  OSjs.Core.Process          = Object.seal(Process);
  OSjs.API.killAll           = doKillAllProcesses;
  OSjs.API.kill              = doKillProcess;
  OSjs.API.message           = doProcessMessage;
  OSjs.API.getProcess        = doGetProcess;
  OSjs.API.getProcesses      = doGetProcesses;
})(OSjs.Utils, OSjs.API);

(function(Utils, API, Process) {
  'use strict';
  function Application(name, args, metadata, settings) {
    this.__inited     = false;
    this.__mainwindow = null;
    this.__scheme     = null;
    this.__windows    = [];
    this.__settings   = {};
    this.__destroying = false;
    try {
      this.__settings = OSjs.Core.getSettingsManager().instance(name, settings || {});
    } catch ( e ) {
      console.warn('Application::construct()', 'An error occured while loading application settings', e);
      console.warn(e.stack);
      this.__settings = OSjs.Core.getSettingsManager().instance(name, {});
    }
    Process.apply(this, arguments);
  }
  Application.prototype = Object.create(Process.prototype);
  Application.constructor = Process;
  Application.prototype.init = function(settings, metadata, scheme) {
    var wm = OSjs.Core.getWindowManager();
    var self = this;
    function focusLastWindow() {
      var last;
      if ( wm ) {
        self.__windows.forEach(function(win, i) {
          if ( win ) {
            wm.addWindow(win);
            last = win;
          }
        });
      }
      if ( last ) {
        last._focus();
      }
    }
    if ( !this.__inited ) {
      if ( scheme ) {
        this._setScheme(scheme);
      }
      this.__settings.set(null, settings);
      this.__inited = true;
      this.__evHandler.emit('init', [settings, metadata, scheme]);
      focusLastWindow();
    }
  };
  Application.prototype.destroy = function(sourceWid) {
    if ( this.__destroying || this.__destroyed ) { // From 'process.js'
      return true;
    }
    this.__destroying = true;
    this.__windows.forEach(function(w) {
      try {
        if ( w && w._wid !== sourceWid ) {
          w.destroy();
        }
      } catch ( e ) {
        console.warn('Application::destroy()', e, e.stack);
      }
    });
    this.__mainwindow = null;
    this.__settings = {};
    this.__windows = [];
    if ( this.__scheme ) {
      this.__scheme.destroy();
    }
    this.__scheme = null;
    var result = Process.prototype.destroy.apply(this, arguments);
    return result;
  };
  Application.prototype._onMessage = function(msg, obj, args) {
    if ( this.__destroying || this.__destroyed ) {
      return false;
    }
    if ( msg === 'destroyWindow' ) {
      if ( obj._name === this.__mainwindow ) {
        this.destroy(obj._wid);
      } else {
        this._removeWindow(obj);
      }
    } else if ( msg === 'attention' ) {
      if ( this.__windows.length && this.__windows[0] ) {
        this.__windows[0]._focus();
      }
    }
    return Process.prototype._onMessage.apply(this, arguments);
  };
  Application.prototype._loadScheme = function(s, cb) {
    var scheme = OSjs.GUI.createScheme(this._getResource(s));
    scheme.load(function __onApplicationLoadScheme(error, result) {
      if ( error ) {
        console.error('Application::_loadScheme()', error);
      }
      cb(scheme);
    });
    this._setScheme(scheme);
  };
  Application.prototype._addWindow = function(w, cb, setmain) {
    if ( !(w instanceof OSjs.Core.Window) ) {
      throw new TypeError('Application::_addWindow() expects Core.Window');
    }
    this.__windows.push(w);
    if ( setmain || this.__windows.length === 1 ) {
      this.__mainwindow = w._name;
    }
    var wm = OSjs.Core.getWindowManager();
    if ( this.__inited ) {
      if ( wm ) {
        wm.addWindow(w);
      }
      if ( w._properties.start_focused ) {
        setTimeout(function() {
          w._focus();
        }, 5);
      }
    }
    (cb || function() {})(w, wm);
    return w;
  };
  Application.prototype._removeWindow = function(w) {
    if ( !(w instanceof OSjs.Core.Window) ) {
      throw new TypeError('Application::_removeWindow() expects Core.Window');
    }
    var self = this;
    this.__windows.forEach(function(win, i) {
      if ( win ) {
        if ( win._wid === w._wid ) {
          win.destroy();
          self.__windows.splice(i, 1);
          return false;
        }
      }
      return true;
    });
  };
  Application.prototype._getWindow = function(value, key) {
    key = key || 'name';
    if ( value === null ) {
      value = this.__mainwindow;
    }
    var result = key === 'tag' ? [] : null;
    this.__windows.every(function(win, i) {
      if ( win ) {
        if ( win['_' + key] === value ) {
          if ( key === 'tag' ) {
            result.push(win);
          } else {
            result = win;
            return false;
          }
        }
      }
      return true;
    });
    return result;
  };
  Application.prototype._getWindowByName = function(name) {
    return this._getWindow(name);
  };
  Application.prototype._getWindowsByTag = function(tag) {
    return this._getWindow(tag, 'tag');
  };
  Application.prototype._getWindows = function() {
    return this.__windows;
  };
  Application.prototype._getMainWindow = function() {
    return this._getWindow(this.__mainwindow, 'name');
  };
  Application.prototype._getSetting = function(k) {
    return this.__settings.get(k);
  };
  Application.prototype._getSessionData = function() {
    var args = this.__args;
    var wins = this.__windows;
    var data = {name: this.__pname, args: args, windows: []};
    wins.forEach(function(win, i) {
      if ( win && win._properties.allow_session ) {
        data.windows.push({
          name      : win._name,
          dimension : win._dimension,
          position  : win._position,
          state     : win._state
        });
      }
    });
    return data;
  };
  Application.prototype._getScheme = function() {
    return this.__scheme;
  };
  Application.prototype._setSetting = function(k, v, save, saveCallback) {
    save = (typeof save === 'undefined' || save === true);
    this.__settings.set(k, v, save ? (saveCallback || function() {}) : false);
  };
  Application.prototype._setScheme = function(s) {
    this.__scheme = s;
  };
  OSjs.Core.Application = Object.seal(Application);
})(OSjs.Utils, OSjs.API, OSjs.Core.Process);

(function(Utils, API, Process) {
  'use strict';
  function Service(name, args, metadata) {
    Process.apply(this, arguments);
  }
  Service.prototype = Object.create(Process.prototype);
  Service.constructor = Process;
  Service.prototype.init = function() {
  };
  OSjs.Core.Service = Object.seal(Service);
})(OSjs.Utils, OSjs.API, OSjs.Core.Process);

(function(Utils, API, GUI, Process) {
  'use strict';
  function _noEvent(ev) {
    OSjs.API.blurMenu();
    ev.preventDefault();
    ev.stopPropagation();
    return false;
  }
  function camelCased(str) {
    return str.replace(/_([a-z])/g, function(g) {
      return g[1].toUpperCase();
    });
  }
  var getNextZindex = (function() {
    var _lzindex  = 1;
    var _ltzindex = 100000;
    return function(ontop) {
      if ( typeof ontop !== 'undefined' && ontop === true ) {
        return (_ltzindex += 2);
      }
      return (_lzindex += 2);
    };
  })();
  function stopPropagation(ev) {
    if ( ev ) {
      ev.stopPropagation();
    }
    return false;
  }
  function getWindowSpace() {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      return wm.getWindowSpace();
    }
    return Utils.getRect();
  }
  function waitForAnimation(win, cb) {
    var wm = OSjs.Core.getWindowManager();
    var anim = wm ? wm.getSetting('animations') : false;
    if ( anim ) {
      win._animationCallback = cb;
    } else {
      cb();
    }
  }
  var createMediaQueries = (function() {
    var queries;
    function _createQueries() {
      var result = {};
      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        var qs = wm._settings.get('mediaQueries') || {};
        Object.keys(qs).forEach(function(k) {
          if ( qs[k] ) {
            result[k] = function(w, h, ref) {
              return w <= qs[k];
            };
          }
        });
      }
      return result;
    }
    return function() {
      if ( !queries ) {
        queries = _createQueries();
      }
      return queries;
    };
  })();
  function checkMediaQueries(win) {
    if ( !win._$element ) {
      return;
    }
    var qs = win._properties.media_queries || {};
    var w = win._dimension.w;
    var h = win._dimension.h;
    var n = '';
    var k;
    for ( k in qs ) {
      if ( qs.hasOwnProperty(k) ) {
        if ( qs[k](w, h, win) ) {
          n = k;
          break;
        }
      }
    }
    win._$element.setAttribute('data-media', n);
  }
  var Window = (function() {
    var _WID                = 0;
    var _DEFAULT_WIDTH      = 200;
    var _DEFAULT_HEIGHT     = 200;
    var _DEFAULT_MIN_HEIGHT = 150;
    var _DEFAULT_MIN_WIDTH  = 150;
    var _DEFAULT_SND_VOLUME = 1.0;
    var _NAMES              = [];
    return function(name, opts, appRef, schemeRef) {
      var self = this;
      if ( _NAMES.indexOf(name) >= 0 ) {
        throw new Error(API._('ERR_WIN_DUPLICATE_FMT', name));
      }
      if ( appRef && !(appRef instanceof OSjs.Core.Application) ) {
        throw new TypeError('appRef given was not instance of Core.Application');
      }
      if ( schemeRef && !(schemeRef instanceof OSjs.GUI.Scheme) ) {
        throw new TypeError('schemeRef given was not instance of GUI.Scheme');
      }
      opts = Utils.argumentDefaults(opts, {
        icon: API.getThemeResource('wm.png', 'wm'),
        width: _DEFAULT_WIDTH,
        height: _DEFAULT_HEIGHT,
        title: name,
        tag: name
      });
      this._$element = null;
      this._$root = null;
      this._$top = null;
      this._$winicon = null;
      this._$loading = null;
      this._$disabled = null;
      this._$resize = null;
      this._$warning = null;
      this._opts = opts;
      this._app = appRef || null;
      this._scheme = schemeRef || null;
      this._destroyed = false;
      this._restored = false;
      this._loaded = false;
      this._initialized = false;
      this._disabled = true;
      this._loading = false;
      this._wid = _WID;
      this._icon = opts.icon;
      this._name = name;
      this._title = opts.title;
      this._tag = opts.tag;
      this._position = {x:opts.x, y:opts.y};
      this._dimension     = {w:opts.width, h:opts.height};
      this._children = [];
      this._parent = null;
      this._origtitle = this._title;
      this._lastDimension = this._dimension;
      this._lastPosition = this._position;
      this._sound = null;
      this._soundVolume   = _DEFAULT_SND_VOLUME;
      this._properties    = {
        gravity           : null,
        allow_move        : true,
        allow_resize      : true,
        allow_minimize    : true,
        allow_maximize    : true,
        allow_close       : true,
        allow_windowlist  : true,
        allow_drop        : false,
        allow_iconmenu    : true,
        allow_ontop       : true,
        allow_hotkeys     : true,
        allow_session     : true,
        key_capture       : false,
        start_focused     : true,
        min_width         : _DEFAULT_MIN_HEIGHT,
        min_height        : _DEFAULT_MIN_WIDTH,
        max_width         : null,
        max_height        : null,
        media_queries     : createMediaQueries()
      };
      this._state = {
        focused   : false,
        modal     : false,
        minimized : false,
        maximized : false,
        ontop     : false,
        onbottom  : false
      };
      this._animationCallback = null;
      this._queryTimer = null;
      this._evHandler = new OSjs.Helpers.EventHandler(name, [
        'focus', 'blur', 'destroy', 'maximize', 'minimize', 'restore',
        'move', 'moved', 'resize', 'resized',
        'keydown', 'keyup', 'keypress',
        'drop', 'drop:upload', 'drop:file'
      ]);
      Object.keys(opts).forEach(function(k) {
        if ( typeof self._properties[k] !== 'undefined' ) {
          self._properties[k] = opts[k];
        } else if ( typeof self._state[k] !== 'undefined' && k !== 'focused' ) {
          self._state[k] = opts[k];
        } else if ( ('sound', 'sound_volume').indexOf(k) !== -1 ) {
          self['_' + camelCased(k)] = opts[k];
        }
      });
      (function _initPosition(properties, position) {
        if ( !properties.gravity && (typeof position.x === 'undefined') || (typeof position.y === 'undefined') ) {
          var wm = OSjs.Core.getWindowManager();
          var np = wm ? wm.getWindowPosition() : {x:0, y:0};
          position.x = np.x;
          position.y = np.y;
        }
      })(this._properties, this._position);
      (function _initDimension(properties, dimension) {
        if ( properties.min_height && (dimension.h < properties.min_height) ) {
          dimension.h = properties.min_height;
        }
        if ( properties.max_width && (dimension.w < properties.max_width) ) {
          dimension.w = properties.max_width;
        }
        if ( properties.max_height && (dimension.h > properties.max_height) ) {
          dimension.h = properties.max_height;
        }
        if ( properties.max_width && (dimension.w > properties.max_width) ) {
          dimension.w = properties.max_width;
        }
      })(this._properties, this._dimension);
      (function _initRestore(position, dimension) {
        if ( appRef && appRef.__args && appRef.__args.__windows__ ) {
          appRef.__args.__windows__.forEach(function(restore) {
            if ( !self._restored && restore.name && restore.name === self._name ) {
              position.x = restore.position.x;
              position.y = restore.position.y;
              if ( self._properties.allow_resize ) {
                dimension.w = restore.dimension.w;
                dimension.h = restore.dimension.h;
              }
              self._restored = true;
            }
          });
        }
      })(this._position, this._dimension);
      (function _initGravity(properties, position, dimension, restored) {
        var grav = properties.gravity;
        if ( grav && !restored ) {
          if ( grav === 'center' ) {
            position.y = (window.innerHeight / 2) - (self._dimension.h / 2);
            position.x = (window.innerWidth / 2) - (self._dimension.w / 2);
          } else {
            var space = getWindowSpace();
            if ( grav.match(/^south/) ) {
              position.y = space.height - dimension.h;
            } else {
              position.y = space.top;
            }
            if ( grav.match(/west$/) ) {
              position.x = space.left;
            } else {
              position.x = space.width - dimension.w;
            }
          }
        }
      })(this._properties, this._position, this._dimension, this._restored);
      _WID++;
    };
  })();
  Window.prototype.init = function(_wm, _app, _scheme) {
    var self = this;
    if ( this._initialized || this._loaded ) {
      return this._$root;
    }
    this._$element = Utils.$create('application-window', {
      className: (function(n, t) {
        var classNames = ['Window', Utils.$safeName(n)];
        if ( t && (n !== t) ) {
          classNames.push(Utils.$safeName(t));
        }
        return classNames;
      })(this._name, this._tag).join(' '),
      style: {
        width: this._dimension.w + 'px',
        height: this._dimension.h + 'px',
        top: this._position.y + 'px',
        left: this._position.x + 'px',
        zIndex: getNextZindex(this._state.ontop)
      },
      data: {
        window_id: this._wid,
        allow_resize: this._properties.allow_resize,
        allow_minimize: this._properties.allow_minimize,
        allow_maximize: this._properties.allow_maximize,
        allow_close: this._properties.allow_close
      },
      aria: {
        role: 'application',
        live: 'polite',
        hidden: 'false'
      }
    });
    this._$root = document.createElement('application-window-content');
    this._$resize = document.createElement('application-window-resize');
    ['nw', 'n',  'ne', 'e', 'se', 's', 'sw', 'w'].forEach(function(i) {
      var h = document.createElement('application-window-resize-handle');
      h.setAttribute('data-direction', i);
      self._$resize.appendChild(h);
      h = null;
    });
    this._$loading = document.createElement('application-window-loading');
    this._$disabled = document.createElement('application-window-disabled');
    this._$top = document.createElement('application-window-top');
    this._$winicon = document.createElement('application-window-icon');
    this._$winicon.setAttribute('role', 'button');
    this._$winicon.setAttribute('aria-haspopup', 'true');
    this._$winicon.setAttribute('aria-label', 'Window Menu');
    var windowTitle = document.createElement('application-window-title');
    windowTitle.setAttribute('role', 'heading');
    Utils.$bind(this._$loading, 'mousedown', _noEvent);
    Utils.$bind(this._$disabled, 'mousedown', _noEvent);
    var preventTimeout;
    function _onanimationend(ev) {
      if ( typeof self._animationCallback === 'function') {
        clearTimeout(preventTimeout);
        preventTimeout = setTimeout(function() {
          self._animationCallback(ev);
          self._animationCallback = false;
          preventTimeout = clearTimeout(preventTimeout);
        }, 10);
      }
    }
    Utils.$bind(this._$element, 'transitionend', _onanimationend);
    Utils.$bind(this._$element, 'animationend', _onanimationend);
    Utils.$bind(this._$element, 'mousedown', function(ev) {
      self._focus();
      return stopPropagation(ev);
    });
    Utils.$bind(this._$element, 'contextmenu', function(ev) {
      var r = Utils.$isFormElement(ev);
      if ( !r ) {
        ev.preventDefault();
        ev.stopPropagation();
      }
      OSjs.API.blurMenu();
      return !!r;
    });
    Utils.$bind(this._$top, 'click', function(ev) {
      var t = ev.isTrusted ? ev.target : (ev.relatedTarget || ev.target);
      ev.preventDefault();
      if ( t ) {
        if ( t.tagName.match(/^APPLICATION\-WINDOW\-BUTTON/) ) {
          self._onWindowButtonClick(ev, t, t.getAttribute('data-action'));
        } else if ( t.tagName === 'APPLICATION-WINDOW-ICON' ) {
          ev.stopPropagation();
          self._onWindowIconClick(ev, t);
        }
      }
    }, true);
    Utils.$bind(windowTitle, 'mousedown', _noEvent);
    Utils.$bind(windowTitle, 'dblclick', function() {
      self._maximize();
    });
    (function _initDnD(properties, main, compability) {
      if ( properties.allow_drop && compability.dnd ) {
        var border = document.createElement('div');
        border.className = 'WindowDropRect';
        OSjs.GUI.Helpers.createDroppable(main, {
          onOver: function(ev, el, args) {
            main.setAttribute('data-dnd-state', 'true');
          },
          onLeave : function() {
            main.setAttribute('data-dnd-state', 'false');
          },
          onDrop : function() {
            main.setAttribute('data-dnd-state', 'false');
          },
          onItemDropped: function(ev, el, item, args) {
            main.setAttribute('data-dnd-state', 'false');
            return self._onDndEvent(ev, 'itemDrop', item, args, el);
          },
          onFilesDropped: function(ev, el, files, args) {
            main.setAttribute('data-dnd-state', 'false');
            return self._onDndEvent(ev, 'filesDrop', files, args, el);
          }
        });
      }
    })(this._properties, this._$element, Utils.getCompability());
    windowTitle.appendChild(document.createTextNode(this._title));
    this._$top.appendChild(this._$winicon);
    this._$top.appendChild(windowTitle);
    this._$top.appendChild(Utils.$create('application-window-button-minimize', {
      className: 'application-window-button-entry',
      data: {
        action: 'minimize'
      },
      aria: {
        role: 'button',
        label: 'Minimize Window'
      }
    }));
    this._$top.appendChild(Utils.$create('application-window-button-maximize', {
      className: 'application-window-button-entry',
      data: {
        action: 'maximize'
      },
      aria: {
        role: 'button',
        label: 'Maximize Window'
      }
    }));
    this._$top.appendChild(Utils.$create('application-window-button-close', {
      className: 'application-window-button-entry',
      data: {
        action: 'close'
      },
      aria: {
        role: 'button',
        label: 'Close Window'
      }
    }));
    this._$loading.appendChild(document.createElement('application-window-loading-indicator'));
    this._$element.appendChild(this._$top);
    this._$element.appendChild(this._$root);
    this._$element.appendChild(this._$resize);
    this._$element.appendChild(this._$disabled);
    document.body.appendChild(this._$element);
    this._onChange('create');
    this._toggleLoading(false);
    this._toggleDisabled(false);
    this._setIcon(API.getIcon(this._icon, null, this._app));
    this._updateMarkup();
    if ( this._sound ) {
      API.playSound(this._sound, this._soundVolume);
    }
    this._initialized = true;
    this._emit('init', [this._$root, _scheme]);
    return this._$root;
  };
  Window.prototype._inited = function() {
    if ( this._loaded ) {
      return;
    }
    this._loaded = true;
    this._onResize();
    if ( !this._restored ) {
      if ( this._state.maximized ) {
        this._maximize(true);
      } else if ( this._state.minimized ) {
        this._minimize(true);
      }
    }
    var self = this;
    var inittimeout = setTimeout(function() {
      self._emit('inited', [self._scheme]);
      inittimeout = clearTimeout(inittimeout);
    }, 10);
    if ( this._app ) {
      this._app._onMessage('initedWindow', this, {});
    }
  };
  Window.prototype.destroy = function(shutdown) {
    var self = this;
    if ( this._destroyed ) {
      return false;
    }
    this._emit('destroy');
    this._destroyed = true;
    var wm = OSjs.Core.getWindowManager();
    function _removeDOM() {
      self._setWarning(null);
      self._$root       = null;
      self._$top        = null;
      self._$winicon    = null;
      self._$loading    = null;
      self._$disabled   = null;
      self._$resize     = null;
      self._$warning    = null;
      self._$element    = Utils.$remove(self._$element);
    }
    function _destroyDOM() {
      if ( self._$element ) {
        self._$element.querySelectorAll('*').forEach(function(iter) {
          if ( iter ) {
            Utils.$unbind(iter);
          }
        });
      }
      if ( self._parent ) {
        self._parent._removeChild(self);
      }
      self._parent = null;
      self._removeChildren();
    }
    function _destroyWin() {
      if ( wm ) {
        wm.removeWindow(self);
      }
      var curWin = wm ? wm.getCurrentWindow() : null;
      if ( curWin && curWin._wid === self._wid ) {
        wm.setCurrentWindow(null);
      }
      var lastWin = wm ? wm.getLastWindow() : null;
      if ( lastWin && lastWin._wid === self._wid ) {
        wm.setLastWindow(null);
      }
    }
    function _animateClose(fn) {
      if ( API.isShuttingDown() ) {
        fn();
      } else {
        if ( self._$element ) {
          var anim = wm ? wm.getSetting('animations') : false;
          if ( anim ) {
            self._$element.setAttribute('data-hint', 'closing');
            self._animationCallback = fn;
            var animatetimeout = setTimeout(function() {
              if ( self._animationCallback ) {
                self._animationCallback();
              }
              animatetimeout = clearTimeout(animatetimeout);
            }, 1000);
          } else {
            self._$element.style.display = 'none';
            fn();
          }
        }
      }
    }
    this._onChange('close');
    _animateClose(function() {
      _removeDOM();
    });
    _destroyDOM();
    _destroyWin();
    if ( this._app ) {
      this._app._onMessage('destroyWindow', this, {});
    }
    if ( this._evHandler ) {
      this._evHandler.destroy();
    }
    this._scheme = null;
    this._app = null;
    this._evHandler = null;
    this._args = {};
    this._queryTimer = clearTimeout(this._queryTimer);
    return true;
  };
  Window.prototype._find = function(id) {
    return this._scheme ? this._scheme.find(this, id) : null;
  };
  Window.prototype._findByQuery = function(q, root, all) {
    return this._scheme ? this._scheme.findByQuery(this, q, root, all) : null;
  };
  Window.prototype._emit = function(k, args) {
    if ( !this._destroyed ) {
      if ( this._evHandler ) {
        return this._evHandler.emit(k, args);
      }
    }
    return false;
  };
  Window.prototype._on = function(k, func) {
    if ( this._evHandler ) {
      return this._evHandler.on(k, func, this);
    }
    return false;
  };
  Window.prototype._off = function(k, idx) {
    if ( this._evHandler ) {
      return this._evHandler.off(k, idx);
    }
    return false;
  };
  Window.prototype._addChild = function(w, wmAdd, wmFocus) {
    w._parent = this;
    var wm = OSjs.Core.getWindowManager();
    if ( wmAdd && wm ) {
      wm.addWindow(w, wmFocus);
    }
    this._children.push(w);
    return w;
  };
  Window.prototype._removeChild = function(w) {
    var self = this;
    this._children.forEach(function(child, i) {
      if ( child && child._wid === w._wid ) {
        child.destroy();
        self._children[i] = null;
      }
    });
  };
  Window.prototype._getChild = function(value, key) {
    key = key || 'wid';
    var result = key === 'tag' ? [] : null;
    this._children.every(function(child, i) {
      if ( child ) {
        if ( key === 'tag' ) {
          result.push(child);
        } else {
          if ( child['_' + key] === value ) {
            result = child;
            return false;
          }
        }
      }
      return true;
    });
    return result;
  };
  Window.prototype._getChildById = function(id) {
    return this._getChild(id, 'wid');
  };
  Window.prototype._getChildByName = function(name) {
    return this._getChild(name, 'name');
  };
  Window.prototype._getChildrenByTag = function(tag) {
    return this._getChild(tag, 'tag');
  };
  Window.prototype._getChildren = function() {
    return this._children;
  };
  Window.prototype._removeChildren = function() {
    if ( this._children && this._children.length ) {
      this._children.forEach(function(child, i) {
        if ( child ) {
          child.destroy();
        }
      });
    }
    this._children = [];
  };
  Window.prototype._close = function() {
    if ( this._disabled || this._destroyed ) {
      return false;
    }
    this._blur();
    this.destroy();
    return true;
  };
  Window.prototype._minimize = function(force) {
    var self = this;
    if ( !this._properties.allow_minimize || this._destroyed  ) {
      return false;
    }
    if ( !force && this._state.minimized ) {
      this._restore(false, true);
      return true;
    }
    this._blur();
    this._state.minimized = true;
    this._$element.setAttribute('data-minimized', 'true');
    waitForAnimation(this, function() {
      self._$element.style.display = 'none';
      self._emit('minimize');
    });
    this._onChange('minimize');
    var wm = OSjs.Core.getWindowManager();
    var win = wm ? wm.getCurrentWindow() : null;
    if ( win && win._wid === this._wid ) {
      wm.setCurrentWindow(null);
    }
    this._updateMarkup();
    return true;
  };
  Window.prototype._maximize = function(force) {
    var self = this;
    if ( !this._properties.allow_maximize || this._destroyed || !this._$element  ) {
      return false;
    }
    if ( !force && this._state.maximized ) {
      this._restore(true, false);
      return true;
    }
    this._lastPosition    = {x: this._position.x,  y: this._position.y};
    this._lastDimension   = {w: this._dimension.w, h: this._dimension.h};
    this._state.maximized = true;
    var s = this._getMaximizedSize();
    this._$element.style.zIndex = getNextZindex(this._state.ontop);
    this._$element.style.top    = (s.top) + 'px';
    this._$element.style.left   = (s.left) + 'px';
    this._$element.style.width  = (s.width) + 'px';
    this._$element.style.height = (s.height) + 'px';
    this._$element.setAttribute('data-maximized', 'true');
    this._dimension.w = s.width;
    this._dimension.h = s.height;
    this._position.x  = s.left;
    this._position.y  = s.top;
    this._focus();
    waitForAnimation(this, function() {
      self._emit('maximize');
    });
    this._onChange('maximize');
    this._onResize();
    this._updateMarkup();
    return true;
  };
  Window.prototype._restore = function(max, min) {
    var self = this;
    if ( !this._$element || this._destroyed  ) {
      return;
    }
    function restoreMaximized() {
      if ( max && self._state.maximized ) {
        self._move(self._lastPosition.x, self._lastPosition.y);
        self._resize(self._lastDimension.w, self._lastDimension.h);
        self._state.maximized = false;
        self._$element.setAttribute('data-maximized', 'false');
      }
    }
    function restoreMinimized() {
      if ( min && self._state.minimized ) {
        self._$element.style.display = 'block';
        self._$element.setAttribute('data-minimized', 'false');
        self._state.minimized = false;
      }
    }
    max = (typeof max === 'undefined') ? true : (max === true);
    min = (typeof min === 'undefined') ? true : (min === true);
    restoreMaximized();
    restoreMinimized();
    waitForAnimation(this, function() {
      self._emit('restore');
    });
    this._onChange('restore');
    this._onResize();
    this._focus();
    this._updateMarkup();
  };
  Window.prototype._focus = function(force) {
    if ( !this._$element || this._destroyed ) {
      return false;
    }
    this._toggleAttentionBlink(false);
    this._$element.style.zIndex = getNextZindex(this._state.ontop);
    this._$element.setAttribute('data-focused', 'true');
    var wm = OSjs.Core.getWindowManager();
    var win = wm ? wm.getCurrentWindow() : null;
    if ( win && win._wid !== this._wid ) {
      win._blur();
    }
    if ( wm ) {
      wm.setCurrentWindow(this);
      wm.setLastWindow(this);
    }
    if ( !this._state.focused || force) {
      this._onChange('focus');
      this._emit('focus');
    }
    this._state.focused = true;
    this._updateMarkup();
    return true;
  };
  Window.prototype._blur = function(force) {
    if ( !this._$element || this._destroyed || (!force && !this._state.focused) ) {
      return false;
    }
    this._$element.setAttribute('data-focused', 'false');
    this._state.focused = false;
    this._onChange('blur');
    this._emit('blur');
    this._blurGUI();
    var wm = OSjs.Core.getWindowManager();
    var win = wm ? wm.getCurrentWindow() : null;
    if ( win && win._wid === this._wid ) {
      wm.setCurrentWindow(null);
    }
    this._updateMarkup();
    return true;
  };
  Window.prototype._blurGUI = function() {
    this._$root.querySelectorAll('input, textarea, select, iframe, button').forEach(function(el) {
      el.blur();
    });
  };
  Window.prototype._resizeTo = function(dw, dh, limit, move, container, force) {
    var self = this;
    if ( !this._$element || (dw <= 0 || dh <= 0) ) {
      return;
    }
    limit = (typeof limit === 'undefined' || limit === true);
    var dx = 0;
    var dy = 0;
    if ( container ) {
      var cpos  = Utils.$position(container, this._$root);
      dx = parseInt(cpos.left, 10);
      dy = parseInt(cpos.top, 10);
    }
    var space = this._getMaximizedSize();
    var cx    = this._position.x + dx;
    var cy    = this._position.y + dy;
    var newW  = dw;
    var newH  = dh;
    var newX  = null;
    var newY  = null;
    function _limitTo() {
      if ( (cx + newW) > space.width ) {
        if ( move ) {
          newW = space.width;
          newX = space.left;
        } else {
          newW = (space.width - cx) + dx;
        }
      } else {
        newW += dx;
      }
      if ( (cy + newH) > space.height ) {
        if ( move ) {
          newH = space.height;
          newY = space.top;
        } else {
          newH = (space.height - cy + self._$top.offsetHeight) + dy;
        }
      } else {
        newH += dy;
      }
    }
    function _moveTo() {
      if ( newX !== null ) {
        self._move(newX, self._position.y);
      }
      if ( newY !== null ) {
        self._move(self._position.x, newY);
      }
    }
    function _resizeFinished() {
      var wm = OSjs.Core.getWindowManager();
      var anim = wm ? wm.getSetting('animations') : false;
      if ( anim ) {
        self._animationCallback = function() {
          self._emit('resized');
        };
      } else {
        self._emit('resized');
      }
    }
    if ( limit ) {
      _limitTo();
    }
    this._resize(newW, newH, force);
    _moveTo();
    _resizeFinished();
  };
  Window.prototype._resize = function(w, h, force) {
    if ( !this._$element || this._destroyed  ) {
      return false;
    }
    var p = this._properties;
    if ( !force ) {
      if ( !p.allow_resize ) {
        return false;
      }
      (function() {
        if ( !isNaN(w) && w ) {
          if ( w < p.min_width ) {
            w = p.min_width;
          }
          if ( p.max_width !== null ) {
            if ( w > p.max_width ) {
              w = p.max_width;
            }
          }
        }
      })();
      (function() {
        if ( !isNaN(h) && h ) {
          if ( h < p.min_height ) {
            h = p.min_height;
          }
          if ( p.max_height !== null ) {
            if ( h > p.max_height ) {
              h = p.max_height;
            }
          }
        }
      })();
    }
    if ( !isNaN(w) && w ) {
      this._$element.style.width = w + 'px';
      this._dimension.w = w;
    }
    if ( !isNaN(h) && h ) {
      this._$element.style.height = h + 'px';
      this._dimension.h = h;
    }
    this._onResize();
    return true;
  };
  Window.prototype._moveTo = function(pos) {
    var wm = OSjs.Core.getWindowManager();
    if ( !wm ) {
      return;
    }
    var s = wm.getWindowSpace();
    var cx = this._position.x;
    var cy = this._position.y;
    if ( pos === 'left' ) {
      this._move(s.left, cy);
    } else if ( pos === 'right' ) {
      this._move((s.width - this._dimension.w), cy);
    } else if ( pos === 'top' ) {
      this._move(cx, s.top);
    } else if ( pos === 'bottom' ) {
      this._move(cx, (s.height - this._dimension.h));
    }
  };
  Window.prototype._move = function(x, y) {
    if ( !this._$element || this._destroyed || !this._properties.allow_move  ) {
      return false;
    }
    if ( typeof x === 'undefined' || typeof y === 'undefined') {
      return false;
    }
    this._$element.style.top  = y + 'px';
    this._$element.style.left = x + 'px';
    this._position.x          = x;
    this._position.y          = y;
    return true;
  };
  Window.prototype._toggleDisabled = function(t) {
    if ( this._$disabled ) {
      this._$disabled.style.display = t ? 'block' : 'none';
    }
    this._disabled = t ? true : false;
    this._updateMarkup();
  };
  Window.prototype._toggleLoading = function(t) {
    if ( this._$loading ) {
      this._$loading.style.display = t ? 'block' : 'none';
    }
    this._loading = t ? true : false;
    this._updateMarkup();
  };
  Window.prototype._updateMarkup = function(ui) {
    if ( !this._$element ) {
      return;
    }
    var t = this._loading || this._disabled;
    var d = this._disabled;
    var h = this._state.minimized;
    var f = !this._state.focused;
    this._$element.setAttribute('aria-busy', String(t));
    this._$element.setAttribute('aria-hidden', String(h));
    this._$element.setAttribute('aria-disabled', String(d));
    this._$root.setAttribute('aria-hidden', String(f));
    if ( !ui ) {
      return;
    }
    var dmax   = this._properties.allow_maximize === true ? 'inline-block' : 'none';
    var dmin   = this._properties.allow_minimize === true ? 'inline-block' : 'none';
    var dclose = this._properties.allow_close === true ? 'inline-block' : 'none';
    this._$top.querySelector('application-window-button-maximize').style.display = dmax;
    this._$top.querySelector('application-window-button-minimize').style.display = dmin;
    this._$top.querySelector('application-window-button-close').style.display = dclose;
    var dres   = this._properties.allow_resize === true;
    this._$element.setAttribute('data-allow-resize', String(dres));
  };
  Window.prototype._toggleAttentionBlink = function(t) {
    if ( !this._$element || this._destroyed || this._state.focused ) {
      return false;
    }
    var el     = this._$element;
    var self   = this;
    function _blink(stat) {
      if ( el ) {
        if ( stat ) {
          Utils.$addClass(el, 'WindowAttentionBlink');
        } else {
          Utils.$removeClass(el, 'WindowAttentionBlink');
        }
      }
      self._onChange(stat ? 'attention_on' : 'attention_off');
    }
    _blink(t);
    return true;
  };
  Window.prototype._nextTabIndex = function(ev) {
    var nextElement = OSjs.GUI.Helpers.getNextElement(ev.shiftKey, document.activeElement, this._$root);
    if ( nextElement ) {
      if ( Utils.$hasClass(nextElement, 'gui-data-view') ) {
        new OSjs.GUI.ElementDataView(nextElement)._call('focus');
      } else {
        try {
          nextElement.focus();
        } catch ( e ) {}
      }
    }
  };
  Window.prototype._onDndEvent = function(ev, type, item, args, el) {
    if ( this._disabled || this._destroyed ) {
      return false;
    }
    this._emit('drop', [ev, type, item, args, el]);
    if ( item ) {
      if ( type === 'filesDrop' ) {
        this._emit('drop:upload', [ev, item, args, el]);
      } else if ( type === 'itemDrop' && item.type === 'file' && item.data ) {
        this._emit('drop:file', [ev, new OSjs.VFS.File(item.data || {}), args, el]);
      }
    }
    return true;
  };
  Window.prototype._onKeyEvent = function(ev, type) {
    if ( this._destroyed ) {
      return false;
    }
    if ( type === 'keydown' && ev.keyCode === Utils.Keys.TAB ) {
      this._nextTabIndex(ev);
    }
    this._emit(type, [ev, ev.keyCode, ev.shiftKey, ev.ctrlKey, ev.altKey]);
    return true;
  };
  Window.prototype._onResize = function() {
    clearTimeout(this._queryTimer);
    var self = this;
    this._queryTimer = setTimeout(function() {
      checkMediaQueries(self);
      self._queryTimer = clearTimeout(self._queryTimer);
    }, 20);
  };
  Window.prototype._onWindowIconClick = function(ev, el) {
    if ( !this._properties.allow_iconmenu || this._destroyed  ) {
      return;
    }
    var self = this;
    var control = [
      [this._properties.allow_minimize, function() {
        return {
          title: API._('WINDOW_MINIMIZE'),
          icon: API.getIcon('actions/stock_up.png'),
          onClick: function(name, iter) {
            self._minimize();
          }
        };
      }],
      [this._properties.allow_maximize, function() {
        return {
          title: API._('WINDOW_MAXIMIZE'),
          icon: API.getIcon('actions/window_fullscreen.png'),
          onClick: function(name, iter) {
            self._maximize();
            self._focus();
          }
        };
      }],
      [this._state.maximized, function() {
        return {
          title: API._('WINDOW_RESTORE'),
          icon: API.getIcon('actions/view-restore.png'),
          onClick: function(name, iter) {
            self._restore();
            self._focus();
          }
        };
      }],
      [this._properties.allow_ontop, function() {
        if ( self._state.ontop ) {
          return {
            title: API._('WINDOW_ONTOP_OFF'),
            icon: API.getIcon('actions/window-new.png'),
            onClick: function(name, iter) {
              self._state.ontop = false;
              if ( self._$element ) {
                self._$element.style.zIndex = getNextZindex(false);
              }
              self._focus();
            }
          };
        }
        return {
          title: API._('WINDOW_ONTOP_ON'),
          icon: API.getIcon('actions/window-new.png'),
          onClick: function(name, iter) {
            self._state.ontop = true;
            if ( self._$element ) {
              self._$element.style.zIndex = getNextZindex(true);
            }
            self._focus();
          }
        };
      }],
      [this._properties.allow_close, function() {
        return {
          title: API._('WINDOW_CLOSE'),
          icon: API.getIcon('actions/window-close.png'),
          onClick: function(name, iter) {
            self._close();
          }
        };
      }]
    ];
    var list = [];
    control.forEach(function(iter) {
      if (iter[0] ) {
        list.push(iter[1]());
      }
    });
    OSjs.API.createMenu(list, ev);
  };
  Window.prototype._onWindowButtonClick = function(ev, el, btn) {
    this._blurGUI();
    if ( btn === 'close' ) {
      this._close();
    } else if ( btn === 'minimize' ) {
      this._minimize();
    } else if ( btn === 'maximize' ) {
      this._maximize();
    }
  };
  Window.prototype._onChange = function(ev, byUser) {
    ev = ev || '';
    if ( ev ) {
      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        wm.eventWindow(ev, this);
      }
    }
  };
  Window.prototype._getMaximizedSize = function() {
    var s = getWindowSpace();
    if ( !this._$element || this._destroyed ) {
      return s;
    }
    var topMargin = 23;
    var borderSize = 0;
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      var theme = wm.getStyleTheme(true);
      if ( theme && theme.style && theme.style.window ) {
        topMargin = theme.style.window.margin;
        borderSize = theme.style.window.border;
      }
    }
    s.left += borderSize;
    s.top += borderSize;
    s.width -= (borderSize * 2);
    s.height -= topMargin + (borderSize * 2);
    return Object.freeze(s);
  };
  Window.prototype._getViewRect = function() {
    return this._$element ? Object.freeze(Utils.$position(this._$element)) : null;
  };
  Window.prototype._getRoot = function() {
    return this._$root;
  };
  Window.prototype._getZindex = function() {
    if ( this._$element ) {
      return parseInt(this._$element.style.zIndex, 10);
    }
    return -1;
  };
  Window.prototype._setTitle = function(t, append, delimiter) {
    if ( !this._$element || this._destroyed ) {
      return;
    }
    delimiter = delimiter || '-';
    var tel = this._$element.getElementsByTagName('application-window-title')[0];
    var text = [];
    if ( append ) {
      text = [this._origtitle, delimiter, t];
    } else {
      text = [t || this._origtitle];
    }
    this._title = text.join(' ') || this._origtitle;
    if ( tel ) {
      Utils.$empty(tel);
      tel.appendChild(document.createTextNode(this._title));
    }
    this._onChange('title');
    this._updateMarkup();
  };
  Window.prototype._setIcon = function(i) {
    if ( this._$winicon ) {
      this._$winicon.title = this._title;
      this._$winicon.style.backgroundImage = 'url(' + i + ')';
    }
    this._icon = i;
    this._onChange('icon');
  };
  Window.prototype._setWarning = function(message) {
    var self = this;
    this._$warning = Utils.$remove(this._$warning);
    if ( this._destroyed || message === null ) {
      return;
    }
    message = message || '';
    var container = document.createElement('application-window-warning');
    var close = document.createElement('div');
    close.innerHTML = 'X';
    Utils.$bind(close, 'click', function() {
      self._setWarning(null);
    });
    var msg = document.createElement('div');
    msg.appendChild(document.createTextNode(message));
    container.appendChild(close);
    container.appendChild(msg);
    this._$warning = container;
    this._$root.appendChild(this._$warning);
  };
  Window.prototype._setProperty = function(p, v) {
    if ( (v === '' || v === null) || !this._$element || (typeof this._properties[p] === 'undefined') ) {
      return;
    }
    this._properties[p] = String(v) === 'true';
    this._updateMarkup(true);
  };
  OSjs.Core.Window = Object.seal(Window);
})(OSjs.Utils, OSjs.API, OSjs.GUI, OSjs.Core.Process);

(function(Utils, API, Window) {
  'use strict';
  function DialogWindow(className, opts, args, callback) {
    var self = this;
    opts = opts || {};
    args = args || {};
    callback = callback || function() {};
    if ( typeof callback !== 'function' ) {
      throw new TypeError('DialogWindow expects a callback Function, gave: ' + typeof callback);
    }
    Window.apply(this, [className, opts]);
    this._properties.gravity          = 'center';
    this._properties.allow_resize     = false;
    this._properties.allow_minimize   = false;
    this._properties.allow_maximize   = false;
    this._properties.allow_windowlist = false;
    this._properties.allow_session    = false;
    this._state.ontop                 = true;
    this._tag                         = 'DialogWindow';
    if ( args.scheme && args.scheme instanceof OSjs.GUI.Scheme ) {
      this.scheme = args.scheme;
      delete args.scheme;
    } else {
      this.scheme = OSjs.GUI.DialogScheme.get();
    }
    this.args = args;
    this.className = className;
    this.buttonClicked = false;
    this.closeCallback = function(ev, button, result) {
      if ( self._destroyed ) {
        return;
      }
      self.buttonClicked = true;
      callback.apply(self, arguments);
      self._close();
    };
  }
  DialogWindow.prototype = Object.create(Window.prototype);
  DialogWindow.constructor = Window;
  DialogWindow.prototype.init = function() {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);
    root.setAttribute('role', 'dialog');
    this.scheme.render(this, this.className.replace(/Dialog$/, ''), root, 'application-dialog', function(node) {
      node.querySelectorAll('gui-label').forEach(function(el) {
        if ( el.childNodes.length && el.childNodes[0].nodeType === 3 && el.childNodes[0].nodeValue ) {
          var label = el.childNodes[0].nodeValue;
          Utils.$empty(el);
          el.appendChild(document.createTextNode(API._(label)));
        }
      });
    });
    var buttonMap = {
      ButtonOK:     'ok',
      ButtonCancel: 'cancel',
      ButtonYes:    'yes',
      ButtonNo:     'no'
    };
    var focusButtons = ['ButtonCancel', 'ButtonNo'];
    Object.keys(buttonMap).forEach(function(id) {
      if ( self.scheme.findDOM(self, id) ) {
        var btn = self.scheme.find(self, id);
        btn.on('click', function(ev) {
          self.onClose(ev, buttonMap[id]);
        });
        if ( focusButtons.indexOf(id) >= 0 ) {
          btn.focus();
        }
      }
    });
    Utils.$addClass(root, 'DialogWindow');
    return root;
  };
  DialogWindow.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, null);
  };
  DialogWindow.prototype._close = function() {
    if ( !this.buttonClicked ) {
      this.onClose(null, 'cancel', null);
    }
    return Window.prototype._close.apply(this, arguments);
  };
  DialogWindow.prototype._onKeyEvent = function(ev) {
    Window.prototype._onKeyEvent.apply(this, arguments);
    if ( ev.keyCode === Utils.Keys.ESC ) {
      this.onClose(ev, 'cancel');
    }
  };
  DialogWindow.parseMessage = function(msg) {
    msg = Utils.$escape(msg || '').replace(/\*\*(.*)\*\*/g, '<span>$1</span>');
    var tmp = document.createElement('div');
    tmp.innerHTML = msg;
    var frag = document.createDocumentFragment();
    for ( var i = 0; i < tmp.childNodes.length; i++ ) {
      frag.appendChild(tmp.childNodes[i].cloneNode(true));
    }
    tmp = null;
    return frag;
  };
  OSjs.Core.DialogWindow = Object.seal(DialogWindow);
})(OSjs.Utils, OSjs.API, OSjs.Core.Window);

(function(Utils, API, Process, Window) {
  'use strict';
  var _WM;             // Running Window Manager process
  function BehaviourState(win, action, mousePosition) {
    var self = this;
    this.win      = win;
    this.$element = win._$element;
    this.$top     = win._$top;
    this.$handle  = win._$resize;
    this.rectWorkspace  = _WM.getWindowSpace(true);
    this.rectWindow     = {
      x: win._position.x,
      y: win._position.y,
      w: win._dimension.w,
      h: win._dimension.h,
      r: win._dimension.w + win._position.x,
      b: win._dimension.h + win._position.y
    };
    var theme = _WM.getStyleTheme(true);
    if ( !theme.style ) {
      theme.style = {'window': {margin: 0, border: 0}};
    }
    this.theme = {
      topMargin : theme.style.window.margin || 0,
      borderSize: theme.style.window.border || 0
    };
    this.snapping   = {
      cornerSize : _WM.getSetting('windowCornerSnap') || 0,
      windowSize : _WM.getSetting('windowSnap') || 0
    };
    this.action     = action;
    this.moved      = false;
    this.direction  = null;
    this.startX     = mousePosition.x;
    this.startY     = mousePosition.y;
    this.minWidth   = win._properties.min_width;
    this.minHeight  = win._properties.min_height;
    var windowRects = [];
    _WM.getWindows().forEach(function(w) {
      if ( w && w._wid !== win._wid ) {
        var pos = w._position;
        var dim = w._dimension;
        var rect = {
          left : pos.x - self.theme.borderSize,
          top : pos.y - self.theme.borderSize,
          width: dim.w + (self.theme.borderSize * 2),
          height: dim.h + (self.theme.borderSize * 2) + self.theme.topMargin
        };
        rect.right = rect.left + rect.width;
        rect.bottom = (pos.y + dim.h) + self.theme.topMargin + self.theme.borderSize;//rect.top + rect.height;
        windowRects.push(rect);
      }
    });
    this.snapRects = windowRects;
  }
  BehaviourState.prototype.getRect = function() {
    var win = this.win;
    return {
      left: win._position.x,
      top: win._position.y,
      width: win._dimension.w,
      height: win._dimension.h
    };
  };
  BehaviourState.prototype.calculateDirection = function() {
    var dir = Utils.$position(this.$handle);
    var dirX = this.startX - dir.left;
    var dirY = this.startY - dir.top;
    var dirD = 20;
    var direction = 's';
    var checks = {
      nw: (dirX <= dirD) && (dirY <= dirD),
      n:  (dirX > dirD) && (dirY <= dirD),
      w:  (dirX <= dirD) && (dirY >= dirD),
      ne: (dirX >= (dir.width - dirD)) && (dirY <= dirD),
      e:  (dirX >= (dir.width - dirD)) && (dirY > dirD),
      se: (dirX >= (dir.width - dirD)) && (dirY >= (dir.height - dirD)),
      sw: (dirX <= dirD) && (dirY >= (dir.height - dirD))
    };
    Object.keys(checks).forEach(function(k) {
      if ( checks[k] ) {
        direction = k;
      }
    });
    this.direction = direction;
  };
  function createWindowBehaviour(win, wm) {
    var current = null;
    var newRect = {};
    function onMouseDown(ev, action, win, mousePosition) {
      OSjs.API.blurMenu();
      ev.preventDefault();
      if ( win._state.maximized ) {
        return;
      }
      current = new BehaviourState(win, action, mousePosition);
      newRect = {};
      win._focus();
      if ( action === 'move' ) {
        current.$element.setAttribute('data-hint', 'moving');
      } else {
        current.calculateDirection();
        current.$element.setAttribute('data-hint', 'resizing');
        newRect = current.getRect();
      }
      win._emit('preop');
      Utils.$bind(document, 'mousemove:movewindow', _onMouseMove, false);
      Utils.$bind(document, 'mouseup:movewindowstop', _onMouseUp, false);
      function _onMouseMove(ev, pos) {
        if ( wm._mouselock ) {
          onMouseMove(ev, action, win, pos);
        }
      }
      function _onMouseUp(ev, pos) {
        onMouseUp(ev, action, win, pos);
        Utils.$unbind(document, 'mousemove:movewindow');
        Utils.$unbind(document, 'mouseup:movewindowstop');
      }
    }
    function onMouseUp(ev, action, win, mousePosition) {
      if ( !current ) {
        return;
      }
      if ( current.moved ) {
        if ( action === 'move' ) {
          win._onChange('move', true);
          win._emit('moved', [win._position.x, win._position.y]);
        } else if ( action === 'resize' ) {
          win._onChange('resize', true);
          win._emit('resized', [win._dimension.w, win._dimension.h]);
        }
      }
      current.$element.setAttribute('data-hint', '');
      win._emit('postop');
      current = null;
    }
    function onMouseMove(ev, action, win, mousePosition) {
      if ( !_WM.getMouseLocked() || !action || !current ) {
        return;
      }
      var result;
      var dx = mousePosition.x - current.startX;
      var dy = mousePosition.y - current.startY;
      if ( action === 'move' ) {
        result = onWindowMove(ev, mousePosition, dx, dy);
      } else {
        result = onWindowResize(ev, mousePosition, dx, dy);
      }
      if ( result ) {
        if ( result.left !== null && result.top !== null ) {
          win._move(result.left, result.top);
          win._emit('move', [result.left, result.top]);
        }
        if ( result.width !== null && result.height !== null ) {
          win._resize(result.width, result.height, true);
          win._emit('resize', [result.width, result.height]);
        }
      }
      current.moved = true;
    }
    function onWindowResize(ev, mousePosition, dx, dy) {
      if ( !current || !current.direction ) {
        return false;
      }
      var nw, nh, nl, nt;
      (function() { // North/South
        if ( current.direction.indexOf('s') !== -1 ) {
          nh = current.rectWindow.h + dy;
          newRect.height = Math.max(current.minHeight, nh);
        } else if ( current.direction.indexOf('n') !== -1 ) {
          nh = current.rectWindow.h - dy;
          nt = current.rectWindow.y + dy;
          if ( nt < current.rectWorkspace.top ) {
            nt = current.rectWorkspace.top;
            nh = newRect.height;
          } else {
            if ( nh < current.minHeight ) {
              nt = current.rectWindow.b - current.minHeight;
            }
          }
          newRect.height = Math.max(current.minHeight, nh);
          newRect.top = nt;
        }
      })();
      (function() { // East/West
        if ( current.direction.indexOf('e') !== -1 ) {
          nw = current.rectWindow.w + dx;
          newRect.width = Math.max(current.minWidth, nw);
        } else if ( current.direction.indexOf('w') !== -1 ) {
          nw = current.rectWindow.w - dx;
          nl = current.rectWindow.x + dx;
          if ( nw < current.minWidth ) {
            nl = current.rectWindow.r - current.minWidth;
          }
          newRect.width = Math.max(current.minWidth, nw);
          newRect.left = nl;
        }
      })();
      return newRect;
    }
    function onWindowMove(ev, mousePosition, dx, dy) {
      var newWidth = null;
      var newHeight = null;
      var newLeft = current.rectWindow.x + dx;
      var newTop = current.rectWindow.y + dy;
      var borderSize = current.theme.borderSize;
      var topMargin = current.theme.topMargin;
      var cornerSnapSize = current.snapping.cornerSize;
      var windowSnapSize = current.snapping.windowSize;
      if ( newTop < current.rectWorkspace.top ) {
        newTop = current.rectWorkspace.top;
      }
      var newRight = newLeft + current.rectWindow.w + (borderSize * 2);
      var newBottom = newTop + current.rectWindow.h + topMargin + (borderSize);
      if ( cornerSnapSize > 0 ) {
        if ( ((newLeft - borderSize) <= cornerSnapSize) && ((newLeft - borderSize) >= -cornerSnapSize) ) { // Left
          newLeft = borderSize;
        } else if ( (newRight >= (current.rectWorkspace.width - cornerSnapSize)) && (newRight <= (current.rectWorkspace.width + cornerSnapSize)) ) { // Right
          newLeft = current.rectWorkspace.width - current.rectWindow.w - borderSize;
        }
        if ( (newTop <= (current.rectWorkspace.top + cornerSnapSize)) && (newTop >= (current.rectWorkspace.top - cornerSnapSize)) ) { // Top
          newTop = current.rectWorkspace.top + (borderSize);
        } else if (
                    (newBottom >= ((current.rectWorkspace.height + current.rectWorkspace.top) - cornerSnapSize)) &&
                    (newBottom <= ((current.rectWorkspace.height + current.rectWorkspace.top) + cornerSnapSize))
                  ) { // Bottom
          newTop = (current.rectWorkspace.height + current.rectWorkspace.top) - current.rectWindow.h - topMargin - borderSize;
        }
      }
      if ( windowSnapSize > 0 ) {
        current.snapRects.every(function(rect) {
          if ( newRight >= (rect.left - windowSnapSize) && newRight <= (rect.left + windowSnapSize) ) { // Left
            newLeft = rect.left - (current.rectWindow.w + (borderSize * 2));
            return false;
          }
          if ( (newLeft - borderSize) <= (rect.right + windowSnapSize) && (newLeft - borderSize) >= (rect.right - windowSnapSize) ) { // Right
            newLeft = rect.right + (borderSize * 2);
            return false;
          }
          if ( newBottom >= (rect.top - windowSnapSize) && newBottom <= (rect.top + windowSnapSize) ) { // Top
            newTop = rect.top - (current.rectWindow.h + (borderSize * 2) + topMargin);
            return false;
          }
          if ( newTop <= (rect.bottom + windowSnapSize) && newTop >= (rect.bottom - windowSnapSize) ) { // Bottom
            newTop = rect.bottom + borderSize * 2;
            return false;
          }
          return true;
        });
      }
      return {left: newLeft, top: newTop, width: newWidth, height: newHeight};
    }
    if ( win._properties.allow_move ) {
      Utils.$bind(win._$top, 'mousedown', function(ev, pos) {
        onMouseDown(ev, 'move', win, pos);
      }, true);
    }
    if ( win._properties.allow_resize ) {
      Utils.$bind(win._$resize, 'mousedown', function(ev, pos) {
        onMouseDown(ev, 'resize', win, pos);
      });
    }
  }
  function WindowManager(name, ref, args, metadata, settings) {
    this._$notifications = null;
    this._windows        = [];
    this._settings       = OSjs.Core.getSettingsManager().instance(name, settings);
    this._currentWin     = null;
    this._lastWin        = null;
    this._mouselock      = true;
    this._stylesheet     = null;
    this._sessionLoaded  = false;
    this._fullyLoaded    = false;
    this._scheme         = null;
    this.__name    = (name || 'WindowManager');
    this.__path    = metadata.path;
    this.__iter    = metadata.iter;
    Process.apply(this, [this.__name, args, metadata]);
    _WM = (ref || this);
  }
  WindowManager.prototype = Object.create(Process.prototype);
  WindowManager.prototype.destroy = function() {
    var self = this;
    this.destroyStylesheet();
    Utils.$unbind(document, 'mouseout:windowmanager');
    Utils.$unbind(document, 'mouseenter:windowmanager');
    this._windows.forEach(function(win, i) {
      if ( win ) {
        win.destroy(true);
        self._windows[i] = null;
      }
    });
    if ( this._scheme ) {
      this._scheme.destroy();
    }
    this._windows = [];
    this._currentWin = null;
    this._lastWin = null;
    this._scheme = null;
    _WM = null;
    return Process.prototype.destroy.apply(this, []);
  };
  WindowManager.prototype.init = function(metadata, settings, scheme) {
    this._scheme = scheme;
    var self = this;
    Utils.$bind(document, 'mouseout:windowmanager', function(ev) {
      self._onMouseLeave(ev);
    });
    Utils.$bind(document, 'mouseenter:windowmanager', function(ev) {
      self._onMouseLeave(ev);
    });
  };
  WindowManager.prototype.setup = function(cb) {
  };
  WindowManager.prototype.getWindow = function(name) {
    var result = null;
    this._windows.every(function(w) {
      if ( w && w._name === name ) {
        result = w;
      }
      return w ? false : true;
    });
    return result;
  };
  WindowManager.prototype.addWindow = function(w, focus) {
    if ( !(w instanceof Window) ) {
      console.warn('WindowManager::addWindow()', 'Got', w);
      throw new TypeError('given argument was not instance of Core.Window');
    }
    try {
      w.init(this, w._app, w._scheme);
    } catch ( e ) {
      console.error('WindowManager::addWindow()', '=>', 'Window::init()', e, e.stack);
    }
    createWindowBehaviour(w, this);
    this._windows.push(w);
    w._inited();
    if ( focus === true || (w instanceof OSjs.Core.DialogWindow) ) {
      setTimeout(function() {
        w._focus();
      }, 10);
    }
    return w;
  };
  WindowManager.prototype.removeWindow = function(w) {
    var self = this;
    if ( !(w instanceof Window) ) {
      console.warn('WindowManager::removeWindow()', 'Got', w);
      throw new TypeError('given argument was not instance of Core.Window');
    }
    var result = false;
    this._windows.every(function(win, i) {
      if ( win && win._wid === w._wid ) {
        self._windows[i] = null;
        result = true;
      }
      return result ? false : true;
    });
    return result;
  };
  WindowManager.prototype.applySettings = function(settings, force, save, triggerWatch) {
    settings = settings || {};
    var result = force ? settings : Utils.mergeObject(this._settings.get(), settings);
    this._settings.set(null, result, save, triggerWatch);
    return true;
  };
  WindowManager.prototype.createStylesheet = function(styles, rawStyles) {
    this.destroyStylesheet();
    var innerHTML = [];
    Object.keys(styles).forEach(function(key) {
      var rules = [];
      Object.keys(styles[key]).forEach(function(r) {
        rules.push(Utils.format('    {0}: {1};', r, styles[key][r]));
      });
      rules = rules.join('\n');
      innerHTML.push(Utils.format('{0} {\n{1}\n}', key, rules));
    });
    innerHTML = innerHTML.join('\n');
    if ( rawStyles ) {
      innerHTML += '\n' + rawStyles;
    }
    var style       = document.createElement('style');
    style.type      = 'text/css';
    style.id        = 'WMGeneratedStyles';
    style.innerHTML = innerHTML;
    document.getElementsByTagName('head')[0].appendChild(style);
    this._stylesheet = style;
  };
  WindowManager.prototype.destroyStylesheet = function() {
    if ( this._stylesheet ) {
      if ( this._stylesheet.parentNode ) {
        this._stylesheet.parentNode.removeChild(this._stylesheet);
      }
    }
    this._stylesheet = null;
  };
  WindowManager.prototype.onKeyDown = function(ev, win) {
  };
  WindowManager.prototype.onOrientationChange = function(ev, orientation) {
  };
  WindowManager.prototype.onSessionLoaded = function() {
    if ( this._sessionLoaded ) {
      return false;
    }
    this._sessionLoaded = true;
    return true;
  };
  WindowManager.prototype.resize = function(ev, rect) {
  };
  WindowManager.prototype.notification = function() {
  };
  WindowManager.prototype.createNotificationIcon = function() {
  };
  WindowManager.prototype.removeNotificationIcon = function() {
  };
  WindowManager.prototype.eventWindow = function(ev, win) {
  };
  WindowManager.prototype.showSettings = function() {
  };
  WindowManager.prototype._onMouseEnter = function(ev) {
    this._mouselock = true;
  };
  WindowManager.prototype._onMouseLeave = function(ev) {
    var from = ev.relatedTarget || ev.toElement;
    if ( !from || from.nodeName === 'HTML' ) {
      this._mouselock = false;
    } else {
      this._mouselock = true;
    }
  };
  WindowManager.prototype.getDefaultSetting = function() {
    return null;
  };
  WindowManager.prototype.getPanel = function() {
    return null;
  };
  WindowManager.prototype.getPanels = function() {
    return [];
  };
  WindowManager.prototype.getStyleTheme = function(returnMetadata) {
    return returnMetadata ? {} : 'default';
  };
  WindowManager.prototype.getSoundTheme = function() {
    return 'default';
  };
  WindowManager.prototype.getSoundFilename = function(k) {
    return null;
  };
  WindowManager.prototype.getIconTheme = function() {
    return 'default';
  };
  WindowManager.prototype.getStyleThemes = function() {
    return API.getConfig('Styles', []);
  };
  WindowManager.prototype.getSoundThemes = function() {
    return API.getConfig('Sounds', []);
  };
  WindowManager.prototype.getIconThemes = function() {
    return API.getConfig('Icons', []);
  };
  WindowManager.prototype.setSetting = function(k, v) {
    return this._settings.set(k, v);
  };
  WindowManager.prototype.getWindowSpace = function() {
    return Utils.getRect();
  };
  WindowManager.prototype.getWindowPosition = (function() {
    var _LNEWX = 0;
    var _LNEWY = 0;
    return function() {
      if ( _LNEWY >= (window.innerHeight - 100) ) {
        _LNEWY = 0;
      }
      if ( _LNEWX >= (window.innerWidth - 100) )  {
        _LNEWX = 0;
      }
      return {x: _LNEWX += 10, y: _LNEWY += 10};
    };
  })();
  WindowManager.prototype.getSetting = function(k) {
    return this._settings.get(k);
  };
  WindowManager.prototype.getSettings = function() {
    return this._settings.get();
  };
  WindowManager.prototype.getWindows = function() {
    return this._windows;
  };
  WindowManager.prototype.getCurrentWindow = function() {
    return this._currentWin;
  };
  WindowManager.prototype.setCurrentWindow = function(w) {
    this._currentWin = w || null;
  };
  WindowManager.prototype.getLastWindow = function() {
    return this._lastWin;
  };
  WindowManager.prototype.setLastWindow = function(w) {
    this._lastWin = w || null;
  };
  WindowManager.prototype.getMouseLocked = function() {
    return this._mouselock;
  };
  OSjs.Core.WindowManager     = Object.seal(WindowManager);
  OSjs.Core.getWindowManager  = function() {
    return _WM;
  };
})(OSjs.Utils, OSjs.API, OSjs.Core.Process, OSjs.Core.Window);

(function(Utils, VFS, API) {
  'use strict';
  var PackageManager = (function() {
    var blacklist = [];
    var packages = {};
    return Object.seal({
      load: function(callback) {
        var self = this;
        callback = callback || {};
        function loadMetadata(cb) {
          self._loadMetadata(function(err) {
            if ( err ) {
              callback(err, false, PackageManager);
              return;
            }
            var len = Object.keys(packages).length;
            if ( len ) {
              cb();
              return;
            }
            callback(false, 'No packages found!', PackageManager);
          });
        }
        loadMetadata(function() {
          self._loadExtensions(function() {
            callback(true, false, PackageManager);
          });
        });
      },
      _loadExtensions: function(callback) {
        var preloads = [];
        Object.keys(packages).forEach(function(k) {
          var iter = packages[k];
          if ( iter.type === 'extension' && iter.sources ) {
            iter.sources.forEach(function(p) {
              preloads.push(p);
            });
          }
        });
        if ( preloads.length ) {
          Utils.preload(preloads, function(total, failed) {
            callback();
          });
        } else {
          callback();
        }
      },
      _loadMetadata: function(callback) {
        var rootURI = API.getBrowserPath().replace(/\/$/, '/packages/'); // FIXME
        function checkEntry(key, iter, scope) {
          iter = Utils.cloneObject(iter);
          iter.type = iter.type || 'application';
          if ( scope ) {
            iter.scope = scope;
          }
          if ( iter.preload ) {
            iter.preload.forEach(function(it) {
              if ( it.src && !it.src.match(/^(\/)|(http)|(ftp)/) ) {
                if ( iter.scope === 'user' ) {
                  it.src = Utils.pathJoin(iter.path, it.src);
                } else {
                  it.src = Utils.pathJoin(rootURI, key, it.src);
                }
              }
            });
          }
          return iter;
        }
        if ( API.isStandalone() || API.getConfig('PackageManager.UseStaticManifest') === true ) {
          var uri = Utils.checkdir(API.getConfig('Connection.MetadataURI'));
          Utils.preload([uri], function(total, failed) {
            if ( failed.length ) {
              callback('Failed to load package manifest', failed);
              return;
            }
            packages = {};
            var list = OSjs.Core.getMetadata();
            Object.keys(list).forEach(function(name) {
              var iter = list[name];
              packages[iter.className] = checkEntry(name, iter);
            });
            callback();
          });
          return;
        }
        var paths = OSjs.Core.getSettingsManager().instance('PackageManager').get('PackagePaths', []);
        API.call('packages', {command: 'list', args: {paths: paths}}, function(err, res) {
          if ( res ) {
            packages = {};
            Object.keys(res).forEach(function(key) {
              var iter = res[key];
              if ( iter && !packages[iter.className] ) {
                packages[iter.className] = checkEntry(key, iter);
              }
            });
          }
          callback();
        });
      },
      generateUserMetadata: function(callback) {
        var self = this;
        var paths = OSjs.Core.getSettingsManager().instance('PackageManager').get('PackagePaths', []);
        API.call('packages', {command: 'cache', args: {action: 'generate', scope: 'user', paths: paths}}, function() {
          self._loadMetadata(callback);
        });
      },
      _addPackages: function(result, scope) {
        var keys = Object.keys(result);
        if ( !keys.length ) {
          return;
        }
        var currLocale = API.getLocale();
        keys.forEach(function(i) {
          var newIter = Utils.cloneObject(result[i]);
          if ( typeof newIter !== 'object' ) {
            return;
          }
          if ( typeof newIter.names !== 'undefined' && newIter.names[currLocale] ) {
            newIter.name = newIter.names[currLocale];
          }
          if ( typeof newIter.descriptions !== 'undefined' && newIter.descriptions[currLocale] ) {
            newIter.description = newIter.descriptions[currLocale];
          }
          if ( !newIter.description ) {
            newIter.description = newIter.name;
          }
          newIter.scope = scope || 'system';
          newIter.type  = newIter.type || 'application';
          packages[i] = newIter;
        });
      },
      install: function(file, root, cb) {
        var self = this;
        var paths = OSjs.Core.getSettingsManager().instance('PackageManager').get('PackagePaths', []);
        if ( typeof root !== 'string' ) {
          root = paths[0];
        }
        var dest = Utils.pathJoin(root, file.filename.replace(/\.zip$/i, ''));
        API.call('packages', {command: 'install', args: {zip: file.path, dest: dest, paths: paths}}, function(e, r) {
          if ( e ) {
            cb(e);
          } else {
            self.generateUserMetadata(cb);
          }
        });
      },
      uninstall: function(file, cb) {
        var self = this;
        API.call('packages', {command: 'uninstall', args: {path: file.path}}, function(e, r) {
          if ( e ) {
            cb(e);
          } else {
            self.generateUserMetadata(cb);
          }
        });
      },
      setBlacklist: function(list) {
        blacklist = list || [];
      },
      getStorePackages: function(opts, callback) {
        var sm = OSjs.Core.getSettingsManager();
        var repos = sm.instance('PackageManager').get('Repositories', []);
        var entries = [];
        Utils.asyncs(repos, function(url, idx, next) {
          API.curl({
            url: url,
            method: 'GET'
          }, function(error, result) {
            if ( !error && result.body ) {
              var list = [];
              if ( typeof result.body === 'string' ) {
                try {
                  list = JSON.parse(result.body);
                } catch ( e ) {}
              }
              entries = entries.concat(list.map(function(iter) {
                iter._repository = url;
                return iter;
              }));
            }
            next();
          });
        }, function() {
          callback(false, entries);
        });
      },
      getPackage: function(name) {
        if ( typeof packages[name] !== 'undefined' ) {
          return Object.freeze(Utils.cloneObject(packages)[name]);
        }
        return false;
      },
      getPackages: function(filtered) {
        var hidden = OSjs.Core.getSettingsManager().instance('PackageManager').get('Hidden', []);
        var p = Utils.cloneObject(packages);
        function allowed(i, iter) {
          if ( blacklist.indexOf(i) >= 0 ) {
            return false;
          }
          if ( iter && (iter.groups instanceof Array) ) {
            if ( !API.checkPermission(iter.groups) ) {
              return false;
            }
          }
          return true;
        }
        if ( typeof filtered === 'undefined' || filtered === true ) {
          var result = {};
          Object.keys(p).forEach(function(name) {
            var iter = p[name];
            if ( !allowed(name, iter) ) {
              return;
            }
            if ( iter && hidden.indexOf(name) < 0 ) {
              result[name] = iter;
            }
          });
          return Object.freeze(result);
        }
        return Object.freeze(p);
      },
      getPackagesByMime: function(mime) {
        var list = [];
        var p = Utils.cloneObject(packages);
        Object.keys(p).forEach(function(i) {
          if ( blacklist.indexOf(i) < 0 ) {
            var a = p[i];
            if ( a && a.mime ) {
              if ( Utils.checkAcceptMime(mime, a.mime) ) {
                list.push(i);
              }
            }
          }
        });
        return list;
      },
      addDummyPackage: function(n, title, icon, fn) {
        if ( packages[n] || OSjs.Applications[n] ) {
          throw new Error('A package already exists with this name!');
        }
        if ( typeof fn !== 'function' ) {
          throw new TypeError('You need to specify a function/callback!');
        }
        packages[n] = Object.seal({
          type: 'application',
          className: n,
          description: title,
          name: title,
          icon: icon,
          cateogry: 'other',
          scope: 'system'
        });
        OSjs.Applications[n] = fn;
      }
    });
  })();
  OSjs.Core.getPackageManager = function() {
    return PackageManager;
  };
})(OSjs.Utils, OSjs.VFS, OSjs.API);

(function(Utils, VFS, API) {
  'use strict';
  var SettingsManager = {
    storage: {},
    defaults: {},
    watches: []
  };
  SettingsManager.init = function(settings) {
    this.storage = settings || {};
  };
  SettingsManager.get = function(pool, key) {
    try {
      if ( this.storage[pool] && Object.keys(this.storage[pool]).length ) {
        return key ? this.storage[pool][key] : this.storage[pool];
      }
      return key ? this.defaults[pool][key] : this.defaults[pool];
    } catch ( e ) {
      console.warn('SettingsManager::get()', 'exception', e, e.stack);
    }
    return false;
  };
  SettingsManager.set = function(pool, key, value, save, triggerWatch) {
    try {
      if ( key ) {
        if ( typeof this.storage[pool] === 'undefined' ) {
          this.storage[pool] = {};
        }
        if ( (['number', 'string']).indexOf(typeof key) >= 0 ) {
          this.storage[pool][key] = value;
        } else {
          console.warn('SettingsManager::set()', 'expects key to be a valid iter, not', key);
        }
      } else {
        this.storage[pool] = value;
      }
    } catch ( e ) {
      console.warn('SettingsManager::set()', 'exception', e, e.stack);
    }
    if ( save ) {
      this.save(pool, save);
    }
    if ( typeof triggerWatch === 'undefined' || triggerWatch === true ) {
      this.changed(pool);
    }
    return true;
  };
  SettingsManager.save = function(pool, callback) {
    if ( typeof callback !== 'function' ) {
      callback = function() {};
    }
    var handler = OSjs.Core.getHandler();
    handler.saveSettings(pool, this.storage, callback);
  };
  SettingsManager.defaults = function(pool, defaults) {
    this.defaults[pool] = defaults;
  };
  SettingsManager.instance = function(pool, defaults) {
    if ( !this.storage[pool] || (this.storage[pool] instanceof Array) ) {
      this.storage[pool] = {};
    }
    var instance = new OSjs.Helpers.SettingsFragment(this.storage[pool], pool);
    if ( arguments.length > 1 ) {
      SettingsManager.defaults(pool, defaults);
      instance.mergeDefaults(defaults);
    }
    return instance;
  };
  SettingsManager.unwatch = function(index) {
    if ( typeof this.watches[index] !== 'undefined' ) {
      delete this.watches[index];
    }
  };
  SettingsManager.watch = function(pool, callback) {
    if ( !this.storage[pool] ) {
      return false;
    }
    var index = this.watches.push({
      pool: pool,
      callback: callback
    });
    return index - 1;
  };
  SettingsManager.changed = function(pool) {
    var self = this;
    this.watches.forEach(function(watch) {
      if ( watch && watch.pool === pool ) {
        watch.callback(self.storage[pool]);
      }
    });
    return this;
  };
  SettingsManager.clear = function(pool, save) {
    save = (typeof save === 'undefined') || (save === true);
    this.set(pool, null, {}, save);
  };
  Object.seal(SettingsManager);
  OSjs.Core.getSettingsManager = function() {
    return SettingsManager;
  };
})(OSjs.Utils, OSjs.VFS, OSjs.API);

(function(Utils, VFS, API) {
  'use strict';
  var DefaultModule = 'User';
  function createMatch(name) {
    return new RegExp('^' + name.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'));
  }
  var MountManager = (function() {
    var _queue = [];
    var _inited = false;
    var _modules = {};
    return Object.seal({
      _create: function(params) {
        var target = VFS.Transports[params.transport];
        if ( target && typeof target.defaults === 'function' ) {
          target.defaults(params);
        }
        function _checkReadOnly(name, params, args) {
          if ( params.readOnly ) {
            var restricted = ['upload', 'unlink', 'write', 'mkdir', 'move', 'trash', 'untrash', 'emptyTrash'];
            if ( name === 'copy' ) {
              var dest = MountManager.getModuleFromPath(args[1].path, false, true);
              return dest.internal !== params.internal;
            }
            if ( restricted.indexOf(name) !== -1 ) {
              return true;
            }
          }
          return false;
        }
        var mparams = (function() {
          var o = {};
          Object.keys(params).forEach(function(k) {
            if ( typeof params[k] !== 'function' ) {
              o[k] = params[k];
            }
          });
          return Object.freeze(o);
        })();
        var cfg = Utils.argumentDefaults(params, {
          request: function(name, args, callback, options) {
            callback = callback || function() {
              console.warn('NO CALLBACK FUNCTION WAS ASSIGNED IN VFS REQUEST');
            };
            if ( !target ) {
              callback(API._('ERR_VFSMODULE_INVALID_TYPE_FMT', params.transport));
              return;
            }
            if ( _checkReadOnly(name, params, args) ) {
              callback(API._('ERR_VFSMODULE_READONLY'));
              return;
            }
            var module = target.module || {};
            if ( !module[name] ) {
              callback(API._('ERR_VFS_UNAVAILABLE'));
              return;
            }
            var fargs = args || [];
            fargs.push(callback);
            fargs.push(options);
            fargs.push(mparams);
            module[name].apply(module, fargs);
          },
          unmount: function(cb) {
            (cb || function() {})(API._('ERR_VFS_UNAVAILABLE'), false);
          },
          mounted: function() {
            return true;
          },
          enabled: function() {
            return true;
          }
        });
        return cfg;
      },
      _add: function(opts, emitEvent) {
        if ( _inited ) {
          _modules[opts.name] = Object.seal(opts);
          if ( emitEvent ) {
            API.message('vfs:mount', opts.name, {source: null});
          }
        } else {
          _queue.push(arguments);
        }
      },
      init: function(callback) {
        if ( _inited ) {
          callback();
          return;
        }
        _inited = true;
        _queue.forEach(function(i) {
          var add = MountManager._create.apply(MountManager, i);
          MountManager._add(add, false);
        });
        var config = API.getConfig('VFS.Mountpoints', {});
        Object.keys(config).forEach(function(key) {
          var iter = config[key];
          if ( iter.enabled !== false ) {
            var mp = MountManager._create({
              readOnly: (typeof iter.readOnly === 'undefined') ? false : (iter.readOnly === true),
              name: key,
              transport: iter.transport || 'Internal',
              description: iter.description || key,
              icon: iter.icon || 'devices/harddrive.png',
              root: key + ':///',
              options: iter.options,
              visible: iter.visible !== false,
              internal: true,
              searchable: true,
              match: createMatch(key + '://')
            });
            MountManager._add(mp, false);
          }
        });
        _queue = [];
        callback();
      },
      restore: function(callback) {
        var sm = OSjs.Core.getSettingsManager();
        Utils.asyncs(sm.instance('VFS').get('mounts', []), function(iter, idx, next) {
          try {
            MountManager.add(iter, next);
          } catch ( e ) {
            console.warn('MountManager::restore()', e, e.stack);
            next();
          }
        }, function() {
          callback();
        });
      },
      add: function(opts, cb) {
        opts = Utils.argumentDefaults(opts, {
          description: 'My VFS Module',
          transport: 'Internal',
          name: 'MyModule',
          icon: 'places/server.png',
          searchable: false,
          visible: true,
          readOnly: false
        });
        if ( _modules[opts.name] ) {
          throw new Error(API._('ERR_VFSMODULE_ALREADY_MOUNTED_FMT', opts.name));
        }
        if ( opts.transport.toLowerCase() === 'owndrive' ) {
          opts.transport = 'WebDAV';
        }
        var modulePath = opts.name.replace(/\s/g, '-').toLowerCase() + '://';
        var moduleRoot = modulePath + '/';
        var moduleMatch = createMatch(modulePath);
        var moduleOptions = opts.options || {};
        var module = (function createMountpointModule() {
          var isMounted = true;
          return MountManager._create({
            readOnly: opts.readOnly,
            transport: opts.transport,
            name: opts.name,
            description: opts.description,
            visible: opts.visible,
            dynamic: true,
            unmount: function(cb) {
              isMounted = false;
              API.message('vfs:unmount', opts.name, {source: null});
              (cb || function() {})(false, true);
            },
            mounted: function() {
              return isMounted;
            },
            root: moduleRoot,
            icon: opts.icon,
            match: moduleMatch,
            options: moduleOptions
          });
        })();
        var validModule = (function() {
          if ( Object.keys(VFS.Transports).indexOf(opts.transport) < 0 ) {
            return 'No such transport \'' + opts.transport + '\'';
          }
          if ( opts.transport === 'WebDAV' && !moduleOptions.username ) {
            return 'Connection requires username (authorization)';
          }
          return true;
        })();
        if ( validModule !== true ) {
          throw new Error(API._('ERR_VFSMODULE_INVALID_CONFIG_FMT', validModule));
        }
        MountManager._add(module, true);
        (cb || function() {})(false, true);
      },
      remove: function(moduleName, cb) {
        if ( !_modules[moduleName] ) {
          throw new Error(API._('ERR_VFSMODULE_NOT_MOUNTED_FMT', moduleName));
        }
        _modules[moduleName].unmount(function() {
          delete _modules[moduleName];
          cb.apply(MountManager, arguments);
        });
      },
      isInternal: function isInternalModule(test) {
        test = test || '';
        var m = _modules;
        var d = null;
        if ( test !== null ) {
          Object.keys(m).forEach(function(name) {
            if ( d !== true ) {
              var i = m[name];
              if ( i.internal === true && i.match && test.match(i.match) ) {
                d = true;
              }
            }
          });
        }
        return d;
      },
      isInternalEnabled: function(module) {
        try {
          if ( API.getConfig('VFS.Internal.' + module + '.enabled') === false ) {
            return false;
          }
        } catch ( e ) {}
        return true;
      },
      getModules: function(opts) {
        opts = Utils.argumentDefaults(opts, {
          visible: true,
          special: false
        });
        var m = _modules;
        var a = [];
        Object.keys(m).forEach(function(name) {
          var iter = m[name];
          if ( !iter.enabled() || (!opts.special && iter.special) ) {
            return;
          }
          if ( opts.visible && iter.visible === opts.visible ) {
            a.push({
              name: name,
              module: iter
            });
          }
        });
        return a;
      },
      getModule: function(name) {
        return _modules[name];
      },
      getModuleFromPath: function getModuleFromPath(test, retdef, retobj) {
        retdef = typeof retdef === 'undefined' ? true : (retdef === true);
        var d = null;
        if ( typeof test === 'string' ) {
          Object.keys(_modules).forEach(function(name) {
            if ( d === null ) {
              var i = _modules[name];
              if ( i.enabled() === true && i.match && test.match(i.match) ) {
                d = name;
              }
            }
          });
        }
        var moduleName = d || (retdef ? DefaultModule : null);
        return retobj ? _modules[moduleName] : moduleName;
      },
      getRootFromPath: function getRootFromPath(path) {
        return MountManager.getModuleFromPath(path, false, true).root;
      },
      getModuleProperty: function(module, property) {
        if ( typeof module === 'string' ) {
          module = _modules[module];
        }
        return module[property];
      }
    });
  })();
  OSjs.Core.getMountManager = function() {
    return MountManager;
  };
})(OSjs.Utils, OSjs.VFS, OSjs.API);

(function(Utils, VFS, API) {
  'use strict';
  function search(list, query) {
    var result = [];
    list.forEach(function(obj) {
      var found = false;
      obj.fields.forEach(function(s) {
        if ( found ) {
          return;
        }
        var qry = String(query).toLowerCase();
        var str = String(s).toLowerCase();
        if ( str.indexOf(qry) !== -1 ) {
          result.push(obj.value);
          found = true;
        }
      });
    });
    return result;
  }
  function SearchObject(obj) {
    var self = this;
    Object.keys(obj).forEach(function(k) {
      self[k] = obj[k];
    });
  }
  var ApplicationModule = (function() {
    function query() {
      var packages = OSjs.Core.getPackageManager().getPackages();
      return Object.keys(packages).map(function(pn) {
        var p = packages[pn];
        return new SearchObject({
          value: {
            title: p.name,
            description: p.description,
            icon: API.getIcon(p.icon, '16x16', p),
            launch: {application: pn, args: {}}
          },
          fields: [
            p.className,
            p.name,
            p.description
          ]
        });
      });
    }
    return {
      search: function(q, args, settings, cb) {
        if ( settings.applications ) {
          var results = search(query(), q);
          if ( args.limit && results.length > args.dlimit ) {
            results = results.splice(0, args.dlimit);
          }
          cb(false, results);
        } else {
          cb(false, []);
        }
      },
      reindex: function(args, cb) {
        cb(false, true);
      },
      destroy: function() {
      }
    };
  })();
  var FilesystemModule = {
    search: function(q, args, settings, cb) {
      if ( !settings.files || !settings.paths ) {
        cb(false, []);
        return;
      }
      var found = [];
      Utils.asyncs(settings.paths, function(e, i, n) {
        VFS.find(e, {query: q, limit: (args.limit ? args.dlimit : 0), recursive: args.recursive}, function(error, result) {
          if ( error ) {
            console.warn(error);
          }
          if ( result ) {
            var list = result.map(function(iter) {
              return {
                title: iter.filename,
                description: iter.path,
                icon: API.getFileIcon(new VFS.File(iter)),
                launch: {application: '', args: '', file: iter}
              };
            });
            found = found.concat(list);
          }
          n();
        });
      }, function() {
        cb(false, found);
      });
    },
    reindex: function(args, cb) {
      cb(false, true);
    },
    destroy: function() {
    }
  };
  var SearchEngine = (function() {
    var modules = [
      ApplicationModule,
      FilesystemModule
    ];
    var settings = {};
    var inited = false;
    return Object.seal({
      init: function(cb) {
        if ( inited ) {
          return;
        }
        var manager = OSjs.Core.getSettingsManager();
        settings = manager.get('SearchEngine') || {};
        inited = true;
        cb();
      },
      destroy: function() {
        modules.forEach(function(m) {
          m.destroy();
        });
        modules = [];
        settings = {};
      },
      search: function(q, args, cb) {
        var result = [];
        var errors = [];
        args = Utils.argumentDefaults(args, {
          recursive: false,
          limit: 0,
          dlimit: 0
        });
        if ( args.limit ) {
          args.dlimit = args.limit;
        }
        Utils.asyncs(modules, function(module, index, next) {
          if ( !args.limit || args.dlimit > 0 ) {
            module.search(q, args, settings, function(err, res) {
              if ( err ) {
                errors.push(err);
              } else {
                args.dlimit -= res.length;
                result = result.concat(res);
              }
              next();
            });
          } else {
            cb(errors, result);
          }
        }, function() {
          cb(errors, result);
        });
      },
      reindex: function(args, cb) {
        var errors = [];
        Utils.asyncs(modules, function(module, index, next) {
          module.reindex(args, function(err, res) {
            if ( err ) {
              errors.push(err);
            }
            next();
          });
        }, function() {
          cb(errors, true);
        });
      },
      configure: function(opts, save) {
      }
    });
  })();
  OSjs.Core.getSearchEngine = function() {
    return SearchEngine;
  };
})(OSjs.Utils, OSjs.VFS, OSjs.API);

(function(API, Utils, VFS, GUI) {
  'use strict';
  GUI.Helpers = GUI.Helpers || {};
  GUI.Helpers.getWindowId = function getWindowId(el) {
    while ( el.parentNode ) {
      var attr = el.getAttribute('data-window-id');
      if ( attr !== null ) {
        return parseInt(attr, 10);
      }
      el = el.parentNode;
    }
    return null;
  };
  GUI.Helpers.getLabel = function getLabel(el) {
    var label = el.getAttribute('data-label');
    return label || '';
  };
  GUI.Helpers.getValueLabel = function getValueLabel(el, attr) {
    var label = attr ? el.getAttribute('data-label') : null;
    if ( el.childNodes.length && el.childNodes[0].nodeType === 3 && el.childNodes[0].nodeValue ) {
      label = el.childNodes[0].nodeValue;
      Utils.$empty(el);
    }
    return label || '';
  };
  GUI.Helpers.getViewNodeValue = function getViewNodeValue(el) {
    var value = el.getAttribute('data-value');
    if ( typeof value === 'string' && value.match(/^\[|\{/) ) {
      try {
        value = JSON.parse(value);
      } catch ( e ) {
        value = null;
      }
    }
    return value;
  };
  GUI.Helpers.getIcon = function getIcon(el, win) {
    var image = el.getAttribute('data-icon');
    if ( image && image !== 'undefined') {
      if ( image.match(/^stock:\/\//) ) {
        image = image.replace('stock://', '');
        var size  = '16x16';
        try {
          var spl = image.split('/');
          var tmp = spl.shift();
          var siz = tmp.match(/^\d+x\d+/);
          if ( siz ) {
            size = siz[0];
            image = spl.join('/');
          }
          image = API.getIcon(image, size);
        } catch ( e ) {}
      } else if ( image.match(/^app:\/\//) ) {
        image = API.getApplicationResource(win._app, image.replace('app://', ''));
      }
      return image;
    }
    return null;
  };
  GUI.Helpers.getProperty = function getProperty(el, param, tagName) {
    tagName = tagName || el.tagName.toLowerCase();
    var isDataView = tagName.match(/^gui\-(tree|icon|list|file)\-view$/);
    if ( param === 'value' && !isDataView) {
      if ( (['gui-text', 'gui-password', 'gui-textarea', 'gui-slider', 'gui-select', 'gui-select-list']).indexOf(tagName) >= 0 ) {
        return el.querySelector('input, textarea, select').value;
      }
      if ( (['gui-checkbox', 'gui-radio', 'gui-switch']).indexOf(tagName) >= 0 ) {
        return !!el.querySelector('input').checked;
      }
      return null;
    }
    if ( (param === 'value' || param === 'selected') && isDataView ) {
      return GUI.Elements[tagName].values(el);
    }
    return el.getAttribute('data-' + param);
  };
  GUI.Helpers.setProperty = function setProperty(el, param, value, tagName) {
    tagName = tagName || el.tagName.toLowerCase();
    function _setKnownAttribute(i, k, v, a) {
      if ( v ) {
        i.setAttribute(k, k);
      } else {
        i.removeAttribute(k);
      }
      if ( a ) {
        el.setAttribute('aria-' + k, String(value === true));
      }
    }
    function _setValueAttribute(i, k, v) {
      if ( typeof v === 'object' ) {
        try {
          v = JSON.stringify(value);
        } catch ( e ) {}
      }
      i.setAttribute(k, String(v));
    }
    var inner = el.children[0];
    var accept = ['gui-slider', 'gui-text', 'gui-password', 'gui-textarea', 'gui-checkbox', 'gui-radio', 'gui-select', 'gui-select-list', 'gui-button'];
    (function() {
      var firstChild;
      var params = {
        readonly: function() {
          _setKnownAttribute(firstChild, 'readonly', value, true);
        },
        disabled: function() {
          _setKnownAttribute(firstChild, 'disabled', value, true);
        },
        value: function() {
          if ( tagName === 'gui-radio' || tagName === 'gui-checkbox' ) {
            _setKnownAttribute(firstChild, 'checked', value);
            firstChild.checked = !!value;
          }
          firstChild.value = value;
        },
        label: function() {
          el.appendChild(firstChild);
          Utils.$remove(el.querySelector('label'));
          GUI.Helpers.createInputLabel(el, tagName.replace(/^gui\-/, ''), firstChild, value);
        }
      };
      if ( accept.indexOf(tagName) >= 0 ) {
        firstChild = el.querySelector('textarea, input, select, button');
        if ( firstChild ) {
          if ( params[param] ) {
            params[param]();
          } else {
            _setValueAttribute(firstChild, param, value || '');
          }
        }
      }
    })();
    accept = ['gui-image', 'gui-audio', 'gui-video'];
    if ( (['src', 'controls', 'autoplay', 'alt']).indexOf(param) >= 0 && accept.indexOf(tagName) >= 0 ) {
      inner[param] = value;
    }
    if ( (['_id', '_class', '_style']).indexOf(param) >= 0 ) {
      inner.setAttribute(param.replace(/^_/, ''), value);
      return;
    }
    if ( param !== 'value' ) {
      _setValueAttribute(el, 'data-' + param, value);
    }
  };
  GUI.Helpers.createInputLabel = function createInputLabel(el, type, input, label) {
    label = label || GUI.Helpers.getLabel(el);
    if ( label ) {
      var lbl = document.createElement('label');
      var span = document.createElement('span');
      span.appendChild(document.createTextNode(label));
      if ( type === 'checkbox' || type === 'radio' ) {
        lbl.appendChild(input);
        lbl.appendChild(span);
      } else {
        lbl.appendChild(span);
        lbl.appendChild(input);
      }
      el.appendChild(lbl);
    } else {
      el.appendChild(input);
    }
  };
  GUI.Helpers.createElement = function createElement(tagName, params, ignoreParams) {
    ignoreParams = ignoreParams || [];
    var el = document.createElement(tagName);
    var classMap = {
      textalign: function(v) {
        Utils.$addClass(el, 'gui-align-' + v);
      },
      className: function(v) {
        Utils.$addClass(el, v);
      }
    };
    function getValue(k, value) {
      if ( typeof value === 'boolean' ) {
        value = value ? 'true' : 'false';
      } else if ( typeof value === 'object' ) {
        try {
          value = JSON.stringify(value);
        } catch ( e ) {}
      }
      return value;
    }
    if ( typeof params === 'object' ) {
      Object.keys(params).forEach(function(k) {
        if ( ignoreParams.indexOf(k) >= 0 ) {
          return;
        }
        var value = params[k];
        if ( typeof value !== 'undefined' && typeof value !== 'function' ) {
          if ( classMap[k] ) {
            classMap[k](value);
            return;
          }
          var fvalue = getValue(k, value);
          el.setAttribute('data-' + k, fvalue);
        }
      });
    }
    return el;
  };
  GUI.Helpers.setFlexbox = function setFlexbox(el, grow, shrink, basis, checkel) {
    checkel = checkel || el;
    (function() {
      if ( typeof basis === 'undefined' || basis === null ) {
        basis = checkel.getAttribute('data-basis') || 'auto';
      }
    })();
    (function() {
      if ( typeof grow === 'undefined' || grow === null ) {
        grow = checkel.getAttribute('data-grow') || 0;
      }
    })();
    (function() {
      if ( typeof shrink === 'undefined' || shrink === null ) {
        shrink = checkel.getAttribute('data-shrink') || 0;
      }
    })();
    var flex = [grow, shrink];
    if ( basis.length ) {
      flex.push(basis);
    }
    var style = flex.join(' ');
    el.style.WebkitBoxFlex = style;
    el.style.MozBoxFlex = style;
    el.style.WebkitFlex = style;
    el.style.MozFlex = style;
    el.style.MSFlex = style;
    el.style.OFlex = style;
    el.style.flex = style;
    var align = el.getAttribute('data-align');
    Utils.$removeClass(el, 'gui-flex-align-start');
    Utils.$removeClass(el, 'gui-flex-align-end');
    if ( align ) {
      Utils.$addClass(el, 'gui-flex-align-' + align);
    }
  };
  OSjs.GUI.Helpers.createDrag = function createDrag(el, onDown, onMove, onUp) {
    onDown = onDown || function() {};
    onMove = onMove || function() {};
    onUp = onUp || function() {};
    var startX, startY, currentX, currentY;
    var dragging = false;
    function _onMouseDown(ev, pos, touchDevice) {
      ev.preventDefault();
      startX = pos.x;
      startY = pos.y;
      onDown(ev, {x: startX, y: startY});
      dragging = true;
      Utils.$bind(window, 'mouseup:guidrag', _onMouseUp, false);
      Utils.$bind(window, 'mousemove:guidrag', _onMouseMove, false);
    }
    function _onMouseMove(ev, pos, touchDevice) {
      ev.preventDefault();
      if ( dragging ) {
        currentX = pos.x;
        currentY = pos.y;
        var diffX = currentX - startX;
        var diffY = currentY - startY;
        onMove(ev, {x: diffX, y: diffY}, {x: currentX, y: currentY});
      }
    }
    function _onMouseUp(ev, pos, touchDevice) {
      onUp(ev, {x: currentX, y: currentY});
      dragging = false;
      Utils.$unbind(window, 'mouseup:guidrag');
      Utils.$unbind(window, 'mousemove:guidrag');
    }
    Utils.$bind(el, 'mousedown', _onMouseDown, false);
  };
  GUI.Helpers.getNextElement = function getNextElement(prev, current, root) {
    function getElements() {
      var ignore_roles = ['menu', 'menuitem', 'grid', 'gridcell', 'listitem'];
      var list = [];
      root.querySelectorAll('.gui-element').forEach(function(e) {
        if ( Utils.$hasClass(e, 'gui-focus-element') || ignore_roles.indexOf(e.getAttribute('role')) >= 0 || e.getAttribute('data-disabled') === 'true' ) {
          return;
        }
        if ( e.offsetParent ) {
          list.push(e);
        }
      });
      return list;
    }
    function getCurrentIndex(els, m) {
      var found = -1;
      if ( m ) {
        els.every(function(e, idx) {
          if ( e === m ) {
            found = idx;
          }
          return found === -1;
        });
      }
      return found;
    }
    function getCurrentParent(els, m) {
      if ( m ) {
        var cur = m;
        while ( cur.parentNode ) {
          if ( Utils.$hasClass(cur, 'gui-element') ) {
            return cur;
          }
          cur = cur.parentNode;
        }
        return null;
      }
      return els[0];
    }
    function getNextIndex(els, p, i) {
      if ( prev ) {
        i = (i <= 0) ? (els.length) - 1 : (i - 1);
      } else {
        i = (i >= (els.length - 1)) ? 0 : (i + 1);
      }
      return i;
    }
    function getNext(els, i) {
      var next = els[i];
      if ( next.tagName.match(/^GUI\-(BUTTON|TEXT|PASSWORD|SWITCH|CHECKBOX|RADIO|SELECT)/) ) {
        next = next.querySelectorAll('input, textarea, button, select')[0];
      }
      if ( next.tagName === 'GUI-FILE-VIEW' ) {
        next = next.children[0];
      }
      return next;
    }
    if ( root ) {
      var elements = getElements();
      if ( elements.length ) {
        var currentParent = getCurrentParent(elements, current);
        var currentIndex = getCurrentIndex(elements, currentParent);
        if ( currentIndex >= 0 ) {
          var nextIndex = getNextIndex(elements, currentParent, currentIndex);
          return getNext(elements, nextIndex);
        }
      }
    }
    return null;
  };
  GUI.Helpers.createDraggable = function createDraggable(el, args) {
    args = OSjs.Utils.argumentDefaults(args, {
      type       : null,
      effect     : 'move',
      data       : null,
      mime       : 'application/json',
      dragImage  : null,
      onStart    : function() {
        return true;
      },
      onEnd      : function() {
        return true;
      }
    });
    if ( OSjs.Utils.isIE() ) {
      args.mime = 'text';
    }
    function _toString(mime) {
      return JSON.stringify({
        type:   args.type,
        effect: args.effect,
        data:   args.data,
        mime:   args.mime
      });
    }
    function _dragStart(ev) {
      try {
        ev.dataTransfer.effectAllowed = args.effect;
        if ( args.dragImage && (typeof args.dragImage === 'function') ) {
          if ( ev.dataTransfer.setDragImage ) {
            var dragImage = args.dragImage(ev, el);
            if ( dragImage ) {
              var dragEl    = dragImage.element;
              var dragPos   = dragImage.offset;
              document.body.appendChild(dragEl);
              ev.dataTransfer.setDragImage(dragEl, dragPos.x, dragPos.y);
            }
          }
        }
        ev.dataTransfer.setData(args.mime, _toString(args.mime));
      } catch ( e ) {
        console.warn('Failed to dragstart: ' + e);
        console.warn(e.stack);
      }
    }
    el.setAttribute('draggable', 'true');
    el.setAttribute('aria-grabbed', 'false');
    Utils.$bind(el, 'dragstart', function(ev) {
      this.setAttribute('aria-grabbed', 'true');
      this.style.opacity = '0.4';
      if ( ev.dataTransfer ) {
        _dragStart(ev);
      }
      return args.onStart(ev, this, args);
    }, false);
    Utils.$bind(el, 'dragend', function(ev) {
      this.setAttribute('aria-grabbed', 'false');
      this.style.opacity = '1.0';
      return args.onEnd(ev, this, args);
    }, false);
  };
  GUI.Helpers.createDroppable = function createDroppable(el, args) {
    args = OSjs.Utils.argumentDefaults(args, {
      accept         : null,
      effect         : 'move',
      mime           : 'application/json',
      files          : true,
      onFilesDropped : function() {
        return true;
      },
      onItemDropped  : function() {
        return true;
      },
      onEnter        : function() {
        return true;
      },
      onOver         : function() {
        return true;
      },
      onLeave        : function() {
        return true;
      },
      onDrop         : function() {
        return true;
      }
    });
    if ( OSjs.Utils.isIE() ) {
      args.mime = 'text';
    }
    function getParent(start, matcher) {
      if ( start === matcher ) {
        return true;
      }
      var i = 10;
      while ( start && i > 0 ) {
        if ( start === matcher ) {
          return true;
        }
        start = start.parentNode;
        i--;
      }
      return false;
    }
    function _onDrop(ev, el) {
      ev.stopPropagation();
      ev.preventDefault();
      args.onDrop(ev, el);
      if ( !ev.dataTransfer ) {
        return true;
      }
      if ( args.files ) {
        var files = ev.dataTransfer.files;
        if ( files && files.length ) {
          return args.onFilesDropped(ev, el, files, args);
        }
      }
      var data;
      try {
        data = ev.dataTransfer.getData(args.mime);
      } catch ( e ) {
        console.warn('Failed to drop: ' + e);
      }
      if ( data ) {
        var item = JSON.parse(data);
        if ( args.accept === null || args.accept === item.type ) {
          return args.onItemDropped(ev, el, item, args);
        }
      }
      return false;
    }
    el.setAttribute('aria-dropeffect', args.effect);
    Utils.$bind(el, 'drop', function(ev) {
      return _onDrop(ev, this);
    }, false);
    Utils.$bind(el, 'dragenter', function(ev) {
      return args.onEnter.call(this, ev, this, args);
    }, false);
    Utils.$bind(el, 'dragover', function(ev) {
      ev.preventDefault();
      if ( !getParent(ev.target, el) ) {
        return false;
      }
      ev.stopPropagation();
      ev.dataTransfer.dropEffect = args.effect;
      return args.onOver.call(this, ev, this, args);
    }, false);
    Utils.$bind(el, 'dragleave', function(ev) {
      return args.onLeave.call(this, ev, this, args);
    }, false);
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  function parseDynamic(scheme, node, win, args) {
    args = args || {};
    var translator = args._ || API._;
    node.querySelectorAll('*[data-label]').forEach(function(el) {
      var label = translator(el.getAttribute('data-label'));
      el.setAttribute('data-label', label);
    });
    node.querySelectorAll('gui-label, gui-button, gui-list-view-column, gui-select-option, gui-select-list-option').forEach(function(el) {
      if ( !el.children.length && !el.getAttribute('data-no-translate') ) {
        var lbl = GUI.Helpers.getValueLabel(el);
        el.appendChild(document.createTextNode(translator(lbl)));
      }
    });
    node.querySelectorAll('gui-button').forEach(function(el) {
      var label = GUI.Helpers.getValueLabel(el);
      if ( label ) {
        el.appendChild(document.createTextNode(API._(label)));
      }
    });
    node.querySelectorAll('*[data-icon]').forEach(function(el) {
      var image = GUI.Helpers.getIcon(el, win);
      el.setAttribute('data-icon', image);
    });
    node.querySelectorAll('*[data-src]').forEach(function(el) {
      var old = el.getAttribute('data-src') || '';
      if ( win._app && old.match(/^app:\/\//) ) {
        var source = API.getApplicationResource(win._app, old.replace('app://', ''));
        el.setAttribute('data-src', source);
      }
    });
  }
  function addChildren(frag, root, before) {
    if ( frag ) {
      var children = frag.children;
      var i = 0;
      while ( children.length && i < 10000 ) {
        if ( before ) {
          root.parentNode.insertBefore(children[0], root);
        } else {
          root.appendChild(children[0]);
        }
        i++;
      }
    }
  }
  function resolveFragments(scheme, node) {
    function _resolve() {
      var nodes = node.querySelectorAll('gui-fragment');
      if ( nodes.length ) {
        nodes.forEach(function(el) {
          var id = el.getAttribute('data-fragment-id');
          if ( id ) {
            var frag = scheme.getFragment(id, 'application-fragment');
            if ( frag ) {
              addChildren(frag.cloneNode(true), el.parentNode);
            } else {
              console.warn('Fragment', id, 'not found');
            }
          }
          Utils.$remove(el); // Or else we'll never get out of the loop!
        });
        return true;
      }
      return false;
    }
    if ( scheme ) {
      var resolving = true;
      while ( resolving ) {
        resolving = _resolve();
      }
    }
  }
  function removeSelfClosingTags(str) {
    var split = (str || '').split('/>');
    var newhtml = '';
    for (var i = 0; i < split.length - 1;i++) {
      var edsplit = split[i].split('<');
      newhtml += split[i] + '></' + edsplit[edsplit.length - 1].split(' ')[0] + '>';
    }
    return newhtml + split[split.length - 1];
  }
  function cleanScheme(html) {
    return Utils.cleanHTML(removeSelfClosingTags(html));
  }
  function resolveExternalFragments(root, html, cb) {
    var doc = document.createElement('div');
    doc.innerHTML = html;
    var nodes = doc.querySelectorAll('gui-fragment[data-fragment-external]');
    Utils.asyncs(nodes.map(function(el) {
      return {
        element: el,
        uri: el.getAttribute('data-fragment-external')
      };
    }), function(iter, index, next) {
      var uri = iter.uri.replace(/^\//, '');
      if ( uri.length < 3 ) {
        console.warn('resolveExternalFragments()', 'invalid', iter);
        return next();
      }
      Utils.ajax({
        url: Utils.pathJoin(root, uri),
        onsuccess: function(h) {
          var tmp = document.createElement('div');
          tmp.innerHTML = cleanScheme(h);
          addChildren(tmp, iter.element, iter.element);
          tmp = next();
        },
        onerror: function() {
          next();
        }
      });
    }, function() {
      cb(doc.innerHTML);
      doc = null;
      nodes = null;
    });
  }
  function UIScheme(url) {
    this.url = url;
    this.scheme = null;
    this.triggers = {render: []};
  }
  UIScheme.prototype.destroy = function() {
    Utils.$empty(this.scheme);
    this.scheme = null;
    this.triggers = {};
  };
  UIScheme.prototype.on = function(f, fn) {
    this.triggers[f].push(fn);
  };
  UIScheme.prototype._trigger = function(f, args) {
    args = args || [];
    var self = this;
    if ( this.triggers[f] ) {
      this.triggers[f].forEach(function(fn) {
        fn.apply(self, args);
      });
    }
  };
  UIScheme.prototype._load = function(html) {
    var doc = document.createDocumentFragment();
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    doc.appendChild(wrapper);
    this.scheme = doc.cloneNode(true);
    wrapper = null;
    doc = null;
  };
  UIScheme.prototype.loadString = function(html, cb) {
    this._load(cleanScheme(html));
    if ( cb ) {
      cb(false, this.scheme);
    }
  };
  UIScheme.prototype.load = function(cb, cbxhr) {
    cbxhr = cbxhr || function() {};
    var self = this;
    var src = this.url;
    if ( src.substr(0, 1) !== '/' && !src.match(/^(https?|ftp)/) ) {
      src = window.location.pathname + src;
    }
    var root = Utils.dirname(src);
    Utils.ajax({
      url: src,
      onsuccess: function(html) {
        html = cleanScheme(html);
        resolveExternalFragments(root, html, function(result) {
          cbxhr(false, result);
          self._load(result);
          cb(false, self.scheme);
        });
      },
      onerror: function() {
        cb('Failed to fetch scheme');
        cbxhr(true);
      }
    });
  };
  UIScheme.prototype.getFragment = function(id, type) {
    var content = null;
    if ( id ) {
      if ( type ) {
        content = this.scheme.querySelector(type + '[data-id="' + id + '"]');
      } else {
        content = this.scheme.querySelector('application-window[data-id="' + id + '"]') ||
                  this.scheme.querySelector('application-fragment[data-id="' + id + '"]');
      }
    }
    return content;
  };
  UIScheme.prototype.parse = function(id, type, win, onparse, args) {
    var content = this.getFragment(id, type);
    if ( !content ) {
      console.error('UIScheme::parse()', 'No fragment found', id + '@' + type);
      return null;
    }
    type = type || content.tagName.toLowerCase();
    if ( content ) {
      var node = content.cloneNode(true);
      UIScheme.parseNode(this, win, node, type, args, onparse, id);
      return node;
    }
    return null;
  };
  UIScheme.prototype.render = function(win, id, root, type, onparse, args) {
    root = root || win._getRoot();
    if ( root instanceof GUI.Element ) {
      root = root.$element;
    }
    function setWindowProperties(frag) {
      if ( frag ) {
        var width = parseInt(frag.getAttribute('data-width'), 10) || 0;
        var height = parseInt(frag.getAttribute('data-height'), 10) || 0;
        var allow_maximize = frag.getAttribute('data-allow_maximize');
        var allow_minimize = frag.getAttribute('data-allow_minimize');
        var allow_close = frag.getAttribute('data-allow_close');
        var allow_resize = frag.getAttribute('data-allow_resize');
        if ( (!isNaN(width) && width > 0) || (!isNaN(height) && height > 0) ) {
          win._resize(width, height);
        }
        win._setProperty('allow_maximize', allow_maximize);
        win._setProperty('allow_minimize', allow_minimize);
        win._setProperty('allow_close', allow_close);
        win._setProperty('allow_resize', allow_resize);
      }
    }
    var content = this.parse(id, type, win, onparse, args);
    addChildren(content, root);
    root.querySelectorAll('application-fragment').forEach(function(e) {
      Utils.$remove(e);
    });
    if ( !win._restored ) {
      setWindowProperties(this.getFragment(id));
    }
    this._trigger('render', [root]);
  };
  UIScheme.prototype.create = function(win, tagName, params, parentNode, applyArgs) {
    tagName = tagName || '';
    params = params || {};
    parentNode = parentNode || win._getRoot();
    if ( parentNode instanceof GUI.Element ) {
      parentNode = parentNode.$element;
    }
    var el;
    if ( GUI.Elements[tagName] && GUI.Elements[tagName].create ) {
      el = GUI.Elements[tagName].create(params);
    } else {
      el = GUI.Helpers.createElement(tagName, params);
    }
    parentNode.appendChild(el);
    GUI.Elements[tagName].build(el, applyArgs, win);
    return this.get(el);
  };
  UIScheme.prototype.find = function(win, id, root) {
    root = this._findRoot(win, root);
    var res = this._findDOM(win, id, root);
    return this.get(res.el, res.q);
  };
  UIScheme.prototype.findByQuery = function(win, query, root, all) {
    root = this._findRoot(win, root);
    var el;
    var self = this;
    if ( all ) {
      el = root.querySelectorAll(query).map(function(e) {
        return self.get(e, query);
      });
    }
    el = root.querySelector(query);
    return this.get(el, query);
  };
  UIScheme.prototype.findDOM = function(win, id, root) {
    root = this._findRoot(win, root);
    return this._findDOM(win, id, root).el;
  };
  UIScheme.prototype._findRoot = function(win, root) {
    if ( !(win instanceof OSjs.Core.Window) ) {
      throw new Error('UIScheme::_findDOM() expects a instance of Window');
    }
    return root || win._getRoot();
  };
  UIScheme.prototype._findDOM = function(win, id, root) {
    var q = '[data-id="' + id + '"]';
    return {
      q: q,
      el: root.querySelector(q)
    };
  };
  UIScheme.prototype.get = function(el, q) {
    return UIScheme.getElementInstance(el, q);
  };
  UIScheme.prototype.getHTML = function() {
    return this.scheme.firstChild.innerHTML;
  };
  UIScheme.parseNode = function(scheme, win, node, type, args, onparse, id) {
    onparse = onparse || function() {};
    args = args || {};
    type = type || 'snipplet';
    if ( args.resolve !== false ) {
      resolveFragments(scheme, node);
    }
    node.querySelectorAll('*').forEach(function(el) {
      var lcase = el.tagName.toLowerCase();
      if ( lcase.match(/^gui\-/) && !lcase.match(/(\-container|\-(h|v)box|\-columns?|\-rows?|(status|tool)bar|(button|menu)\-bar|bar\-entry)$/) ) {
        Utils.$addClass(el, 'gui-element');
      }
    });
    parseDynamic(scheme, node, win, args);
    onparse(node);
    Object.keys(GUI.Elements).forEach(function(key) {
      node.querySelectorAll(key).forEach(function(pel) {
        if ( pel._wasParsed ) {
          return;
        }
        try {
          GUI.Elements[key].build(pel);
        } catch ( e ) {
          console.warn('parseNode()', id, type, win, 'exception');
          console.warn(e, e.stack);
        }
        pel._wasParsed = true;
      });
    });
  };
  UIScheme.getElementInstance = function(el, q) {
    if ( el ) {
      var tagName = el.tagName.toLowerCase();
      if ( tagName.match(/^gui\-(list|tree|icon|file)\-view$/) || tagName.match(/^gui\-select/) ) {
        return new GUI.ElementDataView(el, q);
      }
    }
    return new GUI.Element(el, q);
  };
  var DialogScheme = (function() {
    var dialogScheme;
    return {
      get: function() {
        return dialogScheme;
      },
      destroy: function() {
        if ( dialogScheme ) {
          dialogScheme.destroy();
        }
        dialogScheme = null;
      },
      init: function(cb) {
        if ( dialogScheme ) {
          cb();
          return;
        }
        if ( OSjs.API.isStandalone() ) {
          var html = OSjs.STANDALONE.SCHEMES['/dialogs.html'];
          dialogScheme = new OSjs.GUI.Scheme();
          dialogScheme.loadString(html);
          cb();
          return;
        }
        var root = API.getConfig('Connection.RootURI');
        var url = root + 'client/dialogs.html';
        if ( API.getConfig('Connection.Dist') === 'dist' ) {
          url = root + 'dialogs.html';
        }
        dialogScheme = GUI.createScheme(url);
        dialogScheme.load(function(error) {
          if ( error ) {
            console.warn('OSjs.GUI.initDialogScheme()', 'error loading dialog schemes', error);
          }
          cb();
        });
      }
    };
  })();
  function createScheme(url) {
    return new UIScheme(url);
  }
  GUI.Scheme = Object.seal(UIScheme);
  GUI.DialogScheme = DialogScheme;
  GUI.createScheme = createScheme;
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  function getFocusElement(inst) {
    var tagMap = {
      'gui-switch': 'button',
      'gui-list-view': 'textarea',
      'gui-tree-view': 'textarea',
      'gui-icon-view': 'textarea',
      'gui-input-modal': 'button'
    };
    if ( tagMap[inst.tagName] ) {
      return inst.$element.querySelector(tagMap[inst.tagName]);
    }
    return inst.$element.firstChild || inst.$element;
  }
  function UIElement(el, q) {
    this.$element = el || null;
    this.tagName = el ? el.tagName.toLowerCase() : null;
    this.oldDisplay = null;
    if ( !el ) {
      console.error('UIElement() was constructed without a DOM element', q);
    }
  }
  UIElement.prototype.remove = function() {
    this.$element = Utils.$remove(this.$element);
  };
  UIElement.prototype.empty = function() {
    Utils.$empty(this.$element);
    return this;
  };
  UIElement.prototype.blur = function() {
    if ( this.$element ) {
      var firstChild = getFocusElement(this);
      if ( firstChild ) {
        firstChild.blur();
      }
    }
    return this;
  };
  UIElement.prototype.focus = function() {
    if ( this.$element ) {
      var firstChild = getFocusElement(this);
      if ( firstChild ) {
        firstChild.focus();
      }
    }
    return this;
  };
  UIElement.prototype.show = function() {
    if ( this.$element && !this.$element.offsetParent ) {
      if ( GUI.Elements[this.tagName] && GUI.Elements[this.tagName].show ) {
        GUI.Elements[this.tagName].show.apply(this, arguments);
      } else {
        if ( this.$element ) {
          this.$element.style.display = this.oldDisplay || '';
        }
      }
    }
    return this;
  };
  UIElement.prototype.hide = function() {
    if ( this.$element && this.$element.offsetParent ) {
      if ( !this.oldDisplay ) {
        this.oldDisplay = this.$element.style.display;
      }
      this.$element.style.display = 'none';
    }
    return this;
  };
  UIElement.prototype.on = function(evName, callback, args) {
    if ( GUI.Elements[this.tagName] && GUI.Elements[this.tagName].bind ) {
      GUI.Elements[this.tagName].bind(this.$element, evName, callback, args);
    }
    return this;
  };
  UIElement.prototype.son = function(evName, thisArg, callback, args) {
    return this.on(evName, function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(this);
      callback.apply(thisArg, args);
    }, args);
  };
  UIElement.prototype.set = function(param, value, arg, arg2) {
    if ( this.$element ) {
      if ( GUI.Elements[this.tagName] && GUI.Elements[this.tagName].set ) {
        if ( GUI.Elements[this.tagName].set(this.$element, param, value, arg, arg2) === true ) {
          return this;
        }
      }
      GUI.Helpers.setProperty(this.$element, param, value, arg, arg2);
    }
    return this;
  };
  UIElement.prototype.get = function() {
    if ( this.$element ) {
      if ( GUI.Elements[this.tagName] && GUI.Elements[this.tagName].get ) {
        var args = ([this.$element]).concat(Array.prototype.slice.call(arguments));
        return GUI.Elements[this.tagName].get.apply(this, args);
      } else {
        return GUI.Helpers.getProperty(this.$element, arguments[0]);
      }
    }
    return null;
  };
  UIElement.prototype.fn = function(name, args, thisArg) {
    args = args || [];
    thisArg = thisArg || this;
    if ( this.$element ) {
      return GUI.Elements[this.tagName][name].apply(thisArg, args);
    }
    return null;
  };
  UIElement.prototype.append = function(el) {
    if ( el instanceof UIElement ) {
      el = el.$element;
    } else if ( typeof el === 'string' || typeof el === 'number' ) {
      el = document.createTextNode(String(el));
    }
    var outer = document.createElement('div');
    outer.appendChild(el);
    this._append(outer);
    outer = null;
    return this;
  };
  UIElement.prototype.appendHTML = function(html, scheme, win, args) {
    var el = document.createElement('div');
    el.innerHTML = html;
    return this._append(el, scheme, win, args);
  };
  UIElement.prototype._append = function(el, scheme, win, args) {
    if ( el instanceof Element ) {
      GUI.Scheme.parseNode(scheme, win, el, null, args);
    }
    while ( el.childNodes.length ) {
      this.$element.appendChild(el.childNodes[0]);
    }
    el = null;
    return this;
  };
  UIElement.prototype.querySelector = function(q, rui) {
    var el = this.$element.querySelector(q);
    if ( rui ) {
      return GUI.Scheme.getElementInstance(el, q);
    }
    return el;
  };
  UIElement.prototype.querySelectorAll = function(q, rui) {
    var el = this.$element.querySelectorAll(q);
    if ( rui ) {
      el = el.map(function(i) {
        return GUI.Scheme.getElementInstance(i, q);
      });
    }
    return el;
  };
  UIElement.prototype.css = function(k, v) {
    return Utils.$css(this.$element, k, v);
  };
  UIElement.prototype.position = function() {
    return Utils.$position(this.$element);
  };
  UIElement.prototype._call = function(method, args) {
    if ( GUI.Elements[this.tagName] && GUI.Elements[this.tagName].call ) {
      var cargs = ([this.$element, method, args]);//.concat(args);
      return GUI.Elements[this.tagName].call.apply(this, cargs);
    }
    return null;//this;
  };
  function UIElementDataView() {
    UIElement.apply(this, arguments);
  }
  UIElementDataView.prototype = Object.create(UIElement.prototype);
  UIElementDataView.constructor = UIElement;
  UIElementDataView.prototype.clear = function() {
    return this._call('clear', []);
  };
  UIElementDataView.prototype.add = function(props) {
    return this._call('add', [props]);
  };
  UIElementDataView.prototype.patch = function(props) {
    return this._call('patch', [props]);
  };
  UIElementDataView.prototype.remove = function(id, key) {
    return this._call('remove', [id, key]);
  };
  GUI.Element = Object.seal(UIElement);
  GUI.ElementDataView = Object.seal(UIElementDataView);
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  var _classMap = { // Defaults to (foo-bar)-entry
    'gui-list-view': 'gui-list-view-row'
  };
  function getEntryTagName(type) {
    if ( typeof type !== 'string' ) {
      type = type.tagName.toLowerCase();
    }
    var className = _classMap[type];
    if ( !className ) {
      className = type + '-entry';
    }
    return className;
  }
  function getEntryFromEvent(ev) {
    var t = ev.isTrusted ? ev.target : (ev.relatedTarget || ev.target);
    var tn = t.tagName.toLowerCase();
    if ( tn.match(/(view|textarea|body)$/) ) {
      return null;
    } else if ( tn === 'gui-list-view-column' ) {
      return t.parentNode;
    }
    return t;
  }
  function handleItemSelection(ev, item, idx, className, selected, root, multipleSelect) {
    root = root || item.parentNode;
    if ( idx === -1 ) {
      root.querySelectorAll(getEntryTagName(root)).forEach(function(e) {
        Utils.$removeClass(e, 'gui-active');
      });
      selected = [];
    } else {
      if ( !multipleSelect || !ev.shiftKey ) {
        root.querySelectorAll(className).forEach(function(i) {
          Utils.$removeClass(i, 'gui-active');
        });
        selected = [];
      }
      var findex = selected.indexOf(idx);
      if ( findex >= 0 ) {
        selected.splice(findex, 1);
        Utils.$removeClass(item, 'gui-active');
      } else {
        selected.push(idx);
        Utils.$addClass(item, 'gui-active');
      }
    }
    selected.sort(function(a, b) {
      return a - b;
    });
    return selected;
  }
  function getSelected(el) {
    return GUI.Elements[el.tagName.toLowerCase()].values(el);
  }
  function handleKeyPress(el, ev) {
    var map = {};
    var key = ev.keyCode;
    var type = el.tagName.toLowerCase();
    var className = getEntryTagName(type);
    var root = el.querySelector(type + '-body');
    var entries = root.querySelectorAll(className);
    var count = entries.length;
    if ( !count ) {
      return;
    }
    if ( key === Utils.Keys.ENTER ) {
      el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: getSelected(el)}}));
      return;
    }
    map[Utils.Keys.C] = function(ev) {
      if ( ev.ctrlKey ) {
        var selected = getSelected(el);
        if ( selected && selected.length ) {
          var data = [];
          selected.forEach(function(s) {
            if ( s && s.data ) {
              data.push(new VFS.File(s.data.path, s.data.mime));
            }
          });
          API.setClipboard(data);
        }
      }
    };
    var selected = el._selected.concat() || [];
    var first = selected.length ? selected[0] : 0;
    var last = selected.length > 1 ? selected[selected.length - 1] : first;
    var current = 0;
    function select() {
      var item = entries[current];
      if ( item ) {
        el._selected = handleItemSelection(ev, item, current, className, selected, root, ev.shiftKey);
        GUI.Elements._dataview.scrollIntoView(el, item);
      }
    }
    function getRowSize() {
      var d = 0;
      var lastTop = -1;
      entries.forEach(function(e) {
        if ( lastTop === -1 ) {
          lastTop = e.offsetTop;
        }
        if ( lastTop !== e.offsetTop ) {
          return false;
        }
        lastTop = e.offsetTop;
        d++;
        return true;
      });
      return d;
    }
    function handleKey() {
      function next() {
        current = Math.min(last + 1, count);
        select();
      }
      function prev() {
        current = Math.max(0, first - 1);
        select();
      }
      if ( type === 'gui-tree-view' || type === 'gui-list-view' ) {
        map[Utils.Keys.UP] = prev;
        map[Utils.Keys.DOWN] = next;
      } else {
        map[Utils.Keys.UP] = function() {
          current = Math.max(0, first - getRowSize());
          select();
        };
        map[Utils.Keys.DOWN] = function() {
          current = Math.max(last, last + getRowSize());
          select();
        };
        map[Utils.Keys.LEFT] = prev;
        map[Utils.Keys.RIGHT] = next;
      }
      if ( map[key] ) {
        map[key](ev);
      }
    }
    handleKey();
  }
  function getValueParameter(r) {
    var value = r.getAttribute('data-value');
    try {
      return JSON.parse(value);
    } catch ( e ) {}
    return value;
  }
  function matchValueByKey(r, val, key, idx) {
    var value = r.getAttribute('data-value');
    if ( !key && (val === idx || val === value) ) {
      return r;
    } else {
      try {
        var json = JSON.parse(value);
        if ( typeof json[key] === 'object' ? json[key] === val : String(json[key]) === String(val) ) {
          return r;
        }
      } catch ( e ) {}
    }
    return false;
  }
  GUI.Elements._dataview = {
    clear: function(el, body) {
      body = body || el;
      el.querySelectorAll(getEntryTagName(el)).forEach(function(row) {
        Utils.$unbind(row);
      });
      Utils.$empty(body);
      body.scrollTop = 0;
      el._selected = [];
    },
    add: function(el, args, oncreate) {
      var entries = args[0];
      if ( !(entries instanceof Array) ) {
        entries = [entries];
      }
      entries.forEach(oncreate);
      return this;
    },
    patch: function(el, args, className, body, oncreate, oninit) {
      var self = this;
      var entries = args[0];
      var single = false;
      if ( !(entries instanceof Array) ) {
        entries = [entries];
        single = true;
      }
      var inView = {};
      body.querySelectorAll(className).forEach(function(row) {
        var id = row.getAttribute('data-id');
        if ( id !== null ) {
          inView[id] = row;
        }
      });
      entries.forEach(function(entry) {
        var insertBefore;
        if ( typeof entry.id !== 'undefined' && entry.id !== null ) {
          if ( inView[entry.id] ) {
            insertBefore = inView[entry.id];
            delete inView[entry.id];
          }
          var row = oncreate(entry);
          if ( row ) {
            if ( insertBefore ) {
              if ( Utils.$hasClass(insertBefore, 'gui-active') ) {
                Utils.$addClass(row, 'gui-active');
              }
              body.insertBefore(row, insertBefore);
              self.remove(el, null, className, insertBefore);
            } else {
              body.appendChild(row);
            }
            oninit(el, row);
          }
        }
      });
      if ( !single ) {
        Object.keys(inView).forEach(function(k) {
          self.remove(el, null, className, inView[k]);
        });
      }
      inView = {};
      this.updateActiveSelection(el, className);
      return this;
    },
    remove: function(el, args, className, target, parentEl) {
      function remove(cel) {
        Utils.$remove(cel);
      }
      parentEl = parentEl || el;
      if ( target ) {
        remove(target);
        return;
      }
      if ( typeof args[1] === 'undefined' && typeof args[0] === 'number' ) {
        remove(parentEl.querySelectorAll(className)[args[0]]);
      } else {
        var findId = args[0];
        var findKey = args[1] || 'id';
        var q = 'data-' + findKey + '="' + findId + '"';
        parentEl.querySelectorAll(className + '[' + q + ']').forEach(remove);
      }
      this.updateActiveSelection(el, className);
      return this;
    },
    updateActiveSelection: function(el, className) {
      var active = [];
      el.querySelectorAll(className + '.gui-active').forEach(function(cel) {
        active.push(Utils.$index(cel));
      });
      el._active = active;
    },
    scrollIntoView: function(el, element) {
      var pos = Utils.$position(element, el);
      var marginTop = 0;
      if ( el.tagName.toLowerCase() === 'gui-list-view' ) {
        var header = el.querySelector('gui-list-view-head');
        if ( header ) {
          marginTop = header.offsetHeight;
        }
      }
      var scrollSpace = (el.scrollTop + el.offsetHeight) - marginTop;
      var scrollTop = el.scrollTop + marginTop;
      var elTop = pos.top - marginTop;
      if ( pos !== null && (elTop > scrollSpace || elTop < scrollTop) ) {
        el.scrollTop = elTop;
        return true;
      }
      return false;
    },
    bindEntryEvents: function(el, row, className) {
      function createDraggable() {
        var value = row.getAttribute('data-value');
        if ( value !== null ) {
          try {
            value = JSON.parse(value);
          } catch ( e ) {}
        }
        var source = row.getAttribute('data-draggable-source');
        if ( source === null ) {
          source = GUI.Helpers.getWindowId(el);
          if ( source !== null ) {
            source = {wid: source};
          }
        }
        GUI.Helpers.createDraggable(row, {
          type   : el.getAttribute('data-draggable-type') || row.getAttribute('data-draggable-type'),
          source : source,
          data   : value
        });
        var tooltip = row.getAttribute('data-tooltip');
        if ( tooltip && !row.getAttribute('title') ) {
          row.setAttribute('title', tooltip);
        }
      }
      el.dispatchEvent(new CustomEvent('_render', {detail: {
        element: row,
        data: GUI.Helpers.getViewNodeValue(row)
      }}));
      if ( el.getAttribute('data-draggable') === 'true' ) {
        createDraggable();
      }
    },
    getSelected: function(el, entries) {
      var selected = [];
      entries.forEach(function(iter, idx) {
        if ( Utils.$hasClass(iter, 'gui-active') ) {
          selected.push({
            index: idx,
            data: GUI.Helpers.getViewNodeValue(iter)
          });
        }
      });
      return selected;
    },
    getEntry: function(el, entries, val, key, asValue) {
      if ( val ) {
        var result = null;
        entries.forEach(function(r, idx) {
          if ( !result && matchValueByKey(r, val, key, idx) ) {
            result = r;
          }
        });
        return (asValue && result) ? getValueParameter(result) : result;
      }
      return !asValue ? entries : (entries || []).map(function(iter) {
        return getValueParameter(iter);
      });
    },
    setSelected: function(el, body, entries, val, key, opts) {
      var self = this;
      var select = [];
      var scrollIntoView = false;
      if ( typeof opts === 'object' ) {
        scrollIntoView = opts.scroll === true;
      }
      function sel(r, idx) {
        select.push(idx);
        Utils.$addClass(r, 'gui-active');
        if ( scrollIntoView ) {
          self.scrollIntoView(el, r);
        }
      }
      entries.forEach(function(r, idx) {
        Utils.$removeClass(r, 'gui-active');
        if ( matchValueByKey(r, val, key, idx) ) {
          sel(r, idx);
        }
      });
      el._selected = select;
    },
    build: function(el, applyArgs) {
      el._selected = [];
      el.scrollTop = 0;
      Utils.$addClass(el, 'gui-data-view');
      var singleClick = el.getAttribute('data-single-click') === 'true';
      var multipleSelect = el.getAttribute('data-multiple');
      multipleSelect = multipleSelect === null || multipleSelect === 'true';
      function select(ev) {
        ev.stopPropagation();
        API.blurMenu();
        var row = getEntryFromEvent(ev);
        var className = row ? row.tagName.toLowerCase() : null;
        if ( className === 'gui-tree-view-expander' ) {
          OSjs.GUI.Elements[el.tagName.toLowerCase()].call(el, 'expand', {ev: ev, entry: row.parentNode});
          return;
        }
        var idx = Utils.$index(row);
        el._selected = handleItemSelection(ev, row, idx, className, el._selected, el, multipleSelect);
        el.dispatchEvent(new CustomEvent('_select', {detail: {entries: getSelected(el)}}));
      }
      function activate(ev) {
        ev.stopPropagation();
        API.blurMenu();
        if ( singleClick ) {
          select(ev);
        }
        el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: getSelected(el)}}));
      }
      function context(ev) {
        select(ev);
        el.dispatchEvent(new CustomEvent('_contextmenu', {detail: {entries: getSelected(el), x: ev.clientX, y: ev.clientY}}));
      }
      if ( !el.querySelector('textarea.gui-focus-element') && !el.getAttribute('no-selection') ) {
        var underlay = document.createElement('textarea');
        underlay.setAttribute('aria-label', '');
        underlay.setAttribute('aria-hidden', 'true');
        underlay.setAttribute('readonly', 'true');
        underlay.className = 'gui-focus-element';
        Utils.$bind(underlay, 'focus', function(ev) {
          ev.preventDefault();
          Utils.$addClass(el, 'gui-element-focused');
        });
        Utils.$bind(underlay, 'blur', function(ev) {
          ev.preventDefault();
          Utils.$removeClass(el, 'gui-element-focused');
        });
        Utils.$bind(underlay, 'keydown', function(ev) {
          ev.preventDefault();
          handleKeyPress(el, ev);
        });
        Utils.$bind(underlay, 'keypress', function(ev) {
          ev.preventDefault();
        });
        if ( singleClick ) {
          Utils.$bind(el, 'click', activate, true);
        } else {
          Utils.$bind(el, 'click', select, true);
          Utils.$bind(el, 'dblclick', activate, true);
        }
        Utils.$bind(el, 'contextmenu', function(ev) {
          ev.preventDefault();
          context(ev);
          return false;
        }, true);
        this.bind(el, 'select', function(ev) {
          if ( Utils.$hasClass(el, 'gui-element-focused') ) {
            return;
          }
          var oldTop = el.scrollTop;
          underlay.focus();
          el.scrollTop = oldTop;
          setTimeout(function() {
            el.scrollTop = oldTop;
          }, 2);
        }, true);
        el.appendChild(underlay);
      }
    },
    focus: function(el) {
      try {
        var underlay = el.querySelector('.gui-focus-element');
        underlay.focus();
      } catch ( e ) {
        console.warn(e, e.stack);
      }
    },
    blur: function(el) {
      try {
        var underlay = el.querySelector('.gui-focus-element');
        underlay.blur();
      } catch ( e ) {
        console.warn(e, e.stack);
      }
    },
    bind: function(el, evName, callback, params) {
      if ( (['activate', 'select', 'expand', 'contextmenu', 'render', 'drop']).indexOf(evName) !== -1 ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  GUI.Elements['gui-color-box'] = {
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('div');
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    set: function(el, param, value) {
      if ( param === 'value' ) {
        el.firstChild.style.backgroundColor = value;
        return true;
      }
      return false;
    },
    build: function(el) {
      var inner = document.createElement('div');
      el.appendChild(inner);
    }
  };
  GUI.Elements['gui-color-swatch'] = {
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('canvas');
      if ( evName === 'select' || evName === 'change' ) {
        evName = '_change';
      }
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el) {
      var cv        = document.createElement('canvas');
      cv.width      = 100;
      cv.height     = 100;
      var ctx       = cv.getContext('2d');
      var gradient  = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
      function getColor(ev) {
        var pos = OSjs.Utils.$position(cv);
        var cx = typeof ev.offsetX === 'undefined' ? (ev.clientX - pos.left) : ev.offsetX;
        var cy = typeof ev.offsetY === 'undefined' ? (ev.clientY - pos.top) : ev.offsetY;
        if ( isNaN(cx) || isNaN(cy) ) {
          return null;
        }
        var data = ctx.getImageData(cx, cy, 1, 1).data;
        return {
          r: data[0],
          g: data[1],
          b: data[2],
          hex: Utils.convertToHEX(data[0], data[1], data[2])
        };
      }
      gradient.addColorStop(0,    'rgb(255,   0,   0)');
      gradient.addColorStop(0.15, 'rgb(255,   0, 255)');
      gradient.addColorStop(0.33, 'rgb(0,     0, 255)');
      gradient.addColorStop(0.49, 'rgb(0,   255, 255)');
      gradient.addColorStop(0.67, 'rgb(0,   255,   0)');
      gradient.addColorStop(0.84, 'rgb(255, 255,   0)');
      gradient.addColorStop(1,    'rgb(255,   0,   0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
      gradient.addColorStop(0,   'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(0,     0,   0, 0)');
      gradient.addColorStop(1,   'rgba(0,     0,   0, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      Utils.$bind(cv, 'click', function(ev) {
        var c = getColor(ev);
        if ( c ) {
          cv.dispatchEvent(new CustomEvent('_change', {detail: c}));
        }
      }, false);
      el.appendChild(cv);
    }
  };
  GUI.Elements['gui-iframe'] = (function() {
    var tagName = 'iframe';
    if ( (['nw', 'electron', 'x11']).indexOf(API.getConfig('Connection.Type')) >= 0 ) {
      tagName = 'webview';
    }
    return {
      set: function(el, key, val) {
        if ( key === 'src' ) {
          el.querySelector(tagName).src = val;
        }
      },
      build: function(el) {
        var src = el.getAttribute('data-src') || 'about:blank';
        var iframe = document.createElement(tagName);
        iframe.src = src;
        iframe.setAttribute('border', 0);
        el.appendChild(iframe);
      }
    };
  })();
  GUI.Elements['gui-progress-bar'] = {
    set: function(el, param, value) {
      el.setAttribute('data-' + param, value);
      if ( param === 'progress' || param === 'value' ) {
        value = parseInt(value, 10);
        value = Math.max(0, Math.min(100, value));
        el.setAttribute('aria-label', String(value));
        el.setAttribute('aria-valuenow', String(value));
        el.querySelector('div').style.width = value.toString() + '%';
        el.querySelector('span').innerHTML = value + '%';
        return true;
      }
      return false;
    },
    build: function(el) {
      var p = (el.getAttribute('data-progress') || 0);
      p = Math.max(0, Math.min(100, p));
      var percentage = p.toString() + '%';
      var progress = document.createElement('div');
      progress.style.width = percentage;
      var span = document.createElement('span');
      span.appendChild(document.createTextNode(percentage));
      el.setAttribute('role', 'progressbar');
      el.setAttribute('aria-valuemin', 0);
      el.setAttribute('aria-valuemax', 100);
      el.setAttribute('aria-label', 0);
      el.setAttribute('aria-valuenow', 0);
      el.appendChild(progress);
      el.appendChild(span);
    }
  };
  GUI.Elements['gui-statusbar'] = {
    set: function(el, param, value) {
      if ( param === 'label' || param === 'value' ) {
        var span = el.getElementsByTagName('gui-statusbar-label')[0];
        if ( span ) {
          Utils.$empty(span);
          span.innerHTML = value;
        }
        return true;
      }
      return false;
    },
    build: function(el) {
      var span = document.createElement('gui-statusbar-label');
      var lbl = el.getAttribute('data-label') || el.getAttribute('data-value');
      if ( !lbl ) {
        lbl = (function() {
          var textNodes = [];
          var node, value;
          for ( var i = 0; i < el.childNodes.length; i++ ) {
            node = el.childNodes[i];
            if ( node.nodeType === Node.TEXT_NODE ) {
              value = node.nodeValue.replace(/\s+/g, '').replace(/^\s+/g, '');
              if ( value.length > 0 ) {
                textNodes.push(value);
              }
              el.removeChild(node);
              i++;
            }
          }
          return textNodes.join(' ');
        })();
      }
      span.innerHTML = lbl;
      el.setAttribute('role', 'log');
      el.appendChild(span);
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  var lastMenu;
  function blurMenu(ev) {
    if ( lastMenu ) {
      lastMenu(ev);
    }
    lastMenu = null;
    API.triggerHook('onBlurMenu');
  }
  function bindIngores(el) {
    Utils.$bind(el, 'touchstart', function(ev) {
      ev.preventDefault();
    }, true);
  }
  function clickWrapper(ev, pos, onclick, original) {
    var t = ev.isTrusted ? ev.target : (ev.relatedTarget || ev.target);
    ev.preventDefault();
    if ( t && t.tagName === 'GUI-MENU-ENTRY' ) {
      var isExpander = !!t.querySelector('gui-menu');
      var hasInput = t.querySelector('input');
      if ( hasInput || isExpander ) {
        ev.stopPropagation();
      }
      onclick(ev, pos, t, original);
    }
  }
  function onEntryClick(ev, pos, target, original) {
    var isExpander = !!target.querySelector('gui-menu');
    if ( !isExpander ) {
      blurMenu(ev);
      var hasInput = target.querySelector('input');
      if ( hasInput ) {
        if ( !Utils.isIE() && window.MouseEvent ) {
          hasInput.dispatchEvent(new MouseEvent('click', {
            clientX: pos.x,
            clientY: pos.y
          }));
        } else {
          var nev = document.createEvent('MouseEvent');
          nev.initMouseEvent('click', true, true, window, 0, 0, 0, pos.x, pos.y, ev.ctrlKey, ev.altKey, ev.shiftKey, ev.metaKey, ev.button, hasInput);
        }
      }
      var dispatcher = (original || target).querySelector('label');
      dispatcher.dispatchEvent(new CustomEvent('_select', {detail: getSelectionEventAttribs(target, true)}));
    }
  }
  function clampSubmenuPositions(r) {
    function _clamp(rm) {
      rm.querySelectorAll('gui-menu-entry').forEach(function(srm) {
        var sm = srm.querySelector('gui-menu');
        if ( sm ) {
          sm.style.left = String(-parseInt(sm.offsetWidth, 10)) + 'px';
          _clamp(sm);
        }
      });
    }
    var pos = Utils.$position(r);
    if ( pos && (window.innerWidth - pos.right) < r.offsetWidth ) {
      Utils.$addClass(r, 'gui-overflowing');
      _clamp(r);
    }
    Utils.$addClass(r, 'gui-showing');
  }
  function runChildren(pel, level, winRef, cb) {
    level = level || 0;
    cb = cb || function() {};
    (pel.children || []).forEach(function(child, i) {
      if ( child && child.tagName.toLowerCase() === 'gui-menu-entry') {
        GUI.Elements['gui-menu-entry'].build(child, null, winRef);
        cb(child, level);
      }
    });
  }
  function getSelectionEventAttribs(mel, didx) {
    var id = mel.getAttribute('data-id');
    var idx = Utils.$index(mel)
    if ( !didx ) {
      idx = parseInt(mel.getAttribute('data-index'), 10);
    }
    var result = {index: idx, id: id};
    Array.prototype.slice.call(mel.attributes).forEach(function(item) {
      if ( item.name.match(/^data\-/) ) {
        var an = item.name.replace(/^data\-/, '');
        if ( typeof result[an] === 'undefined' ) {
          result[an] = item.value;
        }
      }
    });
    return result;
  }
  GUI.Elements['gui-menu-entry'] = (function() {
    function createTyped(child, par) {
      var type = child.getAttribute('data-type');
      var value = child.getAttribute('data-checked') === 'true';
      var input = null;
      if ( type ) {
        var group = child.getAttribute('data-group');
        input = document.createElement('input');
        input.type = type;
        input.name = group ? group + '[]' : '';
        if ( value ) {
          input.setAttribute('checked', 'checked');
        }
        par.setAttribute('role', 'menuitem' + type);
        par.appendChild(input);
      }
    }
    return {
      bind: function(el, evName, callback, params) {
        if ( evName === 'select' ) {
          evName = '_select';
        }
        var target = el.querySelector('gui-menu-entry > label');
        Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
      },
      build: function(child, arg, winRef) {
        if ( arguments.length < 3 ) {
          return;
        }
        child.setAttribute('role', 'menuitem' + (child.getAttribute('data-type') || ''));
        var label = GUI.Helpers.getLabel(child);
        var icon = GUI.Helpers.getIcon(child, winRef);
        child.setAttribute('aria-label', label);
        var span = document.createElement('label');
        if ( icon ) {
          child.style.backgroundImage = 'url(' + icon + ')';
          Utils.$addClass(span, 'gui-has-image');
        }
        child.appendChild(span);
        createTyped(child, span);
        if ( child.getAttribute('data-labelhtml') === 'true' ) {
          span.innerHTML = label;
        } else {
          span.appendChild(document.createTextNode(label));
        }
        if ( child.querySelector('gui-menu') ) {
          Utils.$addClass(child, 'gui-menu-expand');
          child.setAttribute('aria-haspopup', 'true');
        } else {
          child.setAttribute('aria-haspopup', 'false');
        }
      }
    };
  })();
  GUI.Elements['gui-menu'] = {
    bind: function(el, evName, callback, params) {
      if ( evName === 'select' ) {
        evName = '_select';
      }
      el.querySelectorAll('gui-menu-entry > label').forEach(function(target) {
        Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
      });
    },
    show: function(ev) {
      ev.stopPropagation();
      ev.preventDefault();
      var newNode = this.$element.cloneNode(true);
      var el = this.$element;
      OSjs.GUI.Helpers.createMenu(null, ev, newNode);
      Utils.$bind(newNode, 'click', function(ev, pos) {
        clickWrapper(ev, pos, onEntryClick, el);
      }, true);
    },
    set: function(el, param, value, arg) {
      if ( param === 'checked' ) {
        var found = el.querySelector('gui-menu-entry[data-id="' + value + '"]');
        if ( found ) {
          var input = found.querySelector('input');
          if ( input ) {
            if ( arg ) {
              input.setAttribute('checked', 'checked');
            } else {
              input.removeAttribute('checked');
            }
          }
        }
        return true;
      }
      return false;
    },
    build: function(el, customMenu, winRef) {
      el.setAttribute('role', 'menu');
      runChildren(el, 0, winRef, function(child, level) {
        if ( customMenu ) {
          if ( child ) {
            child.getElementsByTagName('gui-menu').forEach(function(sub) {
              if ( sub ) {
                runChildren(sub, level + 1, winRef);
              }
            });
          }
        }
      });
      if ( !customMenu ) {
        Utils.$bind(el, 'click', function(ev, pos) {
          clickWrapper(ev, pos, onEntryClick);
        }, true);
      }
    }
  };
  GUI.Elements['gui-menu-bar'] = {
    bind: function(el, evName, callback, params) {
      if ( evName === 'select' ) {
        evName = '_select';
      }
      el.querySelectorAll('gui-menu-bar-entry').forEach(function(target) {
        Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
      });
    },
    build: function(el) {
      el.setAttribute('role', 'menubar');
      function updateChildren(sm, level) {
        if ( sm && sm.children ) {
          var children = sm.children;
          var child;
          for ( var i = 0; i < children.length; i++ ) {
            child = children[i];
            if ( child.tagName === 'GUI-MENU-ENTRY' ) {
              child.setAttribute('aria-haspopup', String(!!child.firstChild));
              updateChildren(child.firstChild, level + 1);
            }
          }
        }
      }
      function _onClick(ev, mel) {
        blurMenu();
        ev.preventDefault();
        ev.stopPropagation();
        var submenu = mel.querySelector('gui-menu');
        mel.querySelectorAll('gui-menu-entry').forEach(function(c) {
          Utils.$removeClass(c, 'gui-hover');
        });
        if ( submenu ) {
          lastMenu = function(ev) {
            if ( ev ) {
              ev.stopPropagation();
            }
            Utils.$removeClass(mel, 'gui-active');
          };
        }
        if ( Utils.$hasClass(mel, 'gui-active') ) {
          if ( submenu ) {
            Utils.$removeClass(mel, 'gui-active');
          }
        } else {
          if ( submenu ) {
            Utils.$addClass(mel, 'gui-active');
          }
          mel.dispatchEvent(new CustomEvent('_select', {detail: getSelectionEventAttribs(mel)}));
        }
      }
      el.querySelectorAll('gui-menu-bar-entry').forEach(function(mel, idx) {
        var label = GUI.Helpers.getLabel(mel);
        var span = document.createElement('span');
        span.appendChild(document.createTextNode(label));
        mel.setAttribute('role', 'menuitem');
        mel.insertBefore(span, mel.firstChild);
        var submenu = mel.querySelector('gui-menu');
        clampSubmenuPositions(submenu);
        mel.setAttribute('aria-haspopup', String(!!submenu));
        mel.setAttribute('data-index', String(idx));
        updateChildren(submenu, 2);
      });
      Utils.$bind(el, 'click', function(ev) {
        var t = ev.isTrusted ? ev.target : (ev.relatedTarget || ev.target);
        if ( t && t.tagName === 'GUI-MENU-BAR-ENTRY' ) {
          _onClick(ev, t);
        }
      }, true);
      bindIngores(el);
    }
  };
  OSjs.GUI.Helpers.blurMenu = blurMenu;
  OSjs.GUI.Helpers.createMenu = function(items, ev, customInstance) {
    items = items || [];
    blurMenu();
    var root = customInstance;
    var callbackMap = [];
    function resolveItems(arr, par) {
      arr.forEach(function(iter) {
        var props = {label: iter.title, icon: iter.icon, disabled: iter.disabled, labelHTML: iter.titleHTML, type: iter.type, checked: iter.checked};
        var entry = GUI.Helpers.createElement('gui-menu-entry', props);
        if ( iter.menu ) {
          var nroot = GUI.Helpers.createElement('gui-menu', {});
          resolveItems(iter.menu, nroot);
          entry.appendChild(nroot);
        }
        if ( iter.onClick ) {
          var index = callbackMap.push(iter.onClick);
          entry.setAttribute('data-callback-id', String(index - 1));
        }
        par.appendChild(entry);
      });
    }
    if ( !root ) {
      root = GUI.Helpers.createElement('gui-menu', {});
      resolveItems(items || [], root);
      GUI.Elements['gui-menu'].build(root, true);
      Utils.$bind(root, 'click', function(ev, pos) {
        clickWrapper(ev, pos, function(ev, pos, t) {
          var index = parseInt(t.getAttribute('data-callback-id'), 10);
          if ( callbackMap[index] ) {
            callbackMap[index](ev, pos);
            blurMenu(ev); // !last!
          }
        });
      }, true);
      bindIngores(root);
    }
    if ( root.$element ) {
      root = root.$element;
    }
    var wm = OSjs.Core.getWindowManager();
    var space = wm.getWindowSpace(true);
    var pos = Utils.mousePosition(ev);
    Utils.$addClass(root, 'gui-root-menu');
    root.style.left = pos.x + 'px';
    root.style.top  = pos.y + 'px';
    document.body.appendChild(root);
    setTimeout(function() {
      var pos = Utils.$position(root);
      if ( pos ) {
        if ( pos.right > space.width ) {
          var newLeft = Math.round(space.width - pos.width);
          root.style.left = Math.max(0, newLeft) + 'px';
        }
        if ( pos.bottom > space.height ) {
          var newTop = Math.round(space.height - pos.height);
          root.style.top = Math.max(0, newTop) + 'px';
        }
      }
      clampSubmenuPositions(root);
    }, 1);
    lastMenu = function() {
      callbackMap = null;
      if ( root ) {
        root.querySelectorAll('gui-menu-entry').forEach(function(el) {
          Utils.$unbind(el);
        });
        Utils.$unbind(root);
      }
      root = Utils.$remove(root);
    };
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  function toggleActive(el, eidx, idx) {
    Utils.$removeClass(el, 'gui-active');
    if ( eidx === idx ) {
      Utils.$addClass(el, 'gui-active');
    }
  }
  GUI.Elements['gui-tabs'] = {
    bind: function(el, evName, callback, params) {
      if ( (['select', 'activate']).indexOf(evName) !== -1 ) {
        evName = 'change';
      }
      if ( evName === 'change' ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    get: function(el, param, value) {
      if ( param === 'current' || param === 'selected' ) {
        var cur = el.querySelector('ul > li[class="gui-active"]');
        return Utils.$index(cur);
      }
      return GUI.Helpers.getProperty(el, param);
    },
    build: function(el) {
      var tabs = document.createElement('ul');
      var lastTab;
      function selectTab(ev, idx, tab) {
        if ( lastTab ) {
          Utils.$removeClass(lastTab, 'gui-active');
        }
        tabs.querySelectorAll('li').forEach(function(tel, eidx) {
          toggleActive(tel, eidx, idx);
        });
        el.querySelectorAll('gui-tab-container').forEach(function(tel, eidx) {
          toggleActive(tel, eidx, idx);
        });
        lastTab = tab;
        Utils.$addClass(tab, 'gui-active');
        el.dispatchEvent(new CustomEvent('_change', {detail: {index: idx}}));
      }
      el.querySelectorAll('gui-tab-container').forEach(function(tel, idx) {
        var tab = document.createElement('li');
        var label = GUI.Helpers.getLabel(tel);
        Utils.$bind(tab, 'click', function(ev) {
          selectTab(ev, idx, tab);
        }, false);
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-label', label);
        tel.setAttribute('role', 'tabpanel');
        tab.appendChild(document.createTextNode(label));
        tabs.appendChild(tab);
      });
      tabs.setAttribute('role', 'tablist');
      el.setAttribute('role', 'navigation');
      if ( el.children.length ) {
        el.insertBefore(tabs, el.children[0]);
      } else {
        el.appendChild(tabs);
      }
      var currentTab = parseInt(el.getAttribute('data-selected-index'), 10) || 0;
      selectTab(null, currentTab);
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  var _buttonCount = 0;
  function createInputOfType(el, type) {
    var group = el.getAttribute('data-group');
    var placeholder = el.getAttribute('data-placeholder');
    var disabled = String(el.getAttribute('data-disabled')) === 'true';
    var value = el.childNodes.length ? el.childNodes[0].nodeValue : null;
    Utils.$empty(el);
    var input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    var attribs = {
      value: null,
      type: type,
      tabindex: -1,
      placeholder: placeholder,
      disabled: disabled ? 'disabled' : null,
      name: group ? group + '[]' : null
    };
    (['autocomplete', 'autocorrect', 'autocapitalize', 'spellcheck']).forEach(function(a) {
      attribs[a] = el.getAttribute('data-' + a) || 'false';
    });
    function _bindDefaults() {
      if ( ['range', 'slider'].indexOf(type) >= 0 ) {
        attribs.min = el.getAttribute('data-min');
        attribs.max = el.getAttribute('data-max');
        attribs.step = el.getAttribute('data-step');
      } else if ( ['radio', 'checkbox'].indexOf(type) >= 0 ) {
        if ( el.getAttribute('data-value') === 'true' ) {
          attribs.checked = 'checked';
        }
      } else if ( ['text', 'password', 'textarea'].indexOf(type) >= 0 ) {
        attribs.value = value || '';
      }
      Object.keys(attribs).forEach(function(a) {
        if ( attribs[a] !== null ) {
          if ( a === 'value' ) {
            input.value = attribs[a];
          } else {
            input.setAttribute(a, attribs[a]);
          }
        }
      });
    }
    function _bindEvents() {
      if ( type === 'text' || type === 'password' || type === 'textarea' ) {
        Utils.$bind(input, 'keydown', function(ev) {
          if ( ev.keyCode === Utils.Keys.ENTER ) {
            input.dispatchEvent(new CustomEvent('_enter', {detail: input.value}));
          } else if ( ev.keyCode === Utils.Keys.C && ev.ctrlKey ) {
            API.setClipboard(input.value);
          }
          if ( type === 'textarea' && ev.keyCode === Utils.Keys.TAB ) {
            ev.preventDefault();
            input.value += '\t';
          }
        }, false);
        Utils.$bind(input, 'mousedown', function() {
          if ( input ) {
            input.focus();
          }
        });
      }
    }
    function _create() {
      _bindDefaults();
      _bindEvents();
      GUI.Helpers.createInputLabel(el, type, input);
      var rolemap = {
        'TEXTAREA': function() {
          return 'textbox';
        },
        'INPUT': function(i) {
          var typemap = {
            'range': 'slider',
            'text': 'textbox',
            'password': 'textbox'
          };
          return typemap[i.type] || i.type;
        }
      };
      if ( rolemap[el.tagName] ) {
        input.setAttribute('role', rolemap[el.tagName](input));
      }
      input.setAttribute('aria-label', el.getAttribute('title') || '');
      el.setAttribute('role', 'region');
      el.setAttribute('aria-disabled', String(disabled));
      Utils.$bind(input, 'change', function(ev) {
        var value = input.value;
        if ( type === 'radio' || type === 'checkbox' ) {
          value = input.checked; //input.value === 'on';
        }
        input.dispatchEvent(new CustomEvent('_change', {detail: value}));
      }, false);
    }
    _create();
  }
  function bindInputEvents(el, evName, callback, params) {
    if ( evName === 'enter' ) {
      evName = '_enter';
    } else if ( evName === 'change' ) {
      evName = '_change';
    }
    var target = el.querySelector('textarea, input, select');
    Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
  }
  function addToSelectBox(el, entries) {
    var target = el.querySelector('select');
    if ( !(entries instanceof Array) ) {
      entries = [entries];
    }
    entries.forEach(function(e) {
      var opt = document.createElement('option');
      opt.setAttribute('role', 'option');
      opt.setAttribute('value', e.value);
      opt.appendChild(document.createTextNode(e.label));
      target.appendChild(opt);
    });
  }
  function removeFromSelectBox(el, what) {
    var target = el.querySelector('select');
    target.querySelectorAll('option').forEach(function(opt) {
      if ( String(opt.value) === String(what) ) {
        Utils.$remove(opt);
        return false;
      }
      return true;
    });
  }
  function callSelectBox(el, method, args) {
    if ( method === 'add' ) {
      addToSelectBox(el, args[0]);
    } else if ( method === 'remove' ) {
      removeFromSelectBox(el, args[0]);
    } else if ( method === 'clear' ) {
      var target = el.querySelector('select');
      Utils.$empty(target);
    }
  }
  function createSelectInput(el, multiple) {
    var disabled = el.getAttribute('data-disabled') !== null;
    var selected = el.getAttribute('data-selected');
    var select = document.createElement('select');
    if ( multiple ) {
      select.setAttribute('size', el.getAttribute('data-size') || 2);
      multiple = el.getAttribute('data-multiple') === 'true';
    }
    if ( multiple ) {
      select.setAttribute('multiple', 'multiple');
    }
    if ( disabled ) {
      select.setAttribute('disabled', 'disabled');
    }
    if ( selected !== null ) {
      select.selectedIndex = selected;
    }
    el.querySelectorAll('gui-select-option').forEach(function(sel) {
      var value = sel.getAttribute('data-value') || '';
      var label = sel.childNodes.length ? sel.childNodes[0].nodeValue : '';
      var option = document.createElement('option');
      option.setAttribute('role', 'option');
      option.setAttribute('value', value);
      option.appendChild(document.createTextNode(label));
      if ( sel.getAttribute('selected') ) {
        option.setAttribute('selected', 'selected');
      }
      select.appendChild(option);
      sel.parentNode.removeChild(sel);
    });
    Utils.$bind(select, 'change', function(ev) {
      select.dispatchEvent(new CustomEvent('_change', {detail: select.value}));
    }, false);
    select.setAttribute('role', 'listbox');
    select.setAttribute('aria-label', el.getAttribute('title') || '');
    el.setAttribute('aria-disabled', String(disabled));
    el.setAttribute('role', 'region');
    el.appendChild(select);
  }
  function setSwitchValue(val, input, button) {
    if ( val !== true ) {
      input.removeAttribute('checked');
      Utils.$removeClass(button, 'gui-active');
      button.innerHTML = '0';
    } else {
      input.setAttribute('checked', 'checked');
      Utils.$addClass(button, 'gui-active');
      button.innerHTML = '1';
    }
  }
  var guiSelect = {
    bind: bindInputEvents,
    call: function() {
      callSelectBox.apply(this, arguments);
      return this;
    },
    build: function(el) {
      var multiple = (el.tagName.toLowerCase() === 'gui-select-list');
      createSelectInput(el, multiple);
    }
  };
  GUI.Elements['gui-label'] = {
    set: function(el, param, value, isHTML) {
      if ( param === 'value' || param === 'label' ) {
        el.setAttribute('data-label', String(value));
        var lbl = el.querySelector('label');
        Utils.$empty(lbl);
        if ( isHTML ) {
          lbl.innerHTML = value;
        } else {
          lbl.appendChild(document.createTextNode(value));
        }
        return true;
      }
      return false;
    },
    build: function(el) {
      var label = GUI.Helpers.getValueLabel(el, true);
      var lbl = document.createElement('label');
      lbl.appendChild(document.createTextNode(label));
      el.setAttribute('role', 'heading');
      el.setAttribute('data-label', String(label));
      el.appendChild(lbl);
    }
  };
  GUI.Elements['gui-textarea'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'textarea');
    },
    set: function(el, param, value) {
      if ( el && param === 'scrollTop' ) {
        if ( typeof value !== 'number' ) {
          value = el.firstChild.scrollHeight;
        }
        el.firstChild.scrollTop = value;
        return true;
      }
      return false;
    }
  };
  GUI.Elements['gui-text'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'text');
    }
  };
  GUI.Elements['gui-password'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'password');
    }
  };
  GUI.Elements['gui-file-upload'] = {
    bind: bindInputEvents,
    build: function(el) {
      var input = document.createElement('input');
      input.setAttribute('role', 'button');
      input.setAttribute('type', 'file');
      input.onchange = function(ev) {
        input.dispatchEvent(new CustomEvent('_change', {detail: input.files[0]}));
      };
      el.appendChild(input);
    }
  };
  GUI.Elements['gui-radio'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'radio');
    }
  };
  GUI.Elements['gui-checkbox'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'checkbox');
    }
  };
  GUI.Elements['gui-switch'] = {
    bind: bindInputEvents,
    set: function(el, param, value) {
      if ( param === 'value' ) {
        var input = el.querySelector('input');
        var button = el.querySelector('button');
        setSwitchValue(value, input, button);
        return true;
      }
      return false;
    },
    build: function(el) {
      var input = document.createElement('input');
      input.type = 'checkbox';
      el.appendChild(input);
      var inner = document.createElement('div');
      var button = document.createElement('button');
      inner.appendChild(button);
      GUI.Helpers.createInputLabel(el, 'switch', inner);
      function toggleValue(v) {
        var val = false;
        if ( typeof v === 'undefined' ) {
          val = !!input.checked;
          val = !val;
        } else {
          val = v;
        }
        setSwitchValue(val, input, button);
      }
      Utils.$bind(inner, 'click', function(ev) {
        ev.preventDefault();
        var disabled = el.getAttribute('data-disabled') !== null;
        if ( !disabled ) {
          toggleValue();
        }
      }, false);
      toggleValue(false);
    }
  };
  GUI.Elements['gui-button'] = {
    set: function(el, param, value, isHTML) {
      if ( param === 'value' || param === 'label' ) {
        var lbl = el.querySelector('button');
        Utils.$empty(lbl);
        if ( isHTML ) {
          lbl.innerHTML = value;
        } else {
          lbl.appendChild(document.createTextNode(value));
        }
        lbl.setAttribute('aria-label', value);
        return true;
      }
      return false;
    },
    create: function(params) {
      var label = params.label;
      if ( params.label ) {
        delete params.label;
      }
      var el = GUI.Helpers.createElement('gui-button', params);
      if ( label ) {
        el.appendChild(document.createTextNode(label));
      }
      return el;
    },
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('button');
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el) {
      var icon = el.getAttribute('data-icon');
      var disabled = el.getAttribute('data-disabled') !== null;
      var group = el.getAttribute('data-group');
      var label = GUI.Helpers.getValueLabel(el);
      var input = document.createElement('button');
      function setGroup(g) {
        if ( g ) {
          input.setAttribute('name', g + '[' + _buttonCount + ']');
          Utils.$bind(input, 'click', function() {
            var root = el;
            while ( root.parentNode ) {
              if ( root.tagName.toLowerCase() === 'application-window-content' ) {
                break;
              }
              root = root.parentNode;
            }
            Utils.$addClass(input, 'gui-active');
            root.querySelectorAll('gui-button[data-group="' + g + '"] > button').forEach(function(b) {
              if ( b.name === input.name ) {
                return;
              }
              Utils.$removeClass(b, 'gui-active');
            });
          });
        }
      }
      function setImage() {
        if ( icon && icon !== 'null' ) {
          var img = document.createElement('img');
          img.src = icon;
          img.alt = el.getAttribute('data-tooltip') || '';
          img.title = el.getAttribute('data-tooltip') || '';
          if ( input.firstChild ) {
            input.insertBefore(img, input.firstChild);
          } else {
            input.appendChild(img);
          }
          Utils.$addClass(el, 'gui-has-image');
        }
      }
      function setLabel() {
        if ( label ) {
          Utils.$addClass(el, 'gui-has-label');
        }
        input.appendChild(document.createTextNode(label));
        input.setAttribute('aria-label', label);
      }
      if ( disabled ) {
        input.setAttribute('disabled', 'disabled');
      }
      setLabel();
      setImage();
      setGroup(group);
      _buttonCount++;
      el.setAttribute('role', 'navigation');
      el.appendChild(input);
    }
  };
  GUI.Elements['gui-select'] = guiSelect;
  GUI.Elements['gui-select-list'] = guiSelect;
  GUI.Elements['gui-slider'] = {
    bind: bindInputEvents,
    get: function(el, param) {
      var val = GUI.Helpers.getProperty(el, param);
      if ( param === 'value' ) {
        return parseInt(val, 10);
      }
      return val;
    },
    build: function(el) {
      createInputOfType(el, 'range');
    }
  };
  GUI.Elements['gui-input-modal'] = {
    bind: function(el, evName, callback, params) {
      if ( evName === 'open' ) {
        evName = '_open';
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    get: function(el, param) {
      if ( param === 'value' ) {
        var input = el.querySelector('input');
        return input.value;
      }
      return false;
    },
    set: function(el, param, value) {
      if ( param === 'value' ) {
        var input = el.querySelector('input');
        input.removeAttribute('disabled');
        input.value = value;
        input.setAttribute('disabled', 'disabled');
        input.setAttribute('aria-disabled', 'true');
        return true;
      }
      return false;
    },
    build: function(el) {
      var container = document.createElement('div');
      var input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('disabled', 'disabled');
      var button = document.createElement('button');
      button.innerHTML = '...';
      Utils.$bind(button, 'click', function(ev) {
        el.dispatchEvent(new CustomEvent('_open', {detail: input.value}));
      }, false);
      container.appendChild(input);
      container.appendChild(button);
      el.appendChild(container);
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  function createVisualElement(el, nodeType, applyArgs) {
    applyArgs = applyArgs || {};
    if ( typeof applyArgs !== 'object' ) {
      console.error('Derp', 'applyArgs was not an object ?!');
      applyArgs = {};
    }
    var img = document.createElement(nodeType);
    var src = el.getAttribute('data-src');
    var controls = el.getAttribute('data-controls');
    if ( controls ) {
      img.setAttribute('controls', 'controls');
    }
    var autoplay = el.getAttribute('data-autoplay');
    if ( autoplay ) {
      img.setAttribute('autoplay', 'autoplay');
    }
    Object.keys(applyArgs).forEach(function(k) {
      var val = applyArgs[k];
      if ( typeof val === 'function' ) {
        k = k.replace(/^on/, '');
        if ( (nodeType === 'video' || nodeType === 'audio') && k === 'load' ) {
          k = 'loadedmetadata';
        }
        Utils.$bind(img, k, val.bind(img), false);
      } else {
        if ( typeof applyArgs[k] === 'boolean' ) {
          val = val ? 'true' : 'false';
        }
        img.setAttribute(k, val);
      }
    });
    img.src = src || 'about:blank';
    el.appendChild(img);
  }
  GUI.Elements['gui-audio'] = {
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('audio');
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el, applyArgs) {
      createVisualElement(el, 'audio', applyArgs);
    }
  };
  GUI.Elements['gui-video'] = {
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('video');
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el, applyArgs) {
      createVisualElement(el, 'video', applyArgs);
    }
  };
  GUI.Elements['gui-image'] = {
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('img');
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el, applyArgs) {
      createVisualElement(el, 'img', applyArgs);
    }
  };
  GUI.Elements['gui-canvas'] = {
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('canvas');
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el) {
      var canvas = document.createElement('canvas');
      el.appendChild(canvas);
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  var _iconSizes = { // Defaults to 16x16
    'gui-icon-view': '32x32'
  };
  function getChildView(el) {
    return el.children[0];
  }
  function getFileIcon(iter, size) {
    if ( iter.icon && typeof iter.icon === 'object' ) {
      return API.getIcon(iter.icon.filename, size, iter.icon.application);
    }
    var icon = 'status/gtk-dialog-question.png';
    return API.getFileIcon(iter, size, icon);
  }
  function getFileSize(iter) {
    var filesize = '';
    if ( iter.type !== 'dir' && iter.size >= 0 ) {
      filesize = Utils.humanFileSize(iter.size);
    }
    return filesize;
  }
  var removeExtension = (function() {
    var mimeConfig;
    return function(str, opts) {
      if ( !mimeConfig ) {
        mimeConfig = API.getConfig('MIME.mapping');
      }
      if ( opts.extensions === false ) {
        var ext = Utils.filext(str);
        if ( ext ) {
          ext = '.' + ext;
          if ( mimeConfig[ext] ) {
            str = str.substr(0, str.length - ext.length);
          }
        }
      }
      return str;
    };
  })();
  function getDateFromStamp(stamp) {
    if ( typeof stamp === 'string' ) {
      var date = null;
      try {
        date = new Date(stamp);
      } catch ( e ) {}
      if ( date ) {
        return OSjs.Helpers.Date.format(date);
      }
    }
    return stamp;
  }
  function getListViewColumns(iter, opts) {
    opts = opts || {};
    var columnMapping = {
      filename: {
        label: 'LBL_FILENAME',
        icon: function() {
          return getFileIcon(iter);
        },
        value: function() {
          return removeExtension(iter.filename, opts);
        }
      },
      mime: {
        label: 'LBL_MIME',
        size: '100px',
        icon: function() {
          return null;
        },
        value: function() {
          return iter.mime;
        }
      },
      mtime: {
        label: 'LBL_MODIFIED',
        size: '160px',
        icon: function() {
          return null;
        },
        value: function() {
          return getDateFromStamp(iter.mtime);
        }
      },
      ctime: {
        label: 'LBL_CREATED',
        size: '160px',
        icon: function() {
          return null;
        },
        value: function() {
          return getDateFromStamp(iter.ctime);
        }
      },
      size: {
        label: 'LBL_SIZE',
        size: '120px',
        icon: function() {
          return null;
        },
        value: function() {
          return getFileSize(iter);
        }
      }
    };
    var defColumns = ['filename', 'mime', 'size'];
    var useColumns = defColumns;
    if ( !opts.defaultcolumns ) {
      var vfsOptions = Utils.cloneObject(OSjs.Core.getSettingsManager().get('VFS') || {});
      var scandirOptions = vfsOptions.scandir || {};
      useColumns = scandirOptions.columns || defColumns;
    }
    var columns = [];
    useColumns.forEach(function(key, idx) {
      var map = columnMapping[key];
      if ( iter ) {
        columns.push({
          label: map.value(),
          icon: map.icon(),
          textalign: idx === 0 ? 'left' : 'right'
        });
      } else {
        columns.push({
          label: API._(map.label),
          size: map.size || '',
          resizable: idx > 0,
          textalign: idx === 0 ? 'left' : 'right'
        });
      }
    });
    return columns;
  }
  function buildChildView(el) {
    var type = el.getAttribute('data-type') || 'list-view';
    if ( !type.match(/^gui\-/) ) {
      type = 'gui-' + type;
    }
    var nel = new GUI.ElementDataView(GUI.Helpers.createElement(type, {'draggable': true, 'draggable-type': 'file'}));
    GUI.Elements[type].build(nel.$element);
    nel.on('select', function(ev) {
      el.dispatchEvent(new CustomEvent('_select', {detail: ev.detail}));
    });
    nel.on('activate', function(ev) {
      el.dispatchEvent(new CustomEvent('_activate', {detail: ev.detail}));
    });
    nel.on('contextmenu', function(ev) {
      if ( !el.hasAttribute('data-has-contextmenu') || el.hasAttribute('data-has-contextmenu') === 'false' ) {
        new GUI.Element(el).fn('contextmenu', [ev]);
      }
      el.dispatchEvent(new CustomEvent('_contextmenu', {detail: ev.detail}));
    });
    if ( type === 'gui-tree-view' ) {
      nel.on('expand', function(ev) {
        el.dispatchEvent(new CustomEvent('_expand', {detail: ev.detail}));
      });
    }
    el.setAttribute('role', 'region');
    el.appendChild(nel.$element);
  }
  function scandir(tagName, dir, opts, cb, oncreate) {
    var file = new VFS.File(dir);
    file.type  = 'dir';
    var scanopts = {
      backlink:           opts.backlink,
      showDotFiles:       opts.dotfiles === true,
      showFileExtensions: opts.extensions === true,
      mimeFilter:         opts.filter || [],
      typeFilter:         opts.filetype || null
    };
    try {
      VFS.scandir(file, function(error, result) {
        if ( error ) {
          cb(error); return;
        }
        var list = [];
        var summary = {size: 0, directories: 0, files: 0, hidden: 0};
        function isHidden(iter) {
          return (iter.filename || '').substr(0) === '.';
        }
        (result || []).forEach(function(iter) {
          list.push(oncreate(iter));
          summary.size += iter.size || 0;
          summary.directories += iter.type === 'dir' ? 1 : 0;
          summary.files += iter.type !== 'dir' ? 1 : 0;
          summary.hidden += isHidden(iter) ? 1 : 0;
        });
        cb(false, list, summary);
      }, scanopts);
    } catch ( e ) {
      cb(e);
    }
  }
  function readdir(el, dir, done, sopts) {
    sopts = sopts || {};
    var vfsOptions = Utils.cloneObject(OSjs.Core.getSettingsManager().get('VFS') || {});
    var scandirOptions = vfsOptions.scandir || {};
    var target = getChildView(el);
    var tagName = target.tagName.toLowerCase();
    el.setAttribute('data-path', dir);
    var opts = {filter: null, backlink: sopts.backlink};
    function setOption(s, d, c, cc) {
      if ( el.hasAttribute(s) ) {
        opts[d] = c(el.getAttribute(s));
      } else {
        opts[d] = (cc || function() {})();
      }
    }
    setOption('data-dotfiles', 'dotfiles', function(val) {
      return val === 'true';
    }, function() {
      return scandirOptions.showHiddenFiles === true;
    });
    setOption('data-extensions', 'extensions', function(val) {
      return val === 'true';
    }, function() {
      return scandirOptions.showFileExtensions === true;
    });
    setOption('data-filetype', 'filetype', function(val) {
      return val;
    });
    setOption('data-defaultcolumns', 'defaultcolumns', function(val) {
      return val === 'true';
    });
    try {
      opts.filter = JSON.parse(el.getAttribute('data-filter'));
    } catch ( e ) {
    }
    scandir(tagName, dir, opts, function(error, result, summary) {
      if ( tagName === 'gui-list-view' ) {
        GUI.Elements[tagName].set(target, 'zebra', true);
        GUI.Elements[tagName].set(target, 'columns', getListViewColumns(null, opts));
      }
      done(error, result, summary);
    }, function(iter) {
      var tooltip = Utils.format('{0}\n{1}\n{2} {3}', iter.type.toUpperCase(), iter.filename, getFileSize(iter), iter.mime || '');
      function _createEntry() {
        var row = {
          value: iter,
          id: iter.id || removeExtension(iter.filename, opts),
          label: iter.filename,
          tooltip: tooltip,
          icon: getFileIcon(iter, _iconSizes[tagName] || '16x16')
        };
        if ( tagName === 'gui-tree-view' && iter.type === 'dir' ) {
          if ( iter.filename !== '..' ) {
            row.entries = [{
              label: 'Loading...'
            }];
          }
        }
        return row;
      }
      if ( tagName !== 'gui-list-view' ) {
        return _createEntry();
      }
      return {
        value: iter,
        id: iter.id || iter.filename,
        tooltip: tooltip,
        columns: getListViewColumns(iter, opts)
      };
    });
  }
  GUI.Elements['gui-file-view'] = {
    bind: function(el, evName, callback, params) {
      if ( (['activate', 'select', 'contextmenu']).indexOf(evName) !== -1 ) {
        evName = '_' + evName;
      }
      if ( evName === '_contextmenu' ) {
        el.setAttribute('data-has-contextmenu', 'true');
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    set: function(el, param, value, arg, arg2) {
      if ( param === 'type' ) {
        var firstChild = el.children[0];
        if ( firstChild && firstChild.tagName.toLowerCase() === value ) {
          return true;
        }
        Utils.$empty(el);
        el.setAttribute('data-type', value);
        Utils.$bind(el, '_expand', function(ev) {
          var target = ev.detail.element;
          if ( target.getAttribute('data-was-rendered') ) {
            return;
          }
          if ( ev.detail.expanded ) {
            var view = new GUI.ElementDataView(getChildView(el));
            var entry = ev.detail.entries[0].data;
            target.setAttribute('data-was-rendered', String(true));
            readdir(el, entry.path, function(error, result, summary) {
              if ( !error ) {
                target.querySelectorAll('gui-tree-view-entry').forEach(function(e) {
                  Utils.$remove(e);
                  view.add({
                    entries: result,
                    parentNode: target
                  });
                });
              }
            }, {backlink: false});
          }
        });
        buildChildView(el);
        if ( typeof arg === 'undefined' || arg === true ) {
          GUI.Elements['gui-file-view'].call(el, 'chdir', {
            path: el.getAttribute('data-path')
          });
        }
        return true;
      } else if ( (['filter', 'dotfiles', 'filetype', 'extensions', 'defaultcolumns']).indexOf(param) >= 0 ) {
        GUI.Helpers.setProperty(el, param, value);
        return true;
      }
      var target = getChildView(el);
      if ( target ) {
        var tagName = target.tagName.toLowerCase();
        GUI.Elements[tagName].set(target, param, value, arg, arg2);
        return true;
      }
      return false;
    },
    build: function(el) {
      buildChildView(el);
    },
    values: function(el) {
      var target = getChildView(el);
      if ( target ) {
        var tagName = target.tagName.toLowerCase();
        return GUI.Elements[tagName].values(target);
      }
      return null;
    },
    contextmenu: function(ev) {
      var vfsOptions = OSjs.Core.getSettingsManager().instance('VFS');
      var scandirOptions = (vfsOptions.get('scandir') || {});
      function setOption(opt, toggle) {
        var opts = {scandir: {}};
        opts.scandir[opt] = toggle;
        vfsOptions.set(null, opts, true);
      }
      API.createMenu([
        {
          title: API._('LBL_SHOW_HIDDENFILES'),
          type: 'checkbox',
          checked: scandirOptions.showHiddenFiles === true,
          onClick: function() {
            setOption('showHiddenFiles', !scandirOptions.showHiddenFiles);
          }
        },
        {
          title: API._('LBL_SHOW_FILEEXTENSIONS'),
          type: 'checkbox',
          checked: scandirOptions.showFileExtensions === true,
          onClick: function() {
            setOption('showFileExtensions', !scandirOptions.showFileExtensions);
          }
        }
      ], ev);
    },
    call: function(el, method, args) {
      args = args || {};
      args.done = args.done || function() {};
      var target = getChildView(el);
      if ( target ) {
        var tagName = target.tagName.toLowerCase();
        if ( method === 'chdir' ) {
          var t = new GUI.ElementDataView(target);
          var dir = args.path || OSjs.API.getDefaultPath();
          clearTimeout(el._readdirTimeout);
          el._readdirTimeout = setTimeout(function() {
            readdir(el, dir, function(error, result, summary) {
              if ( error ) {
                API.error(API._('ERR_VFSMODULE_XHR_ERROR'), API._('ERR_VFSMODULE_SCANDIR_FMT', dir), error);
              } else {
                t.clear();
                t.add(result);
              }
              args.done(error, summary);
            });
            el._readdirTimeout = clearTimeout(el._readdirTimeout);
          }, 50); // Prevent exessive calls
          return;
        }
        GUI.Elements[tagName].call(target, method, args);
      }
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  function createEntry(e) {
    var entry = GUI.Helpers.createElement('gui-tree-view-entry', e, ['entries']);
    return entry;
  }
  function handleItemExpand(ev, el, root, expanded) {
    if ( typeof expanded === 'undefined' ) {
      expanded = !Utils.$hasClass(root, 'gui-expanded');
    }
    Utils.$removeClass(root, 'gui-expanded');
    if ( expanded ) {
      Utils.$addClass(root, 'gui-expanded');
    }
    var children = root.children;
    for ( var i = 0; i < children.length; i++ ) {
      if ( children[i].tagName.toLowerCase() === 'gui-tree-view-entry' ) {
        children[i].style.display = expanded ? 'block' : 'none';
      }
    }
    var selected = {
      index: Utils.$index(root),
      data: GUI.Helpers.getViewNodeValue(root)
    };
    root.setAttribute('data-expanded', String(expanded));
    root.setAttribute('aria-expanded', String(expanded));
    el.dispatchEvent(new CustomEvent('_expand', {detail: {entries: [selected], expanded: expanded, element: root}}));
  } // handleItemExpand()
  function initEntry(el, sel) {
    if ( sel._rendered ) {
      return;
    }
    sel._rendered = true;
    var icon = sel.getAttribute('data-icon');
    var label = GUI.Helpers.getLabel(sel);
    var expanded = el.getAttribute('data-expanded') === 'true';
    var next = sel.querySelector('gui-tree-view-entry');
    var container = document.createElement('div');
    var dspan = document.createElement('span');
    function onDndEnter(ev) {
      ev.stopPropagation();
      Utils.$addClass(sel, 'dnd-over');
    }
    function onDndLeave(ev) {
      Utils.$removeClass(sel, 'dnd-over');
    }
    if ( icon ) {
      dspan.style.backgroundImage = 'url(' + icon + ')';
      Utils.$addClass(dspan, 'gui-has-image');
    }
    dspan.appendChild(document.createTextNode(label));
    container.appendChild(dspan);
    if ( next ) {
      Utils.$addClass(sel, 'gui-expandable');
      var expander = document.createElement('gui-tree-view-expander');
      sel.insertBefore(container, next);
      sel.insertBefore(expander, container);
    } else {
      sel.appendChild(container);
    }
    if ( String(sel.getAttribute('data-draggable')) === 'true' ) {
      GUI.Helpers.createDraggable(container, (function() {
        var data = {};
        try {
          data = JSON.parse(sel.getAttribute('data-value'));
        } catch ( e ) {}
        return {data: data};
      })());
    }
    if ( String(sel.getAttribute('data-droppable')) === 'true' ) {
      var timeout;
      GUI.Helpers.createDroppable(container, {
        onEnter: onDndEnter,
        onOver: onDndEnter,
        onLeave: onDndLeave,
        onDrop: onDndLeave,
        onItemDropped: function(ev, eel, item) {
          ev.stopPropagation();
          ev.preventDefault();
          timeout = clearTimeout(timeout);
          timeout = setTimeout(function() {
            Utils.$removeClass(sel, 'dnd-over');
          }, 10);
          var dval = {};
          try {
            dval = JSON.parse(eel.parentNode.getAttribute('data-value'));
          } catch ( e ) {}
          el.dispatchEvent(new CustomEvent('_drop', {detail: {
            src: item.data,
            dest: dval
          }}));
        }
      });
    }
    handleItemExpand(null, el, sel, expanded);
    GUI.Elements._dataview.bindEntryEvents(el, sel, 'gui-tree-view-entry');
  }
  GUI.Elements['gui-tree-view'] = {
    bind: GUI.Elements._dataview.bind,
    values: function(el) {
      return GUI.Elements._dataview.getSelected(el, el.querySelectorAll('gui-tree-view-entry'));
    },
    build: function(el, applyArgs) {
      var body = el.querySelector('gui-tree-view-body');
      var found = !!body;
      if ( !body ) {
        body = document.createElement('gui-tree-view-body');
        el.appendChild(body);
      }
      body.setAttribute('role', 'group');
      el.setAttribute('role', 'tree');
      el.setAttribute('aria-multiselectable', body.getAttribute('data-multiselect') || 'false');
      el.querySelectorAll('gui-tree-view-entry').forEach(function(sel, idx) {
        sel.setAttribute('aria-expanded', 'false');
        if ( !found ) {
          body.appendChild(sel);
        }
        sel.setAttribute('role', 'treeitem');
        initEntry(el, sel);
      });
      GUI.Elements._dataview.build(el, applyArgs);
    },
    get: function(el, param, value, arg) {
      if ( param === 'entry' ) {
        var body = el.querySelector('gui-tree-view-body');
        return GUI.Elements._dataview.getEntry(el, body.querySelectorAll('gui-tree-view-entry'), value, arg);
      }
      return GUI.Helpers.getProperty(el, param);
    },
    set: function(el, param, value, arg, arg2) {
      var body = el.querySelector('gui-tree-view-body');
      if ( param === 'selected' || param === 'value' ) {
        GUI.Elements._dataview.setSelected(el, body, body.querySelectorAll('gui-tree-view-entry'), value, arg, arg2);
        return true;
      }
      return false;
    },
    call: function(el, method, args) {
      var body = el.querySelector('gui-tree-view-body');
      function recurse(a, root, level) {
        GUI.Elements._dataview.add(el, a, function(e) {
          if ( e ) {
            if ( e.parentNode ) {
              delete e.parentNode;
            }
            var entry = createEntry(e);
            root.appendChild(entry);
            if ( e.entries ) {
              recurse([e.entries], entry, level + 1);
            }
            initEntry(el, entry);
          }
        });
      }
      function add() {
        var parentNode = body;
        var entries = args;
        if ( typeof args[0] === 'object' && !(args[0] instanceof Array) && Object.keys(args[0]).length ) {
          entries = [args[0].entries || []];
          parentNode = args[0].parentNode || body;
        }
        recurse(entries, parentNode, 0);
      }
      if ( method === 'add' ) {
        add();
      } else if ( method === 'remove' ) {
        GUI.Elements._dataview.remove(el, args, 'gui-tree-view-entry');
      } else if ( method === 'clear' ) {
        GUI.Elements._dataview.clear(el, body);
      } else if ( method === 'patch' ) {
        GUI.Elements._dataview.patch(el, args, 'gui-tree-view-entry', body, createEntry, initEntry);
      } else if ( method === 'focus' ) {
        GUI.Elements._dataview.focus(el);
      } else if ( method === 'expand' ) {
        handleItemExpand(args.ev, el, args.entry);
      }
      return this;
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  function createFakeHeader(el) {
    function createResizers() {
      var fhead = el.querySelector('gui-list-view-fake-head');
      var head = el.querySelector('gui-list-view-head');
      var fcols = fhead.querySelectorAll('gui-list-view-column');
      var cols = head.querySelectorAll('gui-list-view-column');
      fhead.querySelectorAll('gui-list-view-column-resizer').forEach(function(rel) {
        Utils.$remove(rel);
      });
      cols.forEach(function(col, idx) {
        var attr = col.getAttribute('data-resizable');
        if ( attr === 'true' ) {
          var fcol = fcols[idx];
          var resizer = document.createElement('gui-list-view-column-resizer');
          fcol.appendChild(resizer);
          var startWidth   = 0;
          var maxWidth     = 0;
          var widthOffset  = 16;
          var minWidth     = widthOffset;
          var tmpEl        = null;
          GUI.Helpers.createDrag(resizer, function(ev) {
            startWidth = col.offsetWidth;
            minWidth = widthOffset;//calculateWidth();
            maxWidth = el.offsetWidth - (el.children.length * widthOffset);
          }, function(ev, diff) {
            var newWidth = startWidth - diff.x;
            if ( !isNaN(newWidth) && newWidth > minWidth && newWidth < maxWidth ) {
              col.style.width = String(newWidth) + 'px';
              fcol.style.width = String(newWidth) + 'px';
            }
            tmpEl = Utils.$remove(tmpEl);
          });
        }
      });
    }
    var fh = el.querySelector('gui-list-view-fake-head gui-list-view-head');
    Utils.$empty(fh);
    var row = el.querySelector('gui-list-view-head gui-list-view-row');
    if ( row ) {
      fh.appendChild(row.cloneNode(true));
      createResizers();
    }
  }
  function initRow(el, row) {
    row.querySelectorAll('gui-list-view-column').forEach(function(cel, idx) {
      var icon = cel.getAttribute('data-icon');
      if ( icon && icon !== 'null' ) {
        Utils.$addClass(cel, 'gui-has-image');
        cel.style.backgroundImage = 'url(' + icon + ')';
      }
      var text = cel.firstChild;
      if ( text && text.nodeType === 3 ) {
        var span = document.createElement('span');
        span.appendChild(document.createTextNode(text.nodeValue));
        cel.insertBefore(span, text);
        cel.removeChild(text);
      }
      if ( el._columns[idx] && !el._columns[idx].visible ) {
        cel.style.display = 'none';
      }
      cel.setAttribute('role', 'listitem');
    });
    GUI.Elements._dataview.bindEntryEvents(el, row, 'gui-list-view-row');
  }
  function createEntry(v, head) {
    var label = v.label || '';
    if ( v.label ) {
      delete v.label;
    }
    var setSize = null;
    if ( v.size ) {
      setSize = v.size;
      delete v.size;
    }
    var nel = GUI.Helpers.createElement('gui-list-view-column', v);
    if ( setSize ) {
      nel.style.width = setSize;
    }
    if ( typeof label === 'function' ) {
      nel.appendChild(label.call(nel, nel, v));
    } else {
      var span = document.createElement('span');
      span.appendChild(document.createTextNode(label));
      nel.appendChild(span);
    }
    return nel;
  }
  function createRow(e) {
    e = e || {};
    if ( e.columns ) {
      var row = GUI.Helpers.createElement('gui-list-view-row', e, ['columns']);
      e.columns.forEach(function(se) {
        row.appendChild(createEntry(se));
      });
      return row;
    }
    return null;
  }
  GUI.Elements['gui-list-view'] = {
    bind: GUI.Elements._dataview.bind,
    values: function(el) {
      var body = el.querySelector('gui-list-view-body');
      return GUI.Elements._dataview.getSelected(el, body.querySelectorAll('gui-list-view-row'));
    },
    get: function(el, param, value, arg, asValue) {
      if ( param === 'entry' ) {
        var body = el.querySelector('gui-list-view-body');
        var rows = body.querySelectorAll('gui-list-view-row');
        return GUI.Elements._dataview.getEntry(el, rows, value, arg, asValue);
      }
      return GUI.Helpers.getProperty(el, param);
    },
    set: function(el, param, value, arg, arg2) {
      if ( param === 'columns' ) {
        var head = el.querySelector('gui-list-view-head');
        var row = document.createElement('gui-list-view-row');
        Utils.$empty(head);
        el._columns = [];
        value.forEach(function(v) {
          v.visible = (typeof v.visible === 'undefined') || v.visible === true;
          var nel = createEntry(v, true);
          el._columns.push(v);
          if ( !v.visible ) {
            nel.style.display = 'none';
          }
          row.appendChild(nel);
        });
        head.appendChild(row);
        createFakeHeader(el);
        return true;
      } else if ( param === 'selected' || param === 'value' ) {
        var body = el.querySelector('gui-list-view-body');
        GUI.Elements._dataview.setSelected(el, body, body.querySelectorAll('gui-list-view-row'), value, arg, arg2);
        return true;
      }
      return false;
    },
    call: function(el, method, args) {
      var body = el.querySelector('gui-list-view-body');
      if ( method === 'add' ) {
        GUI.Elements._dataview.add(el, args, function(e) {
          var cbCreated = e.onCreated || function() {};
          var row = createRow(e);
          if ( row ) {
            body.appendChild(row);
            initRow(el, row);
          }
          cbCreated(row);
        });
      } else if ( method === 'remove' ) {
        GUI.Elements._dataview.remove(el, args, 'gui-list-view-row', null, body);
      } else if ( method === 'clear' ) {
        GUI.Elements._dataview.clear(el, el.querySelector('gui-list-view-body'));
      } else if ( method === 'patch' ) {
        GUI.Elements._dataview.patch(el, args, 'gui-list-view-row', body, createRow, initRow);
      } else if ( method === 'focus' ) {
        GUI.Elements._dataview.focus(el);
      }
      return this;
    },
    build: function(el, applyArgs) {
      el._columns  = [];
      var inner = el.querySelector('gui-list-view-inner');
      var head = el.querySelector('gui-list-view-head');
      var body = el.querySelector('gui-list-view-body');
      function moveIntoInner(cel) {
        if ( cel.parentNode.tagName !== 'GUI-LIST-VIEW-INNER' ) {
          inner.appendChild(cel);
        }
      }
      var fakeHead = el.querySelector('gui-list-view-fake-head');
      if ( !fakeHead ) {
        fakeHead = document.createElement('gui-list-view-fake-head');
        var fakeHeadInner = document.createElement('gui-list-view-inner');
        fakeHeadInner.appendChild(document.createElement('gui-list-view-head'));
        fakeHead.appendChild(fakeHeadInner);
      }
      if ( !inner ) {
        inner = document.createElement('gui-list-view-inner');
        el.appendChild(inner);
      }
      (function _createBody() {
        if ( body ) {
          moveIntoInner(body);
        } else {
          body = document.createElement('gui-list-view-body');
          inner.appendChild(body);
        }
        body.setAttribute('role', 'group');
      })();
      (function _createHead() {
        if ( head ) {
          moveIntoInner(head);
        } else {
          head = document.createElement('gui-list-view-head');
          inner.insertBefore(head, body);
        }
        head.setAttribute('role', 'group');
      })();
      el.setAttribute('role', 'list');
      el.appendChild(fakeHead);
      Utils.$bind(el, 'scroll', function(ev) {
        fakeHead.style.top = el.scrollTop + 'px';
      }, false);
      var hcols = el.querySelectorAll('gui-list-view-head gui-list-view-column');
      hcols.forEach(function(cel, idx) {
        var vis = cel.getAttribute('data-visible');
        var iter = {
          visible: vis === null || vis === 'true',
          size: cel.getAttribute('data-size')
        };
        if ( iter.size ) {
          cel.style.width = iter.size;
        }
        el._columns.push(iter);
        if ( !iter.visible ) {
          cel.style.display = 'none';
        }
      });
      createFakeHeader(el);
      el.querySelectorAll('gui-list-view-body gui-list-view-row').forEach(function(row) {
        initRow(el, row);
      });
      GUI.Elements._dataview.build(el, applyArgs);
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  function createEntry(e) {
    var entry = GUI.Helpers.createElement('gui-icon-view-entry', e);
    return entry;
  }
  function initEntry(el, cel) {
    var icon = cel.getAttribute('data-icon');
    var label = GUI.Helpers.getLabel(cel);
    var dicon = document.createElement('div');
    var dimg = document.createElement('img');
    dimg.src = icon;
    dicon.appendChild(dimg);
    var dlabel = document.createElement('div');
    var dspan = document.createElement('span');
    dspan.appendChild(document.createTextNode(label));
    dlabel.appendChild(dspan);
    GUI.Elements._dataview.bindEntryEvents(el, cel, 'gui-icon-view-entry');
    cel.setAttribute('role', 'listitem');
    cel.appendChild(dicon);
    cel.appendChild(dlabel);
  }
  GUI.Elements['gui-icon-view'] = {
    bind: GUI.Elements._dataview.bind,
    values: function(el) {
      return GUI.Elements._dataview.getSelected(el, el.querySelectorAll('gui-icon-view-entry'));
    },
    build: function(el, applyArgs) {
      var body = el.querySelector('gui-icon-view-body');
      var found = !!body;
      if ( !body ) {
        body = document.createElement('gui-icon-view-body');
        el.appendChild(body);
      }
      el.querySelectorAll('gui-icon-view-entry').forEach(function(cel, idx) {
        if ( !found ) {
          body.appendChild(cel);
        }
        initEntry(el, cel);
      });
      el.setAttribute('role', 'list');
      GUI.Elements._dataview.build(el, applyArgs);
    },
    get: function(el, param, value, arg, asValue) {
      if ( param === 'entry' ) {
        var body = el.querySelector('gui-icon-view-body');
        var rows = body.querySelectorAll('gui-icon-view-entry');
        return GUI.Elements._dataview.getEntry(el, rows, value, arg, asValue);
      }
      return GUI.Helpers.getProperty(el, param);
    },
    set: function(el, param, value, arg) {
      var body = el.querySelector('gui-icon-view-body');
      if ( param === 'selected' || param === 'value' ) {
        GUI.Elements._dataview.setSelected(el, body, body.querySelectorAll('gui-icon-view-entry'), value, arg);
        return true;
      }
      return false;
    },
    call: function(el, method, args) {
      var body = el.querySelector('gui-icon-view-body');
      if ( method === 'add' ) {
        GUI.Elements._dataview.add(el, args, function(e) {
          var entry = createEntry(e);
          body.appendChild(entry);
          initEntry(el, entry);
        });
      } else if ( method === 'remove' ) {
        GUI.Elements._dataview.remove(el, args, 'gui-icon-view-entry');
      } else if ( method === 'clear' ) {
        GUI.Elements._dataview.clear(el, body);
      } else if ( method === 'patch' ) {
        GUI.Elements._dataview.patch(el, args, 'gui-icon-view-entry', body, createEntry, initEntry);
      } else if ( method === 'focus' ) {
        GUI.Elements._dataview.focus(el);
      }
      return this;
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  function getDocument(el, iframe) {
    iframe = iframe || el.querySelector('iframe');
    return iframe.contentDocument || iframe.contentWindow.document;
  }
  function getDocumentData(el) {
    try {
      var doc = getDocument(el);
      return doc.body.innerHTML;
    } catch ( error ) {
      console.error('gui-richtext', 'getDocumentData()', error.stack, error);
    }
    return '';
  }
  function destroyFixInterval(el) {
    el._fixTry = 0;
    el._fixInterval = clearInterval(el._fixInterval);
  }
  function createFixInterval(el, doc, text) {
    if ( el._fixTry > 10 ) {
      el._fixTry = 0;
      return;
    }
    el._fixInterval = setInterval(function() {
      try {
        if ( text ) {
          doc.body.innerHTML = text;
        }
        destroyFixInterval(el);
      } catch ( error ) {
        console.warn('gui-richtext', 'setDocumentData()', error.stack, error, '... trying again');
      }
      el._fixTry++;
    }, 100);
  }
  function setDocumentData(el, text) {
    destroyFixInterval(el);
    text = text || '';
    var wm = OSjs.Core.getWindowManager();
    var theme = (wm ? wm.getSetting('theme') : 'default') || 'default';
    var themeSrc = OSjs.API.getThemeCSS(theme);
    var editable = el.getAttribute('data-editable');
    editable = editable === null || editable === 'true';
    function onMouseDown(ev) {
      function insertTextAtCursor(text) {
        var sel, range;
        if (window.getSelection) {
          sel = window.getSelection();
          if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode( document.createTextNode(text) );
          }
        } else if (document.selection && document.selection.createRange) {
          document.selection.createRange().text = text;
        }
      }
      if ( ev.keyCode === 9 ) {
        insertTextAtCursor('\u00A0');
        ev.preventDefault();
      }
    }
    var script = onMouseDown.toString() + ';window.addEventListener("keydown", onMouseDown)';
    var template = '<!DOCTYPE html><html><head><link rel="stylesheet" type="text/css" href="' + themeSrc + '" /><script>' + script + '</script></head><body contentEditable="true"></body></html>';
    if ( !editable ) {
      template = template.replace(' contentEditable="true"', '');
    }
    var doc = getDocument(el);
    doc.open();
    doc.write(template);
    doc.close();
    createFixInterval(el, doc, text);
  }
  GUI.Elements['gui-richtext'] = {
    bind: function(el, evName, callback, params) {
      if ( (['selection']).indexOf(evName) !== -1 ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el) {
      var text = el.childNodes.length ? el.childNodes[0].nodeValue : '';
      Utils.$empty(el);
      var iframe = document.createElement('iframe');
      iframe.setAttribute('border', 0);
      iframe.onload = function() {
        iframe.contentWindow.addEventListener('selectstart', function() {
          el.dispatchEvent(new CustomEvent('_selection', {detail: {}}));
        });
        iframe.contentWindow.addEventListener('mouseup', function() {
          el.dispatchEvent(new CustomEvent('_selection', {detail: {}}));
        });
      };
      el.appendChild(iframe);
      setTimeout(function() {
        try {
          setDocumentData(el, text);
        } catch ( e ) {
          console.warn('gui-richtext', 'build()', e);
        }
      }, 1);
    },
    call: function(el, method, args) {
      var doc = getDocument(el);
      try {
        if ( method === 'command' ) {
          if ( doc && doc.execCommand ) {
            return doc.execCommand.apply(doc, args);
          }
        } else if ( method === 'query' ) {
          if ( doc && doc.queryCommandValue ) {
            return doc.queryCommandValue.apply(doc, args);
          }
        }
      } catch ( e ) {
        console.warn('gui-richtext call() warning', e.stack, e);
      }
      return null;
    },
    get: function(el, param, value) {
      if ( param === 'value' ) {
        return getDocumentData(el);
      }
      return GUI.Helpers.getProperty(el, param);
    },
    set: function(el, param, value) {
      if ( param === 'value' ) {
        setDocumentData(el, value);
        return true;
      }
      return false;
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  GUI.Elements['gui-paned-view'] = {
    bind: function(el, evName, callback, params) {
      if ( evName === 'resize' ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el) {
      var orient = el.getAttribute('data-orientation') || 'horizontal';
      function bindResizer(resizer, idx, cel) {
        var resizeEl = resizer.previousElementSibling;
        if ( !resizeEl ) {
          return;
        }
        var startWidth = resizeEl.offsetWidth;
        var startHeight = resizeEl.offsetHeight;
        var minSize = 16;
        var maxSize = Number.MAX_VALUE;
        GUI.Helpers.createDrag(resizer, function(ev) {
          startWidth = resizeEl.offsetWidth;
          startHeight = resizeEl.offsetHeight;
          minSize = parseInt(cel.getAttribute('data-min-size'), 10) || minSize;
          var max = parseInt(cel.getAttribute('data-max-size'), 10);
          if ( !max ) {
            var totalHeight = resizer.parentNode.offsetHeight;
            var totalContainers = resizer.parentNode.querySelectorAll('gui-paned-view-container').length;
            var totalSpacers = resizer.parentNode.querySelectorAll('gui-paned-view-handle').length;
            maxSize = totalHeight - (totalContainers * 16) - (totalSpacers * 8);
          }
        }, function(ev, diff) {
          var newWidth = startWidth + diff.x;
          var newHeight = startHeight + diff.y;
          var flex;
          if ( orient === 'horizontal' ) {
            if ( !isNaN(newWidth) && newWidth > 0 && newWidth >= minSize && newWidth <= maxSize ) {
              flex = newWidth.toString() + 'px';
            }
          } else {
            if ( !isNaN(newHeight) && newHeight > 0 && newHeight >= minSize && newHeight <= maxSize ) {
              flex = newHeight.toString() + 'px';
            }
          }
          if ( flex ) {
            resizeEl.style.webkitFlexBasis = flex;
            resizeEl.style.mozFflexBasis = flex;
            resizeEl.style.msFflexBasis = flex;
            resizeEl.style.oFlexBasis = flex;
            resizeEl.style.flexBasis = flex;
          }
        }, function(ev) {
          el.dispatchEvent(new CustomEvent('_resize', {detail: {index: idx}}));
        });
      }
      el.querySelectorAll('gui-paned-view-container').forEach(function(cel, idx) {
        if ( idx % 2 ) {
          var resizer = document.createElement('gui-paned-view-handle');
          resizer.setAttribute('role', 'separator');
          cel.parentNode.insertBefore(resizer, cel);
          bindResizer(resizer, idx, cel);
        }
      });
    }
  };
  GUI.Elements['gui-paned-view-container'] = {
    build: function(el) {
      GUI.Helpers.setFlexbox(el);
    }
  };
  GUI.Elements['gui-button-bar'] = {
    build: function(el) {
      el.setAttribute('role', 'toolbar');
    }
  };
  GUI.Elements['gui-toolbar'] = {
    build: function(el) {
      el.setAttribute('role', 'toolbar');
    }
  };
  GUI.Elements['gui-grid'] = {
    build: function(el) {
      var rows = el.querySelectorAll('gui-grid-row');
      var p = 100 / rows.length;
      rows.forEach(function(r) {
        r.style.height = String(p) + '%';
      });
    }
  };
  GUI.Elements['gui-grid-row'] = {
    build: function(el) {
    }
  };
  GUI.Elements['gui-grid-entry'] = {
    build: function(el) {
    }
  };
  GUI.Elements['gui-vbox'] = {
    build: function(el) {
    }
  };
  GUI.Elements['gui-vbox-container'] = {
    build: function(el) {
      GUI.Helpers.setFlexbox(el);
    }
  };
  GUI.Elements['gui-hbox'] = {
    build: function(el) {
    }
  };
  GUI.Elements['gui-hbox-container'] = {
    build: function(el) {
      GUI.Helpers.setFlexbox(el);
    }
  };
  GUI.Elements['gui-expander'] = (function() {
    function toggleState(el, expanded) {
      if ( typeof expanded === 'undefined' ) {
        expanded = el.getAttribute('data-expanded') !== 'false';
        expanded = !expanded;
      }
      el.setAttribute('aria-expanded', String(expanded));
      el.setAttribute('data-expanded', String(expanded));
      return expanded;
    }
    return {
      set: function(el, param, value) {
        if ( param === 'expanded' ) {
          return toggleState(el, value === true);
        }
        return null;
      },
      bind: function(el, evName, callback, params) {
        if ( (['change']).indexOf(evName) !== -1 ) {
          evName = '_' + evName;
        }
        Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
      },
      build: function(el) {
        var lbltxt = el.getAttribute('data-label') || '';
        var label = document.createElement('gui-expander-label');
        Utils.$bind(label, 'click', function(ev) {
          el.dispatchEvent(new CustomEvent('_change', {detail: {expanded: toggleState(el)}}));
        }, false);
        label.appendChild(document.createTextNode(lbltxt));
        el.setAttribute('role', 'toolbar');
        el.setAttribute('aria-expanded', 'true');
        el.setAttribute('data-expanded', 'true');
        if ( el.children.length ) {
          el.insertBefore(label, el.children[0]);
        } else {
          el.appendChild(label);
        }
      }
    };
  })();
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, DialogWindow) {
  'use strict';
  function AlertDialog(args, callback) {
    args = Utils.argumentDefaults(args, {});
    DialogWindow.apply(this, ['AlertDialog', {
      title: args.title || API._('DIALOG_ALERT_TITLE'),
      icon: 'status/dialog-warning.png',
      width: 400,
      height: 100
    }, args, callback]);
  }
  AlertDialog.prototype = Object.create(DialogWindow.prototype);
  AlertDialog.constructor = DialogWindow;
  AlertDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    root.setAttribute('role', 'alertdialog');
    this.scheme.find(this, 'Message').set('value', this.args.message, true);
    return root;
  };
  OSjs.Dialogs.Alert = Object.seal(AlertDialog);
})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, Utils, DialogWindow) {
  'use strict';
  function ApplicationChooserDialog(args, callback) {
    args = Utils.argumentDefaults(args, {});
    DialogWindow.apply(this, ['ApplicationChooserDialog', {
      title: args.title || API._('DIALOG_APPCHOOSER_TITLE'),
      width: 400,
      height: 400
    }, args, callback]);
  }
  ApplicationChooserDialog.prototype = Object.create(DialogWindow.prototype);
  ApplicationChooserDialog.constructor = DialogWindow;
  ApplicationChooserDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var cols = [{label: API._('LBL_NAME')}];
    var rows = [];
    var metadata = OSjs.Core.getPackageManager().getPackages();
    (this.args.list || []).forEach(function(name) {
      var iter = metadata[name];
      if ( iter && iter.type === 'application' ) {
        var label = [iter.name];
        if ( iter.description ) {
          label.push(iter.description);
        }
        rows.push({
          value: iter,
          columns: [
            {label: label.join(' - '), icon: API.getIcon(iter.icon, null, name), value: JSON.stringify(iter)}
          ]
        });
      }
    });
    this.scheme.find(this, 'ApplicationList').set('columns', cols).add(rows).on('activate', function(ev) {
      self.onClose(ev, 'ok');
    });
    var file = '<unknown file>';
    var label = '<unknown mime>';
    if ( this.args.file ) {
      file = Utils.format('{0} ({1})', this.args.file.filename, this.args.file.mime);
      label = API._('DIALOG_APPCHOOSER_SET_DEFAULT', this.args.file.mime);
    }
    this.scheme.find(this, 'FileName').set('value', file);
    this.scheme.find(this, 'SetDefault').set('label', label);
    return root;
  };
  ApplicationChooserDialog.prototype.onClose = function(ev, button) {
    var result = null;
    if ( button === 'ok' ) {
      var useDefault = this.scheme.find(this, 'SetDefault').get('value');
      var selected = this.scheme.find(this, 'ApplicationList').get('value');
      if ( selected && selected.length ) {
        result = selected[0].data.className;
      }
      if ( !result ) {
        OSjs.API.createDialog('Alert', {
          message: API._('DIALOG_APPCHOOSER_NO_SELECTION')
        }, null, this);
        return;
      }
      result = {
        name: result,
        useDefault: useDefault
      };
    }
    this.closeCallback(ev, button, result);
  };
  OSjs.Dialogs.ApplicationChooser = Object.seal(ApplicationChooserDialog);
})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, Utils, DialogWindow) {
  'use strict';
  function ColorDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
    });
    var rgb = args.color;
    var hex = rgb;
    if ( typeof rgb === 'string' ) {
      hex = rgb;
      rgb = Utils.convertToRGB(rgb);
      rgb.a = null;
    } else {
      if ( typeof rgb.a === 'undefined' ) {
        rgb.a = null;
      } else {
        if ( rgb.a > 1.0 ) {
          rgb.a /= 100;
        }
      }
      rgb = rgb || {r: 0, g: 0, b: 0, a: 100};
      hex = Utils.convertToHEX(rgb.r, rgb.g, rgb.b);
    }
    DialogWindow.apply(this, ['ColorDialog', {
      title: args.title || API._('DIALOG_COLOR_TITLE'),
      icon: 'apps/gnome-settings-theme.png',
      width: 400,
      height: rgb.a !== null ? 300  : 220
    }, args, callback]);
    this.color = {r: rgb.r, g: rgb.g, b: rgb.b, a: rgb.a, hex: hex};
  }
  ColorDialog.prototype = Object.create(DialogWindow.prototype);
  ColorDialog.constructor = DialogWindow;
  ColorDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    function updateHex(update) {
      self.scheme.find(self, 'LabelRed').set('value', API._('DIALOG_COLOR_R', self.color.r));
      self.scheme.find(self, 'LabelGreen').set('value', API._('DIALOG_COLOR_G', self.color.g));
      self.scheme.find(self, 'LabelBlue').set('value', API._('DIALOG_COLOR_B', self.color.b));
      self.scheme.find(self, 'LabelAlpha').set('value', API._('DIALOG_COLOR_A', self.color.a));
      if ( update ) {
        self.color.hex = Utils.convertToHEX(self.color.r, self.color.g, self.color.b);
      }
      var value = self.color.hex;
      if ( self.color.a !== null && !isNaN(self.color.a) ) {
        value = Utils.format('rgba({0}, {1}, {2}, {3})', self.color.r, self.color.g, self.color.b, self.color.a);
      }
      self.scheme.find(self, 'ColorPreview').set('value', value);
    }
    this.scheme.find(this, 'ColorSelect').on('change', function(ev) {
      self.color = ev.detail;
      self.scheme.find(self, 'Red').set('value', self.color.r);
      self.scheme.find(self, 'Green').set('value', self.color.g);
      self.scheme.find(self, 'Blue').set('value', self.color.b);
      updateHex(true);
    });
    this.scheme.find(this, 'Red').on('change', function(ev) {
      self.color.r = parseInt(ev.detail, 10);
      updateHex(true);
    }).set('value', this.color.r);
    this.scheme.find(this, 'Green').on('change', function(ev) {
      self.color.g = parseInt(ev.detail, 10);
      updateHex(true);
    }).set('value', this.color.g);
    this.scheme.find(this, 'Blue').on('change', function(ev) {
      self.color.b = parseInt(ev.detail, 10);
      updateHex(true);
    }).set('value', this.color.b);
    this.scheme.find(this, 'Alpha').on('change', function(ev) {
      self.color.a = parseInt(ev.detail, 10) / 100;
      updateHex(true);
    }).set('value', this.color.a * 100);
    if ( this.color.a === null ) {
      this.scheme.find(this, 'AlphaContainer').hide();
      this.scheme.find(this, 'AlphaLabelContainer').hide();
    }
    updateHex(false, this.color.a !== null);
    return root;
  };
  ColorDialog.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, button === 'ok' ? this.color : null);
  };
  OSjs.Dialogs.Color = Object.seal(ColorDialog);
})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, Utils, DialogWindow) {
  'use strict';
  function ConfirmDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
      buttons: ['yes', 'no', 'cancel']
    });
    DialogWindow.apply(this, ['ConfirmDialog', {
      title: args.title || API._('DIALOG_CONFIRM_TITLE'),
      icon: 'status/dialog-question.png',
      width: 400,
      height: 100
    }, args, callback]);
  }
  ConfirmDialog.prototype = Object.create(DialogWindow.prototype);
  ConfirmDialog.constructor = DialogWindow;
  ConfirmDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var msg = DialogWindow.parseMessage(this.args.message);
    this.scheme.find(this, 'Message').empty().append(msg);
    var buttonMap = {
      yes: 'ButtonYes',
      no: 'ButtonNo',
      cancel: 'ButtonCancel'
    };
    var hide = [];
    (['yes', 'no', 'cancel']).forEach(function(b) {
      if ( self.args.buttons.indexOf(b) < 0 ) {
        hide.push(b);
      }
    });
    hide.forEach(function(b) {
      self.scheme.find(self, buttonMap[b]).hide();
    });
    return root;
  };
  OSjs.Dialogs.Confirm = Object.seal(ConfirmDialog);
})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, Utils, DialogWindow) {
  'use strict';
  function ErrorDialog(args, callback) {
    args = Utils.argumentDefaults(args, {});
    console.error('ErrorDialog::constructor()', args);
    var exception = args.exception || {};
    var error = '';
    if ( exception.stack ) {
      error = exception.stack;
    } else {
      if ( Object.keys(exception).length ) {
        error = exception.name;
        error += '\nFilename: ' + exception.fileName || '<unknown>';
        error += '\nLine: ' + exception.lineNumber;
        error += '\nMessage: ' + exception.message;
        if ( exception.extMessage ) {
          error += '\n' + exception.extMessage;
        }
      }
    }
    DialogWindow.apply(this, ['ErrorDialog', {
      title: args.title || API._('DIALOG_CONFIRM_TITLE'),
      icon: 'status/dialog-error.png',
      width: 400,
      height: error ? 400 : 200
    }, args, callback]);
    this._sound = 'ERROR';
    this._soundVolume = 1.0;
    this.traceMessage = error;
  }
  ErrorDialog.prototype = Object.create(DialogWindow.prototype);
  ErrorDialog.constructor = DialogWindow;
  ErrorDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    root.setAttribute('role', 'alertdialog');
    var msg = DialogWindow.parseMessage(this.args.message);
    this.scheme.find(this, 'Message').empty().append(msg);
    this.scheme.find(this, 'Summary').set('value', this.args.error);
    this.scheme.find(this, 'Trace').set('value', this.traceMessage);
    if ( !this.traceMessage ) {
      this.scheme.find(this, 'Trace').hide();
      this.scheme.find(this, 'TraceLabel').hide();
    }
    if ( this.args.bugreport ) {
      this.scheme.find(this, 'ButtonBugReport').on('click', function() {
        var title = '';
        var body = [];
        if ( API.getConfig('BugReporting.options.issue') ) {
          var obj = {};
          var keys = ['userAgent', 'platform', 'language', 'appVersion'];
          keys.forEach(function(k) {
            obj[k] = navigator[k];
          });
          title = API.getConfig('BugReporting.options.title');
          body = [
            '**' + API.getConfig('BugReporting.options.message') +  ':**',
            '\n',
            '> ' + self.args.message,
            '\n',
            '> ' + (self.args.error || 'Unknown error'),
            '\n',
            '## Expected behaviour',
            '\n',
            '## Actual behaviour',
            '\n',
            '## Steps to reproduce the error',
            '\n',
            '## (Optinal) Browser and OS information',
            '\n',
            '```\n' + JSON.stringify(obj) + '\n```'
          ];
          if ( self.traceMessage ) {
            body.push('\n## Stack Trace \n```\n' + self.traceMessage + '\n```\n');
          }
        }
        var url = API.getConfig('BugReporting.url')
          .replace('%TITLE%', encodeURIComponent(title))
          .replace('%BODY%', encodeURIComponent(body.join('\n')));
        window.open(url);
      });
    } else {
      this.scheme.find(this, 'ButtonBugReport').hide();
    }
    return root;
  };
  OSjs.Dialogs.Error = Object.seal(ErrorDialog);
})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, VFS, Utils, DialogWindow) {
  'use strict';
  function FileDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
      file:       null,
      type:       'open',
      path:       OSjs.API.getDefaultPath(),
      filename:   '',
      filetypes:  [],
      extension:  '',
      mime:       'application/octet-stream',
      filter:     [],
      mfilter:    [],
      select:     null,
      multiple:   false
    });
    args.multiple = (args.type === 'save' ? false : args.multiple === true);
    if ( args.path && args.path instanceof VFS.File ) {
      args.path = Utils.dirname(args.path.path);
    }
    if ( args.file && args.file.path ) {
      args.path = Utils.dirname(args.file.path);
      args.filename = args.file.filename;
      args.mime = args.file.mime;
      if ( args.filetypes.length ) {
        var setTo = args.filetypes[0];
        args.filename = Utils.replaceFileExtension(args.filename, setTo.extension);
        args.mime = setTo.mime;
      }
    }
    var title     = API._(args.type === 'save' ? 'DIALOG_FILE_SAVE' : 'DIALOG_FILE_OPEN');
    var icon      = args.type === 'open' ? 'actions/gtk-open.png' : 'actions/gtk-save-as.png';
    DialogWindow.apply(this, ['FileDialog', {
      title: title,
      icon: icon,
      width: 600,
      height: 400
    }, args, callback]);
    this.selected = null;
    this.path = args.path;
    var self = this;
    this.settingsWatch = OSjs.Core.getSettingsManager().watch('VFS', function() {
      self.changePath();
    });
  }
  FileDialog.prototype = Object.create(DialogWindow.prototype);
  FileDialog.constructor = DialogWindow;
  FileDialog.prototype.destroy = function() {
    try {
      OSjs.Core.getSettingsManager().unwatch(this.settingsWatch);
    } catch ( e ) {}
    return DialogWindow.prototype.destroy.apply(this, arguments);
  };
  FileDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var view = this.scheme.find(this, 'FileView');
    view.set('filter', this.args.filter);
    view.set('filetype', this.args.select || '');
    view.set('defaultcolumns', 'true');
    var filename = this.scheme.find(this, 'Filename');
    var home = this.scheme.find(this, 'HomeButton');
    var mlist = this.scheme.find(this, 'ModuleSelect');
    function checkEmptyInput() {
      var disable = false;
      if ( self.args.select !== 'dir' ) {
        disable = !filename.get('value').length;
      }
      self.scheme.find(self, 'ButtonOK').set('disabled', disable);
    }
    this._toggleLoading(true);
    view.set('multiple', this.args.multiple);
    filename.set('value', this.args.filename || '');
    home.on('click', function() {
      var dpath = API.getDefaultPath();
      self.changePath(dpath);
    });
    view.on('activate', function(ev) {
      self.selected = null;
      if ( self.args.type !== 'save' ) {
        filename.set('value', '');
      }
      if ( ev && ev.detail && ev.detail.entries ) {
        var activated = ev.detail.entries[0];
        if ( activated ) {
          self.selected = new VFS.File(activated.data);
          if ( self.selected.type !== 'dir' ) {
            filename.set('value', self.selected.filename);
          }
          self.checkSelection(ev, true);
        }
      }
    });
    view.on('select', function(ev) {
      self.selected = null;
      if ( ev && ev.detail && ev.detail.entries ) {
        var activated = ev.detail.entries[0];
        if ( activated ) {
          self.selected = new VFS.File(activated.data);
          if ( self.selected.type !== 'dir' ) {
            filename.set('value', self.selected.filename);
          }
        }
      }
      checkEmptyInput();
    });
    if ( this.args.type === 'save' ) {
      var filetypes = [];
      this.args.filetypes.forEach(function(f) {
        filetypes.push({
          label: Utils.format('{0} (.{1} {2})', f.label, f.extension, f.mime),
          value: f.extension
        });
      });
      var ft = this.scheme.find(this, 'Filetype').add(filetypes).on('change', function(ev) {
        var newinput = Utils.replaceFileExtension(filename.get('value'), ev.detail);
        filename.set('value', newinput);
      });
      if ( filetypes.length <= 1 ) {
        new OSjs.GUI.Element(ft.$element.parentNode).hide();
      }
      filename.on('enter', function(ev) {
        self.selected = null;
        self.checkSelection(ev);
      });
      filename.on('change', function(ev) {
        checkEmptyInput();
      });
      filename.on('keyup', function(ev) {
        checkEmptyInput();
      });
    } else {
      this.scheme.find(this, 'FileInput').hide();
    }
    var mm = OSjs.Core.getMountManager();
    var rootPath = mm.getRootFromPath(this.path);
    var modules = mm.getModules().filter(function(m) {
      if ( self.args.mfilter.length ) {
        var success = false;
        self.args.mfilter.forEach(function(fn) {
          if ( !success ) {
            success = fn(m);
          }
        });
        return success;
      }
      return true;
    }).map(function(m) {
      return {
        label: m.name + (m.module.readOnly ? Utils.format(' ({0})', API._('LBL_READONLY')) : ''),
        value: m.module.root
      };
    });
    mlist.clear().add(modules).set('value', rootPath);
    mlist.on('change', function(ev) {
      self.changePath(ev.detail, true);
    });
    this.changePath();
    checkEmptyInput();
    return root;
  };
  FileDialog.prototype.changePath = function(dir, fromDropdown) {
    var self = this;
    var view = this.scheme.find(this, 'FileView');
    var lastDir = this.path;
    function resetLastSelected() {
      var mm = OSjs.Core.getMountManager();
      var rootPath = mm.getRootFromPath(lastDir);
      try {
        self.scheme.find(self, 'ModuleSelect').set('value', rootPath);
      } catch ( e ) {
        console.warn('FileDialog::changePath()', 'resetLastSelection()', e);
      }
    }
    this._toggleLoading(true);
    view._call('chdir', {
      path: dir || this.path,
      done: function(error) {
        if ( error ) {
          if ( fromDropdown ) {
            resetLastSelected();
          }
        } else {
          if ( dir ) {
            self.path = dir;
          }
        }
        self.selected = null;
        self._toggleLoading(false);
      }
    });
  };
  FileDialog.prototype.checkFileExtension = function() {
    var filename = this.scheme.find(this, 'Filename');
    var mime = this.args.mime;
    var input = filename.get('value');
    if ( this.args.filetypes.length ) {
      if ( !input && this.args.filename ) {
        input = this.args.filename;
      }
      if ( input.length ) {
        var extension = input.split('.').pop();
        var found = false;
        this.args.filetypes.forEach(function(f) {
          if ( f.extension === extension ) {
            found = f;
          }
          return !!found;
        });
        found = found || this.args.filetypes[0];
        input = Utils.replaceFileExtension(input, found.extension);
        mime  = found.mime;
      }
    }
    return {
      filename: input,
      mime: mime
    };
  };
  FileDialog.prototype.checkSelection = function(ev, wasActivated) {
    var self = this;
    if ( this.selected && this.selected.type === 'dir' ) {
      if ( wasActivated ) {
        this.changePath(this.selected.path);
        return false;
      }
    }
    if ( this.args.type === 'save' ) {
      var check = this.checkFileExtension();
      if ( !this.path || !check.filename ) {
        API.error(API._('DIALOG_FILE_ERROR'), API._('DIALOG_FILE_MISSING_FILENAME'));
        return;
      }
      this.selected = new VFS.File(this.path.replace(/^\//, '') + '/' + check.filename, check.mime);
      this._toggleDisabled(true);
      VFS.exists(this.selected, function(error, result) {
        self._toggleDisabled(false);
        if ( self._destroyed ) {
          return;
        }
        if ( error ) {
          API.error(API._('DIALOG_FILE_ERROR'), API._('DIALOG_FILE_MISSING_FILENAME'));
        } else {
          if ( result ) {
            self._toggleDisabled(true);
            if ( self.selected ) {
              API.createDialog('Confirm', {
                buttons: ['yes', 'no'],
                message: API._('DIALOG_FILE_OVERWRITE', self.selected.filename)
              }, function(ev, button) {
                self._toggleDisabled(false);
                if ( button === 'yes' || button === 'ok' ) {
                  self.closeCallback(ev, 'ok', self.selected);
                }
              }, self);
            }
          } else {
            self.closeCallback(ev, 'ok', self.selected);
          }
        }
      });
      return false;
    } else {
      if ( !this.selected && this.args.select !== 'dir' ) {
        API.error(API._('DIALOG_FILE_ERROR'), API._('DIALOG_FILE_MISSING_SELECTION'));
        return false;
      }
      var res = this.selected;
      if ( !res && this.args.select === 'dir' ) {
        res = new VFS.File({
          filename: Utils.filename(this.path),
          path: this.path,
          type: 'dir'
        });
      }
      this.closeCallback(ev, 'ok', res);
    }
    return true;
  };
  FileDialog.prototype.onClose = function(ev, button) {
    if ( button === 'ok' && !this.checkSelection(ev) ) {
      return;
    }
    this.closeCallback(ev, button, this.selected);
  };
  OSjs.Dialogs.File = Object.seal(FileDialog);
})(OSjs.API, OSjs.VFS, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, Utils, VFS, DialogWindow) {
  'use strict';
  function FileInfoDialog(args, callback) {
    args = Utils.argumentDefaults(args, {});
    DialogWindow.apply(this, ['FileInfoDialog', {
      title: args.title || API._('DIALOG_FILEINFO_TITLE'),
      width: 400,
      height: 400
    }, args, callback]);
    if ( !this.args.file ) {
      throw new Error('You have to select a file for FileInfo');
    }
  }
  FileInfoDialog.prototype = Object.create(DialogWindow.prototype);
  FileInfoDialog.constructor = DialogWindow;
  FileInfoDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var txt = this.scheme.find(this, 'Info').set('value', API._('LBL_LOADING'));
    var file = this.args.file;
    function _onError(error) {
      if ( error ) {
        txt.set('value', API._('DIALOG_FILEINFO_ERROR_LOOKUP_FMT', file.path));
      }
    }
    function _onSuccess(data) {
      var info = [];
      Object.keys(data).forEach(function(i) {
        if ( i === 'exif' ) {
          info.push(i + ':\n\n' + data[i]);
        } else {
          info.push(i + ':\n\t' + data[i]);
        }
      });
      txt.set('value', info.join('\n\n'));
    }
    VFS.fileinfo(file, function(error, result) {
      if ( error ) {
        _onError(error);
        return;
      }
      _onSuccess(result || {});
    });
    return root;
  };
  OSjs.Dialogs.FileInfo = Object.seal(FileInfoDialog);
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.Core.DialogWindow);

(function(API, Utils, DialogWindow) {
  'use strict';
  function FileProgressDialog(args, callback) {
    args = Utils.argumentDefaults(args, {});
    DialogWindow.apply(this, ['FileProgressDialog', {
      title: args.title || API._('DIALOG_FILEPROGRESS_TITLE'),
      icon: 'actions/document-send.png',
      width: 400,
      height: 100
    }, args, callback]);
    this.busy = !!args.filename;
  }
  FileProgressDialog.prototype = Object.create(DialogWindow.prototype);
  FileProgressDialog.constructor = DialogWindow;
  FileProgressDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    if ( this.args.message ) {
      this.scheme.find(this, 'Message').set('value', this.args.message, true);
    }
    return root;
  };
  FileProgressDialog.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, null);
  };
  FileProgressDialog.prototype.setProgress = function(p) {
    this.scheme.find(this, 'Progress').set('progress', p);
  };
  FileProgressDialog.prototype._close = function(force) {
    if ( !force && this.busy  ) {
      return false;
    }
    return DialogWindow.prototype._close.call(this);
  };
  FileProgressDialog.prototype._onKeyEvent = function(ev) {
    if ( !this.busy ) {
      DialogWindow.prototype._onKeyEvent.apply(this, arguments);
    }
  };
  OSjs.Dialogs.FileProgress = Object.seal(FileProgressDialog);
})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, VFS, Utils, DialogWindow) {
  'use strict';
  function FileUploadDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
      dest:     API.getDefaultPath(),
      progress: {},
      file:     null
    });
    DialogWindow.apply(this, ['FileUploadDialog', {
      title: args.title || API._('DIALOG_UPLOAD_TITLE'),
      icon: 'actions/filenew.png',
      width: 400,
      height: 100
    }, args, callback]);
  }
  FileUploadDialog.prototype = Object.create(DialogWindow.prototype);
  FileUploadDialog.constructor = DialogWindow;
  FileUploadDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var message = this.scheme.find(this, 'Message');
    var maxSize = API.getConfig('VFS.MaxUploadSize');
    message.set('value', API._('DIALOG_UPLOAD_DESC', this.args.dest, maxSize), true);
    var input = this.scheme.find(this, 'File');
    if ( this.args.file ) {
      this.setFile(this.args.file, input);
    } else {
      input.on('change', function(ev) {
        self.setFile(ev.detail, input);
      });
    }
    return root;
  };
  FileUploadDialog.prototype.setFile = function(file, input) {
    var self = this;
    var progressDialog;
    function error(msg, ev) {
      API.error(
        OSjs.API._('DIALOG_UPLOAD_FAILED'),
        OSjs.API._('DIALOG_UPLOAD_FAILED_MSG'),
        msg || OSjs.API._('DIALOG_UPLOAD_FAILED_UNKNOWN')
      );
      progressDialog._close(true);
      self.onClose(ev, 'cancel');
    }
    if ( file ) {
      var fileSize = 0;
      if ( file.size > 1024 * 1024 ) {
        fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
      } else {
        fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';
      }
      if ( input ) {
        input.set('disabled', true);
      }
      this.scheme.find(this, 'ButtonCancel').set('disabled', true);
      var desc = OSjs.API._('DIALOG_UPLOAD_MSG_FMT', file.name, file.type, fileSize, this.dest);
      progressDialog = API.createDialog('FileProgress', {
        message: desc,
        dest: this.args.dest,
        filename: file.name,
        mime: file.type,
        size: fileSize
      }, function(ev, button) {
      }, this);
      if ( this._wmref ) {
        this._wmref.createNotificationIcon(this.notificationId, {className: 'BusyNotification', tooltip: desc, image: false});
      }
      OSjs.VFS.upload({files: [file], destination: this.args.dest}, function(err, result, ev) {
        if ( err ) {
          error(err, ev);
          return;
        }
        progressDialog._close();
        self.onClose(ev, 'ok', file);
      }, {
        onprogress: function(ev) {
          if ( ev.lengthComputable ) {
            var p = Math.round(ev.loaded * 100 / ev.total);
            progressDialog.setProgress(p);
          }
        }
      });
      setTimeout(function() {
        if ( progressDialog ) {
          progressDialog._focus();
        }
      }, 100);
    }
  };
  FileUploadDialog.prototype.onClose = function(ev, button, result) {
    result = result || null;
    this.closeCallback(ev, button, result);
  };
  OSjs.Dialogs.FileUpload = Object.seal(FileUploadDialog);
})(OSjs.API, OSjs.VFS, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, Utils, DialogWindow) {
  'use strict';
  function FontDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
      fontName: API.getConfig('Fonts.default'),
      fontSize: 12,
      fontColor: '#000000',
      backgroundColor: '#ffffff',
      fonts: API.getConfig('Fonts.list'),
      minSize: 6,
      maxSize: 30,
      text: 'The quick brown fox jumps over the lazy dog',
      unit: 'px'
    });
    if ( args.unit === 'null' || args.unit === 'unit' ) {
      args.unit = '';
    }
    DialogWindow.apply(this, ['FontDialog', {
      title: args.title || API._('DIALOG_FONT_TITLE'),
      width: 400,
      height: 300
    }, args, callback]);
    this.selection = {
      fontName: args.fontName,
      fontSize: args.fontSize + args.unit
    };
  }
  FontDialog.prototype = Object.create(DialogWindow.prototype);
  FontDialog.constructor = DialogWindow;
  FontDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var self = this;
    var preview = this.scheme.find(this, 'FontPreview');
    var sizes = [];
    var fonts = [];
    for ( var i = this.args.minSize; i < this.args.maxSize; i++ ) {
      sizes.push({value: i, label: i});
    }
    for ( var j = 0; j < this.args.fonts.length; j++ ) {
      fonts.push({value: this.args.fonts[j], label: this.args.fonts[j]});
    }
    function updatePreview() {
      preview.querySelector('textarea').style.fontFamily = self.selection.fontName;
      preview.querySelector('textarea').style.fontSize = self.selection.fontSize;
    }
    var listFonts = this.scheme.find(this, 'FontName');
    listFonts.add(fonts).set('value', this.args.fontName);
    listFonts.on('change', function(ev) {
      self.selection.fontName = ev.detail;
      updatePreview();
    });
    var listSizes = this.scheme.find(this, 'FontSize');
    listSizes.add(sizes).set('value', this.args.fontSize);
    listSizes.on('change', function(ev) {
      self.selection.fontSize = ev.detail + self.args.unit;
      updatePreview();
    });
    preview.$element.style.color = this.args.fontColor;
    preview.$element.style.backgroundColor = this.args.backgroundColor;
    preview.set('value', this.args.text);
    if ( this.args.fontSize < 0 ) {
      this.scheme.find(this, 'FontSizeContainer').hide();
    }
    updatePreview();
    return root;
  };
  FontDialog.prototype.onClose = function(ev, button) {
    var result = button === 'ok' ? this.selection : null;
    this.closeCallback(ev, button, result);
  };
  OSjs.Dialogs.Font = Object.seal(FontDialog);
})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, Utils, DialogWindow) {
  'use strict';
  function InputDialog(args, callback) {
    args = Utils.argumentDefaults(args, {});
    DialogWindow.apply(this, ['InputDialog', {
      title: args.title || API._('DIALOG_INPUT_TITLE'),
      icon: 'status/dialog-information.png',
      width: 400,
      height: 120
    }, args, callback]);
  }
  InputDialog.prototype = Object.create(DialogWindow.prototype);
  InputDialog.constructor = DialogWindow;
  InputDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    if ( this.args.message ) {
      var msg = DialogWindow.parseMessage(this.args.message);
      this.scheme.find(this, 'Message').empty().append(msg);
    }
    var input = this.scheme.find(this, 'Input');
    input.set('placeholder', this.args.placeholder || '');
    input.set('value', this.args.value || '');
    input.on('enter', function(ev) {
      self.onClose(ev, 'ok');
    });
    return root;
  };
  InputDialog.prototype._focus = function() {
    if ( DialogWindow.prototype._focus.apply(this, arguments) ) {
      this.scheme.find(this, 'Input').focus();
      return true;
    }
    return false;
  };
  InputDialog.prototype.onClose = function(ev, button) {
    var result = this.scheme.find(this, 'Input').get('value');
    this.closeCallback(ev, button, button === 'ok' ? result : null);
  };
  InputDialog.prototype.setRange = function(range) {
    var input = this.scheme.find(this, 'Input');
    if ( input.$element ) {
      input.$element.querySelector('input').select(range);
    }
  };
  OSjs.Dialogs.Input = Object.seal(InputDialog);
})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, Utils) {
  'use strict';
  var _handlerInstance;
  function appendRequestOptions(data, options) {
    options = options || {};
    var onprogress = options.onprogress || function() {};
    var ignore = ['onsuccess', 'onerror', 'onprogress', 'oncanceled'];
    Object.keys(options).forEach(function(key) {
      if ( ignore.indexOf(key) === -1 ) {
        data[key] = options[key];
      }
    });
    data.onprogress = function(ev) {
      if ( ev.lengthComputable ) {
        onprogress(ev, ev.loaded / ev.total);
      } else {
        onprogress(ev, -1);
      }
    };
    return data;
  }
  function HandlerConnection(handler) {
    this.index = 0;
    this.handler = handler;
    this.nw = null;
    this.ws = null;
    if ( (API.getConfig('Connection.Type') === 'nw') ) {
      this.nw = require('osjs').init({
        root: process.cwd(),
        settings: {
          mimes: API.getConfig('MIME.mapping')
        },
        nw: true
      });
    }
    this.wsqueue = {};
  }
  HandlerConnection.prototype.init = function(callback) {
    var self = this;
    if ( API.getConfig('Connection.Type') === 'ws' ) {
      var url = window.location.protocol.replace('http', 'ws') + '//' + window.location.host;
      var connected = false;
      this.ws = new WebSocket(url);
      this.ws.onopen = function() {
        connected = true;
        callback();
      };
      this.ws.onmessage = function(ev) {
        var data = JSON.parse(ev.data);
        var idx = data._index;
        if ( self.wsqueue[idx] ) {
          delete data._index;
          self.wsqueue[idx](data);
          delete self.wsqueue[idx];
        }
      };
      this.ws.onclose = function(ev) {
        if ( !connected && ev.code !== 3001 ) {
          callback('WebSocket connection error'); // FIXME: Locale
        }
      };
    } else {
      callback();
    }
  };
  HandlerConnection.prototype.destroy = function() {
    if ( this.ws ) {
      this.ws.close();
    }
    this.nw = null;
    this.ws = null;
    this._wsRequest = {};
  };
  HandlerConnection.prototype.callPOST = function(form, options, onsuccess, onerror) {
    onerror = onerror || function() {
      console.warn('HandlerConnection::callPOST()', 'error', arguments);
    };
    Utils.ajax(appendRequestOptions({
      url: OSjs.VFS.Transports.Internal.path(),
      method: 'POST',
      body: form,
      onsuccess: function(result) {
        onsuccess(false, result);
      },
      onerror: function(result) {
        onerror('error', null, result);
      },
      oncanceled: function(evt) {
        onerror('canceled', null, evt);
      }
    }, options));
    return true;
  };
  HandlerConnection.prototype.callGET = function(args, options, onsuccess, onerror) {
    onerror = onerror || function() {
      console.warn('HandlerConnection::callGET()', 'error', arguments);
    };
    var self = this;
    Utils.ajax(appendRequestOptions({
      url: args.url || OSjs.VFS.Transports.Internal.path(args.path),
      method: args.method || 'GET',
      responseType: 'arraybuffer',
      onsuccess: function(response, xhr) {
        if ( !xhr || xhr.status === 404 || xhr.status === 500 ) {
          onsuccess({error: xhr.statusText || response, result: null});
          return;
        }
        onsuccess({error: false, result: response});
      },
      onerror: function() {
        onerror.apply(self, arguments);
      }
    }, options));
    return true;
  };
  HandlerConnection.prototype.callXHR = function(url, args, options, onsuccess, onerror) {
    onerror = onerror || function() {
      console.warn('HandlerConnection::callXHR()', 'error', arguments);
    };
    var self = this;
    Utils.ajax(appendRequestOptions({
      url: url,
      method: 'POST',
      json: true,
      body: args,
      onsuccess: function() {
        onsuccess.apply(self.handler, arguments);
      },
      onerror: function() {
        onerror.apply(self.handler, arguments);
      }
    }, options));
    return true;
  };
  HandlerConnection.prototype.callWS = function(path, args, options, onsuccess, onerror) {
    onerror = onerror || function() {
      console.warn('HandlerConnection::callWS()', 'error', arguments);
    };
    var idx = this.index++;
    try {
      this.ws.send(JSON.stringify({
        _index: idx,
        sid: Utils.getCookie('session'),
        path: '/' + path,
        args: args
      }));
      this.wsqueue[idx] = onsuccess || function() {};
      return true;
    } catch ( e ) {
      console.warn('callWS() Warning', e.stack, e);
      onerror(e);
    }
    return false;
  };
  HandlerConnection.prototype.callNW = function(method, args, options, onsuccess, onerror) {
    onerror = onerror || function() {
      console.warn('HandlerConnection::callNW()', 'error', arguments);
    };
    try {
      this.nw.request(method.match(/^FS\:/) !== null, method.replace(/^FS\:/, ''), args, function(err, res) {
        onsuccess({error: err, result: res});
      });
      return true;
    } catch ( e ) {
      console.warn('callNW() Warning', e.stack, e);
      onerror(e);
    }
    return false;
  };
  HandlerConnection.prototype.request = function(isVfs, method, args, options, onsuccess, onerror) {
    if ( API.getConfig('Connection.Type') === 'nw' ) {
      return this.callNW(method, args, options, onsuccess, onerror);
    }
    if ( isVfs ) {
      if ( method === 'FS:get' ) {
        return this.callGET(args, options, onsuccess, onerror);
      } else if ( method === 'FS:upload' ) {
        return this.callPOST(args, options, onsuccess, onerror);
      }
    }
    var url = (function() {
      if ( isVfs ) {
        return API.getConfig('Connection.FSURI') + '/' + method.replace(/^FS\:/, '');
      }
      return API.getConfig('Connection.APIURI') + '/' + method;
    })();
    if ( API.getConfig('Connection.Type') === 'ws' ) {
      return this.callWS(url, args, options, onsuccess, onerror);
    }
    return this.callXHR(url, args, options, onsuccess, onerror);
  };
  var _Handler = function() {
    if ( _handlerInstance ) {
      throw Error('Cannot create another Handler Instance');
    }
    this._saveTimeout = null;
    this.loggedIn   = false;
    this.offline    = false;
    this.userData   = {
      id      : 0,
      username: 'root',
      name    : 'root user',
      groups  : ['admin']
    };
    this.connection = new HandlerConnection();
    _handlerInstance = this;
  };
  _Handler.prototype.init = function(callback) {
    var self = this;
    API.setLocale(API.getConfig('Locale'));
    if ( typeof navigator.onLine !== 'undefined' ) {
      Utils.$bind(window, 'offline', function(ev) {
        self.onOffline();
      });
      Utils.$bind(window, 'online', function(ev) {
        self.onOnline();
      });
    }
    this.connection.init(function(err, res) {
      callback(err, res);
    });
  };
  _Handler.prototype.destroy = function() {
    Utils.$unbind(window, 'offline');
    Utils.$unbind(window, 'online');
    if ( this.connection ) {
      this.connection.destroy();
    }
    this.connection = null;
    _handlerInstance = null;
  };
  _Handler.prototype.login = function(username, password, callback) {
    var opts = {username: username, password: password};
    this.callAPI('login', opts, function(response) {
      if ( response.result ) { // This contains an object with user data
        callback(false, response.result);
      } else {
        var error = response.error || API._('ERR_LOGIN_INVALID');
        callback(API._('ERR_LOGIN_FMT', error), false);
      }
    }, function(error) {
      callback(API._('ERR_LOGIN_FMT', error), false);
    });
  };
  _Handler.prototype.logout = function(save, callback) {
    var self = this;
    function _finished() {
      var opts = {};
      self.callAPI('logout', opts, function(response) {
        if ( response.result ) {
          self.loggedIn = false;
          callback(true);
        } else {
          callback(false, 'An error occured: ' + (response.error || 'Unknown error'));
        }
      }, function(error) {
        callback(false, 'Logout error: ' + error);
      });
    }
    if ( save ) {
      this.saveSession(function() {
        _finished(true);
      });
      return;
    }
    _finished(true);
  };
  _Handler.prototype.saveSession = function(callback) {
    var data = [];
    API.getProcesses().forEach(function(proc, i) {
      if ( proc && (proc instanceof OSjs.Core.Application) ) {
        data.push(proc._getSessionData());
      }
    });
    OSjs.Core.getSettingsManager().set('UserSession', null, data, callback);
  };
  _Handler.prototype.getLastSession = function(callback) {
    callback = callback || function() {};
    var res = OSjs.Core.getSettingsManager().get('UserSession');
    var list = [];
    (res || []).forEach(function(iter, i) {
      var args = iter.args;
      args.__resume__ = true;
      args.__windows__ = iter.windows || [];
      list.push({name: iter.name, args: args});
    });
    callback(false, list);
  };
  _Handler.prototype.loadSession = function(callback) {
    callback = callback || function() {};
    this.getLastSession(function(err, list) {
      if ( err ) {
        callback();
      } else {
        API.launchList(list, null, null, callback);
      }
    });
  };
  _Handler.prototype.saveSettings = function(pool, storage, callback) {
    var self = this;
    var opts = {settings: storage};
    function _save() {
      self.callAPI('settings', opts, function(response) {
        callback.call(self, false, response.result);
      }, function(error) {
        callback.call(self, error, false);
      });
    }
    if ( this._saveTimeout ) {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = null;
    }
    setTimeout(_save, 250);
  };
  _Handler.prototype.getVFSPath = function(item) {
    var base = API.getConfig('Connection.FSURI', '/');
    if ( item ) {
      return base + '/get/' + item.path;
    }
    return base + '/upload';
  };
  _Handler.prototype.getAPICallOptions = function() {
    return {};
  };
  _Handler.prototype.callAPI = function(method, args, cbSuccess, cbError, options) {
    args = args || {};
    options = Utils.mergeObject(this.getAPICallOptions(), options || {});
    cbSuccess = cbSuccess || function() {};
    cbError = cbError || function() {};
    if ( this.offline ) {
      cbError('You are currently off-line and cannot perform this operation!');
    } else if ( (API.getConfig('Connection.Type') === 'standalone') ) {
      cbError('You are currently running locally and cannot perform this operation!');
    } else {
      if ( method.match(/^FS/) ) {
        return this._callVFS(method, args, options, cbSuccess, cbError);
      }
      return this._callAPI(method, args, options, cbSuccess, cbError);
    }
    return false;
  };
  _Handler.prototype._callAPI = function(method, args, options, cbSuccess, cbError) {
    return this.connection.request(false, method, args, options, cbSuccess, cbError);
  };
  _Handler.prototype._callVFS = function(method, args, options, cbSuccess, cbError) {
    return this.connection.request(true, method, args, options, cbSuccess, cbError);
  };
  _Handler.prototype.onLogin = function(data, callback) {
    callback = callback || function() {};
    var userSettings = data.userSettings;
    if ( !userSettings || userSettings instanceof Array ) {
      userSettings = {};
    }
    this.userData = data.userData;
    function getUserLocale() {
      var curLocale = API.getConfig('Locale');
      var detectedLocale = Utils.getUserLocale();
      if ( API.getConfig('LocaleOptions.AutoDetect', true) && detectedLocale ) {
        curLocale = detectedLocale;
      }
      var result = OSjs.Core.getSettingsManager().get('CoreWM');
      if ( !result ) {
        try {
          result = userSettings.CoreWM;
        } catch ( e )  {}
      }
      return result ? (result.language || curLocale) : curLocale;
    }
    document.getElementById('LoadingScreen').style.display = 'block';
    API.setLocale(getUserLocale());
    OSjs.Core.getSettingsManager().init(userSettings);
    if ( data.blacklistedPackages ) {
      OSjs.Core.getPackageManager().setBlacklist(data.blacklistedPackages);
    }
    this.loggedIn = true;
    callback();
  };
  _Handler.prototype.onVFSRequest = function(vfsModule, vfsMethod, vfsArguments, callback) {
    callback();
  };
  _Handler.prototype.onVFSRequestCompleted = function(vfsModule, vfsMethod, vfsArguments, vfsError, vfsResult, callback) {
    callback();
  };
  _Handler.prototype.onOnline = function() {
    console.warn('Handler::onOnline()', 'Going online...');
    this.offline = false;
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.notification({title: 'Warning!', message: 'You are On-line!'});
    }
  };
  _Handler.prototype.onOffline = function() {
    console.warn('Handler::onOffline()', 'Going offline...');
    this.offline = true;
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.notification({title: 'Warning!', message: 'You are Off-line!'});
    }
  };
  _Handler.prototype.getUserData = function() {
    return this.userData || {};
  };
  _Handler.prototype.initLoginScreen = function(callback) {
    var self      = this;
    var container = document.getElementById('Login');
    var login     = document.getElementById('LoginForm');
    var u         = document.getElementById('LoginUsername');
    var p         = document.getElementById('LoginPassword');
    var s         = document.getElementById('LoginSubmit');
    if ( !container ) {
      throw new Error('Could not find Login Form Container');
    }
    function _restore() {
      s.removeAttribute('disabled');
      u.removeAttribute('disabled');
      p.removeAttribute('disabled');
    }
    function _lock() {
      s.setAttribute('disabled', 'disabled');
      u.setAttribute('disabled', 'disabled');
      p.setAttribute('disabled', 'disabled');
    }
    function _login(username, password) {
      self.login(username, password, function(error, result) {
        if ( error ) {
          alert(error);
          _restore();
          return;
        }
        container.parentNode.removeChild(container);
        self.onLogin(result, function() {
          callback();
        });
      });
    }
    login.onsubmit = function(ev) {
      _lock();
      if ( ev ) {
        ev.preventDefault();
      }
      _login(u.value, p.value);
    };
    container.style.display = 'block';
    _restore();
  };
  _Handler.use = (function() {
    var traits = {
      init: function defaultInit(callback) {
        var self = this;
        return OSjs.Core._Handler.prototype.init.call(this, function() {
          self.initLoginScreen(callback);
        });
      },
      login: function defaultLogin(username, password, callback) {
        return OSjs.Core._Handler.prototype.login.apply(this, arguments);
      },
      logout: function defaultLogout(save, callback) {
        return OSjs.Core._Handler.prototype.logout.apply(this, arguments);
      },
      settings: function defaultSettings(pool, storage, callback) {
        return OSjs.Core._Handler.prototype.saveSettings.apply(this, arguments);
      }
    };
    function applyTraits(obj, add) {
      add.forEach(function(fn) {
        obj.prototype[fn] = traits[fn];
      });
    }
    var exports = {
      defaults: function(obj) {
        applyTraits(obj, Object.keys(traits));
      }
    };
    Object.keys(traits).forEach(function(k) {
      exports[k] = function(obj) {
        applyTraits(obj, [k]);
      };
    });
    return exports;
  })();
  OSjs.Core._Handler = _Handler;
  OSjs.Core.Handler  = null;
  OSjs.Core.getHandler = function() {
    return _handlerInstance;
  };
})(OSjs.API, OSjs.Utils);

(function(API, Utils, VFS) {
  'use strict';
  function ShadowHandler() {
    OSjs.Core._Handler.apply(this, arguments);
  }
  ShadowHandler.prototype = Object.create(OSjs.Core._Handler.prototype);
  ShadowHandler.constructor = OSjs.Core._Handler;
  OSjs.Core._Handler.use.defaults(ShadowHandler);
  OSjs.Core.Handler = ShadowHandler;
})(OSjs.API, OSjs.Utils, OSjs.VFS);

(function(Utils, API, VFS, Core) {
  'use strict';
  VFS.Helpers.filterScandir = function filterScandir(list, options) {
    var defaultOptions = Utils.cloneObject(Core.getSettingsManager().get('VFS') || {});
    options = Utils.argumentDefaults(options, defaultOptions.scandir || {});
    options = Utils.argumentDefaults(options, {
      typeFilter: null,
      mimeFilter: [],
      showHiddenFiles: true
    }, true);
    function filterFile(iter) {
      if ( (options.typeFilter && iter.type !== options.typeFilter) || (!options.showHiddenFiles && iter.filename.match(/^\.\w/)) ) {
        return false;
      }
      return true;
    }
    function validMime(iter) {
      if ( options.mimeFilter && options.mimeFilter.length && iter.mime ) {
        return options.mimeFilter.some(function(miter) {
          if ( iter.mime.match(miter) ) {
            return true;
          }
          return false;
        });
      }
      return true;
    }
    var result = list.filter(function(iter) {
      if ( (iter.filename === '..' && options.backlink === false) || !filterFile(iter) ) {
        return false;
      }
      if ( iter.type === 'file' && !validMime(iter) ) {
        return false;
      }
      return true;
    }).map(function(iter) {
      if ( iter.mime === 'application/vnd.google-apps.folder' ) {
        iter.type = 'dir';
      }
      return iter;
    });
    return result.filter(function(iter) {
      return iter.type === 'dir';
    }).concat(result.filter(function(iter) {
      return iter.type !== 'dir';
    }));
  };
  function _abToSomething(m, arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';
    try {
      var blob    = new Blob([arrayBuffer], {type: mime});
      var r       = new FileReader();
      r.onerror   = function(e) {
        callback(e);
      };
      r.onloadend = function()  {
        callback(false, r.result);
      };
      r[m](blob);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }
  VFS.Helpers.addFormFile = function addFormFile(fd, key, data, file) {
    if ( data instanceof window.File ) {
      fd.append(key, data);
    } else {
      if ( file ) {
        if ( data instanceof window.ArrayBuffer ) {
          try {
            data = new Blob([data], {type: file.mime});
          } catch ( e ) {
            data = null;
            console.warn(e, e.stack);
          }
        }
        fd.append(key, data, file.filename);
      } else {
        if ( data.data && data.filename ) { // In case user defines custom
          fd.append(key, data.data, data.filename);
        }
      }
    }
  };
  VFS.Helpers.dataSourceToAb = function dataSourceToAb(data, mime, callback) {
    var byteString = atob(data.split(',')[1]);
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    callback(false, ab);
  };
  VFS.Helpers.textToAb = function textToAb(data, mime, callback) {
    _abToSomething('readAsArrayBuffer', data, mime, callback);
  };
  VFS.Helpers.abToDataSource = function abToDataSource(arrayBuffer, mime, callback) {
    _abToSomething('readAsDataURL', arrayBuffer, mime, callback);
  };
  VFS.Helpers.abToText = function abToText(arrayBuffer, mime, callback) {
    _abToSomething('readAsText', arrayBuffer, mime, callback);
  };
  VFS.Helpers.abToBinaryString = function abToBinaryString(arrayBuffer, mime, callback) {
    _abToSomething('readAsBinaryString', arrayBuffer, mime, callback);
  };
  VFS.Helpers.abToBlob = function abToBlob(arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';
    try {
      var blob = new Blob([arrayBuffer], {type: mime});
      callback(false, blob);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  };
  VFS.Helpers.blobToAb = function blobToAb(data, callback) {
    try {
      var r       = new FileReader();
      r.onerror   = function(e) {
        callback(e);
      };
      r.onloadend = function() {
        callback(false, r.result);
      };
      r.readAsArrayBuffer(data);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  };
})(OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.Core);

(function(Utils, API, VFS, Core) {
  'use strict';
  function request(test, method, args, callback, options) {
    var mm = Core.getMountManager();
    var d = mm.getModuleFromPath(test, false);
    if ( !d ) {
      throw new Error(API._('ERR_VFSMODULE_NOT_FOUND_FMT', test));
    }
    if ( typeof method !== 'string' ) {
      throw new TypeError(API._('ERR_ARGUMENT_FMT', 'VFS::' + method, 'method', 'String', typeof method));
    }
    if ( !(args instanceof Object) ) {
      throw new TypeError(API._('ERR_ARGUMENT_FMT', 'VFS::' + method, 'args', 'Object', typeof args));
    }
    if ( !(callback instanceof Function) ) {
      throw new TypeError(API._('ERR_ARGUMENT_FMT', 'VFS::' + method, 'callback', 'Function', typeof callback));
    }
    if ( options && !(options instanceof Object) ) {
      throw new TypeError(API._('ERR_ARGUMENT_FMT', 'VFS::' + method, 'options', 'Object', typeof options));
    }
    var h = Core.getHandler();
    h.onVFSRequest(d, method, args, function vfsRequestCallback(err, response) {
      if ( arguments.length === 2 ) {
        console.warn('VFS::request()', 'Core::onVFSRequest hijacked the VFS request');
        callback(err, response);
        return;
      }
      try {
        mm.getModule(d).request(method, args, function(err, res) {
          h.onVFSRequestCompleted(d, method, args, err, res, function(e, r) {
            if ( arguments.length === 2 ) {
              console.warn('VFS::request()', 'Core::onVFSRequestCompleted hijacked the VFS request');
              callback(e, r);
              return;
            } else {
              callback(err, res);
            }
          });
        }, options);
      } catch ( e ) {
        var msg = API._('ERR_VFSMODULE_EXCEPTION_FMT', e.toString());
        callback(msg);
        console.warn('VFS::request()', 'exception', e.stack, e);
      }
    });
  }
  function requestWrapper(args, errstr, callback, onfinished, options) {
    function _finished(error, response) {
      if ( error ) {
        error = API._(errstr, error);
      }
      if ( onfinished ) {
        response = onfinished(error, response);
      }
      callback(error, response);
    }
    args.push(_finished);
    if ( typeof options !== 'undefined' ) {
      args.push(options);
    }
    try {
      request.apply(null, args);
    } catch ( e ) {
      _finished(e);
    }
  }
  function hasAlias(item, retm) {
    var mm = OSjs.Core.getMountManager();
    var module = mm.getModuleFromPath(item.path, false, true);
    if ( module && module.options && module.options.alias ) {
      return retm ? module : item.path.replace(module.match, module.options.alias);
    }
    return false;
  }
  function findAlias(item) {
    var mm = OSjs.Core.getMountManager();
    var found = null;
    mm.getModules().forEach(function(iter) {
      if ( !found && iter.module.options && iter.module.options.alias ) {
        var a = iter.module.options.alias;
        if ( item.path.substr(0, a.length) === a ) {
          found = iter.module;
        }
      }
    });
    return found;
  }
  function checkMetadataArgument(item, err) {
    if ( typeof item === 'string' ) {
      item = new VFS.File(item);
    } else if ( typeof item === 'object' && item.path ) {
      item = new VFS.File(item);
    }
    if ( !(item instanceof VFS.File) ) {
      throw new TypeError(err || API._('ERR_VFS_EXPECT_FILE'));
    }
    var alias = hasAlias(item);
    if ( alias ) {
      item.path = alias;
    }
    if ( !Core.getMountManager().getModuleFromPath(item.path, false) ) {
      throw new Error(API._('ERR_VFSMODULE_NOT_FOUND_FMT', item.path));
    }
    return item;
  }
  function hasSameTransport(src, dest) {
    var mm = Core.getMountManager();
    if ( mm.isInternal(src.path) && mm.isInternal(dest.path) ) {
      return true;
    }
    var msrc = mm.getModuleFromPath(src.path, false, true) || {};
    var mdst = mm.getModuleFromPath(dest.path, false, true) || {};
    return (msrc.transport === mdst.transport) || (msrc.name === mdst.name);
  }
  function existsWrapper(item, callback, options) {
    options = options || {};
    try {
      if ( typeof options.overwrite !== 'undefined' && options.overwrite === true ) {
        callback();
      } else {
        VFS.exists(item, function(error, result) {
          if ( error ) {
            console.warn('existsWrapper() error', error);
          }
          if ( result ) {
            callback(API._('ERR_VFS_FILE_EXISTS'));
          } else {
            callback();
          }
        });
      }
    } catch ( e ) {
      callback(e);
    }
  }
  function isReadOnly(item) {
    var m = Core.getMountManager().getModuleFromPath(item.path, false, true) || {};
    return m.readOnly === true;
  }
  function broadcastMessage(msg, item, appRef) {
    API.message(msg, item, {source: appRef ? appRef.__pid : null});
    var aliased = (function() {
      function _transform(i) {
        if ( i instanceof VFS.File ) {
          var n = new VFS.File(i);
          var alias = findAlias(n);
          if ( alias ) {
            n.path = n.path.replace(alias.options.alias, alias.root);
            return n;
          }
        }
        return false;
      }
      if ( item instanceof VFS.File ) {
        return _transform(item);
      } else if ( item && item.destination && item.source ) {
        return {
          source: _transform(item.source),
          destination: _transform(item.destination)
        };
      }
      return null;
    })();
    var tuple = aliased.source || aliased.destination;
    if ( aliased && (aliased instanceof VFS.File || tuple) ) {
      if ( tuple ) {
        aliased.source = aliased.source || item.source;
        aliased.destination = aliased.destination || item.destination;
      }
      API.message(msg, aliased, {source: appRef ? appRef.__pid : null});
    }
  }
  function createBackLink(item, result, alias, oitem) {
    var path = Utils.getPathProtocol(item.path);
    var isOnRoot = path.replace(/\/+/, '/') === '/';
    if ( alias ) {
      isOnRoot = (oitem.path === alias.root);
    }
    if ( !isOnRoot ) {
      var foundBack = result.some(function(iter) {
        return iter.filename === '..';
      });
      if ( !foundBack ) {
        return new VFS.File({
          filename: '..',
          path: Utils.dirname(item.path),
          mime: null,
          size: 0,
          type: 'dir'
        });
      }
    }
    return false;
  }
  VFS.find = function(item, args, callback, options) {
    if ( arguments.length < 3 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    requestWrapper([item.path, 'find', [item, args]], 'ERR_VFSMODULE_FIND_FMT', callback, null, options);
  };
  VFS.scandir = function(item, callback, options) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    var oitem = new VFS.File(item);
    var alias = hasAlias(oitem, true);
    item = checkMetadataArgument(item);
    requestWrapper([item.path, 'scandir', [item]], 'ERR_VFSMODULE_SCANDIR_FMT', function(error, result) {
      if ( alias && result ) {
        result = result.filter(function(iter) { return iter.ctime });
        result = result.map(function(iter) {
          var niter = new VFS.File(iter);
          var str = iter.path.replace(/\/?$/, '');
          var tmp = alias.options.alias.replace(/\/?$/, '');
          niter.path = Utils.pathJoin(alias.root, str.replace(tmp, ''));
          return niter;
        });
      }
      if ( !error && result instanceof Array ) {
        var back = createBackLink(item, result, alias, oitem);
        if ( back ) {
          result.unshift(back);
        }
      }
      return callback(error, result);
    }, null, options);
  };
  VFS.write = function(item, data, callback, options, appRef) {
    if ( arguments.length < 3 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    function _finished(error, result) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_WRITE_FMT', error);
      } else {
        broadcastMessage('vfs:write', item, appRef);
      }
      callback(error, result);
    }
    function _write(filedata) {
      try {
        request(item.path, 'write', [item, filedata], _finished, options);
      } catch ( e ) {
        _finished(e);
      }
    }
    function _converted(error, response) {
      if ( error ) {
        _finished(error, null);
        return;
      }
      _write(response);
    }
    try {
      if ( typeof data === 'string' ) {
        if ( data.length ) {
          VFS.Helpers.textToAb(data, item.mime, function(error, response) {
            _converted(error, response);
          });
        } else {
          _converted(null, data);
        }
      } else {
        if ( data instanceof VFS.FileDataURL ) {
          VFS.Helpers.dataSourceToAb(data.toString(), item.mime, function(error, response) {
            _converted(error, response);
          });
          return;
        } else if ( window.Blob && data instanceof window.Blob ) {
          VFS.Helpers.blobToAb(data, function(error, response) {
            _converted(error, response);
          });
          return;
        }
        _write(data);
      }
    } catch ( e ) {
      _finished(e);
    }
  };
  VFS.read = function(item, callback, options) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    options = options || {};
    function _finished(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_READ_FMT', error);
        callback(error);
        return;
      }
      if ( options.type ) {
        var types = {
          datasource: function readToDataSource() {
            VFS.Helpers.abToDataSource(response, item.mime, function(error, dataSource) {
              callback(error, error ? null : dataSource);
            });
          },
          text: function readToText() {
            VFS.Helpers.abToText(response, item.mime, function(error, text) {
              callback(error, error ? null : text);
            });
          },
          blob: function readToBlob() {
            VFS.Helpers.abToBlob(response, item.mime, function(error, blob) {
              callback(error, error ? null : blob);
            });
          },
          json: function readToJSON() {
            VFS.Helpers.abToText(response, item.mime, function(error, text) {
              var jsn;
              if ( typeof text === 'string' ) {
                try {
                  jsn = JSON.parse(text);
                } catch ( e ) {
                  console.warn('VFS::read()', 'readToJSON', e.stack, e);
                }
              }
              callback(error, error ? null : jsn);
            });
          }
        };
        var type = options.type.toLowerCase();
        if ( types[type] ) {
          types[type]();
          return;
        }
      }
      callback(error, error ? null : response);
    }
    try {
      request(item.path, 'read', [item], function(error, response) {
        _finished(error, error ? false : response);
      }, options);
    } catch ( e ) {
      _finished(e);
    }
  };
  VFS.copy = function(src, dest, callback, options, appRef) {
    if ( arguments.length < 3 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    var mm = Core.getMountManager();
    src = checkMetadataArgument(src, API._('ERR_VFS_EXPECT_SRC_FILE'));
    dest = checkMetadataArgument(dest, API._('ERR_VFS_EXPECT_DST_FILE'));
    if ( isReadOnly(dest) ) {
      callback(API._('ERR_VFSMODULE_READONLY_FMT', mm.getModuleFromPath(dest.path)));
      return;
    }
    options = Utils.argumentDefaults(options, {
      type: 'binary',
      dialog: null
    });
    options.arrayBuffer = true;
    function dialogProgress(prog) {
      if ( options.dialog ) {
        options.dialog.setProgress(prog);
      }
    }
    function doRequest() {
      function _finished(error, result) {
        if ( !error ) {
          broadcastMessage('vfs:copy', dest, appRef);
        }
        callback(error, result);
      }
      if ( hasSameTransport(src, dest) ) {
        request(src.path, 'copy', [src, dest], function(error, response) {
          dialogProgress(100);
          if ( error ) {
            error = API._('ERR_VFSMODULE_COPY_FMT', error);
          }
          _finished(error, response);
        }, options);
      } else {
        var msrc = mm.getModuleFromPath(src.path);
        var mdst = mm.getModuleFromPath(dest.path);
        if ( src.type === 'dir' ) {
          _finished(API._('ERR_VFSMODULE_COPY_FMT', 'Copying folders between different transports is not yet supported!'));
          return;
        }
        dest.mime = src.mime;
        mm.getModule(msrc).request('read', [src], function(error, data) {
          dialogProgress(50);
          if ( error ) {
            _finished(API._('ERR_VFS_TRANSFER_FMT', error));
            return;
          }
          mm.getModule(mdst).request('write', [dest, data], function(error, result) {
            dialogProgress(100);
            if ( error ) {
              error = API._('ERR_VFSMODULE_COPY_FMT', error);
            }
            _finished(error, result);
          }, options);
        }, options);
      }
    }
    existsWrapper(dest, function(error) {
      if ( error ) {
        callback(API._('ERR_VFSMODULE_COPY_FMT', error));
      } else {
        try {
          doRequest();
        } catch ( e ) {
          callback(API._('ERR_VFSMODULE_COPY_FMT', e));
        }
      }
    });
  };
  VFS.move = function(src, dest, callback, options, appRef) {
    var self = this;
    if ( arguments.length < 3 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    var mm = Core.getMountManager();
    src = checkMetadataArgument(src, API._('ERR_VFS_EXPECT_SRC_FILE'));
    dest = checkMetadataArgument(dest, API._('ERR_VFS_EXPECT_DST_FILE'));
    if ( isReadOnly(dest) ) {
      callback(API._('ERR_VFSMODULE_READONLY_FMT', mm.getModuleFromPath(dest.path)));
      return;
    }
    function doRequest() {
      function _finished(error, result) {
        if ( !error ) {
          broadcastMessage('vfs:move', {source: src, destination: dest}, appRef);
        }
        callback(error, result);
      }
      if ( hasSameTransport(src, dest) ) {
        request(src.path, 'move', [src, dest], function(error, response) {
          if ( error ) {
            error = API._('ERR_VFSMODULE_MOVE_FMT', error);
          }
          _finished(error, error ? null : response, dest);
        }, options);
      } else {
        var msrc = mm.getModuleFromPath(src.path);
        dest.mime = src.mime;
        self.copy(src, dest, function(error, result) {
          if ( error ) {
            error = API._('ERR_VFS_TRANSFER_FMT', error);
            return _finished(error);
          }
          mm.getModule(msrc).request('unlink', [src], function(error, result) {
            if ( error ) {
              error = API._('ERR_VFS_TRANSFER_FMT', error);
            }
            _finished(error, result, dest);
          }, options);
        });
      }
    }
    existsWrapper(dest, function(error) {
      if ( error ) {
        callback(API._('ERR_VFSMODULE_MOVE_FMT', error));
      } else {
        try {
          doRequest();
        } catch ( e ) {
          callback(API._('ERR_VFSMODULE_MOVE_FMT', e));
        }
      }
    });
  };
  VFS.rename = function(src, dest, callback) {
    VFS.move.apply(this, arguments);
  };
  VFS.unlink = function(item, callback, options, appRef) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    function _checkPath() {
      var pkgdir = OSjs.Core.getSettingsManager().instance('PackageManager').get('PackagePaths', []);
      var found = pkgdir.some(function(i) {
        var chkdir = new VFS.File(i);
        var idir = Utils.dirname(item.path);
        return idir === chkdir.path;
      });
      if ( found ) {
        Core.getPackageManager().generateUserMetadata(function() {});
      }
    }
    requestWrapper([item.path, 'unlink', [item]], 'ERR_VFSMODULE_UNLINK_FMT', callback, function(error, response) {
      if ( !error ) {
        broadcastMessage('vfs:unlink', item, appRef);
        _checkPath();
      }
      return response;
    }, options);
  };
  (function() {
    VFS['delete'] = function(item, callback) {
      VFS.unlink.apply(this, arguments);
    };
  })();
  VFS.mkdir = function(item, callback, options, appRef) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    existsWrapper(item, function(error) {
      if ( error ) {
        return callback(API._('ERR_VFSMODULE_MKDIR_FMT', error));
      }
      requestWrapper([item.path, 'mkdir', [item]], 'ERR_VFSMODULE_MKDIR_FMT', callback, function(error, response) {
        if ( !error ) {
          broadcastMessage('vfs:mkdir', item, appRef);
        }
        return response;
      }, options);
    });
  };
  VFS.exists = function(item, callback) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    requestWrapper([item.path, 'exists', [item]], 'ERR_VFSMODULE_EXISTS_FMT', callback);
  };
  VFS.fileinfo = function(item, callback) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    requestWrapper([item.path, 'fileinfo', [item]], 'ERR_VFSMODULE_FILEINFO_FMT', callback);
  };
  VFS.url = function(item, callback) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    requestWrapper([item.path, 'url', [item]], 'ERR_VFSMODULE_URL_FMT', callback, function(error, response) {
      return error ? false : Utils.checkdir(response);
    });
  };
  VFS.upload = function(args, callback, options, appRef) {
    args = args || {};
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    if ( !args.files ) {
      throw new Error(API._('ERR_VFS_UPLOAD_NO_FILES'));
    }
    if ( !args.destination ) {
      throw new Error(API._('ERR_VFS_UPLOAD_NO_DEST'));
    }
    function _createFile(filename, mime, size) {
      var npath = (args.destination + '/' + filename).replace(/\/\/\/\/+/, '///');
      return new VFS.File({
        filename: filename,
        path: npath,
        mime: mime || 'application/octet-stream',
        size: size
      });
    }
    function _dialogClose(ev, btn, ufile) {
      if ( btn !== 'ok' && btn !== 'complete' ) {
        callback(false, false);
        return;
      }
      var file = _createFile(ufile.name, ufile.mime, ufile.size);
      callback(false, file);
    }
    var mm = Core.getMountManager();
    if ( !mm.isInternal(args.destination) ) {
      args.files.forEach(function(f, i) {
        request(args.destination, 'upload', [f, args.destination], callback, options);
      });
      return;
    }
    function doRequest(f, i) {
      if ( args.app ) {
        API.createDialog('FileUpload', {
          dest: args.destination,
          file: f
        }, _dialogClose, args.win || args.app);
      } else {
        var realDest = new VFS.File(args.destination);
        var tmpPath = hasAlias(realDest);
        if ( tmpPath ) {
          realDest = tmpPath;
        }
        VFS.Transports.Internal.upload(f, realDest, function(err, result, ev) {
          if ( err ) {
            if ( err === 'canceled' ) {
              callback(API._('ERR_VFS_UPLOAD_CANCELLED'), null, ev);
            } else {
              var errstr = ev ? ev.toString() : 'Unknown reason';
              var msg = API._('ERR_VFS_UPLOAD_FAIL_FMT', errstr);
              callback(msg, null, ev);
            }
          } else {
            var file = _createFile(f.name, f.type, f.size);
            broadcastMessage('vfs:upload', file, args.app);
            callback(false, file, ev);
          }
        }, options);
      }
    }
    args.files.forEach(function(f, i) {
      var filename = (f instanceof window.File) ? f.name : f.filename;
      var dest = new VFS.File(args.destination + '/' + filename);
      existsWrapper(dest, function(error) {
        if ( error ) {
          return callback(error);
        }
        try {
          doRequest(f, i);
        } catch ( e ) {
          callback(API._('ERR_VFS_UPLOAD_FAIL_FMT', e));
        }
      }, options);
    });
  };
  VFS.download = (function download() {
    var _didx = 1;
    return function(args, callback) {
      args = args || {};
      if ( arguments.length < 2 ) {
        throw new Error(API._('ERR_VFS_NUM_ARGS'));
      }
      if ( !args.path ) {
        throw new Error(API._('ERR_VFS_DOWNLOAD_NO_FILE'));
      }
      args = checkMetadataArgument(args);
      var lname = 'DownloadFile_' + _didx;
      _didx++;
      API.createLoading(lname, {className: 'BusyNotification', tooltip: API._('TOOLTIP_VFS_DOWNLOAD_NOTIFICATION')});
      var mm = Core.getMountManager();
      var dmodule = mm.getModuleFromPath(args.path);
      if ( !mm.isInternal(args.path) ) {
        var file = args;
        if ( !(file instanceof VFS.File) ) {
          file = new VFS.File(args.path);
          if ( args.id ) {
            file.id = args.id;
          }
        }
        mm.getModule(dmodule).request('read', [file], function(error, result) {
          API.destroyLoading(lname);
          if ( error ) {
            callback(API._('ERR_VFS_DOWNLOAD_FAILED', error));
            return;
          }
          callback(false, result);
        });
        return;
      }
      VFS.url(args, function(error, url) {
        if ( error ) {
          return callback(error);
        }
        Utils.ajax({
          url: url,
          method: 'GET',
          responseType: 'arraybuffer',
          onsuccess: function(result) {
            API.destroyLoading(lname);
            callback(false, result);
          },
          onerror: function(result) {
            API.destroyLoading(lname);
            callback(error);
          }
        });
      });
    };
  })();
  VFS.trash = function(item, callback) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    requestWrapper([item.path, 'trash', [item]], 'ERR_VFSMODULE_TRASH_FMT', callback);
  };
  VFS.untrash = function(item, callback) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    requestWrapper([item.path, 'untrash', [item]], 'ERR_VFSMODULE_UNTRASH_FMT', callback);
  };
  VFS.emptyTrash = function(callback) {
    if ( arguments.length < 1 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    requestWrapper([null, 'emptyTrash', []], 'ERR_VFSMODULE_EMPTYTRASH_FMT', callback);
  };
  VFS.freeSpace = function(item, callback) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    var m = Core.getMountManager().getModuleFromPath(item.path, false, true);
    requestWrapper([item.path, 'freeSpace', [m.root]], 'ERR_VFSMODULE_FREESPACE_FMT', callback);
  };
})(OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.Core);

(function(Utils, API, VFS) {
  'use strict';
  function FileDataURL(dataURL) {
    this.dataURL = dataURL;
  }
  FileDataURL.prototype.toBase64 = function() {
    return this.data.split(',')[1];
  };
  FileDataURL.prototype.toString = function() {
    return this.dataURL;
  };
  function FileMetadata(arg, mime) {
    if ( !arg ) {
      throw new Error(API._('ERR_VFS_FILE_ARGS'));
    }
    this.path     = null;
    this.filename = null;
    this.type     = null;
    this.size     = null;
    this.mime     = null;
    this.id       = null;
    if ( typeof arg === 'object' ) {
      this.setData(arg);
    } else if ( typeof arg === 'string' ) {
      this.path = arg;
      this.setData();
    }
    if ( typeof mime === 'string' ) {
      if ( mime.match(/\//) ) {
        this.mime = mime;
      } else {
        this.type = mime;
      }
    }
    this._guessMime();
  }
  FileMetadata.prototype.setData = function(o) {
    var self = this;
    if ( o ) {
      Object.keys(o).forEach(function(k) {
        if ( k !== '_element' ) {
          self[k] = o[k];
        }
      });
    }
    if ( !this.filename ) {
      this.filename = Utils.filename(this.path);
    }
  };
  FileMetadata.prototype.getData = function() {
    return {
      path: this.path,
      filename: this.filename,
      type: this.type,
      size: this.size,
      mime: this.mime,
      id: this.id
    };
  };
  FileMetadata.prototype.copy = function(dest, callback, options, appRef) {
    return VFS.copy(this, dest, callback, options, appRef);
  };
  FileMetadata.prototype.download = function(callback) {
    return VFS.download(this, callback);
  };
  FileMetadata.prototype.delete = function() {
    return this.unlink.apply(this, arguments);
  };
  FileMetadata.prototype.unlink = function(callback, options, appRef) {
    return VFS.unlink(this, callback, options, appRef);
  };
  FileMetadata.prototype.exists = function(callback) {
    return VFS.exists(this, callback);
  };
  FileMetadata.prototype.mkdir = function(callback, options, appRef) {
    return VFS.mkdir(this, callback, options, appRef);
  };
  FileMetadata.prototype.move = function(dest, callback, options, appRef) {
    var self = this;
    return VFS.move(this, dest, function(err, res, newDest) {
      if ( !err && newDest ) {
        self.setData(newDest);
      }
      callback.apply(this, arguments);
    }, options, appRef);
  };
  FileMetadata.prototype.read = function(callback, options) {
    return VFS.read(this, callback, options);
  };
  FileMetadata.prototype.rename = function() {
    return this.move.apply(this, arguments);
  };
  FileMetadata.prototype.scandir = function(callback, options) {
    return VFS.scandir(this, callback, options);
  };
  FileMetadata.prototype.trash = function(callback) {
    return VFS.trash(this, callback);
  };
  FileMetadata.prototype.untrash = function(callback) {
    return VFS.untrash(this, callback);
  };
  FileMetadata.prototype.url = function(callback) {
    return VFS.url(this, callback);
  };
  FileMetadata.prototype.write = function(data, callback, options, appRef) {
    return VFS.write(this, data, callback, options, appRef);
  };
  FileMetadata.prototype._guessMime = function() {
    if ( this.mime || this.type === 'dir' || (!this.path || this.path.match(/\/$/)) ) {
      return;
    }
    var ext = Utils.filext(this.path);
    this.mime = API.getConfig('MIME.mapping')['.' + ext] || 'application/octet-stream';
  };
  VFS.file = function createFileInstance(arg, mime) {
    return new FileMetadata(arg, mime);
  };
  VFS.File = FileMetadata;
  VFS.FileDataURL = FileDataURL;
})(OSjs.Utils, OSjs.API, OSjs.VFS);

(function(Utils, API, VFS) {
  'use strict';
  function makePath(item) {
    if ( typeof item === 'string' ) {
      item = new VFS.File(item);
    }
    return OSjs.Core.getHandler().getVFSPath(item);
  }
  function internalRequest(name, args, callback) {
    API.call('FS:' + name, args, function(err, res) {
      if ( !err && typeof res === 'undefined' ) {
        err = API._('ERR_VFS_FATAL');
      }
      callback(err, res);
    });
  }
  function internalUpload(file, dest, callback, options) {
    options = options || {};
    if ( dest instanceof VFS.File ) {
      dest = dest.path;
    }
    if ( typeof file.size !== 'undefined' ) {
      var maxSize = API.getConfig('VFS.MaxUploadSize');
      if ( maxSize > 0 ) {
        var bytes = file.size;
        if ( bytes > maxSize ) {
          var msg = API._('DIALOG_UPLOAD_TOO_BIG_FMT', Utils.humanFileSize(maxSize));
          callback('error', null, msg);
          return;
        }
      }
    }
    var fd  = new FormData();
    fd.append('upload', 1);
    fd.append('path', dest);
    if ( options ) {
      Object.keys(options).forEach(function(key) {
        fd.append(key, String(options[key]));
      });
    }
    VFS.Helpers.addFormFile(fd, 'upload', file);
    OSjs.Core.getHandler().callAPI('FS:upload', fd, callback, null, options);
  }
  function internalFetch(url, mime, callback, options) {
    options = options || {};
    options.type = options.type || 'binary';
    mime = options.mime || 'application/octet-stream';
    if ( arguments.length < 1 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    options = options || {};
    API.curl({
      url: url,
      binary: true,
      mime: mime
    }, function(error, response) {
      if ( error ) {
        callback(error);
        return;
      }
      if ( !response.body ) {
        callback(API._('ERR_VFS_REMOTEREAD_EMPTY'));
        return;
      }
      if ( options.type.toLowerCase() === 'datasource' ) {
        callback(false, response.body);
        return;
      }
      VFS.Helpers.dataSourceToAb(response.body, mime, function(error, response) {
        if ( options.type === 'text' ) {
          VFS.Helpers.abToText(response, mime, function(error, text) {
            callback(error, text);
          });
          return;
        }
        callback(error, response);
      });
    });
  }
  var Transport = {
    scandir: function(item, callback, options) {
      internalRequest('scandir', {path: item.path}, function(error, result) {
        var list = [];
        if ( result ) {
          result = VFS.Helpers.filterScandir(result, options);
          result.forEach(function(iter) {
            list.push(new VFS.File(iter));
          });
        }
        callback(error, list);
      });
    },
    write: function(item, data, callback, options) {
      options = options || {};
      options.onprogress = options.onprogress || function() {};
      function _write(dataSource) {
        var wopts = {path: item.path, data: dataSource};
        internalRequest('write', wopts, callback, options);
      }
      if ( typeof data === 'string' && !data.length ) {
        _write(data);
        return;
      }
      VFS.Helpers.abToDataSource(data, item.mime, function(error, dataSource) {
        if ( error ) {
          callback(error);
          return;
        }
        _write(dataSource);
      });
    },
    read: function(item, callback, options) {
      if ( API.getConfig('Connection.Type') === 'nw' ) {
        OSjs.Core.getHandler().nw.request(true, 'read', {
          path: item.path,
          options: {raw: true}
        }, function(err, res) {
          callback(err, res);
        });
        return;
      }
      internalRequest('get', {path: item.path}, callback, options);
    },
    copy: function(src, dest, callback) {
      internalRequest('copy', {src: src.path, dest: dest.path}, callback);
    },
    move: function(src, dest, callback) {
      internalRequest('move', {src: src.path, dest: dest.path}, callback);
    },
    unlink: function(item, callback) {
      internalRequest('delete', {path: item.path}, callback);
    },
    mkdir: function(item, callback) {
      internalRequest('mkdir', {path: item.path}, callback);
    },
    exists: function(item, callback) {
      internalRequest('exists', {path: item.path}, callback);
    },
    fileinfo: function(item, callback) {
      internalRequest('fileinfo', {path: item.path}, callback);
    },
    find: function(item, args, callback) {
      internalRequest('find', {path: item.path, args: args}, callback);
    },
    url: function(item, callback) {
      callback(false, VFS.Transports.Internal.path(item));
    },
    freeSpace: function(root, callback) {
      internalRequest('freeSpace', {root: root}, callback);
    }
  };
  VFS.Transports.Internal = {
    request: internalRequest,
    upload: internalUpload,
    fetch: internalFetch,
    module: Transport,
    path: makePath
  };
})(OSjs.Utils, OSjs.API, OSjs.VFS);

(function(Utils, API, VFS) {
  'use strict';
  VFS.Transports.HTTP = {
    module: {
      read: function(item, callback, options) {
        VFS.Transports.Internal.fetch(item.path, item.mime, callback, options);
      }
    }
  };
  OSjs.Core.getMountManager()._add({
    readOnly: true,
    name: 'HTTP',
    transport: 'HTTP',
    description: 'HTTP',
    visible: false,
    searchable: false,
    unmount: function(cb) {
      cb(false, false);
    },
    mounted: function() {
      return true;
    },
    enabled: function() {
      return true;
    },
    root: 'http:///',
    icon: 'places/google-drive.png',
    match: /^https?\:\/\//
  });
})(OSjs.Utils, OSjs.API, OSjs.VFS);

(function(Utils, API) {
  'use strict';
  var Transport = {
    url: function(item, callback) {
      var root = window.location.pathname || '/';
      if ( root === '/' || window.location.protocol === 'file:' ) {
        root = '';
      }
      var mm = OSjs.Core.getMountManager();
      var module = mm.getModuleFromPath(item.path, false, true);
      var url = item.path.replace(module.match, root);
      callback(false, url);
    }
  };
  var restricted = ['write', 'move', 'unlink', 'mkdir', 'exists', 'fileinfo', 'trash', 'untrash', 'emptyTrash', 'freeSpace'];
  var internal = OSjs.VFS.Transports.Internal.module;
  Object.keys(internal).forEach(function(n) {
    if ( restricted.indexOf(n) === -1 ) {
      Transport[n] = internal[n];
    }
  });
  OSjs.VFS.Transports.OSjs = {
    module: Transport,
    defaults: function(opts) {
      opts.readOnly = true;
      opts.searchable = true;
    }
  };
})(OSjs.Utils, OSjs.API);

(function(Utils, API) {
  'use strict';
  function makePath(file) {
    var mm = OSjs.Core.getMountManager();
    var rel = mm.getPathProtocol(file.path);
    var module = mm.getModuleFromPath(file.path, false, true);
    var base = (module.options || {}).url;
    return base + rel.replace(/^\/+/, '/');
  }
  function httpCall(func, item, callback) {
    var url = makePath(item);
    if ( func === 'scandir' ) {
      url += '/_scandir.json';
    }
    var args = {
      method: func === 'exists' ? 'HEAD' : 'GET',
      url: url,
      onerror: function(error) {
        callback(error);
      },
      onsuccess: function(response) {
        callback(false, response);
      }
    };
    if ( func === 'read' ) {
      args.responseType = 'arraybuffer';
    }
    Utils.ajax(args);
  }
  var Transport = {
    scandir: function(item, callback, options) {
      var mm = OSjs.Core.getMountManager();
      var root = mm.getRootFromPath(item.path);
      httpCall('scandir', item, function(error, response) {
        var list = null;
        if ( !error ) {
          var json = null;
          try {
            json = JSON.parse(response);
          } catch ( e ) {}
          if ( json === null ) {
            error = 'Failed to parse directory JSON';
          } else {
            list = json.map(function(iter) {
              iter.path = root + iter.path.replace(/^\//, '');
              return iter;
            });
            var rel = Utils.getPathProtocol(item.path);
            if ( rel !== '/' ) {
              list.unshift({
                filename: '..',
                path: Utils.dirname(item.path),
                type: 'dir',
                size: 0
              });
            }
          }
        }
        callback(error, list);
      });
    },
    read: function(item, callback, options) {
      options = options || {};
      var mime = item.mime || 'application/octet-stream';
      httpCall('read', item, function(error, response) {
        if ( !error ) {
          if ( options.type === 'text' ) {
            OSjs.VFS.Helpers.abToText(response, mime, function(error, text) {
              callback(error, text);
            });
            return;
          }
        }
        callback(error, response);
      });
    },
    exists: function(item, callback) {
      httpCall('exists', item, function(err) {
        callback(err, err ? false : true);
      });
    },
    url: function(item, callback, options) {
      callback(false, makePath(item));
    }
  };
  OSjs.VFS.Transports.Web = {
    defaults: function(iter) {
      iter.readOnly = true;
      iter.match = /^https?\:\/\//;
    },
    module: Transport,
    path: makePath
  };
})(OSjs.Utils, OSjs.API);

(function(Utils, API) {
  'use strict';
  function getModule(item) {
    var mm = OSjs.Core.getMountManager();
    var module = mm.getModuleFromPath(item.path, false, true);
    if ( !module ) {
      throw new Error(API._('ERR_VFSMODULE_INVALID_FMT', item.path));
    }
    return module;
  }
  function getNamespace(item) {
    var module = getModule(item);
    return module.options.ns || 'DAV:';
  }
  function getCORSAllowed(item) {
    var module = getModule(item);
    var val = module.options.cors;
    return typeof val === 'undefined' ? false : val === true;
  }
  function getURL(item) {
    if ( typeof item === 'string' ) {
      item = new OSjs.VFS.File(item);
    }
    var module = getModule(item);
    var opts = module.options;
    return Utils.parseurl(opts.host, {username: opts.username, password: opts.password}).url;
  }
  function getURI(item) {
    var module = getModule(item);
    return Utils.parseurl(module.options.host).path;
  }
  function resolvePath(item) {
    var module = getModule(item);
    return item.path.replace(module.match, '');
  }
  function davCall(method, args, callback, raw) {
    function parseDocument(body) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(body, 'application/xml');
      return doc.firstChild;
    }
    function getUrl(p, f) {
      var url = getURL(p);
      url += resolvePath(f).replace(/^\//, '');
      return url;
    }
    var mime = args.mime || 'application/octet-stream';
    var headers = {};
    var sourceFile = new OSjs.VFS.File(args.path, mime);
    var sourceUrl = getUrl(args.path, sourceFile);
    var destUrl = null;
    if ( args.dest ) {
      destUrl = getUrl(args.dest, new OSjs.VFS.File(args.dest, mime));
      headers.Destination = destUrl;
    }
    function externalCall() {
      var opts = {
        url: sourceUrl,
        method: method,
        requestHeaders: headers
      };
      if ( raw ) {
        opts.binary = true;
        opts.mime = mime;
      }
      if ( typeof args.data !== 'undefined' ) {
        opts.query = args.data;
      }
      API.call('curl', opts, function(error, result) {
        if ( error ) {
          callback(error);
          return;
        }
        if ( !result ) {
          callback(API._('ERR_VFS_REMOTEREAD_EMPTY'));
          return;
        }
        if ( ([200, 201, 203, 204, 205, 207]).indexOf(result.httpCode) < 0 ) {
          callback(API._('ERR_VFSMODULE_XHR_ERROR') + ': ' + result.httpCode);
          return;
        }
        if ( opts.binary ) {
          OSjs.VFS.Helpers.dataSourceToAb(result.body, mime, callback);
        } else {
          var doc = parseDocument(result.body);
          callback(false, doc);
        }
      });
    }
    if ( getCORSAllowed(sourceFile) ) {
      OSjs.VFS.Transports.Internal.request('get', {url: sourceUrl, method: method}, callback);
    } else {
      externalCall();
    }
  }
  var Transport = {
    scandir: function(item, callback, options) {
      var mm = OSjs.Core.getMountManager();
      function parse(doc) {
        var ns = getNamespace(item);
        var list = [];
        var reqpath = resolvePath(item);
        var root = mm.getRootFromPath(item.path);
        doc.children.forEach(function(c) {
          var type = 'file';
          function getPath() {
            var path = c.getElementsByTagNameNS(ns, 'href')[0].textContent;
            return path.substr(getURI(item).length - 1, path.length);
          }
          function getId() {
            var id = null;
            try {
              id = c.getElementsByTagNameNS(ns, 'getetag')[0].textContent;
            } catch ( e ) {
            }
            return id;
          }
          function getMime() {
            var mime = null;
            if ( type === 'file' ) {
              try {
                mime = c.getElementsByTagNameNS(ns, 'getcontenttype')[0].textContent || 'application/octet-stream';
              } catch ( e ) {
                mime = 'application/octet-stream';
              }
            }
            return mime;
          }
          function getSize() {
            var size = 0;
            if ( type === 'file' ) {
              try {
                size = parseInt(c.getElementsByTagNameNS(ns, 'getcontentlength')[0].textContent, 10) || 0;
              } catch ( e ) {
              }
            }
            return size;
          }
          try {
            var path = getPath();
            if ( path.match(/\/$/) ) {
              type = 'dir';
              path = path.replace(/\/$/, '') || '/';
            }
            if ( path !== reqpath ) {
              list.push({
                id: getId(),
                path: root + path.replace(/^\//, ''),
                filename: Utils.filename(path),
                size: getSize(),
                mime: getMime(),
                type: type
              });
            }
          } catch ( e ) {
            console.warn('scandir() exception', e, e.stack);
          }
        });
        return OSjs.VFS.Helpers.filterScandir(list, options);
      }
      davCall('PROPFIND', {path: item.path}, function(error, doc) {
        var list = [];
        if ( !error && doc ) {
          var result = parse(doc);
          result.forEach(function(iter) {
            list.push(new OSjs.VFS.File(iter));
          });
        }
        callback(error, list);
      });
    },
    write: function(item, data, callback, options) {
      davCall('PUT', {path: item.path, mime: item.mime, data: data}, callback);
    },
    read: function(item, callback, options) {
      davCall('GET', {path: item.path, mime: item.mime}, callback, true);
    },
    copy: function(src, dest, callback) {
      davCall('COPY', {path: src.path, dest: dest.path}, callback);
    },
    move: function(src, dest, callback) {
      davCall('MOVE', {path: src.path, dest: dest.path}, callback);
    },
    unlink: function(item, callback) {
      davCall('DELETE', {path: item.path}, callback);
    },
    mkdir: function(item, callback) {
      davCall('MKCOL', {path: item.path}, callback);
    },
    exists: function(item, callback) {
      davCall('PROPFIND', {path: item.path}, function(error, doc) {
        callback(false, !error);
      });
    },
    url: function(item, callback, options) {
      callback(false, OSjs.VFS.Transports.WebDAV.path(item));
    },
    freeSpace: function(root, callback) {
      callback(false, -1);
    }
  };
  function makePath(item) {
    if ( typeof item === 'string' ) {
      item = new OSjs.VFS.File(item);
    }
    var url      = getURL(item);
    var reqpath  = resolvePath(item).replace(/^\//, '');
    var fullpath = url + reqpath;
    if ( !getCORSAllowed(item) ) {
      fullpath = API.getConfig('Connection.FSURI') + '/get/' + fullpath;
    }
    return fullpath;
  }
  OSjs.VFS.Transports.WebDAV = {
    module: Transport,
    path: makePath
  };
})(OSjs.Utils, OSjs.API);

(function(Utils, API, VFS) {
  'use strict';
  var Transport = {
    scandir: function(item, callback, options) {
      var metadata = OSjs.Core.getPackageManager().getPackages();
      var files = [];
      Object.keys(metadata).forEach(function(m) {
        var iter = metadata[m];
        if ( iter.type !== 'extension' ) {
          files.push(new OSjs.VFS.File({
            filename: iter.name,
            icon: {
              filename: iter.icon,
              application: m
            },
            type: 'application',
            path: 'applications:///' + m,
            mime: 'osjs/application'
          }, 'osjs/application'));
        }
      });
      callback(false, files);
    }
  };
  VFS.Transports.Applications = {
    module: Transport,
    defaults: function(opts) {
      opts.readOnly = true;
      opts.special = true;
      opts.searchable = true;
    }
  };
})(OSjs.Utils, OSjs.API, OSjs.VFS);

(function(Utils, API) {
  'use strict';
  var gapi = window.gapi = window.gapi  || {};
  var CACHE_CLEAR_TIMEOUT = 7000;
  var _isMounted    = false;
  var _rootFolderId = null;
  var _treeCache    = null;
  var _clearCacheTimeout;
  function createBoundary(file, data, callback) {
    var boundary = '-------314159265358979323846';
    var delimiter = '\r\n--' + boundary + '\r\n';
    var close_delim = '\r\n--' + boundary + '--';
    var contentType = file.mime || 'text/plain'; //fileData.type || 'application/octet-stream';
    function createBody(result) {
      var metadata = {
        title: file.filename,
        mimeType: contentType
      };
      var base64Data = result;
      var multipartRequestBody =
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: ' + contentType + '\r\n' +
          'Content-Transfer-Encoding: base64\r\n' +
          '\r\n' +
          base64Data +
          close_delim;
      return multipartRequestBody;
    }
    var reqContentType = 'multipart/mixed; boundary=\'' + boundary + '\'';
    if ( data instanceof OSjs.VFS.FileDataURL ) {
      callback(false, {
        contentType: reqContentType,
        body: createBody(data.toBase64())
      });
    } else {
      OSjs.VFS.Helpers.abToBinaryString(data, contentType, function(error, response) {
        callback(error, error ? false : {
          contentType: reqContentType,
          body: createBody(btoa(response))
        });
      });
    }
  }
  function getFileFromPath(dir, type, callback) {
    if ( dir instanceof OSjs.VFS.File ) {
      dir = dir.path;
    }
    var tmpItem = new OSjs.VFS.File({
      filename: Utils.filename(dir),
      type: 'dir',
      path: Utils.dirname(dir)
    });
    getAllDirectoryFiles(tmpItem, function(error, list, ldir) {
      if ( error ) {
        return callback(error);
      }
      var found = null;
      list.forEach(function(iter) {
        if ( iter.title === Utils.filename(dir) ) {
          if ( type ) {
            if ( iter.mimeType === type ) {
              found = iter;
              return false;
            }
          } else {
            found = iter;
          }
        }
        return true;
      });
      callback(false, found);
    });
  }
  function getParentPathId(item, callback) {
    var dir = Utils.dirname(item.path);
    var type = 'application/vnd.google-apps.folder';
    getFileFromPath(dir, type, function(error, item) {
      if ( error ) {
        return callback(error);
      }
      callback(false, item ? item.id : null);
    });
  }
  function createDirectoryList(dir, list, item, options) {
    var result = [];
    var rdir = dir.replace(/^google-drive\:\/+/, '/'); // FIXME
    var isOnRoot = rdir === '/';
    function createItem(iter, i) {
      var path = dir;
      if ( iter.title === '..' ) {
        path = Utils.dirname(dir);
      } else {
        if ( !isOnRoot ) {
          path += '/';
        }
        path += iter.title;
      }
      var fileType = iter.mimeType === 'application/vnd.google-apps.folder' ? 'dir' : (iter.kind === 'drive#file' ? 'file' : 'dir');
      if ( iter.mimeType === 'application/vnd.google-apps.trash' ) {
        fileType = 'trash';
      }
      return new OSjs.VFS.File({
        filename: iter.title,
        path:     path,
        id:       iter.id,
        size:     iter.quotaBytesUsed || 0,
        mime:     iter.mimeType === 'application/vnd.google-apps.folder' ? null : iter.mimeType,
        type:     fileType
      });
    }
    if ( list ) {
      list.forEach(function(iter, i) {
        if ( !iter ) {
          return;
        }
        result.push(createItem(iter, i));
      });
    }
    return result ? OSjs.VFS.Helpers.filterScandir(result, options) : [];
  }
  function getAllDirectoryFiles(item, callback) {
    function retrieveAllFiles(cb) {
      if ( _clearCacheTimeout ) {
        clearTimeout(_clearCacheTimeout);
        _clearCacheTimeout = null;
      }
      if ( _treeCache ) {
        cb(false, _treeCache);
        return;
      }
      var list = [];
      function retrievePageOfFiles(request, result) {
        request.execute(function(resp) {
          if ( resp.error ) {
            console.warn('GoogleDrive::getAllDirectoryFiles()', 'error', resp);
          }
          result = result.concat(resp.items);
          var nextPageToken = resp.nextPageToken;
          if (nextPageToken) {
            request = gapi.client.drive.files.list({
              pageToken: nextPageToken
            });
            retrievePageOfFiles(request, result);
          } else {
            _treeCache = result;
            cb(false, result);
          }
        });
      }
      try {
        var initialRequest = gapi.client.drive.files.list({});
        retrievePageOfFiles(initialRequest, list);
      } catch ( e ) {
        console.warn('GoogleDrive::getAllDirectoryFiles() exception', e, e.stack);
        console.warn('THIS ERROR OCCURS WHEN MULTIPLE REQUESTS FIRE AT ONCE ?!'); // FIXME
        cb(false, list);
      }
    }
    function getFilesBelongingTo(list, root, cb) {
      var idList = {};
      var parentList = {};
      list.forEach(function(iter) {
        if ( iter ) {
          idList[iter.id] = iter;
          var parents = [];
          if ( iter.parents ) {
            iter.parents.forEach(function(piter) {
              if ( piter ) {
                parents.push(piter.id);
              }
            });
          }
          parentList[iter.id] = parents;
        }
      });
      var resolves = Utils.getPathProtocol(root).replace(/^\/+/, '').split('/');
      resolves = resolves.filter(function(el) {
        return el !== '';
      });
      var currentParentId = _rootFolderId;
      var isOnRoot = !resolves.length;
      function _getFileList(foundId) {
        var result = [];
        if ( !isOnRoot ) {
          result.push({
            title: '..',
            path: Utils.dirname(root),
            id: item.id,
            quotaBytesUsed: 0,
            mimeType: 'application/vnd.google-apps.folder'
          });
        }
        list.forEach(function(iter) {
          if ( iter && parentList[iter.id] && parentList[iter.id].indexOf(foundId) !== -1 ) {
            result.push(iter);
          }
        });
        return result;
      }
      function _nextDir(completed) {
        var current = resolves.shift();
        var done = resolves.length <= 0;
        var found;
        if ( isOnRoot ) {
          found = currentParentId;
        } else {
          if ( current ) {
            list.forEach(function(iter) {
              if ( iter ) {
                if ( iter.title === current && parentList[iter.id] && parentList[iter.id].indexOf(currentParentId) !== -1 ) {
                  currentParentId = iter.id;
                  found  = iter.id;
                }
              }
            });
          }
        }
        if ( done ) {
          completed(found);
        } else {
          _nextDir(completed);
        }
      }
      _nextDir(function(foundId) {
        if ( foundId && idList[foundId] ) {
          cb(false, _getFileList(foundId));
          return;
        } else {
          if ( isOnRoot ) {
            cb(false, _getFileList(currentParentId));
            return;
          }
        }
        cb('Could not list directory');
      });
    }
    function doRetrieve() {
      retrieveAllFiles(function(error, list) {
        var root = item.path;
        if ( error ) {
          callback(error, false, root);
          return;
        }
        getFilesBelongingTo(list, root, function(error, response) {
          _clearCacheTimeout = setTimeout(function() {
            _treeCache = null;
          }, CACHE_CLEAR_TIMEOUT);
          callback(error, response, root);
        });
      });
    }
    if ( !_rootFolderId ) {
      var request = gapi.client.drive.about.get();
      request.execute(function(resp) {
        if ( !resp || !resp.rootFolderId ) {
          callback(API._('ERR_VFSMODULE_ROOT_ID'));
          return;
        }
        _rootFolderId = resp.rootFolderId;
        doRetrieve();
      });
    } else {
      doRetrieve();
    }
  }
  function setFolder(item, pid, callback) {
    pid = pid || 'root';
    function _clearFolders(cb) {
      item.parents.forEach(function(p, i) {
        var request = gapi.client.drive.children.delete({
          folderId: p.id,
          childId: item.id
        });
        request.execute(function(resp) {
          if ( i >= (item.parents.length - 1) ) {
            cb();
          }
        });
      });
    }
    function _setFolder(rootId, cb) {
      var request = gapi.client.drive.children.insert({
        folderId: pid,
        resource: {id: item.id}
      });
      request.execute(function(resp) {
        callback(false, true);
      });
    }
    _clearFolders(function() {
      _setFolder(pid, callback);
    });
  }
  var GoogleDriveStorage = {};
  GoogleDriveStorage.scandir = function(item, callback, options) {
    getAllDirectoryFiles(item, function(error, list, dir) {
      if ( error ) {
        return callback(error);
      }
      var result = createDirectoryList(dir, list, item, options);
      callback(false, result, list);
    });
  };
  GoogleDriveStorage.read = function(item, callback, options) {
    function doRead() {
      var request = gapi.client.drive.files.get({
        fileId: item.id
      });
      request.execute(function(file) {
        if ( file && file.id ) {
          var accessToken = gapi.auth.getToken().access_token;
          Utils.ajax({
            url: file.downloadUrl,
            method: 'GET',
            responseType: 'arraybuffer',
            requestHeaders: {'Authorization': 'Bearer ' + accessToken},
            onsuccess: function(response) {
              callback(false, response);
            },
            onerror: function(error) {
              callback(API._('ERR_VFSMODULE_XHR_ERROR') + ' - ' + error);
            }
          });
        } else {
          callback(API._('ERR_VFSMODULE_NOSUCH'));
        }
      });
    }
    if ( item.downloadUrl ) {
      doRead();
    } else {
      getFileFromPath(item.path, item.mime, function(error, response) {
        if ( error ) {
          callback(error);
          return;
        }
        if ( !response ) {
          callback(API._('ERR_VFSMODULE_NOSUCH'));
          return;
        }
        item = response;
        doRead();
      });
    }
  };
  GoogleDriveStorage.write = function(file, data, callback) {
    var self = this;
    function doWrite(parentId, fileId) {
      var uri = '/upload/drive/v2/files';
      var method = 'POST';
      if ( fileId ) {
        uri = '/upload/drive/v2/files/' + fileId;
        method = 'PUT';
      }
      createBoundary(file, data, function(error, fileData) {
        if ( error ) {
          callback(error);
          return;
        }
        var request = gapi.client.request({
          path: uri,
          method: method,
          params: {uploadType: 'multipart'},
          headers: {'Content-Type': fileData.contentType},
          body: fileData.body
        });
        request.execute(function(resp) {
          _treeCache = null; // Make sure we refetch any cached stuff
          if ( resp && resp.id ) {
            if ( parentId ) {
              setFolder(resp, parentId, callback);
            } else {
              callback(false, true);
            }
          } else {
            callback(API._('ERR_VFSMODULE_NOSUCH'));
          }
        });
      });
    }
    getParentPathId(file, function(error, id) {
      if ( error ) {
        return callback(error);
      }
      if ( file.id ) {
        doWrite(id, file.id);
      } else {
        self.exists(file, function(error, exists) {
          var fileid = error ? null : (exists ? exists.id : null);
          doWrite(id, fileid);
        });
      }
    });
  };
  GoogleDriveStorage.copy = function(src, dest, callback) {
    var request = gapi.client.drive.files.copy({
      fileId: Utils.filename(src),
      resource: {title: Utils.filename(dest)}
    });
    request.execute(function(resp) {
      if ( resp.id ) {
        callback(false, true);
        return;
      }
      var msg = resp && resp.message ? resp.message : API._('ERR_APP_UNKNOWN_ERROR');
      callback(msg);
    });
  };
  GoogleDriveStorage.unlink = function(src, callback) {
    function doDelete() {
      _treeCache = null; // Make sure we refetch any cached stuff
      var request = gapi.client.drive.files.delete({
        fileId: src.id
      });
      request.execute(function(resp) {
        if ( resp && (typeof resp.result === 'object') ) {
          callback(false, true);
        } else {
          var msg = resp && resp.message ? resp.message : API._('ERR_APP_UNKNOWN_ERROR');
          callback(msg);
        }
      });
    }
    if ( !src.id ) {
      getFileFromPath(src.path, src.mime, function(error, response) {
        if ( error ) {
          callback(error);
          return;
        }
        if ( !response ) {
          callback(API._('ERR_VFSMODULE_NOSUCH'));
          return;
        }
        src = response;
        doDelete();
      });
    } else {
      doDelete();
    }
  };
  GoogleDriveStorage.move = function(src, dest, callback) {
    var request = gapi.client.drive.files.patch({
      fileId: src.id,
      resource: {
        title: Utils.filename(dest.path)
      }
    });
    request.execute(function(resp) {
      if ( resp && resp.id ) {
        _treeCache = null; // Make sure we refetch any cached stuff
        callback(false, true);
      } else {
        var msg = resp && resp.message ? resp.message : API._('ERR_APP_UNKNOWN_ERROR');
        callback(msg);
      }
    });
  };
  GoogleDriveStorage.exists = function(item, callback) {
    var req = new OSjs.VFS.File(OSjs.Utils.dirname(item.path));
    this.scandir(req, function(error, result) {
      if ( error ) {
        callback(error);
        return;
      }
      var found = false;
      if ( result ) {
        result.forEach(function(iter) {
          if ( iter.path === item.path ) {
            found = new OSjs.VFS.File(item.path, iter.mimeType);
            found.id = iter.id;
            found.title = iter.title;
            return false;
          }
          return true;
        });
      }
      callback(false, found);
    });
  };
  GoogleDriveStorage.fileinfo = function(item, callback) {
    var request = gapi.client.drive.files.get({
      fileId: item.id
    });
    request.execute(function(resp) {
      if ( resp && resp.id ) {
        var useKeys = ['createdDate', 'id', 'lastModifyingUser', 'lastViewedByMeDate', 'markedViewedByMeDate', 'mimeType', 'modifiedByMeDate', 'modifiedDate', 'title', 'alternateLink'];
        var info = {};
        useKeys.forEach(function(k) {
          info[k] = resp[k];
        });
        return callback(false, info);
      }
      callback(API._('ERR_VFSMODULE_NOSUCH'));
    });
  };
  GoogleDriveStorage.url = function(item, callback) {
    if ( !item || !item.id ) {
      throw new Error('url() expects a File ref with Id');
    }
    var request = gapi.client.drive.files.get({
      fileId: item.id
    });
    request.execute(function(resp) {
      if ( resp && resp.webContentLink ) {
        callback(false, resp.webContentLink);
      } else {
        var msg = resp && resp.message ? resp.message : API._('ERR_APP_UNKNOWN_ERROR');
        callback(msg);
      }
    });
  };
  GoogleDriveStorage.mkdir = function(dir, callback) {
    function doMkdir(parents) {
      var request = gapi.client.request({
        'path': '/drive/v2/files',
        'method': 'POST',
        'body': JSON.stringify({
          title: dir.filename,
          parents: parents,
          mimeType: 'application/vnd.google-apps.folder'
        })
      });
      request.execute(function(resp) {
        if ( resp && resp.id ) {
          _treeCache = null; // Make sure we refetch any cached stuff
          callback(false, true);
        } else {
          var msg = resp && resp.message ? resp.message : API._('ERR_APP_UNKNOWN_ERROR');
          callback(msg);
        }
      });
    }
    var mm = OSjs.Core.getMountManager();
    if ( Utils.dirname(dir.path) !== Utils.getPathProtocol(mm.getModuleProperty('GoogleDrive', 'root')) ) {
      getParentPathId(dir, function(error, id) {
        if ( error || !id ) {
          error = error || API._('ERR_VFSMODULE_PARENT');
          callback(API._('ERR_VFSMODULE_PARENT_FMT', error));
          return;
        }
        doMkdir([{id: id}]);
      });
      return;
    }
    doMkdir(null);
  };
  GoogleDriveStorage.upload = function(file, dest, callback) {
    var item = new OSjs.VFS.File({
      filename: file.name,
      path: Utils.pathJoin((new OSjs.VFS.File(dest)).path, file.name),
      mime: file.type,
      size: file.size
    });
    this.write(item, file, callback);
  };
  GoogleDriveStorage.trash = function(file, callback) {
    var request = gapi.client.drive.files.trash({
      fileId: file.id
    });
    request.execute(function(resp) {
      if ( resp.id ) {
        callback(false, true);
        return;
      }
      var msg = resp && resp.message ? resp.message : API._('ERR_APP_UNKNOWN_ERROR');
      callback(msg);
    });
  };
  GoogleDriveStorage.untrash = function(file, callback) {
    var request = gapi.client.drive.files.untrash({
      fileId: file.id
    });
    request.execute(function(resp) {
      if ( resp.id ) {
        callback(false, true);
        return;
      }
      var msg = resp && resp.message ? resp.message : API._('ERR_APP_UNKNOWN_ERROR');
      callback(msg);
    });
  };
  GoogleDriveStorage.emptyTrash = function(callback) {
    var request = gapi.client.drive.files.emptyTrash({});
    request.execute(function(resp) {
      if ( resp && resp.message ) {
        var msg = resp && resp.message ? resp.message : API._('ERR_APP_UNKNOWN_ERROR');
        callback(msg);
        return;
      }
      callback(false, true);
    });
  };
  GoogleDriveStorage.freeSpace = function(root, callback) {
    callback(false, -1);
  };
  function getGoogleDrive(callback, onerror) {
    callback = callback || function() {};
    onerror  = onerror  || function() {};
    if ( _isMounted ) {
      var inst = OSjs.Helpers.GoogleAPI.getInstance();
      if ( inst && !inst.authenticated ) {
        _isMounted = false;
      }
    }
    if ( !_isMounted ) {
      var scopes = [
        'https://www.googleapis.com/auth/drive.install',
        'https://www.googleapis.com/auth/drive.file',
        'openid'
      ];
      var loads = [
        'drive-realtime',
        'drive-share'
      ];
      var iargs = {load: loads, scope: scopes};
      OSjs.Helpers.GoogleAPI.createInstance(iargs, function(error, result) {
        if ( error ) {
          return onerror(error);
        }
        gapi.client.load('drive', 'v2', function() {
          _isMounted = true;
          API.message('vfs:mount', 'GoogleDrive', {source: null});
          callback(GoogleDriveStorage);
        });
      });
      return;
    }
    callback(GoogleDriveStorage);
  }
  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || function() {};
    getGoogleDrive(function(instance) {
      if ( !instance ) {
        throw new Error('No GoogleDrive instance was created. Load error ?');
      } else if ( !instance[name] ) {
        throw new Error('Invalid GoogleDrive API call name');
      }
      var fargs = args;
      fargs.push(callback);
      fargs.push(options);
      instance[name].apply(instance, fargs);
    }, function(error) {
      callback(error);
    });
  }
  OSjs.Core.getMountManager()._add({
    readOnly: false,
    name: 'GoogleDrive',
    transport: 'GoogleDrive',
    description: 'Google Drive',
    visible: true,
    searchable: false,
    unmount: function(cb) {
      cb = cb || function() {};
      _isMounted = false;
      API.message('vfs:unmount', 'GoogleDrive', {source: null});
      cb(false, true);
    },
    mounted: function() {
      return _isMounted;
    },
    enabled: function() {
      try {
        if ( API.getConfig('VFS.GoogleDrive.Enabled') ) {
          return true;
        }
      } catch ( e ) {
        console.warn('OSjs.VFS.Modules.GoogleDrive::enabled()', e, e.stack);
      }
      return false;
    },
    root: 'google-drive:///',
    icon: 'places/google-drive.png',
    match: /^google-drive\:\/\//,
    request: makeRequest
  });
})(OSjs.Utils, OSjs.API);

(function(Utils, API) {
  'use strict';
  var _cachedClient;
  var _isMounted = false;
  function _getConfig(cfg, isVFS) {
    var config = OSjs.Core.getConfig();
    try {
      return isVFS ? config.VFS.Dropbox[cfg] : config.DropboxAPI[cfg];
    } catch ( e ) {
      console.warn('OSjs.VFS.Modules.Dropbox::enabled()', e, e.stack);
    }
    return null;
  }
  function destroyRingNotification() {
    var ring = API.getServiceNotificationIcon();
    if ( ring ) {
      ring.remove('Dropbox.js');
    }
  }
  function createRingNotification() {
    var ring = API.getServiceNotificationIcon();
    if ( ring ) {
      ring.add('Dropbox.js', [{
        title: API._('DROPBOX_SIGN_OUT'),
        onClick: function() {
          signoutDropbox();
        }
      }]);
    }
  }
  function DropboxVFS() {
    var clientKey = _getConfig('ClientKey');
    this.client = new window.Dropbox.Client({ key: clientKey });
    if ( this.client ) {
      var href = window.location.href;
      if ( !href.match(/\/$/) ) {
        href += '/';
      }
      href += 'vendor/dropboxOauthReceiver.html';
      var authDriver = new window.Dropbox.AuthDriver.Popup({
        receiverUrl: href
      });
      this.client.authDriver(authDriver);
    }
  }
  DropboxVFS.prototype.init = function(callback) {
    var timedOut = false;
    var timeout = setTimeout(function() {
      timedOut = true;
      callback(API._('ERR_OPERATION_TIMEOUT_FMT', '60s'));
    }, 60 * 1000);
    this.client.authenticate(function(error, client) {
      if ( !timedOut ) {
        console.warn('DropboxVFS::construct()', error, client);
        timeout = clearTimeout(timeout);
        callback(error);
      }
    });
  };
  DropboxVFS.prototype.scandir = function(item, callback) {
    var mm = OSjs.Core.getMountManager();
    var path = Utils.getPathProtocol(item.path);
    function _finish(entries) {
      var result = entries.map(function(iter) {
        return new OSjs.VFS.File({
          filename: iter.name,
          path: mm.getModuleProperty('Dropbox', 'root').replace(/\/$/, '') + iter.path,
          size: iter.size,
          mime: iter.isFolder ? null : iter.mimeType,
          type: iter.isFolder ? 'dir' : 'file'
        });
      });
      var list = OSjs.VFS.Helpers.filterScandir(result, item._opts);
      callback(false, list);
    }
    this.client.readdir(path, {}, function(error, entries, stat, entry_stats) {
      if ( error ) {
        callback(error);
        return;
      }
      _finish(entry_stats);
    });
  };
  DropboxVFS.prototype.write = function(item, data, callback) {
    var path = Utils.getPathProtocol(item.path);
    this.client.writeFile(path, data, function(error, stat) {
      callback(error, true);
    });
  };
  DropboxVFS.prototype.read = function(item, callback, options) {
    options = options || {};
    options.arrayBuffer = true;
    var path = Utils.getPathProtocol(item.path);
    this.client.readFile(path, options, function(error, entries) {
      callback(error, (error ? false : (entries instanceof Array ? entries.join('\n') : entries)));
    });
  };
  DropboxVFS.prototype.copy = function(src, dest, callback) {
    var spath = Utils.getPathProtocol(src.path);
    var dpath = Utils.getPathProtocol(dest.path);
    this.client.copy(spath, dpath, function(error) {
      callback(error, !error);
    });
  };
  DropboxVFS.prototype.move = function(src, dest, callback) {
    var spath = Utils.getPathProtocol(src.path);
    var dpath = Utils.getPathProtocol(dest.path);
    this.client.move(spath, dpath, function(error) {
      callback(error, !error);
    });
  };
  DropboxVFS.prototype.unlink = function(item, callback) {
    var path = Utils.getPathProtocol(item.path);
    this.client.unlink(path, function(error, stat) {
      callback(error, !error);
    });
  };
  DropboxVFS.prototype.mkdir = function(item, callback) {
    var path = Utils.getPathProtocol(item.path);
    this.client.mkdir(path, function(error, stat) {
      callback(error, !error);
    });
  };
  DropboxVFS.prototype.exists = function(item, callback) {
    this.read(item, function(error, data) {
      callback(error, !error);
    });
  };
  DropboxVFS.prototype.fileinfo = function(item, callback) {
    var path = Utils.getPathProtocol(item.path);
    this.client.stat(path, path, function(error, response) {
      var fileinfo = null;
      if ( !error && response ) {
        fileinfo = {};
        var useKeys = ['clientModifiedAt', 'humanSize', 'mimeType', 'modifiedAt', 'name', 'path', 'size', 'versionTag'];
        useKeys.forEach(function(k) {
          fileinfo[k] = response[k];
        });
      }
      callback(error, fileinfo);
    });
  };
  DropboxVFS.prototype.url = function(item, callback) {
    var path = (typeof item === 'string') ? Utils.getPathProtocol(item) : Utils.getPathProtocol(item.path);
    this.client.makeUrl(path, {downloadHack: true}, function(error, url) {
      callback(error, url ? url.url : false);
    });
  };
  DropboxVFS.prototype.upload = function(file, dest, callback) {
    var item = new OSjs.VFS.File({
      filename: file.name,
      path: Utils.pathJoin((new OSjs.VFS.File(dest)).path, file.name),
      mime: file.type,
      size: file.size
    });
    this.write(item, file, callback);
  };
  DropboxVFS.prototype.trash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };
  DropboxVFS.prototype.untrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };
  DropboxVFS.prototype.emtpyTrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };
  DropboxVFS.freeSpace = function(root, callback) {
    callback(false, -1);
  };
  function getDropbox(callback) {
    if ( !_cachedClient ) {
      _cachedClient = new DropboxVFS();
      _cachedClient.init(function(error) {
        if ( error ) {
          console.error('Failed to initialize dropbox VFS', error);
          callback(null, error);
          return;
        }
        _isMounted = true;
        createRingNotification();
        API.message('vfs:mount', 'Dropbox', {source: null});
        callback(_cachedClient);
      });
      return;
    }
    callback(_cachedClient);
  }
  function signoutDropbox(cb, options) {
    cb = cb || function() {};
    options = options || null;
    function finished(client) {
      if ( client ) {
        client.reset();
      }
      _isMounted = false;
      _cachedClient = null;
      API.message('vfs:unmount', 'Dropbox', {source: null});
      destroyRingNotification();
      cb();
    }
    getDropbox(function(client) {
      client = client ? client.client : null;
      if ( client ) {
        try {
          client.signOut(options, function() {
            finished(client);
          });
        } catch ( ex ) {
          console.warn('DROPBOX SIGNOUT EXCEPTION', ex);
          finished(client);
        }
      }
    });
  }
  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || function() {};
    getDropbox(function(instance, error) {
      if ( !instance ) {
        callback('No Dropbox VFS API Instance was ever created. Possible intialization error' + (error ? ': ' + error : ''));
        return;
      }
      var fargs = args;
      fargs.push(callback);
      fargs.push(options);
      instance[name].apply(instance, fargs);
    });
  }
  OSjs.Core.getMountManager()._add({
    readOnly: false,
    name: 'Dropbox',
    transport: 'Dropbox',
    description: 'Dropbox',
    visible: true,
    searchable: false,
    unmount: function(cb) {
      cb = cb || function() {};
      _isMounted = false;
      API.message('vfs:unmount', 'Dropbox', {source: null});
      cb(false, true);
    },
    mounted: function() {
      return _isMounted;
    },
    enabled: function() {
      if ( !window.Dropbox ) {
        return false;
      }
      return _getConfig('Enabled', true) || false;
    },
    root: 'dropbox:///',
    icon: 'places/dropbox.png',
    match: /^dropbox\:\/\//,
    request: makeRequest
  });
})(OSjs.Utils, OSjs.API);

(function(Utils, API) {
  'use strict';
  var _isMounted    = false;
  var _mimeCache;
  function onedriveCall(args, callback) {
    var WL = window.WL || {};
    WL.api(args).then(
      function(response) {
        callback(false, response);
      },
      function(responseFailed) {
        console.error('OneDrive::*onedriveCall()', 'error', responseFailed, args);
        callback(responseFailed.error.message);
      }
    );
  }
  function getItemType(iter) {
    var type = 'file';
    if ( iter.type === 'folder' || iter.type === 'album' ) {
      type = 'dir';
    }
    return type;
  }
  function getMetadataFromItem(dir, item) {
    var path = 'onedrive://' + dir.replace(/^\/+/, '').replace(/\/+$/, '') + '/' + item.name; // FIXME
    var itemFile = new OSjs.VFS.File({
      id: item.id,
      filename: item.name,
      size: item.size || 0,
      path: path,
      mime: getItemMime(item),
      type: getItemType(item)
    });
    return itemFile;
  }
  function getItemMime(iter) {
    if ( !_mimeCache ) {
      _mimeCache = API.getConfig('MIME.mapping', {});
    }
    var mime = null;
    if ( getItemType(iter) !== 'dir' ) {
      mime = 'application/octet-stream';
      var ext = Utils.filext(iter.name);
      if ( ext.length ) {
        ext = '.' + ext;
        if ( _mimeCache[ext] ) {
          mime = _mimeCache[ext];
        }
      }
    }
    return mime;
  }
  function createDirectoryList(dir, list, item, options) {
    var result = [];
    if ( dir !== '/' ) {
      result.push(new OSjs.VFS.File({
        id: item.id,
        filename: '..',
        path: Utils.dirname(item.path),
        size: 0,
        type: 'dir'
      }));
    }
    list.forEach(function(iter) {
      result.push(getMetadataFromItem(dir, iter));
    });
    return result;
  }
  function getFilesInFolder(folderId, callback) {
    onedriveCall({
      path: folderId + '/files',
      method: 'GET'
    }, function(error, response) {
      if ( error ) {
        callback(error);
        return;
      }
      callback(false, response.data || []);
    });
  }
  function resolvePath(item, callback, useParent) {
    if ( !useParent ) {
      if ( item.id ) {
        callback(false, item.id);
        return;
      }
    }
    var path = Utils.getPathProtocol(item.path).replace(/\/+/, '/');
    if ( useParent ) {
      path = Utils.dirname(path);
    }
    if ( path === '/' ) {
      callback(false, 'me/skydrive');
      return;
    }
    var resolves = path.replace(/^\/+/, '').split('/');
    var isOnRoot = !resolves.length;
    var currentParentId = 'me/skydrive';
    function _nextDir(completed) {
      var current = resolves.shift();
      var done = resolves.length <= 0;
      var found;
      if ( isOnRoot ) {
        found = currentParentId;
      } else {
        if ( current ) {
          getFilesInFolder(currentParentId, function(error, list) {
            list = list || [];
            var lfound;
            if ( !error ) {
              list.forEach(function(iter) { // FIXME: Not very precise
                if ( iter ) {
                  if ( iter.name === current ) {
                    lfound = iter.id;
                  }
                }
              });
              if ( lfound ) {
                currentParentId = lfound;
              }
            } else {
              console.warn('OneDrive', 'resolvePath()', 'getFilesInFolder() error', error);
            }
            if ( done ) {
              completed(lfound);
            } else {
              _nextDir(completed);
            }
          });
          return;
        }
      }
      if ( done ) {
        completed(found);
      } else {
        _nextDir(completed);
      }
    }
    _nextDir(function(foundId) {
      if ( foundId ) {
        callback(false, foundId);
      } else {
        callback(API._('ONEDRIVE_ERR_RESOLVE'));
      }
    });
  }
  var OneDriveStorage = {};
  OneDriveStorage.scandir = function(item, callback, options) {
    var relativePath = Utils.getPathProtocol(item.path);
    function _finished(error, result) {
      callback(error, result);
    }
    function _scandir(drivePath) {
      onedriveCall({
        path: drivePath,
        method: 'GET'
      }, function(error, response) {
        if ( error ) {
          _finished(error);
          return;
        }
        getFilesInFolder(response.id, function(error, list) {
          if ( error ) {
            _finished(error);
            return;
          }
          var fileList = createDirectoryList(relativePath, list, item, options);
          _finished(false, fileList);
        });
      });
    }
    resolvePath(item, function(error, drivePath) {
      if ( error ) {
        _finished(error);
        return;
      }
      _scandir(drivePath);
    });
  };
  OneDriveStorage.read = function(item, callback, options) {
    options = options || {};
    this.url(item, function(error, url) {
      if ( error ) {
        callback(error);
        return;
      }
      var file = new OSjs.VFS.File(url, item.mime);
      OSjs.VFS.read(file, function(error, response) {
        if ( error ) {
          callback(error);
          return;
        }
        callback(false, response);
      }, options);
    });
  };
  OneDriveStorage.write = function(file, data, callback) {
    var inst = OSjs.Helpers.WindowsLiveAPI.getInstance();
    var url = 'https://apis.live.net/v5.0/me/skydrive/files?access_token=' + inst.accessToken;
    var fd  = new FormData();
    OSjs.VFS.Helpers.addFormFile(fd, 'file', data, file);
    OSjs.Utils.ajax({
      url: url,
      method: 'POST',
      json: true,
      body: fd,
      onsuccess: function(result) {
        if ( result && result.id ) {
          callback(false, result.id);
          return;
        }
        callback(API._('ERR_APP_UNKNOWN_ERROR'));
      },
      onerror: function(error, result) {
        if ( result && result.error ) {
          error += ' - ' + result.error.message;
        }
        callback(error);
      }
    });
  };
  OneDriveStorage.copy = function(src, dest, callback) {
    resolvePath(src, function(error, srcDrivePath) {
      if ( error ) {
        callback(error);
        return;
      }
      resolvePath(dest, function(error, dstDrivePath) {
        if ( error ) {
          callback(error);
          return;
        }
        onedriveCall({
          path: srcDrivePath,
          method: 'COPY',
          body: {
            destination: dstDrivePath
          }
        }, function(error, response) {
          callback(error, error ? null : true);
        });
      });
    });
  };
  OneDriveStorage.unlink = function(src, callback) {
    resolvePath(src, function(error, drivePath) {
      if ( error ) {
        callback(error);
        return;
      }
      onedriveCall({
        path: drivePath,
        method: 'DELETE'
      }, function(error, response) {
        callback(error, error ? null : true);
      });
    });
  };
  OneDriveStorage.move = function(src, dest, callback) {
    resolvePath(src, function(error, srcDrivePath) {
      if ( error ) {
        callback(error);
        return;
      }
      resolvePath(dest, function(error, dstDrivePath) {
        if ( error ) {
          callback(error);
          return;
        }
        onedriveCall({
          path: srcDrivePath,
          method: 'MOVE',
          body: {
            destination: dstDrivePath
          }
        }, function(error, response) {
          callback(error, error ? null : true);
        });
      });
    });
  };
  OneDriveStorage.exists = function(item, callback) {
    this.fileinfo(item, function(error, response) {
      if ( error ) {
        callback(false, false);
        return;
      }
      callback(false, response ? true : false);
    });
  };
  OneDriveStorage.fileinfo = function(item, callback) {
    resolvePath(item, function(error, drivePath) {
      if ( error ) {
        callback(error);
        return;
      }
      onedriveCall({
        path: drivePath,
        method: 'GET'
      }, function(error, response) {
        if ( error ) {
          callback(error);
          return;
        }
        var useKeys = ['created_time', 'id', 'link', 'name', 'type', 'updated_time', 'upload_location', 'description', 'client_updated_time'];
        var info = {};
        useKeys.forEach(function(k) {
          info[k] = response[k];
        });
        callback(false, info);
      });
    });
  };
  OneDriveStorage.mkdir = function(dir, callback) {
    resolvePath(dir, function(error, drivePath) {
      if ( error ) {
        callback(error);
        return;
      }
      onedriveCall({
        path: drivePath,
        method: 'POST',
        body: {
          name: dir.filename
        }
      }, function(error, response) {
        callback(error, error ? null : true);
      });
    }, true);
  };
  OneDriveStorage.upload = function(file, dest, callback) {
    var item = new OSjs.VFS.File({
      filename: file.name,
      path: Utils.pathJoin((new OSjs.VFS.File(dest)).path, file.name),
      mime: file.type,
      size: file.size
    });
    this.write(item, file, callback);
  };
  OneDriveStorage.url = function(item, callback) {
    resolvePath(item, function(error, drivePath) {
      if ( error ) {
        callback(error);
        return;
      }
      onedriveCall({
        path: drivePath + '/content',
        method: 'GET'
      }, function(error, response) {
        if ( error ) {
          callback(error);
          return;
        }
        callback(false, response.location);
      });
    });
  };
  OneDriveStorage.trash = function(file, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };
  OneDriveStorage.untrash = function(file, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };
  OneDriveStorage.emptyTrash = function(callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };
  OneDriveStorage.freeSpace = function(root, callback) {
    callback(false, -1);
  };
  function getOneDrive(callback, onerror) {
    callback = callback || function() {};
    onerror  = onerror  || function() {};
    if ( _isMounted ) {
      var inst = OSjs.Helpers.WindowsLiveAPI.getInstance();
      if ( inst && !inst.authenticated ) {
        _isMounted = false;
      }
    }
    if ( !_isMounted ) {
      var iargs = {scope: ['wl.signin', 'wl.skydrive', 'wl.skydrive_update']};
      OSjs.Helpers.WindowsLiveAPI.createInstance(iargs, function(error, result) {
        if ( error ) {
          return onerror(error);
        }
        _isMounted = true;
        API.message('vfs:mount', 'OneDrive', {source: null});
        callback(OneDriveStorage);
      });
      return;
    }
    callback(OneDriveStorage);
  }
  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || function() {};
    getOneDrive(function(instance) {
      if ( !instance ) {
        throw new Error('No OneDrive instance was created. Load error ?');
      } else if ( !instance[name] ) {
        throw new Error('Invalid OneDrive API call name');
      }
      var fargs = args;
      fargs.push(callback);
      fargs.push(options);
      instance[name].apply(instance, fargs);
    }, function(error) {
      callback(error);
    });
  }
  OSjs.Core.getMountManager()._add({
    readOnly: false,
    name: 'OneDrive',
    transport: 'OneDrive',
    description: 'OneDrive',
    visible: true,
    searchable: false,
    unmount: function(cb) {
      cb = cb || function() {};
      _isMounted = false;
      API.message('vfs:unmount', 'OneDrive', {source: null});
      cb(false, true);
    },
    mounted: function() {
      return _isMounted;
    },
    enabled: function() {
      try {
        if ( API.getConfig('VFS.OneDrive.Enabled') ) {
          return true;
        }
      } catch ( e ) {
        console.warn('OSjs.VFS.Modules.OneDrive::enabled()', e, e.stack);
      }
      return false;
    },
    root: 'onedrive:///',
    icon: 'places/onedrive.png',
    match: /^onedrive\:\/\//,
    request: makeRequest
  });
})(OSjs.Utils, OSjs.API);

(function(Utils, API) {
  'use strict';
  var NAMESPACE = 'OSjs/VFS/LocalStorage';
  var _isMounted = false;
  var _cache = {};
  var _fileCache = {};
  function getRealPath(p, par) {
    if ( typeof p !== 'string' || !p ) {
      throw new TypeError('Expected p as String');
    }
    p = Utils.getPathProtocol(p).replace(/\/+/g, '/');
    var path = par ? (Utils.dirname(p) || '/') : p;
    if ( path !== '/' ) {
      path = path.replace(/\/$/, '');
    }
    return path;
  }
  function createMetadata(i, path, p) {
    i = Utils.cloneObject(i);
    if ( !p.match(/(\/\/)?\/$/) ) {
      p += '/';
    }
    i.path = p + i.filename;
    return new OSjs.VFS.File(i);
  }
  function initStorage() {
    if ( !_isMounted ) {
      try {
        _cache = JSON.parse(localStorage.getItem(NAMESPACE + '/tree')) || {};
      } catch ( e ) {}
      try {
        _fileCache = JSON.parse(localStorage.getItem(NAMESPACE + '/data')) || {};
      } catch ( e ) {}
      if ( typeof _cache['/'] === 'undefined' ) {
        _cache['/'] = [];
      }
      _isMounted = true;
      API.message('vfs:mount', 'LocalStorage', {source: null});
    }
  }
  function commitStorage() {
    try {
      localStorage.setItem(NAMESPACE + '/tree', JSON.stringify(_cache));
      localStorage.setItem(NAMESPACE + '/data', JSON.stringify(_fileCache));
      return true;
    } catch ( e ) {}
    return false;
  }
  function addToCache(iter, data, dab) {
    var path = getRealPath(iter.path);
    var dirname = Utils.dirname(path);
    var type = typeof data === 'undefined' || data === null ? 'dir' : 'file';
    var mimeConfig = API.getConfig('MIME.mapping');
    var mime = (function(type) {
      if ( type !== 'dir' ) {
        if ( iter.mime ) {
          return iter.mime;
        } else {
          var ext = Utils.filext(iter.filename);
          return mimeConfig['.' + ext] || 'application/octet-stream';
        }
      }
      return null;
    })(iter.type);
    var file = {
      size: iter.size || (type === 'file' ? (dab.byteLength || dab.length || 0) : 0),
      mime: mime,
      type: type,
      filename: iter.filename
    };
    if ( typeof _cache[dirname] === 'undefined' ) {
      _cache[dirname] = [];
    }
    (function(found) {
      if ( found !== false) {
        _cache[dirname][found] = file;
      } else {
        _cache[dirname].push(file);
      }
    })(findInCache(iter));
    if ( file.type === 'dir' ) {
      if ( _fileCache[path] ) {
        delete _fileCache[path];
      }
      _cache[path] = [];
    } else {
      var iof = data.indexOf(',');
      _fileCache[path] = data.substr(iof + 1);
    }
    return true;
  }
  function removeFromCache(iter) {
    function _removef(i) {
      var path = getRealPath(i.path);
      if ( _fileCache[path] ) {
        delete _fileCache[path];
      }
      _removefromp(i);
    }
    function _removed(i) {
      var path = getRealPath(i.path);
      if ( path !== '/' ) {
        _removefromp(i);
        if ( _cache[path] ) {
          delete _cache[path];
        }
      }
    }
    function _removefromp(i) {
      var path = getRealPath(i.path);
      var dirname = Utils.dirname(path);
      if ( _cache[dirname] ) {
        var found = -1;
        _cache[dirname].forEach(function(ii, idx) {
          if ( found === -1 && ii ) {
            if ( ii.type === i.type && i.filename === i.filename ) {
              found = idx;
            }
          }
        });
        if ( found >= 0 ) {
          _cache[dirname].splice(found, 1);
        }
      }
    }
    function _op(i) {
      if ( i ) {
        if ( i.type === 'dir' ) {
          scanStorage(i, false).forEach(function(ii) {
            _op(ii);
          });
          _removed(i);
        } else {
          _removef(i);
        }
      }
    }
    _op(iter);
    return true;
  }
  function findInCache(iter) {
    var path = getRealPath(iter.path);
    var dirname = Utils.dirname(path);
    var found = false;
    _cache[dirname].forEach(function(chk, idx) {
      if ( found === false && chk.filename === iter.filename ) {
        found = idx;
      }
    });
    return found;
  }
  function getFromCache(pp) {
    var path = Utils.dirname(pp);
    var fname = Utils.filename(pp);
    var result = null;
    var tpath = path.replace(/^(.*)\:\/\//, '');
    (_cache[tpath] || []).forEach(function(v) {
      if ( !result && v.filename === fname ) {
        result = createMetadata(v, null, path);
      }
    });
    return result;
  }
  function scanStorage(item, ui) {
    var path = getRealPath(item.path);
    var data = _cache[path] || false;
    var list = (data === false) ? false : data.filter(function(i) {
      return !!i;
    }).map(function(i) {
      return createMetadata(i, path, item.path);
    });
    return list;
  }
  var LocalStorageStorage = {
    scandir: function(item, callback, options) {
      var list = scanStorage(item, true);
      callback(list === false ? API._('ERR_VFSMODULE_NOSUCH') : false, list);
    },
    read: function(item, callback, options) {
      options = options || {};
      var path = getRealPath(item.path);
      function readStorage(cb) {
        var metadata = getFromCache(path);
        if ( metadata ) {
          var data = _fileCache[path];
          if ( data ) {
            var ds  = 'data:' + metadata.mime + ',' + data;
            OSjs.VFS.Helpers.dataSourceToAb(ds, metadata.mime, function(err, res) {
              if ( err ) {
                cb(err);
              } else {
                if ( options.url ) {
                  OSjs.VFS.Helpers.abToBlob(res, metadata.mime, function(err, blob) {
                    cb(err, URL.createObjectURL(blob));
                  });
                } else {
                  cb(err, res);
                }
              }
            });
            return true;
          }
        }
        return false;
      }
      if ( readStorage(callback) === false ) {
        callback(API._('ERR_VFS_FATAL'), false);
      }
    },
    write: function(file, data, callback, options) {
      options = options || {};
      var mime = file.mime || 'application/octet-stream';
      function writeStorage(cb) {
        if ( options.isds ) {
          cb(false, data);
        } else {
          OSjs.VFS.Helpers.abToDataSource(data, mime, function(err, res) {
            if ( err ) {
              callback(err, false);
            } else {
              cb(false, res);
            }
          });
        }
      }
      writeStorage(function(err, res) {
        try {
          if ( addToCache(file, res, data) && commitStorage() ) {
            callback(err, true);
          } else {
            callback(API._('ERR_VFS_FATAL'), false);
          }
        } catch ( e ) {
          callback(e);
        }
      });
    },
    unlink: function(src, callback) {
      try {
        src = getFromCache(src.path) || src;
        if ( removeFromCache(src) && commitStorage() ) {
          callback(false, true);
        } else {
          callback(API._('ERR_VFS_FATAL'), false);
        }
      } catch ( e ) {
        callback(e);
      }
    },
    copy: function(src, dest, callback) {
      function _write(s, d, cb) {
        OSjs.VFS.read(s, function(err, data) {
          if ( err ) {
            cb(err);
          } else {
            OSjs.VFS.write(d, data, cb);
          }
        });
      }
      function _op(s, d, cb) {
        if ( s.type === 'file' ) {
          d.mime = s.mime;
        }
        d.size = s.size;
        d.type = s.type;
        if ( d.type === 'dir' ) {
          OSjs.VFS.mkdir(d, function(err, res) {
            if ( err ) {
              cb(err);
            } else {
              var list = scanStorage(s, false);
              if ( list && list.length ) {
                Utils.asyncs(list, function(entry, idx, next) {
                  var rp = entry.path.substr(src.path.length);
                  var nd = new OSjs.VFS.File(dest.path + rp);
                  _op(entry, nd, next);
                }, function() {
                  cb(false, true);
                });
              } else {
                cb(false, true);
              }
            }
          });
        } else {
          _write(s, d, cb);
        }
      }
      src = getFromCache(src.path) || src;
      var droot = getRealPath(Utils.dirname(dest.path));
      if ( droot !== '/' && !getFromCache(droot) ) {
        callback(API._('ERR_VFS_TARGET_NOT_EXISTS'));
        return;
      }
      if ( src.type === 'dir' && src.path === Utils.dirname(dest.path) ) {
        callback('You cannot copy a directory into itself'); // FIXME
        return;
      }
      _op(src, dest, callback);
    },
    move: function(src, dest, callback) {
      var spath = getRealPath(src.path);
      var dpath = getRealPath(dest.path);
      var sdirname = Utils.dirname(spath);
      var ddirname = Utils.dirname(dpath);
      if ( _fileCache[dpath] ) {
        callback(API._('ERR_VFS_FILE_EXISTS'));
        return;
      }
      if ( sdirname === ddirname ) {
        if ( _fileCache[spath] ) {
          var tmp = _fileCache[spath];
          delete _fileCache[spath];
          _fileCache[dpath] = tmp;
        }
        if ( _cache[sdirname] ) {
          var found = -1;
          _cache[sdirname].forEach(function(i, idx) {
            if ( i && found === -1 ) {
              if ( i.filename === src.filename && i.type === src.type ) {
                found = idx;
              }
            }
          });
          if ( found >= 0 ) {
            _cache[sdirname][found].filename = dest.filename;
          }
        }
        callback(false, commitStorage());
      } else {
        OSjs.VSF.copy(src, dest, function(err) {
          if ( err ) {
            callback(err);
          } else {
            OSjs.VFS.unlink(src, callback);
          }
        });
      }
    },
    exists: function(item, callback) {
      var data = getFromCache(getRealPath(item.path));
      callback(false, !!data);
    },
    fileinfo: function(item, callback) {
      var data = getFromCache(item.path);
      callback(data ? false : API._('ERR_VFSMODULE_NOSUCH'), data);
    },
    mkdir: function(dir, callback) {
      var dpath = getRealPath(dir.path);
      if ( dpath !== '/' && getFromCache(dpath) ) {
        callback(API._('ERR_VFS_FILE_EXISTS'));
        return;
      }
      dir.mime = null;
      dir.size = 0;
      dir.type = 'dir';
      try {
        if ( addToCache(dir) && commitStorage() ) {
          callback(false, true);
        } else {
          callback(API._('ERR_VFS_FATAL'));
        }
      } catch ( e ) {
        callback(e);
      }
    },
    upload: function(file, dest, callback) {
      var check = new OSjs.VFS.File(Utils.pathJoin((new OSjs.VFS.File(dest)).path, file.name), file.type);
      check.size = file.size;
      check.type = 'file';
      OSjs.VFS.exists(check, function(err, exists) {
        if ( err || exists ) {
          callback(err || API._('ERR_VFS_FILE_EXISTS'));
        } else {
          var reader = new FileReader();
          reader.onerror = function(e) {
            callback(e);
          };
          reader.onloadend = function() {
            OSjs.VFS.write(check, reader.result, callback, {isds: true});
          };
          reader.readAsDataURL(file);
        }
      });
    },
    url: function(item, callback) {
      OSjs.VFS.exists(item, function(err, exists) {
        if ( err || !exists ) {
          callback(err || API._('ERR_VFS_FILE_EXISTS'));
        } else {
          OSjs.VFS.read(item, callback, {url: true});
        }
      });
    },
    find: function(file, callback) {
      callback(API._('ERR_VFS_UNAVAILABLE'));
    },
    trash: function(file, callback) {
      callback(API._('ERR_VFS_UNAVAILABLE'));
    },
    untrash: function(file, callback) {
      callback(API._('ERR_VFS_UNAVAILABLE'));
    },
    emptyTrash: function(callback) {
      callback(API._('ERR_VFS_UNAVAILABLE'));
    },
    freeSpace: function(root, callback) {
      var total = 5 * 1024 * 1024;
      var used = JSON.stringify(_cache).length + JSON.stringify(_fileCache).length;
      callback(false, total - used);
    }
  };
  function makeRequest(name, args, callback, options) {
    initStorage();
    var ref = LocalStorageStorage[name];
    var fargs = (args || []).slice(0);
    fargs.push(callback || function() {});
    fargs.push(options || {});
    return ref.apply(ref, fargs);
  }
  OSjs.Core.getMountManager()._add({
    readOnly: false,
    name: 'LocalStorage',
    transport: 'LocalStorage',
    description: API.getConfig('VFS.LocalStorage.Options.description', 'LocalStorage'),
    visible: true,
    searchable: false,
    unmount: function(cb) {
      cb = cb || function() {};
      _isMounted = false;
      API.message('vfs:unmount', 'LocalStorage', {source: null});
      cb(false, true);
    },
    mounted: function() {
      return _isMounted;
    },
    enabled: function() {
      try {
        if ( API.getConfig('VFS.LocalStorage.Enabled') ) {
          return true;
        }
      } catch ( e ) {
        console.warn('OSjs.VFS.Modules.LocalStorage::enabled()', e, e.stack);
      }
      return false;
    },
    root: 'localstorage:///',
    icon: API.getConfig('VFS.LocalStorage.Options.icon', 'apps/web-browser.png'),
    match: /^localstorage\:\/\//,
    request: makeRequest
  });
})(OSjs.Utils, OSjs.API);

(function(Utils, VFS, API) {
  'use strict';
  function filter(from, index, shrt, toindex) {
    var list = [];
    for ( var i = (shrt ? 0 : toindex); i < from.length; i++ ) {
      list.push(from[i]);
    }
    return list;
  }
  function format(fmt, date) {
    var utc;
    if ( typeof fmt === 'undefined' || !fmt ) {
      fmt = ExtendedDate.config.defaultFormat;
    } else {
      if ( typeof fmt !== 'string' ) {
        utc = fmt.utc;
        fmt = fmt.format;
      } else {
        utc = ExtendedDate.config.utc;
      }
    }
    return formatDate(date, fmt, utc);
  }
  function _now(now) {
    return now ? (now instanceof ExtendedDate ? now.date : now) : new Date();
  }
  function _y(y, now) {
    return (typeof y === 'undefined' || y === null || y < 0 ) ? now.getFullYear() : y;
  }
  function _m(m, now) {
    return (typeof m === 'undefined' || m === null || m < 0 ) ? now.getMonth() : m;
  }
  function ExtendedDate(date) {
    if ( date ) {
      if ( date instanceof Date ) {
        this.date = date;
      } else if ( date instanceof ExtendedDate ) {
        this.date = date.date;
      } else if ( typeof date === 'string' ) {
        this.date = new Date(date);
      }
    }
    if ( !this.date ) {
      this.date = new Date();
    }
  }
  ExtendedDate.config = {
    defaultFormat: 'isoDateTime'
  };
  ExtendedDate.dayNames = [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];
  ExtendedDate.monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
  ];
  var methods = [
    'UTC',
    'toString',
    'now',
    'parse',
    'getDate',
    'getDay',
    'getFullYear',
    'getHours',
    'getMilliseconds',
    'getMinutes',
    'getMonth',
    'getSeconds',
    'getTime',
    'getTimezoneOffset',
    'getUTCDate',
    'getUTCDay',
    'getUTCFullYear',
    'getUTCHours',
    'getUTCMilliseconds',
    'getUTCMinutes',
    'getUTCMonth',
    'getUTCSeconds',
    'getYear',
    'setDate',
    'setFullYear',
    'setHours',
    'setMilliseconds',
    'setMinutes',
    'setMonth',
    'setSeconds',
    'setTime',
    'setUTCDate',
    'setUTCFullYear',
    'setUTCHours',
    'setUTCMilliseconds',
    'setUTCMinutes',
    'setUTCMonth',
    'setUTCSeconds',
    'setYear',
    'toDateString',
    'toGMTString',
    'toISOString',
    'toJSON',
    'toLocaleDateString',
    'toLocaleFormat',
    'toLocaleString',
    'toLocaleTimeString',
    'toSource',
    'toString',
    'toTimeString',
    'toUTCString',
    'valueOf'
  ];
  methods.forEach(function(m) {
    ExtendedDate.prototype[m] = function() {
      return this.date[m].apply(this.date, arguments);
    };
  });
  ExtendedDate.prototype.get = function() {
    return this.date;
  };
  ExtendedDate.prototype.format = function(fmt) {
    return ExtendedDate.format(this, fmt);
  };
  ExtendedDate.prototype.getFirstDayInMonth = function(fmt) {
    return ExtendedDate.getFirstDayInMonth(fmt, null, null, this);
  };
  ExtendedDate.prototype.getLastDayInMonth = function(fmt) {
    return ExtendedDate.getLastDayInMonth(fmt, null, null, this);
  };
  ExtendedDate.prototype.getDaysInMonth = function() {
    return ExtendedDate.getDaysInMonth(null, null, this);
  };
  ExtendedDate.prototype.getWeekNumber = function() {
    return ExtendedDate.getWeekNumber(this);
  };
  ExtendedDate.prototype.isWithinMonth = function(from, to) {
    return ExtendedDate.isWithinMonth(this, from, to);
  };
  ExtendedDate.prototype.getDayOfTheYear = function() {
    return ExtendedDate.getDayOfTheYear();
  };
  ExtendedDate.format = function(date, fmt) {
    return format(fmt, date);
  };
  ExtendedDate.getPreviousMonth = function(now) {
    now = now ? (now instanceof ExtendedDate ? now.date : now) : new Date();
    var current;
    if (now.getMonth() === 0) {
      current = new Date(now.getFullYear() - 1, 11, now.getDate());
    } else {
      current = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }
    return new ExtendedDate(current);
  };
  ExtendedDate.getNextMonth = function(now) {
    now = now ? (now instanceof ExtendedDate ? now.date : now) : new Date();
    var current;
    if (now.getMonth() === 11) {
      current = new Date(now.getFullYear() + 1, 0, now.getDate());
    } else {
      current = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }
    return new ExtendedDate(current);
  };
  ExtendedDate.getFirstDayInMonth = function(fmt, y, m, now) {
    now = _now(now);
    y = _y(y, now);
    m = _m(m, now);
    var date = new Date();
    date.setFullYear(y, m, 1);
    if ( fmt === true ) {
      return date.getDate();
    }
    return fmt ? format(fmt, date) : new ExtendedDate(date);
  };
  ExtendedDate.getLastDayInMonth = function(fmt, y, m, now) {
    now = _now(now);
    y = _y(y, now);
    m = _m(m, now);
    var date = new Date();
    date.setFullYear(y, m, 0);
    if ( fmt === true ) {
      return date.getDate();
    }
    return fmt ? format(fmt, date) : new ExtendedDate(date);
  };
  ExtendedDate.getDaysInMonth = function(y, m, now) {
    now = _now(now);
    y = _y(y, now);
    m = _m(m, now);
    var date = new Date();
    date.setFullYear(y, m, 0);
    return parseInt(date.getDate(), 10);
  };
  ExtendedDate.getWeekNumber = function(now) {
    now = now ? (now instanceof ExtendedDate ? now.date : now) : new Date();
    var d = new Date(+now);
    d.setHours(0,0,0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    return Math.ceil((((d - new Date(d.getFullYear(),0,1)) / 8.64e7) + 1) / 7);
  };
  ExtendedDate.getDayName = function(index, shrt) {
    if ( index < 0 || index === null || typeof index === 'undefined' ) {
      return filter(ExtendedDate.dayNames, index, shrt, 7);
    }
    shrt = shrt ? 0 : 1;
    var idx = index + (shrt + 7);
    return ExtendedDate.dayNames[idx];
  };
  ExtendedDate.getMonthName = function(index, shrt) {
    if ( index < 0 || index === null || typeof index === 'undefined' ) {
      return filter(ExtendedDate.monthNames, index, shrt, 12);
    }
    shrt = shrt ? 0 : 1;
    var idx = index + (shrt + 12);
    return ExtendedDate.monthNames[idx];
  };
  ExtendedDate.isWithinMonth = function(now, from, to) {
    if ( now.getFullYear() >= from.getFullYear() && now.getMonth() >= from.getMonth() ) {
      if ( now.getFullYear() <= to.getFullYear() && now.getMonth() <= to.getMonth() ) {
        return true;
      }
    }
    return false;
  };
  ExtendedDate.getDayOfTheYear = function() {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var diff = now - start;
    var oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };
  function formatDate(date, format, utc) {
    utc = utc === true;
    function pad(val, len) {
      val = String(val);
      len = len || 2;
      while (val.length < len) {
        val = '0' + val;
      }
      return val;
    }
    var defaultFormats = {
      'default':      'Y-m-d H:i:s',
      shortDate:      'm/d/y',
      mediumDate:     'M d, Y',
      longDate:       'F d, Y',
      fullDate:       'l, F d, Y',
      shortTime:      'h:i A',
      mediumTime:     'h:i:s A',
      longTime:       'h:i:s A T',
      isoDate:        'Y-m-d',
      isoTime:        'H:i:s',
      isoDateTime:    'Y-m-d H:i:s'
    };
    format = defaultFormats[format] || format;
    if ( !(date instanceof ExtendedDate) ) {
      date = new ExtendedDate(date);
    }
    var map = {
      d: function(s) {
        return pad(map.j(s));
      },
      D: function(s) {
        return ExtendedDate.dayNames[utc ? date.getUTCDay() : date.getDay()];
      },
      j: function(s) {
        return (utc ? date.getUTCDate() : date.getDate());
      },
      l: function(s) {
        return ExtendedDate.dayNames[(utc ? date.getUTCDay() : date.getDay()) + 7];
      },
      w: function(s) {
        return (utc ? date.getUTCDay() : date.getDay());
      },
      z: function(s) {
        return date.getDayOfTheYear();
      },
      S: function(s) {
        var d = utc ? date.getUTCDate() : date.getDate();
        return ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10];
      },
      W: function(s) {
        return date.getWeekNumber();
      },
      F: function(s) {
        return ExtendedDate.monthNames[(utc ? date.getUTCMonth() : date.getMonth()) + 12];
      },
      m: function(s) {
        return pad(map.n(s));
      },
      M: function(s) {
        return ExtendedDate.monthNames[(utc ? date.getUTCMonth() : date.getMonth())];
      },
      n: function(s) {
        return (utc ? date.getUTCMonth() : date.getMonth()) + 1;
      },
      t: function(s) {
        return date.getDaysInMonth();
      },
      Y: function(s) {
        return (utc ? date.getUTCFullYear() : date.getFullYear());
      },
      y: function(s) {
        return String(map.Y(s)).slice(2);
      },
      a: function(s) {
        return map.G(s) < 12 ? 'am' : 'pm';
      },
      A: function(s) {
        return map.a(s).toUpperCase();
      },
      g: function(s) {
        return map.G(s) % 12 || 12;
      },
      G: function(s) {
        return (utc ? date.getUTCHours() : date.getHours());
      },
      h: function(s) {
        return pad(map.g(s));
      },
      H: function(s) {
        return pad(map.G(s));
      },
      i: function(s) {
        return pad(utc ? date.getUTCMinutes() : date.getMinutes());
      },
      s: function(s) {
        return pad(utc ? date.getUTCSeconds() : date.getSeconds());
      },
      O: function(s) {
        var tzo = -date.getTimezoneOffset();
        var dif = tzo >= 0 ? '+' : '-';
        function ppad(num) {
          var norm = Math.abs(Math.floor(num));
          return (norm < 10 ? '0' : '') + norm;
        }
        var str = dif + ppad(tzo / 60) + ':' + ppad(tzo % 60);
        return str;
      },
      T: function(s) {
        if ( utc ) {
          return 'UTC';
        }
        var timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
        var zones = String(date.date).match(timezone) || [''];
        return zones.pop().replace(/(\+|\-)[0-9]+$/, '');
      },
      U: function(s) {
        return date.getTime();
      }
    };
    var result = [];
    format.split('').forEach(function(s) {
      result.push(map[s] ? map[s]() : s);
    });
    return result.join('');
  }
  OSjs.Helpers.Date = ExtendedDate;
})(OSjs.Utils, OSjs.VFS, OSjs.API);

(function(Utils, API, GUI, Window) {
  'use strict';
  function EventHandler(name, names) {
    this.name   = name;
    this.events = {};
    (names || []).forEach(function(n) {
      this.events[n] = [];
    }, this);
  }
  EventHandler.prototype.destroy = function() {
    this.events = {};
  };
  EventHandler.prototype.on = function(name, cb, thisArg) {
    thisArg = thisArg || this;
    if ( !(cb instanceof Function) ) {
      throw new TypeError('EventHandler::on() expects cb to be a Function');
    }
    var self = this;
    var added = [];
    function _register(n) {
      if ( !(self.events[n] instanceof Array) ) {
        self.events[n] = [];
      }
      added.push(self.events[n].push(function(args) {
        return cb.apply(thisArg, args);
      }));
    }
    if ( name instanceof RegExp ) {
      Object.keys(this.events).forEach(function(n) {
        if ( name.test(n) ) {
          _register(n);
        }
      });
    } else {
      name.replace(/\s/g, '').split(',').forEach(function(n) {
        _register(n);
      });
    }
    return added.length === 1 ? added[0] : added;
  };
  EventHandler.prototype.off = function(name, index) {
    if ( !(this.events[name] instanceof Array) ) {
      throw new TypeError('Invalid event name');
    }
    if ( arguments.length > 1 && typeof index === 'number' ) {
      this.events[name].splice(index, 1);
    } else {
      this.events[name] = [];
    }
  };
  EventHandler.prototype.emit = function(name, args) {
    args = args || [];
    if ( !(this.events[name] instanceof Array) ) {
      return true;
    }
    return (this.events[name]).every(function(fn) {
      var result;
      try {
        result = fn(args);
      } catch ( e ) {
        console.warn('EventHandler::emit() exception', name, e);
        console.warn(e.stack);
      }
      return typeof result === 'undefined' || result === true;
    });
  };
  OSjs.Helpers.EventHandler = EventHandler;
})(OSjs.Utils, OSjs.API, OSjs.GUI, OSjs.Core.Window);

(function(Application, Window, Utils, VFS, GUI) {
  'use strict';
  var IFRAME_COUNT = 0;
  var IFrameApplicationWindow = function(name, opts, app) {
    opts = Utils.argumentDefaults(opts, {
      src: 'about:blank',
      focus: function() {},
      blur: function() {},
      icon: null,
      title: 'IframeApplicationWindow',
      width: 320,
      height: 240,
      allow_resize: false,
      allow_restore: false,
      allow_maximize: false
    });
    Window.apply(this, ['IFrameApplicationWindow', opts, app]);
    this._iwin = null;
    this._frame = null;
  };
  IFrameApplicationWindow.prototype = Object.create(Window.prototype);
  IFrameApplicationWindow.prototype.destroy = function() {
    this.postMessage('Window::destroy');
    return Window.prototype.destroy.apply(this, arguments);
  };
  IFrameApplicationWindow.prototype.init = function(wmRef, app) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);
    root.style.overflow = 'visible';
    var id = 'IframeApplicationWindow' + IFRAME_COUNT.toString();
    var iframe = document.createElement('iframe');
    iframe.setAttribute('border', 0);
    iframe.id = id;
    iframe.className = 'IframeApplicationFrame';
    iframe.addEventListener('load', function() {
      self._iwin = iframe.contentWindow;
      self.postMessage('Window::init');
    });
    this.setLocation(this._opts.src, iframe);
    root.appendChild(iframe);
    this._frame = iframe;
    try {
      this._iwin = iframe.contentWindow;
    } catch ( e ) {}
    if ( this._iwin ) {
      this._iwin.focus();
    }
    this._frame.focus();
    this._opts.focus(this._frame, this._iwin);
    IFRAME_COUNT++;
    return root;
  };
  IFrameApplicationWindow.prototype._blur = function() {
    if ( Window.prototype._blur.apply(this, arguments) ) {
      if ( this._iwin ) {
        this._iwin.blur();
      }
      if ( this._frame ) {
        this._frame.blur();
      }
      this._opts.blur(this._frame, this._iwin);
      return true;
    }
    return false;
  };
  IFrameApplicationWindow.prototype._focus = function() {
    if ( Window.prototype._focus.apply(this, arguments) ) {
      if ( this._iwin ) {
        this._iwin.focus();
      }
      if ( this._frame ) {
        this._frame.focus();
      }
      this._opts.focus(this._frame, this._iwin);
      return true;
    }
    return false;
  };
  IFrameApplicationWindow.prototype.postMessage = function(message) {
    if ( this._iwin && this._app ) {
      this._iwin.postMessage({
        message: message,
        pid: this._app.__pid,
        wid: this._wid
      }, window.location.href);
    }
  };
  IFrameApplicationWindow.prototype.onPostMessage = function(message, ev) {
  };
  IFrameApplicationWindow.prototype.setLocation = function(src, iframe) {
    iframe = iframe || this._frame;
    var oldbefore = window.onbeforeunload;
    window.onbeforeunload = null;
    iframe.src = src;
    window.onbeforeunload = oldbefore;
  };
  var IFrameApplication = function(name, args, metadata, opts) {
    Application.call(this, name, args, metadata);
    this.options = Utils.argumentDefaults(opts, {
      icon: '',
      title: 'IframeApplicationWindow'
    });
    this.options.src = OSjs.API.getApplicationResource(this, this.options.src);
  };
  IFrameApplication.prototype = Object.create(Application.prototype);
  IFrameApplication.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);
    var name = this.__pname + 'Window';
    this._addWindow(new IFrameApplicationWindow(name, this.options, this), null, true);
  };
  IFrameApplication.prototype.onPostMessage = function(message, ev) {
    var self = this;
    function _response(err, res) {
      self.postMessage({
        id: message.id,
        method: message.method,
        error: err,
        result: Utils.cloneObject(res)
      });
    }
    if ( typeof message.id === 'number' && message.method ) {
      if ( this[message.method] ) {
        this[message.method](message.args || {}, _response);
      } else {
        _response('No such method');
      }
    }
  };
  IFrameApplication.prototype.postMessage = function(message) {
    var win = this._getMainWindow();
    if ( win ) {
      win.postMessage(message);
    }
  };
  OSjs.Helpers.IFrameApplication       = IFrameApplication;
  OSjs.Helpers.IFrameApplicationWindow = IFrameApplicationWindow;
})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(Application, Window, Utils, VFS, API, GUI) {
  'use strict';
  function DefaultApplication(name, args, metadata, opts) {
    this.defaultOptions = Utils.argumentDefaults(opts, {
      readData: true,
      rawData: false,
      extension: '',
      mime: 'application/octet-stream',
      filetypes: [],
      filename: 'New file'
    });
    Application.apply(this, [name, args, metadata]);
  }
  DefaultApplication.prototype = Object.create(Application.prototype);
  DefaultApplication.constructor = Application;
  DefaultApplication.prototype.destroy = function() {
    Application.prototype.destroy.apply(this, arguments);
  };
  DefaultApplication.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);
    var self = this;
    var current = this._getArgument('file');
    var win = this._getWindow(this.__mainwindow);
    if ( msg === 'vfs' && args.source !== null && args.source !== this.__pid && args.file ) {
      if ( win && current && current.path === args.file.path ) {
        win._toggleDisabled(true);
        API.createDialog('Confirm', {
          buttons: ['yes', 'no'],
          message: API._('MSG_FILE_CHANGED')
        }, function(ev, button) {
          win._toggleDisabled(false);
          if ( button === 'ok' || button === 'yes' ) {
            self.openFile(new VFS.File(args.file), win);
          }
        }, win);
      }
    }
  };
  DefaultApplication.prototype.openFile = function(file, win) {
    var self = this;
    if ( !file ) {
      return;
    }
    function onError(error) {
      if ( error ) {
        API.error(self.__label,
                  API._('ERR_FILE_APP_OPEN'),
                  API._('ERR_FILE_APP_OPEN_ALT_FMT',
                  file.path));
        return true;
      }
      return false;
    }
    function onDone(result) {
      self._setArgument('file', file);
      win.showFile(file, result);
    }
    var check = this.__metadata.mime || [];
    if ( !Utils.checkAcceptMime(file.mime, check) ) {
      API.error(this.__label,
                API._('ERR_FILE_APP_OPEN'),
                API._('ERR_FILE_APP_OPEN_FMT',
                file.path, file.mime)
      );
      return false;
    }
    win._toggleLoading(true);
    function CallbackVFS(error, result) {
      win._toggleLoading(false);
      if ( onError(error) ) {
        return;
      }
      onDone(result);
    }
    if ( this.defaultOptions.readData ) {
      VFS.read(file, CallbackVFS, {type: this.defaultOptions.rawData ? 'binary' : 'text'});
    } else {
      VFS.url(file, CallbackVFS);
    }
    return true;
  };
  DefaultApplication.prototype.saveFile = function(file, value, win) {
    var self = this;
    if ( !file ) {
      return;
    }
    win._toggleLoading(true);
    VFS.write(file, value || '', function(error, result) {
      win._toggleLoading(false);
      if ( error ) {
        API.error(self.__label,
                  API._('ERR_FILE_APP_SAVE'),
                  API._('ERR_FILE_APP_SAVE_ALT_FMT',
                  file.path));
        return;
      }
      self._setArgument('file', file);
      win.updateFile(file);
    }, {}, this);
  };
  DefaultApplication.prototype.saveDialog = function(file, win, saveAs) {
    var self = this;
    var value = win.getFileData();
    if ( !saveAs ) {
      this.saveFile(file, value, win);
      return;
    }
    win._toggleDisabled(true);
    API.createDialog('File', {
      file: file,
      filename: file ? file.filename : this.defaultOptions.filename,
      filetypes: this.defaultOptions.filetypes,
      filter: this.__metadata.mime,
      extension: this.defaultOptions.extension,
      mime: this.defaultOptions.mime,
      type: 'save'
    }, function(ev, button, result) {
      win._toggleDisabled(false);
      if ( button === 'ok' ) {
        self.saveFile(result, value, win);
      }
    }, win);
  };
  DefaultApplication.prototype.openDialog = function(file, win) {
    var self = this;
    function openDialog() {
      win._toggleDisabled(true);
      API.createDialog('File', {
        file: file,
        filter: self.__metadata.mime
      }, function(ev, button, result) {
        win._toggleDisabled(false);
        if ( button === 'ok' && result ) {
          self.openFile(new VFS.File(result), win);
        }
      }, win);
    }
    win.checkHasChanged(function(discard) {
      if ( discard ) {
        openDialog();
      }
    });
  };
  DefaultApplication.prototype.newDialog = function(path, win) {
    var self = this;
    win.checkHasChanged(function(discard) {
      if ( discard ) {
        self._setArgument('file', null);
        win.showFile(null, null);
      }
    });
  };
  OSjs.Helpers.DefaultApplication       = DefaultApplication;
})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.VFS, OSjs.API, OSjs.GUI);

(function(Application, Window, Utils, VFS, API, GUI) {
  'use strict';
  function DefaultApplicationWindow(name, app, args, scheme, file) {
    Window.apply(this, arguments);
    this.hasClosingDialog = false;
    this.currentFile = file ? new VFS.File(file) : null;
    this.hasChanged = false;
  }
  DefaultApplicationWindow.prototype = Object.create(Window.prototype);
  DefaultApplicationWindow.constructor = Window;
  DefaultApplicationWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
    this.currentFile = null;
  };
  DefaultApplicationWindow.prototype.init = function(wm, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    return root;
  };
  DefaultApplicationWindow.prototype._inited = function() {
    var result = Window.prototype._inited.apply(this, arguments);
    var self = this;
    var app = this._app;
    var menuMap = {
      MenuNew:    function() {
        app.newDialog(self.currentFile, self);
      },
      MenuSave:   function() {
        app.saveDialog(self.currentFile, self);
      },
      MenuSaveAs: function() {
        app.saveDialog(self.currentFile, self, true);
      },
      MenuOpen:   function() {
        app.openDialog(self.currentFile, self);
      },
      MenuClose:  function() {
        self._close();
      }
    };
    this._scheme.find(this, 'SubmenuFile').on('select', function(ev) {
      if ( menuMap[ev.detail.id] ) {
        menuMap[ev.detail.id]();
      }
    });
    this._scheme.find(this, 'MenuSave').set('disabled', true);
    if ( this.currentFile ) {
      if ( !this._app.openFile(this.currentFile, this) ) {
        this.currentFile = null;
      }
    }
    return result;
  };
  DefaultApplicationWindow.prototype._onDndEvent = function(ev, type, item, args) {
    if ( !Window.prototype._onDndEvent.apply(this, arguments) ) {
      return;
    }
    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._app.openFile(new VFS.File(data), this);
      }
    }
  };
  DefaultApplicationWindow.prototype._close = function() {
    var self = this;
    if ( this.hasClosingDialog ) {
      return;
    }
    if ( this.hasChanged ) {
      this.hasClosingDialog = true;
      this.checkHasChanged(function(discard) {
        self.hasClosingDialog = false;
        if ( discard ) {
          self.hasChanged = false; // IMPORTANT
          self._close();
        }
      });
      return;
    }
    Window.prototype._close.apply(this, arguments);
  };
  DefaultApplicationWindow.prototype.checkHasChanged = function(cb) {
    var self = this;
    if ( this.hasChanged ) {
      this._toggleDisabled(true);
      API.createDialog('Confirm', {
        buttons: ['yes', 'no'],
        message: API._('MSG_GENERIC_APP_DISCARD')
      }, function(ev, button) {
        self._toggleDisabled(false);
        cb(button === 'ok' || button === 'yes');
      });
      return;
    }
    cb(true);
  };
  DefaultApplicationWindow.prototype.showFile = function(file, content) {
    this.updateFile(file);
  };
  DefaultApplicationWindow.prototype.updateFile = function(file) {
    this.currentFile = file || null;
    this.hasChanged = false;
    if ( this._scheme && (this._scheme instanceof GUI.Scheme) ) {
      this._scheme.find(this, 'MenuSave').set('disabled', !file);
    }
    if ( file ) {
      this._setTitle(file.filename, true);
    } else {
      this._setTitle();
    }
  };
  DefaultApplicationWindow.prototype.getFileData = function() {
    return null;
  };
  DefaultApplicationWindow.prototype._onKeyEvent = function(ev, type, shortcut) {
    if ( shortcut === 'SAVE' ) {
      this._app.saveDialog(this.currentFile, this, !this.currentFile);
      return false;
    } else if ( shortcut === 'SAVEAS' ) {
      this._app.saveDialog(this.currentFile, this, true);
      return false;
    } else if ( shortcut === 'OPEN' ) {
      this._app.openDialog(this.currentFile, this);
      return false;
    }
    return Window.prototype._onKeyEvent.apply(this, arguments);
  };
  OSjs.Helpers.DefaultApplicationWindow = DefaultApplicationWindow;
})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.VFS, OSjs.API, OSjs.GUI);

(function(Utils, API) {
  'use strict';
  var gapi = window.gapi = window.gapi || {};
  var SingletonInstance = null;
  function GoogleAPI(clientId) {
    this.clientId       = clientId;
    this.accessToken    = null;
    this.userId         = null;
    this.preloaded      = false;
    this.authenticated  = false;
    this.loaded         = [];
    this.preloads       = [
      {
        type: 'javascript',
        src: 'https://apis.google.com/js/api.js'
      }
    ];
  }
  GoogleAPI.prototype.destroy = function() {
  };
  GoogleAPI.prototype.init = function(callback) {
    var self = this;
    callback = callback || function() {};
    if ( this.preloaded ) {
      callback(false, true);
    } else {
      Utils.preload(this.preloads, function(total, failed) {
        if ( !failed.length ) {
          self.preloaded = true;
        }
        callback(failed.join('\n'));
      });
    }
  };
  GoogleAPI.prototype.load = function(load, scope, client, callback) {
    var self = this;
    function auth(cb) {
      self.authenticate(scope, function(error, result) {
        if ( error ) {
          return cb(error);
        }
        if ( !self.authenticated ) {
          return cb(API._('GAPI_AUTH_FAILURE'));
        }
        cb(false, result);
      });
    }
    function loadAll(finished) {
      var lload   = [];
      load.forEach(function(i) {
        if ( self.loaded.indexOf(i) === -1 ) {
          lload.push(i);
        }
      });
      var current = 0;
      var total   = lload.length;
      function _load(iter, cb) {
        var args = [];
        var name = null;
        if ( iter instanceof Array ) {
          if ( iter.length > 0 && iter.length < 3 ) {
            args = args.concat(iter);
            name = iter[0];
          }
        } else {
          args.push(iter);
          name = iter;
        }
        args.push(function() {
          self.loaded.push(name);
          cb.apply(this, arguments);
        });
        if ( client ) {
          gapi.client.load.apply(gapi, args);
        } else {
          gapi.load.apply(gapi, args);
        }
      }
      function _next() {
        if ( current >= total ) {
          finished();
        } else {
          _load(lload[current], function() {
            _next();
          });
          current++;
        }
      }
      _next();
    }
    this.init(function(error) {
      if ( error ) {
        callback(error);
        return;
      }
      if ( !window.gapi || !gapi.load ) {
        callback(API._('GAPI_LOAD_FAILURE'));
        return;
      }
      auth(function(error) {
        if ( error ) {
          callback(error);
          return;
        }
        loadAll(function(error, result) {
          callback(error, result, SingletonInstance);
        });
      });
    });
  };
  GoogleAPI.prototype.signOut = function(cb) {
    cb = cb || function() {};
    if ( this.authenticated ) {
      try {
        gapi.auth.signOut();
      } catch ( e ) {
        console.warn('GoogleAPI::signOut()', 'failed', e);
        console.warn(e.stack);
      }
      this.authenticated = false;
      var ring = API.getServiceNotificationIcon();
      if ( ring ) {
        ring.remove('Google API');
      }
    }
    OSjs.Core.getMountManager().remove('GoogleDrive');
    cb(false, true);
  };
  GoogleAPI.prototype.revoke = function(callback) {
    if ( !this.accessToken ) {
      return callback(false);
    }
    var url = 'https://accounts.google.com/o/oauth2/revoke?token=' + this.accessToken;
    Utils.ajax({
      url: url,
      jsonp: true,
      onsuccess: function() {
        callback(true);
      },
      onerror: function() {
        callback(false);
      }
    });
  };
  GoogleAPI.prototype.authenticate = function(scope, callback) {
    callback = callback || function() {};
    var self = this;
    function getUserId(cb) {
      cb = cb || function() {};
      gapi.client.load('oauth2', 'v2', function() {
        gapi.client.oauth2.userinfo.get().execute(function(resp) {
          cb(resp.id);
        });
      });
    }
    function login(immediate, cb) {
      cb = cb || function() {};
      gapi.auth.authorize({
        client_id: self.clientId,
        scope: scope,
        user_id: self.userId,
        immediate: immediate
      }, cb);
    }
    function createRingNotification() {
      var ring = API.getServiceNotificationIcon();
      if ( ring ) {
        ring.remove('Google API');
        ring.add('Google API', [{
          title: API._('GAPI_SIGN_OUT'),
          onClick: function() {
            self.signOut();
          }
        }, {
          title: API._('GAPI_REVOKE'),
          onClick: function() {
            self.revoke(function() {
              self.signOut();
            });
          }
        }]);
      }
    }
    var handleAuthResult = function(authResult, immediate) {
      if ( authResult.error ) {
        if ( authResult.error_subtype === 'origin_mismatch' || (authResult.error_subtype === 'access_denied' && !immediate) ) {
          var msg = API._('GAPI_AUTH_FAILURE_FMT', authResult.error, authResult.error_subtype);
          callback(msg);
          return;
        }
      }
      if ( authResult && !authResult.error ) {
        getUserId(function(id) {
          self.userId = id;
          if ( id ) {
            createRingNotification();
            self.authenticated = true;
            self.accessToken = authResult.access_token || null;
            callback(false, true);
          } else {
            callback(false, false);
          }
        });
      } else {
        login(false, function(res) {
          handleAuthResult(res, false);
        });
      }
    };
    gapi.load('auth:client', function(result) {
      if ( result && result.error ) {
        var msg = API._('GAPI_AUTH_FAILURE_FMT', result.error, result.error_subtype);
        callback(msg);
        return;
      }
      login(true, function(res) {
        handleAuthResult(res, true);
      });
    });
  };
  OSjs.Helpers.GoogleAPI = OSjs.Helpers.GoogleAPI || {};
  OSjs.Helpers.GoogleAPI.getInstance = function() {
    return SingletonInstance;
  };
  OSjs.Helpers.GoogleAPI.createInstance = function(args, callback) {
    var load = args.load || [];
    var scope = args.scope || [];
    var client = args.client === true;
    function _run() {
      SingletonInstance.load(load, scope, client, callback);
    }
    if ( SingletonInstance ) {
      return _run();
    }
    var clientId = null;
    try {
      clientId = API.getConfig('GoogleAPI.ClientId');
    } catch ( e ) {
      console.warn('getGoogleAPI()', e, e.stack);
    }
    if ( !clientId ) {
      callback(API._('GAPI_DISABLED'));
      return;
    }
    SingletonInstance = new GoogleAPI(clientId);
    _run();
  };
})(OSjs.Utils, OSjs.API);

(function(Utils, API) {
  'use strict';
  var redirectURI = window.location.href.replace(/\/$/, '') + '/vendor/wlOauthReceiver.html';
  var SingletonInstance = null;
  function WindowsLiveAPI(clientId) {
    this.hasSession = false;
    this.clientId = clientId;
    this.loaded = false;
    this.inited = false;
    this.accessToken = null;
    this.lastScope = null;
    this.preloads = [{
      type: 'javascript',
      src: '//js.live.net/v5.0/wl.js'
    }];
  }
  WindowsLiveAPI.prototype.destroy = function() {
  };
  WindowsLiveAPI.prototype.init = function(callback) {
    callback = callback || function() {};
    var self = this;
    if ( this.loaded ) {
      callback(false, true);
    } else {
      Utils.preload(this.preloads, function(total, failed) {
        if ( !failed.length ) {
          self.loaded = true;
        }
        callback(failed.join('\n'));
      });
    }
  };
  WindowsLiveAPI.prototype.load = function(scope, callback) {
    var self = this;
    var WL = window.WL || {};
    function _login() {
      var lastScope = (self.lastScope || []).sort();
      var currScope = (scope || []).sort();
      if ( self.hasSession && (lastScope.toString() === currScope.toString()) ) {
        callback(false, true);
        return;
      }
      self.login(scope, function(error, response) {
        if ( error ) {
          callback(error);
          return;
        }
        setTimeout(function() {
          callback(false, true);
        }, 10);
      });
    }
    this.init(function(error) {
      if ( error ) {
        callback(error);
        return;
      }
      if ( !window.WL ) {
        callback(API._('WLAPI_LOAD_FAILURE'));
        return;
      }
      WL = window.WL || {};
      if ( self.inited ) {
        _login();
      } else {
        self.inited = true;
        WL.Event.subscribe('auth.login', function() {
          self.onLogin.apply(self, arguments);
        });
        WL.Event.subscribe('auth.logout', function() {
          self.onLogout.apply(self, arguments);
        });
        WL.Event.subscribe('wl.log', function() {
          self.onLog.apply(self, arguments);
        });
        WL.Event.subscribe('auth.sessionChange', function() {
          self.onSessionChange.apply(self, arguments);
        });
        WL.init({
          client_id: self.clientId,
          display: 'popup',
          redirect_uri: redirectURI
        }).then(function(result) {
          if ( result.session ) {
            self.accessToken = result.session.access_token || null;
          }
          if ( result.status === 'connected' ) {
            callback(false, true);
          } else if ( result.status === 'success' ) {
            _login();
          } else {
            callback(API._('WLAPI_INIT_FAILED_FMT', result.status.toString()));
          }
        }, function(result) {
          console.error('WindowsLiveAPI::load()', 'init() error', result);
          callback(result.error_description);
        });
      }
    });
  };
  WindowsLiveAPI.prototype._removeRing = function() {
    var ring = API.getServiceNotificationIcon();
    if ( ring ) {
      ring.remove('Windows Live API');
    }
  };
  WindowsLiveAPI.prototype.logout = function(callback) {
    callback = callback || function() {};
    var self = this;
    var WL = window.WL || {};
    if ( this.hasSession ) {
      callback(false, false);
    }
    WL.Event.unsubscribe('auth.logout');
    WL.Event.subscribe('auth.logout', function() {
      self._removeRing();
      WL.Event.unsubscribe('auth.logout');
      callback(false, true);
    });
    WL.logout();
    OSjs.Core.getMountManager().remove('OneDrive');
  };
  WindowsLiveAPI.prototype.login = function(scope, callback) {
    var WL = window.WL || {};
    if ( this.hasSession ) {
      callback(false, true);
      return;
    }
    WL.login({
      scope: scope,
      redirect_uri: redirectURI
    }).then(function(result) {
      if ( result.status === 'connected' ) {
        callback(false, true);
      } else {
        callback(API._('WLAPI_LOGIN_FAILED'));
      }
    }, function(result) {
      callback(API._('WLAPI_LOGIN_FAILED_FMT', result.error_description));
    });
  };
  WindowsLiveAPI.prototype.onSessionChange = function() {
    console.warn('WindowsLiveAPI::onSessionChange()', arguments);
    var WL = window.WL || {};
    var session = WL.getSession();
    if ( session ) {
      this.hasSession = true;
    } else {
      this.hasSession = false;
    }
  };
  WindowsLiveAPI.prototype.onLogin = function() {
    console.warn('WindowsLiveAPI::onLogin()', arguments);
    this.hasSession = true;
    var self = this;
    var ring = API.getServiceNotificationIcon();
    if ( ring ) {
      ring.add('Windows Live API', [{
        title: API._('WLAPI_SIGN_OUT'),
        onClick: function() {
          self.logout();
        }
      }]);
    }
  };
  WindowsLiveAPI.prototype.onLogout = function() {
    console.warn('WindowsLiveAPI::onLogout()', arguments);
    this.hasSession = false;
    this._removeRing();
  };
  WindowsLiveAPI.prototype.onLog = function() {
  };
  OSjs.Helpers.WindowsLiveAPI = OSjs.Helpers.WindowsLiveAPI || {};
  OSjs.Helpers.WindowsLiveAPI.getInstance = function() {
    return SingletonInstance;
  };
  OSjs.Helpers.WindowsLiveAPI.createInstance = function(args, callback) {
    args = args || {};
    function _run() {
      var scope = args.scope;
      SingletonInstance.load(scope, function(error) {
        callback(error ? error : false, SingletonInstance);
      });
    }
    if ( SingletonInstance ) {
      _run();
      return;
    }
    var clientId = null;
    try {
      clientId = API.getConfig('WindowsLiveAPI.ClientId');
    } catch ( e ) {
      console.warn('getWindowsLiveAPI()', e, e.stack);
    }
    if ( !clientId ) {
      callback(API._('WLAPI_DISABLED'));
      return;
    }
    SingletonInstance = new WindowsLiveAPI(clientId);
    _run();
  };
})(OSjs.Utils, OSjs.API);

(function(Utils, API, VFS) {
  'use strict';
  function getEntries(file, callback) {
    zip.createReader(new zip.BlobReader(file), function(zipReader) {
      zipReader.getEntries(function(entries) {
        callback(false, entries);
      });
    }, function(message) {
      callback(message);
    });
  }
  function getEntryFile(entry, onend, onprogress) {
    var writer = new zip.BlobWriter();
    entry.getData(writer, function(blob) {
      onend(blob);
      writer = null;
    }, onprogress);
  }
  function openFile(file, done) {
    VFS.download(file, function(error, data) {
      if ( error ) {
        console.warning('An error while opening zip', error);
        done(error);
        return;
      }
      var blob = new Blob([data], {type: file.mime});
      getEntries(blob, function(error, result) {
        done(error, result || []);
      });
    });
  }
  function importFiles(writer, entries, pr, done, ignore) {
    ignore = ignore || [];
    function _next(index) {
      if ( !entries.length || index >= entries.length ) {
        done(false);
        return;
      }
      var current = entries[index];
      if ( ignore.indexOf(current.filename) >= 0 ) {
        console.warn('Ignoring', index, current);
        pr('ignored', index, current);
        _next(index + 1);
        return;
      }
      getEntryFile(current, function(blob) {
        writer.add(current.filename, new zip.BlobReader(blob), function() {
          pr('added', index, current);
          _next(index + 1);
        }, function(current, total) {
          pr('reading', index, total, current);
        }, {
          directory: current.directory,
          lastModDate: current.lastModDate,
          version: current.version
        });
      });
    }
    _next(0);
  }
  function createZip(done) {
    var writer = new zip.BlobWriter();
    zip.createWriter(writer, function(writer) {
      done(false, writer);
    }, function(error) {
      done(error);
    });
  }
  function saveZip(writer, file, ccb) {
    writer.close(function(blob) {
      VFS.upload({
        destination: Utils.dirname(file.path),
        files: [{filename: Utils.filename(file.path), data: blob}]
      }, function(type, ev) {
        var error = (type === 'error') ? ev : false;
        ccb(error, !!error);
      }, {overwrite: true});
    });
  }
  var SingletonInstance = null;
  function ZipArchiver(opts) {
    this.opts = opts;
    this.inited = false;
    this.preloads = [{
      type: 'javascript',
      src: '/vendor/zip.js/WebContent/zip.js'
    }];
  }
  ZipArchiver.prototype.init = function(cb) {
    cb = cb || function() {};
    if ( this.inited ) {
      cb();
      return;
    }
    var self = this;
    Utils.preload(this.preloads, function(total, failed) {
      if ( failed.length ) {
        cb(API._('ZIP_PRELOAD_FAIL'), failed);
        return;
      }
      if ( window.zip ) {
        zip.workerScriptsPath = '/vendor/zip.js/WebContent/';
        self.inited = true;
      }
      cb();
    });
  };
  ZipArchiver.prototype.list = function(file, cb) {
    VFS.download(file, function(error, result) {
      if ( error ) {
        alert(error);
        cb(error, null);
        return;
      }
      var blob = new Blob([result], {type: 'application/zip'});
      getEntries(blob, function(error, entries) {
        cb(error, entries);
      });
    });
  };
  ZipArchiver.prototype.create = function(file, cb, appRef) {
    var writer = new zip.BlobWriter();
    zip.createWriter(writer, function(writer) {
      writer.close(function(blob) {
        VFS.upload({
          destination: Utils.dirname(file.path),
          files: [
            {filename: Utils.filename(file.path), data: blob}
          ]
        }, function(type, ev) {
          if ( type === 'error' ) {
            console.warn('Error creating blank zip', ev);
          }
          writer = null;
          if ( type !== 'error' ) {
            API.message('vfs:upload', file, {source: appRef ? appRef.__pid : null});
          }
          cb(type === 'error' ? ev : false, type !== 'error');
        }, {overwrite: true});
      });
    });
  };
  ZipArchiver.prototype.add = function(file, add, args) {
    var cb = args.oncomplete || function() {};
    var pr = args.onprogress || function() {};
    var currentDir = args.path || '/';
    function finished(err, res) {
      cb(err, res);
    }
    function checkIfExists(entries, done) {
      var found = false;
      var chk = Utils.filename(add.path);
      entries.forEach(function(i) {
        if ( i.filename === chk ) {
          if ( !i.directory || (i.directory && add.type === 'dir') ) {
            found = true;
          }
        }
        return !found;
      });
      done(found ? 'File is already in archive' : false);
    }
    function addFile(writer, done) {
      var filename = add instanceof window.File ? add.name : add.filename;
      var type = add instanceof window.File ? 'file' : (add.type || 'file');
      filename = ((currentDir || '/').replace(/\/$/, '') + '/' + filename).replace(/^\//, '');
      function _addBlob(blob) {
        writer.add(filename, new zip.BlobReader(blob), function() {
          saveZip(writer, file, done);
        }, function(current, total) {
          pr('compressing', current);
        });
      }
      function _addFolder() {
        writer.add(filename, null, function() {
          saveZip(writer, file, done);
        }, null, {directory: true});
      }
      if ( type === 'dir' ) {
        _addFolder();
      } else {
        if ( add instanceof window.File ) {
          _addBlob(add);
        } else {
          VFS.download(add, function(error, data) {
            if ( error ) {
              done(error);
              return;
            }
            var blob = new Blob([data], {type: add.mime});
            _addBlob(blob);
          });
        }
      }
    }
    openFile(file, function(err, entries) {
      if ( err ) {
        finished(err); return;
      }
      checkIfExists(entries, function(err) {
        if ( err ) {
          finished(err); return;
        }
        createZip(function(err, writer) {
          if ( err ) {
            finished(err); return;
          }
          importFiles(writer, entries, pr, function(err) {
            if ( err ) {
              finished(err); return;
            }
            addFile(writer, function(err) {
              finished(err, !!err);
            });
          });
        });
      });
    });
  };
  ZipArchiver.prototype.remove = function(file, path, cb) {
    function finished(err, res, writer) {
      if ( err || !writer ) {
        cb(err || API._('ZIP_NO_RESOURCE'));
        return;
      }
      saveZip(writer, file, function(eer, rees) {
        cb(eer, rees);
      });
    }
    if ( !path ) {
      finished(API._('ZIP_NO_PATH'));
      return;
    }
    openFile(file, function(err, entries) {
      if ( err ) {
        finished(err); return;
      }
      createZip(function(err, writer) {
        if ( err ) {
          finished(err); return;
        }
        importFiles(writer, entries, function() {
        }, function(err) {
          finished(err, !!err, writer);
        }, [path]);
      });
    });
  };
  ZipArchiver.prototype.extract = function(file, destination, args) {
    args = args || {};
    args.onprogress = args.onprogress || function() {};
    args.oncomplete = args.oncomplete || function() {};
    function finished(error, warnings, result) {
      if ( !error ) {
        API.message('vfs:update', destination, {source: args.app ? args.app.__pid : null});
      }
      args.oncomplete(error, warnings, result);
    }
    var extracted = [];
    var warnings = [];
    var total = 0;
    function _extractList(list, destination) {
      total = list.length;
      var index = 0;
      function _extract(item, cb) {
        args.onprogress(item.filename, index, total);
        var dest = destination;
        if ( item.filename.match(/\//) ) {
          if ( item.directory ) {
            dest += '/' + item.filename;
          } else {
            dest += '/' + Utils.dirname(item.filename);
          }
        }
        if ( item.directory ) {
          VFS.mkdir(new VFS.File(dest), function(error, result) {
            if ( error ) {
              warnings.push(Utils.format('Could not create directory "{0}": {1}', item.filename, error));
            } else {
              extracted.push(item.filename);
            }
            cb();
          });
          return;
        }
        getEntryFile(item, function(blob) {
          VFS.upload({
            destination: dest,
            files: [{filename: Utils.filename(item.filename), data: blob}]
          }, function(type, ev) { // error, result, ev
            console.warn('ZipArchiver::extract()', '_extract()', 'upload', type, ev);
            if ( type === 'error' ) {
              warnings.push(Utils.format('Could not extract "{0}": {1}', item.filename, ev));
            } else {
              extracted.push(item.filename);
            }
            cb();
          });
        }, function() {
        });
      }
      function _finished() {
        finished(false, warnings, true);
      }
      function _next() {
        if ( !list.length || index >= list.length ) {
          return _finished();
        }
        _extract(list[index], function() {
          index++;
          _next();
        });
      }
      _next();
    }
    function _checkDirectory(destination, cb) {
      var dst = new VFS.File({path: destination, type: 'dir'});
      VFS.mkdir(dst, function(error, result) {
        if ( error ) {
          console.warn('ZipArchiver::extract()', '_checkDirectory()', 'VFS::mkdir()', error);
        }
        VFS.exists(dst, function(err, result) {
          if ( err ) {
            console.warn('ZipArchiver::extract()', '_checkDirectory()', 'VFS::exists()', err);
          }
          if ( result ) {
            cb(false);
          } else {
            cb('Destination directory was not created or does not exist');
          }
        });
      });
    }
    VFS.download(file, function(error, result) {
      if ( error ) {
        finished(error, warnings, false);
        return;
      }
      var blob = new Blob([result], {type: 'application/zip'});
      _checkDirectory(destination, function(err) {
        if ( err ) {
          finished(error, warnings, false);
          return;
        }
        getEntries(blob, function(error, entries) {
          if ( error ) {
            finished(error, warnings, false);
            return;
          }
          _extractList(entries, destination);
        });
      });
    });
  };
  OSjs.Helpers.ZipArchiver = OSjs.Helpers.ZipArchiver || {};
  OSjs.Helpers.ZipArchiver.getInstance = function() {
    return SingletonInstance;
  };
  OSjs.Helpers.ZipArchiver.createInstance = function(args, callback) {
    args = args || {};
    if ( !SingletonInstance ) {
      SingletonInstance = new ZipArchiver(args);
    }
    SingletonInstance.init(function(error) {
      if ( !error ) {
        if ( !window.zip ) {
          error = API._('ZIP_VENDOR_FAIL');
        }
      }
      callback(error, error ? false : SingletonInstance);
    });
  };
})(OSjs.Utils, OSjs.API, OSjs.VFS);

(function(Utils) {
  'use strict';
  function SettingsFragment(obj, poolName) {
    this._pool = poolName;
    if ( obj.constructor !== {}.constructor ) {
      throw new Error('SettingsFragment will not work unless you give it a object to manage.');
    }
    this._settings = obj;
  }
  SettingsFragment.prototype.get = function(key, defaultValue) {
    var ret = key ? this._settings[key] : this._settings;
    return (typeof ret === 'undefined') ? defaultValue : ret;
  };
  SettingsFragment.prototype.set = function(key, value, save, triggerWatch) {
    if ( key === null ) {
      Utils.mergeObject(this._settings, value);
    } else {
      if ( (['number', 'string']).indexOf(typeof key) >= 0 ) {
        this._settings[key] = value;
      } else {
        console.warn('SettingsFragment::set()', 'expects key to be a valid iter, not', key);
      }
    }
    if (save) {
      OSjs.Core.getSettingsManager().save(this._pool, save);
    }
    if ( typeof triggerWatch === 'undefined' || triggerWatch === true ) {
      OSjs.Core.getSettingsManager().changed(this._pool);
    }
    return this;
  };
  SettingsFragment.prototype.save = function(callback) {
    return OSjs.Core.getSettingsManager().save(this._pool, callback);
  };
  SettingsFragment.prototype.getChained = function() {
    var nestedSetting = this._settings;
    arguments.every(function(key) {
      if (nestedSetting[key]) {
        nestedSetting = nestedSetting[key];
        return true;
      }
      return false;
    });
    return nestedSetting;
  };
  SettingsFragment.prototype.mergeDefaults = function(defaults) {
    Utils.mergeObject(this._settings, defaults, {overwrite: false});
    return this;
  };
  SettingsFragment.prototype.instance = function(key) {
    if (typeof this._settings[key] === 'undefined') {
      throw new Error('The object doesn\'t contain that key. SettingsFragment will not work.');
    }
    return new OSjs.Helpers.SettingsFragment(this._settings[key], this._pool);
  };
  OSjs.Helpers.SettingsFragment = SettingsFragment;
})(OSjs.Utils);
