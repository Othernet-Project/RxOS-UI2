(function(DefaultApplication, DefaultApplicationWindow, Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationWikireaderWindow(app, metadata, scheme) {
    DefaultApplicationWindow.apply(this, ['ApplicationWikireaderWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app, scheme]);

    this.updateInterval = null;
  }

  ApplicationWikireaderWindow.prototype = Object.create(DefaultApplicationWindow.prototype);
  ApplicationWikireaderWindow.constructor = DefaultApplicationWindow.prototype;

  ApplicationWikireaderWindow.prototype.destroy = function() {
    this.updateInterval = clearInterval(this.updateInterval);
    return DefaultApplicationWindow.prototype.destroy.apply(this, arguments);
  };


  ApplicationWikireaderWindow.prototype.init = function(wmRef, app, scheme) {
    var root = DefaultApplicationWindow.prototype.init.apply(this, arguments);
    scheme.render(this, 'WikireaderWindow', root);

    //
    // Side View
    //
    var side = scheme.find(this, 'SideView');
    var txtarea = this._find('iframe');
    side.on('activate', function(ev) {
        if( ev && ev.detail && ev.detail.entries && ev.detail.entries[0] && ev.detail.entries[0].data ) {
            txtarea.set('src', "FS/get/" + encodeURIComponent(ev.detail.entries[0].data));
        }
    });
    side.set('zebra',false);

    var populate = function() {
        VFS.scandir('downloads:///Wikipedia', function(error, result) {

            if (error) return;

            var entries = result.map(function(i) {
                if(i.mime != 'text/html') {
                    return [];
                }
                var r = {};
                r.title = i.filename.split(".").slice(0,-1).join('.').replace(/_/g, ' ');
                r.value = i.path;
                r.columns =  [ { label: r.title } ];
                r.mtime = i.mtime;
                return r;
            });

            var sortBymtime = function (a,b) {
                return (Date.parse(b.mtime) - Date.parse(a.mtime));
            };

            entries.sort(sortBymtime);
            side.clear();
            side.add(entries);
        });
    };

    setTimeout(populate, 1);
    this.updateInterval = setInterval(populate, 2 * 60 * 1000); // 2 minutes

    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationWikireader(args, metadata) {
    DefaultApplication.apply(this, ['ApplicationWikireader', args, metadata, {
      extension: null,
      mime: null,
      filename: null,
      fileypes: null,
      readData: false
    }]);
  }

  ApplicationWikireader.prototype = Object.create(DefaultApplication.prototype);
  ApplicationWikireader.constructor = DefaultApplication;

  ApplicationWikireader.prototype.init = function(settings, metadata, scheme) {
    Application.prototype.init.call(this, settings, metadata, scheme);
    this._addWindow(new ApplicationWikireaderWindow(this, metadata, scheme));
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationWikireader = OSjs.Applications.ApplicationWikireader || {};
  OSjs.Applications.ApplicationWikireader.Class = Object.seal(ApplicationWikireader);

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
