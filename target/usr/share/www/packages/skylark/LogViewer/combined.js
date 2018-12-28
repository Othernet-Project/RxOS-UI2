(function(DefaultApplication, DefaultApplicationWindow, Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationLogViewerWindow(app, metadata, scheme) {
    DefaultApplicationWindow.apply(this, ['ApplicationLogViewerWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app, scheme]);
  }

  ApplicationLogViewerWindow.prototype = Object.create(DefaultApplicationWindow.prototype);
  ApplicationLogViewerWindow.constructor = DefaultApplicationWindow.prototype;

  ApplicationLogViewerWindow.prototype.init = function(wmRef, app, scheme) {
    var root = DefaultApplicationWindow.prototype.init.apply(this, arguments);
    scheme.render(this, 'LogViewerWindow', root);

    //
    // Side View
    //
    var side = scheme.find(this, 'SideView');
    var txtarea = this._find('Text');
    side.on('activate', function(ev) {
        txtarea.set('value', "Loading...");
        if( ev && ev.detail && ev.detail.entries) {
            var entry = ev.detail.entries[0];
            app._api('runTask', entry.data, function(err, r) {
                txtarea.set('value', r || '');
            });
        } else {
           txtarea.set('value', "Failed");
        }
    });

    var items = [
        { value: 'diags',  columns: [ { label: 'Diagnostics'} ] },
        { value: 'mounts', columns: [ { label: 'Mounted Filesystems'} ] },
        { value: 'dmesg' , columns: [ { label: 'Kernel Messages'} ] },
        { value: 'syslog', columns: [ { label: 'System Messages'} ] },
        { value: 'top',    columns: [ { label: 'Running Processes'} ] }
    ];

    var side = this._find('SideView');
    side.clear();
    side.add(items);

    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationLogViewer(args, metadata) {
    DefaultApplication.apply(this, ['ApplicationLogViewer', args, metadata, {
      extension: null,
      mime: null,
      filename: null,
      fileypes: null,
      readData: false
    }]);
  }

  ApplicationLogViewer.prototype = Object.create(DefaultApplication.prototype);
  ApplicationLogViewer.constructor = DefaultApplication;

  ApplicationLogViewer.prototype.init = function(settings, metadata, scheme) {
    Application.prototype.init.call(this, settings, metadata, scheme);
    this._addWindow(new ApplicationLogViewerWindow(this, metadata, scheme));
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationLogViewer = OSjs.Applications.ApplicationLogViewer || {};
  OSjs.Applications.ApplicationLogViewer.Class = Object.seal(ApplicationLogViewer);

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
