/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
(function(DefaultApplication, DefaultApplicationWindow, Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationReaderWindow(app, metadata, scheme, file) {
    DefaultApplicationWindow.apply(this, ['ApplicationReaderWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app, scheme, file]);
  }

  ApplicationReaderWindow.prototype = Object.create(DefaultApplicationWindow.prototype);
  ApplicationReaderWindow.constructor = DefaultApplicationWindow.prototype;

  ApplicationReaderWindow.prototype.init = function(wmRef, app, scheme) {
    var root = DefaultApplicationWindow.prototype.init.apply(this, arguments);
    scheme.render(this, 'ReaderWindow', root);
    return root;
  };

  ApplicationReaderWindow.prototype.showFile = function(file, url) {
    if ( this._scheme ) {

      // TODO: nasty hack, fix this
      var base = "/packages/skylark/Reader/";

      var viewerjs = function(f,u) {
          return base + "ViewerJS/index.html#/" + encodeURIComponent(u);
      };

      var playerjs = function(f,u) {
          if (f.mime.match("^audio/")) {
              return base + "MediaElement/index.html?type=audio&u=" + encodeURIComponent(u);
          } else {
              return base + "MediaElement/index.html?type=video&u=" + encodeURIComponent(u);
          }
      };

      var epubjs = function(f,u) {
          return base + "epub.js/index.html?u=" + encodeURIComponent(u);
      };

      var showdown = function(f,u) {
          return base + "showdown/index.html?u=" + encodeURIComponent(u);
      };

      var mime_map = {
        "application/pdf" : viewerjs,
        "application/vnd.oasis.opendocument.presentation" : viewerjs,
        "application/vnd.oasis.opendocument.spreadsheet" : viewerjs,
        "application/vnd.oasis.opendocument.text" : viewerjs,
        "^video/" : playerjs,
        "^audio/" : playerjs,
        "application/epub+zip" : epubjs,
        "application/epub" : epubjs,
        "text/markdown" : showdown
      };

      var src = encodeURIComponent(url);

      if (mime_map[file.mime]) {
        src = mime_map[file.mime](file, url);
      } else {
        for(var k in mime_map) {
            if (file.mime.match(k)) {
                src = mime_map[k](file, url);
                break;
            }
        }
      }

      console.log(file); console.log(url);
        console.log(src);
      this._find('iframe').set('src', src);
    }
    DefaultApplicationWindow.prototype.showFile.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationReader(args, metadata) {
    DefaultApplication.apply(this, ['ApplicationReader', args, metadata, {
      extension: [ 'html', 'htm', 'pdf', 'odt', 'ods', 'odp', 'ogv', 'mp4', 'webm', 'ogv',
                   'mp3', 'oga', 'ogg', 'wav', 'vtt', 'srt', 'epub', 'md' ],
      mime: [
        "text/htm",
        "text/html",
        "application/pdf",
        // OpenDocument
        "application/vnd.oasis.opendocument.presentation",
        "application/vnd.oasis.opendocument.spreadsheet",
        "application/vnd.oasis.opendocument.text",
        // Video
        "video/ogg",
        "video/mp4",
        "video/webm",
        "video/ogv",
        //Audio
        "audio/mp3",
        "audio/mpeg",
        "audio/oga",
        "audio/ogg",
        "audio/wav",
        // subtitles
        "text/vtt",
        "text/srt",
        // epub
        "application/epub+zip",
        "application/epub",
        // markdown
        "text/markdown"
      ],
      filename: 'index.html',
      fileypes: ['html', 'htm', 'pdf', 'odt', 'ods', 'odp', 'ogv', 'mp4', 'webm', 'ogv',
                  'mp3', 'mpeg', 'oga', 'ogg', 'wav', 'vtt', 'srt', 'epub', 'md' ],
      readData: false
    }]);
  }

  ApplicationReader.prototype = Object.create(DefaultApplication.prototype);
  ApplicationReader.constructor = DefaultApplication;

  ApplicationReader.prototype.init = function(settings, metadata, scheme) {
    Application.prototype.init.call(this, settings, metadata, scheme);
    var file = this._getArgument('file');
    this._addWindow(new ApplicationReaderWindow(this, metadata, scheme, file));
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationReader = OSjs.Applications.ApplicationReader || {};
  OSjs.Applications.ApplicationReader.Class = Object.seal(ApplicationReader);

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
