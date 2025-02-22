import {Client} from "@brimdata/zealot"
import "abortcontroller-polyfill/dist/abortcontroller-polyfill-only"
import {existsSync} from "fs"
import {reject} from "lodash"
import path from "path"
import {
  ElectronApplication,
  Page,
  _electron as electron,
} from "playwright-chromium"
import env from "../../../src/app/core/env"
import {itestDir} from "./env"

export default class TestApp {
  brim: ElectronApplication
  zealot: Client
  mainWin: Page
  testNdx = 1
  currentDataDir: string

  constructor(private name: string) {
    this.zealot = new Client("http://localhost:9867")
  }

  find(...args: Parameters<Page["locator"]>) {
    return this.mainWin.locator(...args)
  }

  async init() {
    const userDataDir = path.resolve(
      path.join(itestDir(), this.name, (this.testNdx++).toString())
    )
    this.currentDataDir = userDataDir

    const {bin, entry} = getAppInfo()
    const launchOpts = {
      args: [`--user-data-dir=${userDataDir}`, entry],
      bypassCSP: true,
      timeout: 60000,
    }

    // @ts-ignore
    if (bin) launchOpts.executablePath = bin
    this.brim = await electron.launch(launchOpts)
    await waitForTrue(() => this.brim.windows().length === 2)
    await Promise.all(
      this.brim.windows().map((page) =>
        page.waitForFunction(() => {
          // @ts-ignore
          return global.firstMount
        })
      )
    )
    this.mainWin = await this.getWindowByTitle("Zui")
  }

  async createPool(
    filepaths: string[],
    expectedResult = "Load Successful"
  ): Promise<void> {
    await this.mainWin.getByRole("button", {name: "create"}).click()
    await this.mainWin.locator('li:has-text("New Pool")').click()
    const [chooser] = await Promise.all([
      this.mainWin.waitForEvent("filechooser"),
      this.mainWin.locator("text=Choose Files").click(),
    ])
    await chooser.setFiles(filepaths)
    await this.mainWin.getByRole("button", {name: "Create Pool"}).click()
    await this.mainWin.getByText(expectedResult).waitFor()
  }

  async chooseFiles(locator, paths: string[]) {
    const [chooser] = await Promise.all([
      this.mainWin.waitForEvent("filechooser"),
      locator.click(),
    ])

    await chooser.setFiles(paths)
  }

  async deleteAllPools() {
    const pools = await this.zealot.getPools()
    for (let pool of pools) {
      await this.zealot.deletePool(pool.id)
    }
  }

  async query(zed: string): Promise<void> {
    await this.mainWin.locator('div[role="textbox"]').fill(zed)
    await this.mainWin.locator('[aria-label="run-query"]').click()
    await this.mainWin.locator('span[aria-label="fetching"]').isHidden()
  }

  // TODO: this method is a wip, it still needs to wait for cells to populate first
  async getViewerResults(includeHeaders = true): Promise<string[]> {
    const fields = await this.mainWin.locator(".zed-table__cell")
    let results = await fields.evaluateAll<string[], HTMLElement>((nodes) =>
      nodes.map((n) => n.innerText.trim())
    )
    if (includeHeaders) {
      const headers = await this.mainWin.locator(".zed-table__header-cell")
      const headerResults = await headers.evaluateAll<string[], HTMLElement>(
        (headerCells) => headerCells.map((hc) => hc.innerText.trim())
      )
      results = headerResults.concat(results)
    }

    return results
  }

  async getViewerStats(): Promise<{results: number; shapes: number}> {
    const results = await this.mainWin
      .locator('span[aria-label="results"]')
      .textContent()
    const shapes = await this.mainWin
      .locator('span[aria-label="shapes"]')
      .textContent()

    const toInt = (str: string) => parseInt(str.replace(/\D*/, ""))
    return {results: toInt(results), shapes: toInt(shapes)}
  }

  async shutdown() {
    await this.brim.close()
  }

  async getWindowByTitle(title: string): Promise<Page> {
    const wins = await this.brim.windows()
    const winTitles = await Promise.all(wins.map((w) => w.title()))
    return wins[winTitles.findIndex((wTitle) => wTitle === title)]
  }

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  get results() {
    return this.mainWin.getByTestId("results-pane")
  }
}

const getAppInfo = () => {
  const macInstallPath = "/Applications/Brim.app/Contents/MacOS/Brim"
  const linuxInstallPath = "/usr/bin/brim"
  const packagedEntryPoint = "app.asar/app/dist/js/electron/main.js"

  if (env.isCI && env.isMac && existsSync(macInstallPath)) {
    return {
      bin: macInstallPath,
      entry: path.join(
        macInstallPath,
        "Contents/Resources",
        packagedEntryPoint
      ),
    }
  }
  if (env.isCI && env.isLinux && existsSync(linuxInstallPath)) {
    return {
      bin: linuxInstallPath,
      entry: path.join(linuxInstallPath, "resources", packagedEntryPoint),
    }
  }

  return {bin: null, entry: "../.."}
}

function waitForTrue(check: () => boolean) {
  return new Promise<void>((resolve) => {
    const id = setTimeout(() => reject("Gave up"), 30000)
    const run = () => {
      if (check()) {
        clearTimeout(id)
        resolve()
      } else {
        setTimeout(() => run(), 100)
      }
    }
    run()
  })
}
