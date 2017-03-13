
(function(skylark_config) {
  'use strict';

  module.exports.getNetConf = function(args, callback, request, response) {
    if(request.session.get('groups').indexOf("admin")>-1) {
        skylark_config.getNetConf( function (r) {
            callback(false, r);
        });
    } else {
       callback("You are not allowed to use this App/API");
    }
  };

  module.exports.setNetConf = function(args, callback, request, response) {
    if(request.session.get('groups').indexOf("admin")>-1) {
        skylark_config.setNetConf(args, function (r) {
            callback(false, r);
        });
    } else {
       callback("You are not allowed to use this App/API");
    }
  };

  //
  // This is called whenever the HTTP server starts up
  //
  module.exports._onServerStart = function(server, instance, metadata) {
  };

})(require('skylark_config'));

