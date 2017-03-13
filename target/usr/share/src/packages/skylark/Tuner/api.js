
(function(skylark_config) {
  'use strict';

  module.exports.getTunerConf = function(args, callback, request, response) {
    if(request.session.get('groups').indexOf("admin")>-1) {
        skylark_config.getTunerConf( function (r) {
            callback(false, r);
        });
    } else {
       callback("You are not allowed to use this App/API");
    }

  };

  module.exports.setTunerConf = function(args, callback, request, response) {
    if(request.session.get('groups').indexOf("admin")>-1) {
        skylark_config.setTunerConf(args, function (r) {
            callback(false, r);
        });
    } else {
       callback("You are not allowed to use this App/API");
    }
  };

  var onddClient;

  module.exports.getOnddStatus2 = function(args, callback, request, response) {
    callback(false, onddClient.getStatus());
  };

  module.exports.getApiNS = function(ns) {
    ns.getTunerStatus = function(server, args, callback) {
        callback(false, onddClient.getStatus());
    }
  };

  //
  // This is called whenever the HTTP server starts up
  //
  module.exports._onServerStart = function(server, instance, metadata) {

    // ondd/tuner status listener
    skylark_config.getOnddClient(function(ondd) {
        onddClient = ondd;
        onddClient.start();
        console.log("started ondd client");

        // telemetry
        skylark_config.getTelemetryClient( function(telemetryClient) {
            telemetryClient.attachOnddClient(onddClient);
            telemetryClient.start();
            console.log("started telemetry client");
        });

    });
  };

})(require('skylark_config'));

