
(function(skylark_config) {
  'use strict';

  module.exports.runTask = function(args, callback, request, response) {
    skylark_config.runTask(args, function(r) {
        callback(false,r);
    });
  };

  //
  // This is called whenever the HTTP server starts up
  //
  module.exports._onServerStart = function(server, instance, metadata) {
  };

})(require('skylark_config'));

