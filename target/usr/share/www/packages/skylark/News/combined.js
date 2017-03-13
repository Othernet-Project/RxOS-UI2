/*!
 * Skylark - News app
 */

(function(DefaultApplication, DefaultApplicationWindow, Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationNewsWindow(app, metadata, scheme, file) {
    DefaultApplicationWindow.apply(this, ['ApplicationNewsWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 600,
      height: 300
    }, app, scheme, file]);

    this.updateInterval = null;
  }

  ApplicationNewsWindow.prototype = Object.create(DefaultApplicationWindow.prototype);
  ApplicationNewsWindow.constructor = DefaultApplicationWindow.prototype;

  ApplicationNewsWindow.prototype.destroy = function() {
    this.updateInterval = clearInterval(this.updateInterval);
    return DefaultApplicationWindow.prototype.destroy.apply(this, arguments);
  };

  ApplicationNewsWindow.prototype.init = function(wmRef, app, scheme) {
    var root = DefaultApplicationWindow.prototype.init.apply(this, arguments);
    var entries = [];
    var channels = [];
    var me = this;

    var dedupe = function (a) {
        return a.filter( (el, i, arr) => arr.indexOf(el) === i );
    };

    scheme.render(this, 'NewsWindow', root);

    var channels_w = scheme.find(me, 'Channels');
    var articles_w = scheme.find(me, 'Articles');
    var text_w = scheme.find(me,'iframe');

    var populate = function() {

        VFS.scandir('downloads:///News', function(error, result) {

            if (error) return;

            entries = result.map(function(i) {
                if(i.mime != 'text/html') {
                    return [];
                }
                var r = {};
                r.date = i.filename.split('.')[0];
                r.channel = i.filename.split(".")[1];
                r.title = i.filename.split(".").slice(2,-1).join(' ');
                channels = channels.concat(r.channel);
                r.path = i.path;
                r.mtime = i.mtime;
                return r;
            });

            channels = dedupe(channels).sort();
            var channel_items = channels.map( function (v) { return { columns: [ { label: v } ], value: v }; });
            channels_w.clear();
            channels_w.set('columns', [
                {label: "Channels", textalign: "left" }
            ]);
            channels_w.set('zebra', false);
            channels_w.add(channel_items);

            var onChannelActivate = function(ev) {
                if( ev && ev.detail && ev.detail.entries && ev.detail.entries[0] && ev.detail.entries[0].data ) {
                    var selectedChannel = ev.detail.entries[0].data;
                    var selectedEntries = entries
                                .filter( (v) => v.channel == selectedChannel )
                                .map( function(v) {return { value: v.path , mtime: v.mtime, columns: [ { label: v.date }, { label: v.title } ] }; } );

                    var sortBymtime = function (a,b) {
                        return (Date.parse(b.mtime) - Date.parse(a.mtime));
                    };

                    selectedEntries.sort(sortBymtime);
                    articles_w.clear(); articles_w.add(selectedEntries);
                }
            };

            channels_w.on('activate', onChannelActivate);

            var onArticleActivate = function(ev) {
                if( ev && ev.detail && ev.detail.entries && ev.detail.entries[0] && ev.detail.entries[0].data ) {
                    var selectedEntry = ev.detail.entries[0].data;
                    text_w.set('src', "FS/get/" + encodeURIComponent(selectedEntry));
                }
            };

            articles_w.set('zebra', false);

            articles_w.set('columns', [
                {label: "Date", size: "6em", textalign: "center" },
                {label: "Article", textalign: "left" }
            ]);

            articles_w.on('activate', onArticleActivate);
            onChannelActivate({ detail: { entries: [ { data:  channel_items[0].value } ] } });

        });
    };

    setTimeout(populate, 1);
    this.updateInterval = setInterval(populate, 30 * 60 * 1000); // 30 minutes

    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationNews(args, metadata) {
    DefaultApplication.apply(this, ['ApplicationNews', args, metadata]);
  }

  ApplicationNews.prototype = Object.create(DefaultApplication.prototype);
  ApplicationNews.constructor = DefaultApplication;

  ApplicationNews.prototype.init = function(settings, metadata, scheme) {
    Application.prototype.init.call(this, settings, metadata, scheme);
    this._addWindow(new ApplicationNewsWindow(this, metadata, scheme));
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationNews = OSjs.Applications.ApplicationNews || {};
  OSjs.Applications.ApplicationNews.Class = Object.seal(ApplicationNews);

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
