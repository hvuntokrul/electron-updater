"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NoOpLogger = exports.AppUpdater = void 0;

function _builderUtilRuntime() {
  const data = require("builder-util-runtime");

  _builderUtilRuntime = function () {
    return data;
  };

  return data;
}

function _crypto() {
  const data = require("crypto");

  _crypto = function () {
    return data;
  };

  return data;
}

function _electron() {
  const data = require("electron");

  _electron = function () {
    return data;
  };

  return data;
}

function _events() {
  const data = require("events");

  _events = function () {
    return data;
  };

  return data;
}

function _fsExtra() {
  const data = require("fs-extra");

  _fsExtra = function () {
    return data;
  };

  return data;
}

function _jsYaml() {
  const data = require("js-yaml");

  _jsYaml = function () {
    return data;
  };

  return data;
}

function _lazyVal() {
  const data = require("lazy-val");

  _lazyVal = function () {
    return data;
  };

  return data;
}

var path = _interopRequireWildcard(require("path"));

function _semver() {
  const data = require("semver");

  _semver = function () {
    return data;
  };

  return data;
}

function _DownloadedUpdateHelper() {
  const data = require("./DownloadedUpdateHelper");

  _DownloadedUpdateHelper = function () {
    return data;
  };

  return data;
}

function _ElectronAppAdapter() {
  const data = require("./ElectronAppAdapter");

  _ElectronAppAdapter = function () {
    return data;
  };

  return data;
}

function _electronHttpExecutor() {
  const data = require("./electronHttpExecutor");

  _electronHttpExecutor = function () {
    return data;
  };

  return data;
}

function _GenericProvider() {
  const data = require("./providers/GenericProvider");

  _GenericProvider = function () {
    return data;
  };

  return data;
}

function _main() {
  const data = require("./main");

  _main = function () {
    return data;
  };

  return data;
}

function _providerFactory() {
  const data = require("./providerFactory");

  _providerFactory = function () {
    return data;
  };

  return data;
}

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

class AppUpdater extends _events().EventEmitter {
  constructor(options, app) {
    super();
    /**
     * Whether to automatically download an update when it is found.
     */

    this.autoDownload = true;
    /**
     * Whether to automatically install a downloaded update on app quit (if `quitAndInstall` was not called before).
     */

    this.autoInstallOnAppQuit = true;
    /**
     * *GitHub provider only.* Whether to allow update to pre-release versions. Defaults to `true` if application version contains prerelease components (e.g. `0.12.1-alpha.1`, here `alpha` is a prerelease component), otherwise `false`.
     *
     * If `true`, downgrade will be allowed (`allowDowngrade` will be set to `true`).
     */

    this.allowPrerelease = false;
    /**
     * *GitHub provider only.* Get all release notes (from current version to latest), not just the latest.
     * @default false
     */

    this.fullChangelog = false;
    /**
     * Whether to allow version downgrade (when a user from the beta channel wants to go back to the stable channel).
     *
     * Taken in account only if channel differs (pre-release version component in terms of semantic versioning).
     *
     * @default false
     */

    this.allowDowngrade = false;
    this._channel = null;
    this.downloadedUpdateHelper = null;
    /**
     *  The request headers.
     */

    this.requestHeaders = null;
    this._logger = console; // noinspection JSUnusedGlobalSymbols

    /**
     * For type safety you can use signals, e.g. `autoUpdater.signals.updateDownloaded(() => {})` instead of `autoUpdater.on('update-available', () => {})`
     */

    this.signals = new (_main().UpdaterSignal)(this);
    this._appUpdateConfigPath = null;
    this.clientPromise = null;
    this.stagingUserIdPromise = new (_lazyVal().Lazy)(() => this.getOrCreateStagingUserId()); // public, allow to read old config for anyone

    /** @internal */

    this.configOnDisk = new (_lazyVal().Lazy)(() => this.loadUpdateConfig());
    this.checkForUpdatesPromise = null;
    this.updateInfoAndProvider = null;
    /**
     * @private
     * @internal
     */

    this._testOnlyOptions = null;
    this.on("error", error => {
      this._logger.error(`Error: ${error.stack || error.message}`);
    });

    if (app == null) {
      this.app = new (_ElectronAppAdapter().ElectronAppAdapter)();
      this.httpExecutor = new (_electronHttpExecutor().ElectronHttpExecutor)((authInfo, callback) => this.emit("login", authInfo, callback));
    } else {
      this.app = app;
      this.httpExecutor = null;
    }

    const currentVersionString = this.app.version;
    const currentVersion = (0, _semver().parse)(currentVersionString);

    if (currentVersion == null) {
      throw (0, _builderUtilRuntime().newError)(`App version is not a valid semver version: "${currentVersionString}"`, "ERR_UPDATER_INVALID_VERSION");
    }

    this.currentVersion = currentVersion;
    this.allowPrerelease = hasPrereleaseComponents(currentVersion);

    if (options != null) {
      this.setFeedURL(options);

      if (typeof options !== "string" && options.requestHeaders) {
        this.requestHeaders = options.requestHeaders;
      }
    }
  }
  /**
   * Get the update channel. Not applicable for GitHub. Doesn't return `channel` from the update configuration, only if was previously set.
   */


  get channel() {
    return this._channel;
  }
  /**
   * Set the update channel. Not applicable for GitHub. Overrides `channel` in the update configuration.
   *
   * `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
   */


  set channel(value) {
    if (this._channel != null) {
      // noinspection SuspiciousTypeOfGuard
      if (typeof value !== "string") {
        throw (0, _builderUtilRuntime().newError)(`Channel must be a string, but got: ${value}`, "ERR_UPDATER_INVALID_CHANNEL");
      } else if (value.length === 0) {
        throw (0, _builderUtilRuntime().newError)(`Channel must be not an empty string`, "ERR_UPDATER_INVALID_CHANNEL");
      }
    }

    this._channel = value;
    this.allowDowngrade = true;
  } // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols


  get netSession() {
    return (0, _electronHttpExecutor().getNetSession)();
  }
  /**
   * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
   * Set it to `null` if you would like to disable a logging feature.
   */


  get logger() {
    return this._logger;
  }

  set logger(value) {
    this._logger = value == null ? new NoOpLogger() : value;
  } // noinspection JSUnusedGlobalSymbols

  /**
   * test only
   * @private
   */


  set updateConfigPath(value) {
    this.clientPromise = null;
    this._appUpdateConfigPath = value;
    this.configOnDisk = new (_lazyVal().Lazy)(() => this.loadUpdateConfig());
  } //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols


  getFeedURL() {
    return "Deprecated. Do not use it.";
  }
  /**
   * Configure update provider. If value is `string`, [GenericServerOptions](/configuration/publish#genericserveroptions) will be set with value as `url`.
   * @param options If you want to override configuration in the `app-update.yml`.
   */


  setFeedURL(options) {
    const runtimeOptions = this.createProviderRuntimeOptions(); // https://github.com/electron-userland/electron-builder/issues/1105

    let provider;

    if (typeof options === "string") {
      provider = new (_GenericProvider().GenericProvider)({
        provider: "generic",
        url: options
      }, this, { ...runtimeOptions,
        isUseMultipleRangeRequest: (0, _providerFactory().isUrlProbablySupportMultiRangeRequests)(options)
      });
    } else {
      provider = (0, _providerFactory().createClient)(options, this, runtimeOptions);
    }

    this.clientPromise = Promise.resolve(provider);
  }
  /**
   * Asks the server whether there is an update.
   */


  checkForUpdates() {
    let checkForUpdatesPromise = this.checkForUpdatesPromise;

    if (checkForUpdatesPromise != null) {
      this._logger.info("Checking for update (already in progress)");

      return checkForUpdatesPromise;
    }

    const nullizePromise = () => this.checkForUpdatesPromise = null;

    this._logger.info("Checking for update");

    checkForUpdatesPromise = this.doCheckForUpdates().then(it => {
      nullizePromise();
      return it;
    }).catch(e => {
      nullizePromise();
      this.emit("error", e, `Cannot check for updates: ${(e.stack || e).toString()}`);
      throw e;
    });
    this.checkForUpdatesPromise = checkForUpdatesPromise;
    return checkForUpdatesPromise;
  }

  isUpdaterActive() {
    if (!this.app.isPackaged) {
      this._logger.info("Skip checkForUpdatesAndNotify because application is not packed");

      return false;
    }

    return true;
  } // noinspection JSUnusedGlobalSymbols


  checkForUpdatesAndNotify(downloadNotification) {
    if (!this.isUpdaterActive()) {
      return Promise.resolve(null);
    }

    return this.checkForUpdates().then(it => {
      const downloadPromise = it.downloadPromise;

      if (downloadPromise == null) {
        const debug = this._logger.debug;

        if (debug != null) {
          debug("checkForUpdatesAndNotify called, downloadPromise is null");
        }

        return it;
      }

      downloadPromise.then(() => {
        const notificationContent = this.formatDownloadNotification(it.updateInfo.version, this.app.name, downloadNotification);
        new (_electron().Notification)(notificationContent).show();
      });
      return it;
    });
  }

  formatDownloadNotification(version, appName, downloadNotification) {
    if (downloadNotification == null) {
      downloadNotification = {
        title: "A new update is ready to install",
        body: `{appName} version {version} has been downloaded and will be automatically installed on exit`
      };
    }

    downloadNotification = {
      title: downloadNotification.title.replace("{appName}", appName).replace("{version}", version),
      body: downloadNotification.body.replace("{appName}", appName).replace("{version}", version)
    };
    return downloadNotification;
  }

  async isStagingMatch(updateInfo) {
    const rawStagingPercentage = updateInfo.stagingPercentage;
    let stagingPercentage = rawStagingPercentage;

    if (stagingPercentage == null) {
      return true;
    }

    stagingPercentage = parseInt(stagingPercentage, 10);

    if (isNaN(stagingPercentage)) {
      this._logger.warn(`Staging percentage is NaN: ${rawStagingPercentage}`);

      return true;
    } // convert from user 0-100 to internal 0-1


    stagingPercentage = stagingPercentage / 100;
    const stagingUserId = await this.stagingUserIdPromise.value;

    const val = _builderUtilRuntime().UUID.parse(stagingUserId).readUInt32BE(12);

    const percentage = val / 0xFFFFFFFF;

    this._logger.info(`Staging percentage: ${stagingPercentage}, percentage: ${percentage}, user id: ${stagingUserId}`);

    return percentage < stagingPercentage;
  }

  computeFinalHeaders(headers) {
    if (this.requestHeaders != null) {
      Object.assign(headers, this.requestHeaders);
    }

    return headers;
  }

  async isUpdateAvailable(updateInfo) {
    const latestVersion = (0, _semver().parse)(updateInfo.version);

    if (latestVersion == null) {
      throw (0, _builderUtilRuntime().newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${updateInfo.version}"`, "ERR_UPDATER_INVALID_VERSION");
    }

    const currentVersion = this.currentVersion;

    if ((0, _semver().eq)(latestVersion, currentVersion)) {
      return false;
    }

    const isStagingMatch = await this.isStagingMatch(updateInfo);

    if (!isStagingMatch) {
      return false;
    } // https://github.com/electron-userland/electron-builder/pull/3111#issuecomment-405033227
    // https://github.com/electron-userland/electron-builder/pull/3111#issuecomment-405030797


    const isLatestVersionNewer = (0, _semver().gt)(latestVersion, currentVersion);
    const isLatestVersionOlder = (0, _semver().lt)(latestVersion, currentVersion);

    if (isLatestVersionNewer) {
      return true;
    }

    return this.allowDowngrade && isLatestVersionOlder;
  }

  async getUpdateInfoAndProvider() {
    await this.app.whenReady();

    if (this.clientPromise == null) {
      this.clientPromise = this.configOnDisk.value.then(it => (0, _providerFactory().createClient)(it, this, this.createProviderRuntimeOptions()));
    }

    const client = await this.clientPromise;
    const stagingUserId = await this.stagingUserIdPromise.value;
    client.setRequestHeaders(this.computeFinalHeaders({
      "x-user-staging-id": stagingUserId
    }));
    return {
      info: await client.getLatestVersion(),
      provider: client
    };
  } // eslint-disable-next-line @typescript-eslint/explicit-function-return-type


  createProviderRuntimeOptions() {
    return {
      isUseMultipleRangeRequest: true,
      platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
      executor: this.httpExecutor
    };
  }

  async doCheckForUpdates() {
    this.emit("checking-for-update");
    const result = await this.getUpdateInfoAndProvider();
    const updateInfo = result.info;

    if (!(await this.isUpdateAvailable(updateInfo))) {
      this._logger.info(`Update for version ${this.currentVersion} is not available (latest version: ${updateInfo.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`);

      this.emit("update-not-available", updateInfo);
      return {
        versionInfo: updateInfo,
        updateInfo
      };
    }

    this.updateInfoAndProvider = result;
    this.onUpdateAvailable(updateInfo);
    const cancellationToken = new (_builderUtilRuntime().CancellationToken)(); //noinspection ES6MissingAwait

    return {
      versionInfo: updateInfo,
      updateInfo,
      cancellationToken,
      downloadPromise: this.autoDownload ? this.downloadUpdate(cancellationToken) : null
    };
  }

  onUpdateAvailable(updateInfo) {
    this._logger.info(`Found version ${updateInfo.version} (url: ${(0, _builderUtilRuntime().asArray)(updateInfo.files).map(it => it.url).join(", ")})`);

    this.emit("update-available", updateInfo);
  }
  /**
   * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
   * @returns {Promise<string>} Path to downloaded file.
   */


  downloadUpdate(cancellationToken = new (_builderUtilRuntime().CancellationToken)()) {
    const updateInfoAndProvider = this.updateInfoAndProvider;

    if (updateInfoAndProvider == null) {
      const error = new Error("Please check update first");
      this.dispatchError(error);
      return Promise.reject(error);
    }

    this._logger.info(`Downloading update from ${(0, _builderUtilRuntime().asArray)(updateInfoAndProvider.info.files).map(it => it.url).join(", ")}`);

    const errorHandler = e => {
      // https://github.com/electron-userland/electron-builder/issues/1150#issuecomment-436891159
      if (!(e instanceof _builderUtilRuntime().CancellationError)) {
        try {
          this.dispatchError(e);
        } catch (nestedError) {
          this._logger.warn(`Cannot dispatch error event: ${nestedError.stack || nestedError}`);
        }
      }

      return e;
    };

    try {
      return this.doDownloadUpdate({
        updateInfoAndProvider,
        requestHeaders: this.computeRequestHeaders(updateInfoAndProvider.provider),
        cancellationToken
      }).catch(e => {
        throw errorHandler(e);
      });
    } catch (e) {
      return Promise.reject(errorHandler(e));
    }
  }

  dispatchError(e) {
    this.emit("error", e, (e.stack || e).toString());
  }

  dispatchUpdateDownloaded(event) {
    this.emit(_main().UPDATE_DOWNLOADED, event);
  }

  async loadUpdateConfig() {
    if (this._appUpdateConfigPath == null) {
      this._appUpdateConfigPath = this.app.appUpdateConfigPath;
    }

    return (0, _jsYaml().load)(await (0, _fsExtra().readFile)(this._appUpdateConfigPath, "utf-8"));
  }

  computeRequestHeaders(provider) {
    const fileExtraDownloadHeaders = provider.fileExtraDownloadHeaders;

    if (fileExtraDownloadHeaders != null) {
      const requestHeaders = this.requestHeaders;
      return requestHeaders == null ? fileExtraDownloadHeaders : { ...fileExtraDownloadHeaders,
        ...requestHeaders
      };
    }

    return this.computeFinalHeaders({
      accept: "*/*"
    });
  }

  async getOrCreateStagingUserId() {
    const file = path.join(this.app.userDataPath, ".updaterId");

    try {
      const id = await (0, _fsExtra().readFile)(file, "utf-8");

      if (_builderUtilRuntime().UUID.check(id)) {
        return id;
      } else {
        this._logger.warn(`Staging user id file exists, but content was invalid: ${id}`);
      }
    } catch (e) {
      if (e.code !== "ENOENT") {
        this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${e}`);
      }
    }

    const id = _builderUtilRuntime().UUID.v5((0, _crypto().randomBytes)(4096), _builderUtilRuntime().UUID.OID);

    this._logger.info(`Generated new staging user ID: ${id}`);

    try {
      await (0, _fsExtra().outputFile)(file, id);
    } catch (e) {
      this._logger.warn(`Couldn't write out staging user ID: ${e}`);
    }

    return id;
  }
  /** @internal */


  get isAddNoCacheQuery() {
    const headers = this.requestHeaders; // https://github.com/electron-userland/electron-builder/issues/3021

    if (headers == null) {
      return true;
    }

    for (const headerName of Object.keys(headers)) {
      const s = headerName.toLowerCase();

      if (s === "authorization" || s === "private-token") {
        return false;
      }
    }

    return true;
  }

  async getOrCreateDownloadHelper() {
    let result = this.downloadedUpdateHelper;

    if (result == null) {
      const dirName = (await this.configOnDisk.value).updaterCacheDirName;
      const logger = this._logger;

      if (dirName == null) {
        logger.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
      }

      const cacheDir = path.join(this.app.baseCachePath, dirName || this.app.name);

      if (logger.debug != null) {
        logger.debug(`updater cache dir: ${cacheDir}`);
      }

      result = new (_DownloadedUpdateHelper().DownloadedUpdateHelper)(cacheDir);
      this.downloadedUpdateHelper = result;
    }

    return result;
  }

  async executeDownload(taskOptions) {
    const fileInfo = taskOptions.fileInfo;
    const downloadOptions = {
      headers: taskOptions.downloadUpdateOptions.requestHeaders,
      cancellationToken: taskOptions.downloadUpdateOptions.cancellationToken,
      sha2: fileInfo.info.sha2,
      sha512: fileInfo.info.sha512
    };

    if (this.listenerCount(_main().DOWNLOAD_PROGRESS) > 0) {
      downloadOptions.onProgress = it => this.emit(_main().DOWNLOAD_PROGRESS, it);
    }

    const updateInfo = taskOptions.downloadUpdateOptions.updateInfoAndProvider.info;
    const version = updateInfo.version;
    const packageInfo = fileInfo.packageInfo;

    function getCacheUpdateFileName() {
      // NodeJS URL doesn't decode automatically
      const urlPath = decodeURIComponent(taskOptions.fileInfo.url.pathname);

      if (urlPath.endsWith(`.${taskOptions.fileExtension}`)) {
        return path.posix.basename(urlPath);
      } else {
        // url like /latest, generate name
        return `update.${taskOptions.fileExtension}`;
      }
    }

    const downloadedUpdateHelper = await this.getOrCreateDownloadHelper();
    const cacheDir = downloadedUpdateHelper.cacheDirForPendingUpdate;
    await (0, _fsExtra().ensureDir)(cacheDir);
    const updateFileName = getCacheUpdateFileName();
    let updateFile = path.join(cacheDir, updateFileName);
    const packageFile = packageInfo == null ? null : path.join(cacheDir, `package-${version}${path.extname(packageInfo.path) || ".7z"}`);

    const done = async isSaveCache => {
      await downloadedUpdateHelper.setDownloadedFile(updateFile, packageFile, updateInfo, fileInfo, updateFileName, isSaveCache);
      await taskOptions.done({ ...updateInfo,
        downloadedFile: updateFile
      });
      return packageFile == null ? [updateFile] : [updateFile, packageFile];
    };

    const log = this._logger;
    const cachedUpdateFile = await downloadedUpdateHelper.validateDownloadedPath(updateFile, updateInfo, fileInfo, log);

    if (cachedUpdateFile != null) {
      updateFile = cachedUpdateFile;
      return await done(false);
    }

    const removeFileIfAny = async () => {
      await downloadedUpdateHelper.clear().catch(() => {// ignore
      });
      return await (0, _fsExtra().unlink)(updateFile).catch(() => {// ignore
      });
    };

    const tempUpdateFile = await (0, _DownloadedUpdateHelper().createTempUpdateFile)(`temp-${updateFileName}`, cacheDir, log);

    try {
      await taskOptions.task(tempUpdateFile, downloadOptions, packageFile, removeFileIfAny);
      await (0, _fsExtra().rename)(tempUpdateFile, updateFile);
    } catch (e) {
      await removeFileIfAny();

      if (e instanceof _builderUtilRuntime().CancellationError) {
        log.info("cancelled");
        this.emit("update-cancelled", updateInfo);
      }

      throw e;
    }

    log.info(`New version ${version} has been downloaded to ${updateFile}`);
    return await done(true);
  }

}

exports.AppUpdater = AppUpdater;

function hasPrereleaseComponents(version) {
  const versionPrereleaseComponent = (0, _semver().prerelease)(version);
  return versionPrereleaseComponent != null && versionPrereleaseComponent.length > 0;
}
/** @private */


class NoOpLogger {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info(message) {// ignore
  } // eslint-disable-next-line @typescript-eslint/no-unused-vars


  warn(message) {// ignore
  } // eslint-disable-next-line @typescript-eslint/no-unused-vars


  error(message) {// ignore
  }

} exports.NoOpLogger = NoOpLogger;
// __ts-babel@6.0.4
//# sourceMappingURL=AppUpdater.js.map