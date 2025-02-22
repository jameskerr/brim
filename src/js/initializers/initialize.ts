import BrimApi from "../api"
import initDebugGlobals from "./initDebugGlobals"
import initDOM from "./initDOM"
import initGlobals from "./initGlobals"
import initIpcListeners from "./initIpcListeners"
import initPlugins from "./initPlugins"
import initStore from "./initStore"
import initLakeParams from "./initLakeParams"
import {initAutosave} from "./initAutosave"
import {featureFlagsOp} from "../electron/ops/feature-flags-op"
import {commands} from "src/app/commands/command"
import {menus} from "src/core/menu"
import {windowInitialized} from "../electron/ops/window-initialized-op"

export default async function initialize() {
  const api = new BrimApi()
  const store = await initStore(api)
  api.init(store.dispatch, store.getState)

  const pluginManager = await initPlugins(api)
  global.featureFlags = await featureFlagsOp.invoke()

  initDOM()
  await initGlobals(store)
  initIpcListeners(store)
  initLakeParams(store)
  initDebugGlobals(store, api)
  initAutosave(store)
  commands.setContext(store, api)
  menus.setContext({api})
  windowInitialized.invoke(global.windowId)

  return {store, api, pluginManager}
}
