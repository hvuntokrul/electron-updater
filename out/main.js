"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getChannelFilename = getChannelFilename;
exports.newBaseUrl = newBaseUrl;
exports.newUrlFromBase = newUrlFromBase;
Object.defineProperty(exports, "AppUpdater", {
  enumerable: true,
  get: function () {
    return _AppUpdater().AppUpdater;
  }
});
Object.defineProperty(exports, "NoOpLogger", {
  enumerable: true,
  get: function () {
    return _AppUpdater().NoOpLogger;
  }
});
Object.defineProperty(exports, "Provider", {
  enumerable: true,
  get: function () {
    return _Provider().Provider;
  }
});
Object.defineProperty(exports, "AppImageUpdater", {
  enumerable: true,
  get: function () {
    return _AppImageUpdater().AppImageUpdater;
  }
});
Object.defineProperty(exports, "MacUpdater", {
  enumerable: true,
  get: function () {
    return _MacUpdater().MacUpdater;
  }
});
Object.defineProperty(exports, "NsisUpdater", {
  enumerable: true,
  get: function () {
    return _NsisUpdater().NsisUpdater;
  }
});
exports.UpdaterSignal = exports.UPDATE_DOWNLOADED = exports.DOWNLOAD_PROGRESS = void 0;

function _url() {
  const data = require("url");

  _url = function () {
    return data;
  };

  return data;
}

function _AppUpdater() {
  const data = require("./AppUpdater");

  _AppUpdater = function () {
    return data;
  };

  return data;
}

function _Provider() {
  const data = require("./providers/Provider");

  _Provider = function () {
    return data;
  };

  return data;
}

function _AppImageUpdater() {
  const data = require("./AppImageUpdater");

  _AppImageUpdater = function () {
    return data;
  };

  return data;
}

function _MacUpdater() {
  const data = require("./MacUpdater");

  _MacUpdater = function () {
    return data;
  };

  return data;
}

function _NsisUpdater() {
  const data = require("./NsisUpdater");

  _NsisUpdater = function () {
    return data;
  };

  return data;
}

// autoUpdater to mimic electron bundled autoUpdater
let _autoUpdater;

function doLoadAutoUpdater() {
  // tslint:disable:prefer-conditional-expression
  if (process.platform === "win32") {
    _autoUpdater = new (require("./NsisUpdater").NsisUpdater)();
  } else if (process.platform === "darwin") {
    _autoUpdater = new (require("./MacUpdater").MacUpdater)();
  } else {
    _autoUpdater = new (require("./AppImageUpdater").AppImageUpdater)();
  }

  return _autoUpdater;
}

Object.defineProperty(exports, "autoUpdater", {
  enumerable: true,
  get: () => {
    return _autoUpdater || doLoadAutoUpdater();
  }
});

function getChannelFilename(channel) {
  return `${channel}.yml`;
}

const DOWNLOAD_PROGRESS = "download-progress";
exports.DOWNLOAD_PROGRESS = DOWNLOAD_PROGRESS;
const UPDATE_DOWNLOADED = "update-downloaded";
exports.UPDATE_DOWNLOADED = UPDATE_DOWNLOADED;

class UpdaterSignal {
  constructor(emitter) {
    this.emitter = emitter;
  }
  /**
   * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
   */


  login(handler) {
    addHandler(this.emitter, "login", handler);
  }

  progress(handler) {
    addHandler(this.emitter, DOWNLOAD_PROGRESS, handler);
  }

  updateDownloaded(handler) {
    addHandler(this.emitter, UPDATE_DOWNLOADED, handler);
  }

  updateCancelled(handler) {
    addHandler(this.emitter, "update-cancelled", handler);
  }

}

exports.UpdaterSignal = UpdaterSignal;
const isLogEvent = false;

function addHandler(emitter, event, handler) {
  if (isLogEvent) {
    emitter.on(event, (...args) => {
      console.log("%s %s", event, args);
      handler(...args);
    });
  } else {
    emitter.on(event, handler);
  }
} // if baseUrl path doesn't ends with /, this path will be not prepended to passed pathname for new URL(input, base)

/** @internal */


function newBaseUrl(url) {
  const result = new (_url().URL)(url);

  if (!result.pathname.endsWith("/")) {
    result.pathname += "/";
  }

  return result;
} // addRandomQueryToAvoidCaching is false by default because in most cases URL already contains version number,
// so, it makes sense only for Generic Provider for channel files


function newUrlFromBase(pathname, baseUrl, addRandomQueryToAvoidCaching = false) {
  const result = new (_url().URL)(pathname, baseUrl); // search is not propagated (search is an empty string if not specified)

  const search = baseUrl.search;

  if (search != null && search.length !== 0) {
    result.search = search;
  } else if (addRandomQueryToAvoidCaching) {
    result.search = `noCache=${Date.now().toString(32)}`;
  }

  return result;
} 
// __ts-babel@6.0.4
//# sourceMappingURL=main.js.map