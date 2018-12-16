(function(DefaultApplication, DefaultApplicationWindow, Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationWhatsNewWindow(app, metadata, scheme) {
    DefaultApplicationWindow.apply(this, ['ApplicationWhatsNewWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app, scheme]);

    this.updateInterval = null;
  }

  ApplicationWhatsNewWindow.prototype = Object.create(DefaultApplicationWindow.prototype);
  ApplicationWhatsNewWindow.constructor = DefaultApplicationWindow.prototype;

  ApplicationWhatsNewWindow.prototype.destroy = function() {
    this.updateInterval = clearInterval(this.updateInterval);
    return DefaultApplicationWindow.prototype.destroy.apply(this, arguments);
  };

  ApplicationWhatsNewWindow.prototype.init = function(wmRef, app, scheme) {
    var root = DefaultApplicationWindow.prototype.init.apply(this, arguments);
    scheme.render(this, 'WhatsNewWindow', root);

    var items = this._find('Items');
    items.set('zebra', false);
    items.set('columns', [
        {label: "Date", size: "6em", textalign: "center" },
        {label: "Time", size: "7em", textalign: "center" },
        {label: "File", textalign: "left" }
    ]);

    var populate = function () {
        app._api('scandir_r', null, function(err, value) {
            if (!err) {

                var files = value;
                var sortBymtime = function (a,b) {
                        return (Date.parse(b.mtime) - Date.parse(a.mtime));
                };

                files.sort(sortBymtime);
                var entries=files.map(function(v) {
                    if (v.filename[0]=='.') return []; // skip dot files
                    var d = new Date.parse(v.mtime);
                    return {
                        value: v ,
                        columns: [
                            { label: d.toLocaleDateString() },
                            { label: d.toLocaleTimeString() },
                            { label: v.path.slice(v.path.indexOf('/')+1) }
                        ]
                    };
                });
                items.clear(); items.add(entries);
            }
        });
    };

    populate();
    this.updateInterval = setInterval(populate, 120000);

    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationWhatsNew(args, metadata) {
    DefaultApplication.apply(this, ['ApplicationWhatsNew', args, metadata, {
      extension: null,
      mime: null,
      filename: null,
      fileypes: null,
      readData: false
    }]);
  }

  ApplicationWhatsNew.prototype = Object.create(DefaultApplication.prototype);
  ApplicationWhatsNew.constructor = DefaultApplication;

  ApplicationWhatsNew.prototype.init = function(settings, metadata, scheme) {
    Application.prototype.init.call(this, settings, metadata, scheme);
    this._addWindow(new ApplicationWhatsNewWindow(this, metadata, scheme));
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationWhatsNew = OSjs.Applications.ApplicationWhatsNew || {};
  OSjs.Applications.ApplicationWhatsNew.Class = Object.seal(ApplicationWhatsNew);

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
