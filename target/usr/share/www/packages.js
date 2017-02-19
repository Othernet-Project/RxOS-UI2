(function() {
  window.OSjs = window.OSjs || {}
  OSjs.Core = OSjs.Core || {}
  OSjs.Core.getMetadata = function() {
    return Object.freeze({
    "default/About": {
        "className": "ApplicationAbout",
        "name": "About Skylark",
        "description": "About Skylark",
        "singular": true,
        "category": "system",
        "icon": "apps/help-browser.png",
        "preload": [
            {
                "type": "javascript",
                "src": "combined.js"
            },
            {
                "type": "stylesheet",
                "src": "combined.css"
            },
            {
                "src": "scheme.html",
                "type": "scheme"
            }
        ],
        "type": "application",
        "path": "default/About",
        "build": {},
        "repo": "default"
    },
    "default/Calculator": {
        "className": "ApplicationCalculator",
        "name": "Calculator",
        "names": {
            "bg_Bg": "Клакулатор",
            "fr_FR": "Calculatrice",
            "it_IT": "Calcolatrice",
            "ko_KR": "계산기",
            "nl_NL": "Rekenmachine",
            "no_NO": "Kalkulator",
            "pl_PL": "Kalkulator",
            "ru_RU": "Калькулятор",
            "sk_SK": "Kalkulačka",
            "tr_TR": "Hesap Makinesi",
            "vi_VN": "Máy tính"
        },
        "icon": "apps/calc.png",
        "category": "office",
        "preload": [
            {
                "type": "javascript",
                "src": "combined.js"
            },
            {
                "type": "stylesheet",
                "src": "combined.css"
            },
            {
                "src": "scheme.html",
                "type": "scheme"
            }
        ],
        "type": "application",
        "path": "default/Calculator",
        "build": {},
        "repo": "default"
    },
    "default/CoreWM": {
        "className": "CoreWM",
        "name": "OS.js Window Manager",
        "names": {
            "bg_BG": "Мениджър на прозорци на OS.js",
            "de_DE": "OS.js Fenster-Manager",
            "es_ES": "OS.js Window Manager",
            "fr_FR": "Gestionnaire de fenêtre OS.js",
            "it_IT": "OS.js Gestore Finestre",
            "ko_KR": "OS.js 윈도우 관리자",
            "nl_NL": "OS.js venster beheer",
            "no_NO": "OS.js Vinduhåndterer",
            "pl_PL": "Menedżer Okien OS.js",
            "ru_RU": "OS.js Оконный менеджер",
            "sk_SK": "Správca Okien OS.js",
            "tr_TR": "OS.js Pencere Yöneticisi",
            "vi_VN": "Quản lí cửa sổ OS.js"
        },
        "singular": true,
        "type": "windowmanager",
        "icon": "apps/gnome-window-manager.png",
        "splash": false,
        "preload": [
            {
                "src": "scheme.html",
                "type": "scheme"
            },
            {
                "type": "javascript",
                "src": "combined.js"
            },
            {
                "type": "stylesheet",
                "src": "combined.css"
            }
        ],
        "panelItems": {
            "AppMenu": {
                "Name": "AppMenu",
                "Description": "Application Menu",
                "Icon": "actions/stock_about.png",
                "HasOptions": false
            },
            "Buttons": {
                "Name": "Buttons",
                "Description": "Button Bar",
                "Icon": "actions/stock_about.png"
            },
            "Clock": {
                "Name": "Clock",
                "Description": "View the time",
                "Icon": "status/appointment-soon.png",
                "HasOptions": true
            },
            "NotificationArea": {
                "Name": "NotificationArea",
                "Description": "View notifications",
                "Icon": "apps/gnome-panel-notification-area.png"
            },
            "Search": {
                "Name": "Search",
                "Description": "Perform searches",
                "Icon": "actions/find.png",
                "HasOptions": true
            },
            "Weather": {
                "Name": "Weather",
                "Description": "Weather notification",
                "Icon": "status/weather-few-clouds.png"
            },
            "WindowList": {
                "Name": "Window List",
                "Description": "Toggle between open windows",
                "Icon": "apps/xfwm4.png"
            }
        },
        "path": "default/CoreWM",
        "build": {},
        "repo": "default"
    },
    "default/FileManager": {
        "className": "ApplicationFileManager",
        "name": "File Manager",
        "description": "The default file manager",
        "names": {
            "bg_BG": "Файлов мениджър",
            "de_DE": "Dateimanager",
            "fr_FR": "Explorateur de fichier",
            "it_IT": "Gestore File",
            "nl_NL": "bestands beheer",
            "no_NO": "Fil-håndtering",
            "pl_PL": "Menedżer Plików",
            "ko_KR": "파일 탐색기",
            "sk_SK": "Správca súborov",
            "ru_RU": "Файловый менеджер",
            "tr_TR": "Dosya Yöneticisi",
            "vi_VN": "Quản lí file"
        },
        "descriptions": {
            "bg_BG": "Стандартния файлов мениджър",
            "de_DE": "Standardmäßiger Dateimanager",
            "fr_FR": "Gestionnaire de fichier par défaut",
            "it_IT": "Il gestore file predefinito",
            "nl_NL": "Standaard bestands beheerder",
            "no_NO": "Standard Fil-håndtering program",
            "pl_PL": "Domyślny Menedżer Plików",
            "ko_KR": "기본 파일 관리자",
            "sk_SK": "Štandardný správca súborov",
            "ru_RU": "Стандартный файловый менеджер",
            "tr_TR": "Varsayılan dosya yöneticisi",
            "vi_VN": "Trình quản lí file mặc định"
        },
        "category": "utilities",
        "icon": "apps/file-manager.png",
        "preload": [
            {
                "type": "javascript",
                "src": "combined.js"
            },
            {
                "type": "stylesheet",
                "src": "combined.css"
            },
            {
                "src": "scheme.html",
                "type": "scheme"
            }
        ],
        "type": "application",
        "path": "default/FileManager",
        "build": {},
        "repo": "default"
    },
    "default/LogViewer": {
        "className": "ApplicationLogViewer",
        "name": "Log Viewer",
        "mime": null,
        "icon": "apps/logviewer.png",
        "category": "utilities",
        "preload": [
            {
                "type": "javascript",
                "src": "combined.js"
            },
            {
                "src": "scheme.html",
                "type": "scheme"
            },
            {
                "type": "stylesheet",
                "src": "combined.css"
            }
        ],
        "type": "application",
        "path": "default/LogViewer",
        "build": {},
        "repo": "default"
    },
    "default/Messaging": {
        "className": "ApplicationMessaging",
        "name": "Messages",
        "mime": null,
        "icon": "apps/messaging.png",
        "category": "utilities",
        "preload": [
            {
                "type": "javascript",
                "src": "combined.js"
            },
            {
                "src": "scheme.html",
                "type": "scheme"
            },
            {
                "type": "stylesheet",
                "src": "combined.css"
            }
        ],
        "type": "application",
        "path": "default/Messaging",
        "build": {},
        "repo": "default"
    },
    "default/Network": {
        "className": "ApplicationNetconf",
        "name": "Network",
        "mime": null,
        "icon": "apps/wifi.png",
        "category": "utilities",
        "preload": [
            {
                "type": "javascript",
                "src": "combined.js"
            },
            {
                "src": "scheme.html",
                "type": "scheme"
            },
            {
                "type": "stylesheet",
                "src": "combined.css"
            }
        ],
        "type": "application",
        "path": "default/Network",
        "build": {},
        "repo": "default"
    },
    "default/News": {
        "className": "ApplicationNews",
        "name": "News",
        "mime": [],
        "icon": "apps/news.png",
        "category": "utilities",
        "preload": [
            {
                "type": "javascript",
                "src": "combined.js"
            },
            {
                "src": "scheme.html",
                "type": "scheme"
            }
        ],
        "type": "application",
        "path": "default/News",
        "build": {},
        "repo": "default"
    },
    "default/Preview": {
        "className": "ApplicationPreview",
        "name": "Preview",
        "description": "Preview image files",
        "names": {
            "bg_BG": "Преглед на изображения",
            "de_DE": "Vorschau",
            "fr_FR": "Visionneuse",
            "it_IT": "Anteprima Immagini",
            "ko_KR": "미리보기",
            "nl_NL": "Foto viewer",
            "no_NO": "Forhåndsviser",
            "pl_PL": "Podgląd",
            "ru_RU": "Просмотрщик",
            "sk_SK": "Prehliadač obrázkov",
            "tr_TR": "Önizle",
            "vi_VN": "Trình xem ảnh"
        },
        "descriptions": {
            "bg_BG": "Преглед на изображения",
            "de_DE": "Bildervorschau",
            "fr_FR": "Visionneuse de photos",
            "it_IT": "Anteprima Immagini",
            "ko_KR": "이미지 파일을 미리 봅니다",
            "nl_NL": "Foto viewer",
            "no_NO": "Forhåndsvisning av bilde-filer",
            "pl_PL": "Podgląd zdjęć",
            "ru_RU": "Просмотрщик изображений",
            "sk_SK": "Prehliadač obrázkov",
            "tr_TR": "resim dosyalarını önizle",
            "vi_VN": "Trình xem ảnh"
        },
        "mime": [
            "^image",
            "^video"
        ],
        "category": "multimedia",
        "icon": "mimetypes/image.png",
        "preload": [
            {
                "type": "javascript",
                "src": "combined.js"
            },
            {
                "type": "stylesheet",
                "src": "combined.css"
            },
            {
                "src": "scheme.html",
                "type": "scheme"
            }
        ],
        "type": "application",
        "path": "default/Preview",
        "build": {},
        "repo": "default"
    },
    "default/Reader": {
        "className": "ApplicationReader",
        "name": "Reader",
        "icon": "apps/reader.png",
        "mime": [
            "text\\/html",
            "application\\/pdf",
            "application\\/vnd.oasis.opendocument.presentation",
            "application\\/vnd.oasis.opendocument.spreadsheet",
            "application\\/vnd.oasis.opendocument.text",
            "video\\/ogg",
            "video\\/mp4",
            "video\\/webm",
            "video\\/ogv",
            "audio\\/mp3",
            "audio\\/oga",
            "audio\\/ogg",
            "audio\\/wav",
            "text\\/vtt",
            "text\\/srt",
            "application\\/epub+zip",
            "application\\/epub",
            "text\\/markdown"
        ],
        "category": "utilities",
        "preload": [
            {
                "type": "javascript",
                "src": "combined.js"
            },
            {
                "src": "scheme.html",
                "type": "scheme"
            }
        ],
        "type": "application",
        "path": "default/Reader",
        "build": {},
        "repo": "default"
    },
    "default/Textpad": {
        "className": "ApplicationTextpad",
        "name": "Textpad",
        "description": "Simple text editor",
        "names": {
            "bg_BG": "Текстов редактор",
            "de_DE": "Texteditor",
            "fr_FR": "Éditeur de texte",
            "it_IT": "Editor Testi",
            "ko_KR": "텍스트패드",
            "nl_NL": "Notities",
            "no_NO": "Tekstblokk",
            "pl_PL": "Notatnik",
            "ru_RU": "Редактор текста",
            "sk_SK": "Poznámkový blok",
            "tr_TR": "Basit Bir Metin Düzenleyicisi",
            "vi_VN": "Trình sửa văn bản"
        },
        "descriptions": {
            "bg_BG": "Стандартен текстов редактор",
            "de_DE": "Einfacher Texteditor",
            "fr_FR": "Éditeur de texte simple",
            "it_IT": "Semplice editor di testi",
            "ko_KR": "간단한 텍스트 편집기",
            "nl_NL": "Eenvoudige Tekstverwerker",
            "no_NO": "Simpel tekst redigering",
            "pl_PL": "Prosty edytor tekstu",
            "ru_RU": "Простой текстовый редактор",
            "sk_SK": "Jednoduchý textový editor",
            "tr_TR": "Basit Bir Metin Düzenleyicisi",
            "vi_VN": "Trình sửa văn bản đơn giản"
        },
        "mime": [
            "^text",
            "inode\\/x\\-empty",
            "application\\/x\\-empty",
            "application\\/x\\-lua",
            "application\\/x\\-python",
            "application\\/javascript",
            "application\\/json"
        ],
        "category": "utilities",
        "icon": "apps/accessories-text-editor.png",
        "preload": [
            {
                "type": "javascript",
                "src": "combined.js"
            },
            {
                "type": "stylesheet",
                "src": "combined.css"
            },
            {
                "src": "scheme.html",
                "type": "scheme"
            }
        ],
        "type": "application",
        "path": "default/Textpad",
        "build": {},
        "repo": "default"
    },
    "default/Tuner": {
        "className": "ApplicationTuner",
        "name": "Tuner",
        "mime": null,
        "icon": "apps/tuner.png",
        "category": "utilities",
        "preload": [
            {
                "type": "javascript",
                "src": "combined.js"
            },
            {
                "src": "scheme.html",
                "type": "scheme"
            },
            {
                "type": "stylesheet",
                "src": "combined.css"
            }
        ],
        "type": "application",
        "path": "default/Tuner",
        "build": {},
        "repo": "default"
    },
    "default/Weather": {
        "className": "ApplicationWeather",
        "name": "Weather",
        "mime": null,
        "icon": "apps/weather.png",
        "preload": [
            {
                "type": "javascript",
                "src": "combined.js"
            }
        ],
        "type": "application",
        "path": "default/Weather",
        "build": {},
        "repo": "default"
    },
    "default/WhatsNew": {
        "className": "ApplicationWhatsNew",
        "name": "What's New",
        "mime": null,
        "icon": "apps/whatsnew.png",
        "category": "utilities",
        "preload": [
            {
                "type": "javascript",
                "src": "combined.js"
            },
            {
                "src": "scheme.html",
                "type": "scheme"
            },
            {
                "type": "stylesheet",
                "src": "combined.css"
            }
        ],
        "type": "application",
        "path": "default/WhatsNew",
        "build": {},
        "repo": "default"
    },
    "default/Wikipedia": {
        "className": "ApplicationWikireader",
        "name": "Wikipedia",
        "mime": null,
        "icon": "apps/wikireader.png",
        "category": "utilities",
        "preload": [
            {
                "type": "javascript",
                "src": "combined.js"
            },
            {
                "src": "scheme.html",
                "type": "scheme"
            },
            {
                "type": "stylesheet",
                "src": "combined.css"
            }
        ],
        "type": "application",
        "path": "default/Wikipedia",
        "build": {},
        "repo": "default"
    }
});
  };
})();
