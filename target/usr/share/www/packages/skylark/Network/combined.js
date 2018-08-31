(function(DefaultApplication, DefaultApplicationWindow, Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationNetconfWindow(app, metadata, scheme) {
    DefaultApplicationWindow.apply(this, ['ApplicationNetconfWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app, scheme]);
  }

  ApplicationNetconfWindow.prototype = Object.create(DefaultApplicationWindow.prototype);
  ApplicationNetconfWindow.constructor = DefaultApplicationWindow.prototype;

  ApplicationNetconfWindow.prototype.init = function(wmRef, app, scheme) {
    var root = DefaultApplicationWindow.prototype.init.apply(this, arguments);
    scheme.render(this, 'NetconfWindow', root);


    app._api('getNetConf', null, (function (scheme, me) { return function(err, netConf) {

        if ( err ) {
                API.error(API._('ERR_GENERIC_APP_FMT', "Network"), API._('ERR_GENERIC_APP_REQUEST'), err);
                return;
        }
        // populate tabs

        // modes tab
        var mode_w = scheme.find(me, 'Mode');
        var modes = netConf['modes'];
        var modes_list = Object.keys(modes).map(function(v) { return modes[v]; });
        mode_w.add(modes_list);

        var selected = netConf['mode'];
        mode_w.set('value', selected);

        // hostname
        scheme.find(me,'Hostname').set('value', netConf['hostname']);

        // ap tab
        scheme.find(me,'HotspotName').set('value', netConf['ap']['ssid']);
        scheme.find(me,'HotspotHide').set('value', netConf['ap']['hidden']);
        scheme.find(me,'HotspotCountry').add((netConf['ap']['countries']).map(function(v) { return { "value" : v['code'], "label": v['name']}; } ) );
        var selectedCountry = netConf['ap']['selectedCountry'];
        selectedCountry = selectedCountry === null ? "none" : selectedCountry;
        scheme.find(me,'HotspotCountry').set('value', selectedCountry);
        scheme.find(me,'HotspotChannel').add((netConf['ap']['channels']).map(function(v) { return { "value" : v, "label": v}; } ) );
        scheme.find(me,'HotspotChannel').set('value', netConf['ap']['selectedChannel']);
        scheme.find(me,'HotspotSecurityEnabled').set('value', netConf['ap']['securityEnabled']);
        scheme.find(me,'HotspotPassword').set('value', netConf['ap']['password']);

        // sta tab
        scheme.find(me,'SSID').set('value', netConf['sta']['ssid']);
        scheme.find(me,'SSIDPass').set('value', netConf['sta']['password']);

        // setup saving
        var netsave = scheme.find(me, 'NetSave');

        var netsaveOnClick  = (function (scheme, me, netConf) { return function() {
            // mode tab
            netConf['hostname'] = scheme.find(me, 'Hostname').get('value');
            netConf['OthernetPassword'] = scheme.find(me, 'OthernetPassword').get('value');
            netConf['mode'] = scheme.find(me, 'Mode').get('value');

            // ap tab
            netConf['ap']['ssid'] = scheme.find(me,'HotspotName').get('value');
            netConf['ap']['hidden'] = scheme.find(me,'HotspotHide').get('value');
            var selectedCountry = scheme.find(me,'HotspotCountry').get('value');
            netConf['ap']['selectedCountry'] = selectedCountry == "none" ? null : selectedCountry;
            netConf['ap']['selectedChannel'] = scheme.find(me,'HotspotChannel').get('value');
            netConf['ap']['securityEnabled'] = scheme.find(me,'HotspotSecurityEnabled').get('value');
            netConf['ap']['password'] = scheme.find(me,'HotspotPassword').get('value');

            // sta tab
            netConf['sta']['ssid'] = scheme.find(me,'SSID').get('value');
            netConf['sta']['password'] = scheme.find(me,'SSIDPass').get('value');

            // TODO: replace "console.log" with alert box
            if ( netConf['ap']['securityEnabled'] && netConf['ap']['password'].length < 8) {
                API.createDialog('Alert', {title: "Access Point", message: "password must have 8 or more characters" }, null, me);
            } else {
                app._api('setNetConf', netConf , console.log);
            }
        }}) (scheme, me , netConf);

        netsave.on('click', netsaveOnClick);

    }}) (scheme, this));

    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationNetconf(args, metadata) {
    DefaultApplication.apply(this, ['ApplicationNetconf', args, metadata, {
      extension: null,
      mime: null,
      filename: null,
      fileypes: null,
      readData: false
    }]);
  }

  ApplicationNetconf.prototype = Object.create(DefaultApplication.prototype);
  ApplicationNetconf.constructor = DefaultApplication;

  ApplicationNetconf.prototype.init = function(settings, metadata, scheme) {
    Application.prototype.init.call(this, settings, metadata, scheme);
    this._addWindow(new ApplicationNetconfWindow(this, metadata, scheme));
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationNetconf = OSjs.Applications.ApplicationNetconf || {};
  OSjs.Applications.ApplicationNetconf.Class = Object.seal(ApplicationNetconf);

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
