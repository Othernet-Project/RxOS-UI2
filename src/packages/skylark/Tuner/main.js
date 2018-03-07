(function(DefaultApplication, DefaultApplicationWindow, Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationTunerWindow(app, metadata, scheme) {
    DefaultApplicationWindow.apply(this, ['ApplicationTunerWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 300
    }, app, scheme]);

    this.statusInterval = null;
  }

  ApplicationTunerWindow.prototype = Object.create(DefaultApplicationWindow.prototype);
  ApplicationTunerWindow.constructor = DefaultApplicationWindow.prototype;

  ApplicationTunerWindow.prototype.destroy = function() {
    this.statusInterval = clearInterval(this.statusInterval);
    return DefaultApplicationWindow.prototype.destroy.apply(this, arguments);
  };

  ApplicationTunerWindow.prototype.init = function(wmRef, app, scheme) {
    var self = this;
    var root = DefaultApplicationWindow.prototype.init.apply(this, arguments);
    scheme.render(this, 'TunerWindow', root);

    var beams = scheme.find(this, 'Beams');
    var antennaTypes = scheme.find(this, 'AntennaType');
    var param_table = scheme.find(this, 'BeamParameters');
    var beamsave = scheme.find(this, 'BeamSave');

    var tunerstatus = scheme.find(this, "Status");
    var customFrequency = scheme.find(this, "Frequency");
    var customBeamtype = scheme.find(this, "BeamType");


    this.statusInterval = setInterval(function() {

      app._api('getOnddStatus2', null, function (err, onddStatus) {
        if(!err) {
          if(onddStatus) {
            tunerstatus.clear();
            if (onddStatus.hasOwnProperty("stream")) tunerstatus.add( [ { columns: [ {label: "Stream"}, {label: '' + onddStatus.stream} ] } ] );
            if (onddStatus.hasOwnProperty("snr")) tunerstatus.add( [ { columns: [ {label: "SNR (dB)"}, {label: '' + onddStatus.snr} ] } ] );
            if (onddStatus.hasOwnProperty("lock")) tunerstatus.add( [ { columns: [ {label: "Lock"}, {label: onddStatus.lock? "yes" : "no" } ] } ] );
            if (onddStatus.hasOwnProperty("rssi")) tunerstatus.add( [ { columns: [ {label: "Rssi (dBm) "}, {label: '' + onddStatus.rssi} ] } ] );
            if (onddStatus.hasOwnProperty("alg_pk_mn")) tunerstatus.add( [ { columns: [ {label: "APkMn Ratio"}, {label: '' + onddStatus.alg_pk_mn} ] } ] );
            if (onddStatus.hasOwnProperty("freq")) tunerstatus.add( [ { columns: [ {label: "Frequency (MHz)"}, {label: '' + onddStatus.freq} ] } ] );
            if (onddStatus.hasOwnProperty("freq_offset")) tunerstatus.add( [ { columns: [ {label: "Freq Offset (Hz)"}, {label: '' + onddStatus.freq_offset} ] } ] );
            if (onddStatus.hasOwnProperty("ser")) tunerstatus.add( [ { columns: [ {label: "Symbol Error Rate (SER)"}, {label: '' + onddStatus.ser} ] } ] );
            if (onddStatus.hasOwnProperty("crc_err")) tunerstatus.add( [ { columns: [ {label: "Packets received"}, {label: '' + (onddStatus.crc_ok + onddStatus.crc_err) } ] } ] );
            if (onddStatus.hasOwnProperty("crc_ok")) tunerstatus.add( [ { columns: [ {label: "Valid packets"}, {label: '' + onddStatus.crc_ok} ] } ] );
            if (onddStatus.hasOwnProperty("crc_err")) tunerstatus.add( [ { columns: [ {label: "Valid packets %"}, {label: '' + Math.round(100*onddStatus.crc_ok/ (onddStatus.crc_ok + onddStatus.crc_err)) } ] } ] );
            if (onddStatus.hasOwnProperty("crc_err")) tunerstatus.add( [ { columns: [ {label: "Packet Error Rate (PER)"}, {label: '' + Math.round(1000*onddStatus.crc_err/ (onddStatus.crc_ok + onddStatus.crc_err))/1000 } ] } ] );
            if (onddStatus.hasOwnProperty("td")) tunerstatus.add( [ { columns: [ {label: "dT (ms)"}, {label: '' + onddStatus.td} ] } ] );
            if (onddStatus.hasOwnProperty("bitrate")) tunerstatus.add( [ { columns: [ {label: "Bitrate (bps)"}, {label: '' + onddStatus.bitrate} ] } ] );
            if (onddStatus.hasOwnProperty("packetrate")) tunerstatus.add( [ { columns: [ {label: "Packet rate (pps)"}, {label: '' + onddStatus.packetrate} ] } ] );
            if (onddStatus.hasOwnProperty("state")) tunerstatus.add( [ { columns: [
                    {label: "Lock State"},
                    {   label: [ "Search", "Signal Detect", "Const Lock", "Code Lock", "Frame Lock" ] [onddStatus.state] }
                ] } ] );
            if (onddStatus.hasOwnProperty("transfers")) {
                tunerstatus.add( [ { columns: [ {label: "Transfers:"}, {label: ""} ] } ] );

                onddStatus.transfers.forEach(function(v) {
                    if (v.path) {
                        var s = Math.round(100*v.block_received/v.block_count) + "%";
                        if (v.complete) s = "Complete";
                        tunerstatus.add([ { columns: [ {label: v.path}, {label: s} ] } ] );
                    }
                });
            }
          }
        } else
            clearInterval(self.statusInterval);
      });

    }, 1000);

    app._api('getTunerConf', null, (function (beams, param_table, beamsave, antennaTypes, customFrequency, customBeamtype) { return function(err, TunerConf) {

        if ( err ) {
                API.error(API._('ERR_GENERIC_APP_FMT', "Tuner"), API._('ERR_GENERIC_APP_REQUEST'), err);
                return;
        }

        var Beams = TunerConf.beams;
        var selected = TunerConf.selectedBeam;
        var beams_list = Object.keys(Beams).map(function(v) { return Beams[v]; });
        var AntennaTypes = TunerConf.antennaTypes;
        var selectedAntenna = TunerConf.selectedAntenna;
        var antennaTypes_list = Object.keys(AntennaTypes).map(function(v) { return AntennaTypes[v]; });

        var beamsOnChange = (function (Beams, param_table) { return function(ev) {
            param_table.clear();
            param_table.add( [
                { value: 'label', columns: [ {label: "Region"}, {label: Beams[ev.detail]['label'] } ] },
                { value: 'freq', columns: [ {label: "Frequency"}, {label: Beams[ev.detail]['freq'] } ] },
                { value: 'beamtype', columns: [ {label: "Beam Type"}, {label: Beams[ev.detail]['beamtype'] } ] }
            ]);
        }}) (Beams, param_table);

        var beamsaveOnClick  = (function (Beams, beams, AntennaTypes, antennaTypes, customFrequency, customBeamtype, TunerConf) { return function() {
            TunerConf.selectedBeam = beams.get('value');
            TunerConf.selectedAntenna = antennaTypes.get('value');
            TunerConf.beams.custom.freq = customFrequency.get('value');
            TunerConf.beams.custom.beamtype = customBeamtype.get('value');
            // TODO: replace "console.log" with alert box
            app._api('setTunerConf', TunerConf , console.log);
        }}) (Beams, beams, AntennaTypes, antennaTypes, customFrequency, customBeamtype, TunerConf);

        beams.on('change', beamsOnChange);
        beams.add(beams_list);

        beams.set('value', selected);
        // populate param list on initial load
        beamsOnChange({ detail: beams.get('value')});

        antennaTypes.add(antennaTypes_list);

        antennaTypes.set('value', selectedAntenna);

        customFrequency.set('value', TunerConf['beams']['custom']['freq']);
        customBeamtype.set('value', TunerConf['beams']['custom']['beamtype']);

        beamsave.on('click', beamsaveOnClick);

        // TODO: add support for custom beam
    }}) (beams, param_table, beamsave, antennaTypes, customFrequency, customBeamtype));

    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationTuner(args, metadata) {
    DefaultApplication.apply(this, ['ApplicationTuner', args, metadata, {
      extension: null,
      mime: null,
      filename: null,
      fileypes: null,
      readData: false
    }]);
  }

  ApplicationTuner.prototype = Object.create(DefaultApplication.prototype);
  ApplicationTuner.constructor = DefaultApplication;

  ApplicationTuner.prototype.init = function(settings, metadata, scheme) {
    Application.prototype.init.call(this, settings, metadata, scheme);
    this._addWindow(new ApplicationTunerWindow(this, metadata, scheme));
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationTuner = OSjs.Applications.ApplicationTuner || {};
  OSjs.Applications.ApplicationTuner.Class = Object.seal(ApplicationTuner);

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
