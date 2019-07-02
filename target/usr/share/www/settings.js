(function() {
  window.OSjs = window.OSjs || {}
  OSjs.Core = OSjs.Core || {}
  OSjs.Core.getConfig = (function() {
    var _cache;
    return function() {
      if ( !_cache ) {
        _cache = {
    "Version": "2.0-alpha80",
    "SettingsManager": {
        "VFS": {
            "scandir": {
                "showHiddenFiles": false,
                "showFileExtensions": true,
                "columns": [
                    "filename",
                    "mime",
                    "size"
                ]
            },
            "mounts": []
        },
        "CoreWM": {
            "styleTheme": "default",
            "iconTheme": "default",
            "soundTheme": "default",
            "animations": true,
            "fullscreen": true,
            "desktopMargin": 5,
            "wallpaper": "osjs:///themes/wallpapers/wallpaper.png",
            "desktopPath": "desktop:///",
            "icon": "othernet.png",
            "backgroundColor": "#089bd2",
            "fontFamily": "Ariel",
            "background": "image-fill",
            "windowCornerSnap": 0,
            "windowSnap": 0,
            "useTouchMenu": true,
            "enableIconView": false,
            "enableSwitcher": true,
            "enableHotkeys": true,
            "enableSounds": true,
            "invertIconViewColor": false,
            "moveOnResize": true,
            "hotkeys": {
                "WINDOW_MOVE_UP": "ALT+UP",
                "WINDOW_MOVE_DOWN": "ALT+DOWN",
                "WINDOW_MOVE_LEFT": "ALT+LEFT",
                "WINDOW_MOVE_RIGHT": "ALT+RIGHT",
                "WINDOW_MINIMIZE": "ALT+H",
                "WINDOW_RESTORE": "ALT+R",
                "WINDOW_MAXIMIZE": "ALT+M",
                "SEARCH": "F3",
                "SWITCHER": "ALT+TILDE",
                "SAVEAS": "CTRL+SHIFT+S",
                "SAVE": "CTRL+S",
                "OPEN": "CTRL+O"
            },
            "sounds": {
                "LOGOUT": "service-logout",
                "LOGIN": "service-login",
                "ERROR": "dialog-warning"
            },
            "panels": [
                {
                    "options": {
                        "position": "top",
                        "ontop": true,
                        "autohide": false,
                        "background": "#101010",
                        "foreground": "#ffffff",
                        "opacity": 85
                    },
                    "items": [
                        {
                            "name": "AppMenu",
                            "settings": {}
                        },
                        {
                            "name": "WindowList",
                            "settings": {}
                        },
                        {
                            "name": "NotificationArea",
                            "settings": {}
                        },
                        {
                            "name": "Search",
                            "settings": {}
                        },
                        {
                            "name": "Clock",
                            "settings": {}
                        }
                    ]
                }
            ],
            "mediaQueries": {
                "mobile": 320,
                "tablet": 800
            },
            "menu": {
                "development": {
                    "icon": "categories/package_development.png",
                    "title": "Development"
                },
                "education": {
                    "icon": "categories/applications-sience.png",
                    "title": "Education"
                },
                "games": {
                    "icon": "categories/package_games.png",
                    "title": "Games"
                },
                "graphics": {
                    "icon": "categories/package_graphics.png",
                    "title": "Graphics"
                },
                "network": {
                    "icon": "categories/package_network.png",
                    "title": "Network"
                },
                "multimedia": {
                    "icon": "categories/package_multimedia.png",
                    "title": "Multimedia"
                },
                "office": {
                    "icon": "categories/package_office.png",
                    "title": "Office"
                },
                "system": {
                    "icon": "categories/package_system.png",
                    "title": "System"
                },
                "utilities": {
                    "icon": "categories/package_utilities.png",
                    "title": "Utilities"
                },
                "unknown": {
                    "icon": "categories/applications-other.png",
                    "title": "Other"
                }
            }
        },
        "PackageManager": {
            "Repositories": [
                "https://builds.os.js.org/store/packages.json"
            ],
            "PackagePaths": [
                "home:///.packages"
            ],
            "Hidden": []
        },
        "DefaultApplication": {
            "dir": "ApplicationFileManager"
        },
        "SearchEngine": {
            "applications": true,
            "files": true,
            "paths": [
                "home:///"
            ]
        }
    },
    "PackageManager": {
        "UseStaticManifest": false
    },
    "Preloads": [],
    "AutoStart": [],
    "Languages": {
        "en_EN": "English",
        "bg_BG": "Bulgarian (Bulgaria)",
        "no_NO": "Norsk (Norwegian)",
        "de_DE": "Deutsch (German)",
        "es_ES": "Spanish (Spain)",
        "fr_FR": "French (France)",
        "ru_RU": "Russian (Russia)",
        "ko_KR": "Korean (한국어)",
        "zh_CN": "Chinese (China)",
        "nl_NL": "Dutch (Nederlands)",
        "pl_PL": "Polski (Poland)",
        "pt_BR": "Portuguese (Brazil)",
        "sk_SK": "Slovak (Slovenčina)",
        "vi_VN": "Vietnamese (Tiếng Việt)",
        "tr_TR": "Turkish (Turkey)",
        "it_IT": "Italiano (Italian)",
        "fa_FA": "Farsi (Persian)",
        "ar_DZ": "Arabic (Algeria)"
    },
    "Styles": [
        {
            "name": "dark",
            "title": "Dark",
            "style": {
                "window": {
                    "margin": 30,
                    "border": 3
                }
            }
        },
        {
            "name": "default",
            "title": "Default",
            "style": {
                "window": {
                    "margin": 30,
                    "border": 3
                }
            }
        },
        {
            "name": "glass",
            "title": "Glass",
            "style": {
                "window": {
                    "margin": 30,
                    "border": 5
                }
            }
        },
        {
            "name": "material",
            "title": "Material Design",
            "style": {
                "window": {
                    "margin": 34,
                    "border": 0
                }
            }
        },
        {
            "name": "windows8",
            "title": "Windows 8",
            "style": {
                "window": {
                    "margin": 30,
                    "border": 3
                }
            }
        }
    ],
    "Sounds": {
        "default": "Default (Freedesktop)"
    },
    "Icons": {
        "default": "Default (Gnome)"
    },
    "Fonts": {
        "default": "Karla",
        "list": [
            "Arial",
            "Arial Black",
            "Sans-serif",
            "Serif",
            "Trebuchet MS",
            "Impact",
            "Georgia",
            "Courier New",
            "Comic Sans MS",
            "Monospace",
            "Symbol",
            "Webdings"
        ]
    },
    "MIME": {
        "descriptions": {
            "application/vnd.oasis.opendocument.presentation": "OpenDocument Presentation",
            "application/vnd.oasis.opendocument.spreadsheet": "OpenDocument Spreadsheet",
            "application/vnd.oasis.opendocument.text": "OpenDocument Text",
            "application/epub+zip": "Epub",
            "text/markdown": "Markdown",
            "image/bmp": "Bitmap Image",
            "image/gif": "GIF Image",
            "image/jpeg": "JPEG Image",
            "image/jpg": "JPEG Image",
            "image/png": "PNG Image",
            "text/plain": "Text Document",
            "text/css": "Cascade Stylesheet",
            "text/html": "HTML Document",
            "text/xml": "XML Document",
            "application/javascript": "JavaScript Document",
            "application/json": "JSON Document",
            "application/x-python": "Python Document",
            "application/x-lua": "Lua Document",
            "application/x-shellscript": "Shell Script",
            "text/x-c": "C Document",
            "text/x-cplusplus": "C++ Document",
            "application/pdf": "PDF Document",
            "application/zip": "ZIP Archive",
            "audio/aac": "AAC Audio",
            "audio/mp3": "MP3 Audio",
            "audio/mp4": "MP4 Audio",
            "audio/mpeg": "MPEG Audio",
            "audio/ogg": "OGG Audio",
            "audio/oga": "OGG Audio",
            "audio/wav": "WAV Audio",
            "audio/webm": "WEBM Audio",
            "video/mp4": "MP4 Video",
            "video/ogg": "OGG Video",
            "video/webm": "WEBM Video",
            "video/ogv": "OGG Video",
            "video/x-ms-video": "AVI Video",
            "video/x-flv": "FLV Video",
            "video/x-matroska": "MKV Video",
            "application/x-ipkg": "Itsy Package",
            "osjs/document": "OS.js Document",
            "osjs/draw": "OS.js Image",
            "osjs/project": "OS.js Project"
        },
        "mapping": {
            ".odp": "application/vnd.oasis.opendocument.presentation",
            ".ods": "application/vnd.oasis.opendocument.spreadsheet",
            ".odt": "application/vnd.oasis.opendocument.text",
            ".epub": "application/epub+zip",
            ".md": "text/plain",
            ".bmp": "image/bmp",
            ".css": "text/css",
            ".gif": "image/gif",
            ".htm": "text/html",
            ".html": "text/html",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".js": "application/javascript",
            ".json": "application/json",
            ".lua": "application/x-lua",
            ".sh": "application/x-shellscript",
            ".c": "text/x-c",
            ".cpp": "text/x-cplusplus",
            ".cc": "text/x-cplusplus",
            ".otf": "font/opentype",
            ".ttf": "font/opentype",
            ".png": "image/png",
            ".zip": "application/zip",
            ".aac": "audio/aac",
            ".mp4": "video/mp4",
            ".m4a": "audio/mp4",
            ".mp1": "audio/mpeg",
            ".mp2": "audio/mpeg",
            ".mp3": "audio/mpeg",
            ".mpg": "audio/mpeg",
            ".mpeg": "audio/mpeg",
            ".oga": "audio/ogg",
            ".ogg": "audio/ogg",
            ".wav": "audio/wav",
            ".webm": "video/webm",
            ".m4v": "video/mp4",
            ".ogv": "video/ogg",
            ".avi": "video/x-ms-video",
            ".flv": "video/x-flv",
            ".mkv": "video/x-matroska",
            ".py": "application/x-python",
            ".xml": "text/xml",
            ".txt": "text/plain",
            ".log": "text/plain",
            ".doc": "text/plain",
            ".pdf": "application/pdf",
            ".ipk": "application/x-ipkg",
            ".odbeat": "osjs/dbeat",
            ".oplist": "osjs/playlist",
            ".odoc": "osjs/document",
            ".odraw": "osjs/draw",
            ".oproj": "osjs/project",
            "default": "application/octet-stream"
        }
    },
    "WM": {
        "exec": "CoreWM",
        "args": {
            "defaults": {}
        }
    },
    "VFS": {
        "MaxUploadSize": 64000000,
        "Home": "home:///",
        "GoogleDrive": {
            "Enabled": false
        },
        "OneDrive": {
            "Enabled": false
        },
        "Dropbox": {
            "Enabled": false
        },
        "LocalStorage": {
            "Enabled": false
        },
        "Mountpoints": {
            "applications": {
                "enabled": true,
                "transport": "Applications",
                "icon": "places/user-bookmarks.png",
                "description": "Applications",
                "visible": false
            },
            "desktop": {
                "enabled": true,
                "icon": "places/desktop.png",
                "description": "Desktop",
                "options": {
                    "alias": "downloads://",
                    "path": "downloads://"
                },
                "visible": false
            },
            "osjs": {
                "enabled": true,
                "transport": "OSjs",
                "icon": "devices/harddrive.png",
                "description": "Skylark",
                "visible": false
            },
            "home": {
                "enabled": true,
                "icon": "places/folder_home.png",
                "description": "Home",
                "visible": true
            },
            "shared": {
                "enabled": false,
                "description": "Shared",
                "icon": "places/folder-publicshare.png"
            },
            "downloads": {
                "enabled": true,
                "description": "Downloads",
                "icon": "devices/harddrive.png"
            }
        }
    },
    "Connection": {
        "Type": "http",
        "Handler": "shadow",
        "RootURI": "",
        "APIURI": "API",
        "FSURI": "FS",
        "MetadataURI": "packages.js",
        "ThemeURI": "themes/styles",
        "SoundURI": "themes/sounds",
        "IconURI": "themes/icons",
        "FontURI": "themes/fonts",
        "PackageURI": "packages",
        "AppendVersion": "",
        "PreloadParallel": 3,
        "Dist": "dist"
    },
    "BugReporting": {
        "enabled": true,
        "url": "//github.com/Othernet-Project/RxOS-UI2/issues/new?title=%TITLE%&body=%BODY%",
        "options": {
            "issue": true,
            "title": "[Automated Bugreport] YOUR TITLE HERE",
            "message": "This bugreport was generated by Othernet Skylark"
        }
    },
    "ShowQuitWarning": false,
    "ReloadOnShutdown": true,
    "PreloadOnBoot": [],
    "Watermark": {
        "enabled": true,
        "lines": [
            "Skylark 5.6 (c) 2019 Othernet Inc"
        ]
    },
    "DropboxAPI": {
        "ClientKey": ""
    },
    "GoogleAPI": {
        "ClientId": ""
    },
    "WindowsLiveAPI": {
        "ClientId": ""
    },
    "Locale": "en_EN",
    "LocaleOptions": {
        "AutoDetect": true,
        "RTL": [
            "az",
            "fa",
            "he",
            "uz",
            "zh",
            "ar"
        ]
    }
};

        var rootURI = window.location.pathname || '/';
        if ( window.location.protocol === 'file:' ) {
          rootURI = '';
        }

        var replace = ['RootURI', 'APIURI', 'FSURI', 'MetadataURI', 'ThemeURI', 'SoundURI', 'IconURI', 'PackageURI'];
        replace.forEach(function(val) {
          if ( _cache[val] ) {
            _cache[val] = _cache[val].replace(/^\//, rootURI);
          }
        });

        var preloads = _cache.Preloads;
        if ( preloads ) {
          preloads.forEach(function(item, key) {
            if ( item && item.src && item.src.match(/^\//) ) {
              preloads[key].src = item.src.replace(/^\//, rootURI);
            }
          });
        }

        var dev =_cache.Connection.Dist === 'dist-dev';
        _cache.MOCHAMODE = dev && window.location.hash === '#mocha';
        _cache.DEVMODE = dev && window.location.hash === '#developer';
      }

      return Object.freeze(_cache);
    };
  })();
})();
