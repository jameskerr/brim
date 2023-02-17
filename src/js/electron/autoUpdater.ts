import env from "src/app/core/env"
import {meta} from "src/app/ipc/meta"
import {app, dialog} from "electron"
import log from "electron-log"
import {autoUpdater} from "electron-updater"
import got from "got"
import get from "lodash/get"
import semver from "semver/preload"
import open from "../lib/open"

autoUpdater.channel = "beta"
autoUpdater.allowPrerelease = true

const getFeedURLForPlatform = (repo, platform) => {
  return `https://update.electronjs.org/${repo}/${platform}/${app.getVersion()}`
}

export const getLatestVersion = async (): Promise<string> => {
  // Check for updates for MacOS and if there are then we assume there is also one for our other supported OSs
  const repo = meta.repo()
  const url = getFeedURLForPlatform(repo, "darwin-x64")
  const resp = await got(url)

  // the update server responds with a 204 and no body if the current version is the same as the
  // latest version, but will otherwise return json naming the latest version published on github
  // (even if it is behind the current version)
  if (resp.statusCode === 204) return app.getVersion()

  const body = JSON.parse(resp.body)
  const latestVersion = get(body, "name", "")
  if (!semver.valid(latestVersion))
    log.error(new Error(`Invalid latest version format: ${latestVersion}`))

  return latestVersion
}

const autoUpdateLinux = async () => {
  const latestVersion = await getLatestVersion()

  // up to date
  if (semver.gte(app.getVersion(), latestVersion)) return

  const dialogOpts = {
    type: "info",
    buttons: ["Get Update", "Later"],
    title: "Application Update",
    message: "A new version is available.",
    detail:
      "Attention: Zui is the new Brim and is now available for download. See the release notes for more details.",
  }

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    const navUrl = "https://www.brimdata.io/download/"
    if (returnValue.response === 0) open(navUrl)
  })
}

export async function setupAutoUpdater() {
  if (env.isLinux) {
    setUpdateRepeater(() => {
      autoUpdateLinux().catch((err) => log.error(err))
    })

    return
  }

  autoUpdater.on("update-downloaded", (event, releaseNotes, releaseName) => {
    const dialogOpts = {
      type: "info",
      buttons: ["Restart", "Later"],
      title: "Application Update",
      // releaseNotes are not available for windows, so use name instead
      message: env.isWindows ? releaseNotes : releaseName,
      detail:
        "Attention: Zui is the new Brim and has been downloaded! After closing this app, please open Zui from your applications folder. See the release notes for more details.",
    }

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall()
    })
  })

  autoUpdater.on("error", (err) => {
    log.error("There was a problem updating the application: " + err)
  })

  setUpdateRepeater(() => {
    autoUpdater.checkForUpdates()
  })
}

const setUpdateRepeater = (updateCb) => {
  // check for updates 30s after startup
  setTimeout(updateCb, 30 * 1000)
  // then check for updates once a day
  setInterval(updateCb, 24 * 60 * 60 * 1000)
}
