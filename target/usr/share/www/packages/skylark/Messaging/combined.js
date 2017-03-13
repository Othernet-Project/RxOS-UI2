(function(DefaultApplication, DefaultApplicationWindow, Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationMessagingWindow(app, metadata, scheme) {
    DefaultApplicationWindow.apply(this, ['ApplicationMessagingWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app, scheme]);

    this.updateInterval = null;
  }

  ApplicationMessagingWindow.prototype = Object.create(DefaultApplicationWindow.prototype);
  ApplicationMessagingWindow.constructor = DefaultApplicationWindow.prototype;

  ApplicationMessagingWindow.prototype.destroy = function() {
    this.updateInterval = clearInterval(this.updateInterval);
    return DefaultApplicationWindow.prototype.destroy.apply(this, arguments);
  };

  ApplicationMessagingWindow.prototype.init = function(wmRef, app, scheme) {
    var root = DefaultApplicationWindow.prototype.init.apply(this, arguments);
    scheme.render(this, 'MessagingWindow', root);

    var msgarea = this._find('Messages');
    msgarea.set('zebra', false);
    msgarea.set('columns', [
        {label: "Date", size: "6em", textalign: "center" },
        {label: "Time", size: "7em", textalign: "center" },
        {label: "From", size: "15em", textalign: "center" },
        {label: "Message", textalign: "left" },

    ]);

    var populate = function () {

        var line2entry = function(l) {
            var l_parts = l.split(",");
            var ts  = l_parts[0];
            var ts_date = new Date(ts*1000);
            if (!ts_date.getYear()) return [];
            var ts_formatted_date = ts_date.toLocaleDateString();
            var ts_formatted_time = ts_date.toLocaleTimeString();
            var source = l_parts[1];
            var uname = "";
            var message = l_parts.slice(2).join(',');
            var name_tag = "";

            if (source == 'Twitter') {
                var m_parts = message.split(",");
                uname = m_parts[0];
                message = m_parts.slice(1).join(",");
                name_tag = "@" + uname + " on Twitter";
            } else if (source == 'APRSAT') {
                uname = message.split(">")[0];
                name_tag = uname + " via APRS";
            }
            else {
                return [];
            }

            var c = {
                    value: message,
                    columns: [
                        { label: ts_formatted_date },
                        { label: ts_formatted_time },
                        { label: name_tag },
                        { label: message }
                    ]
            }
            return c;
        }

        app._api('runTask', 'getMessages', function(err, r) {
            if (!err) {
                var messages = r.split("\n");
                var entries = messages.map(line2entry);
                msgarea.clear(); msgarea.add(entries);
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

  function ApplicationMessaging(args, metadata) {
    DefaultApplication.apply(this, ['ApplicationMessaging', args, metadata, {
      extension: null,
      mime: null,
      filename: null,
      fileypes: null,
      readData: false
    }]);
  }

  ApplicationMessaging.prototype = Object.create(DefaultApplication.prototype);
  ApplicationMessaging.constructor = DefaultApplication;

  ApplicationMessaging.prototype.init = function(settings, metadata, scheme) {
    Application.prototype.init.call(this, settings, metadata, scheme);
    this._addWindow(new ApplicationMessagingWindow(this, metadata, scheme));
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationMessaging = OSjs.Applications.ApplicationMessaging || {};
  OSjs.Applications.ApplicationMessaging.Class = Object.seal(ApplicationMessaging);

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
