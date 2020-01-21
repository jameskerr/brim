/* @flow */
import {ipcRenderer} from "electron"

import type {Store} from "../state/types"
import {clearState} from "./initPersistance"
import {goBack, goForward} from "../state/thunks/searchBar"
import {toggleLeftSidebar, toggleRightSidebar} from "../state/actions"
import Modal from "../state/Modal"
import SearchBar from "../state/SearchBar"

export default (store: Store) => {
  ipcRenderer.on("pinSearch", () => {
    store.dispatch(SearchBar.pinSearchBar())
  })

  ipcRenderer.on("focusSearchBar", () => {
    const el = document.getElementById("main-search-input")

    el && el.focus()
    // $FlowFixMe
    el && el.select()
  })

  ipcRenderer.on("clearPins", () => {
    store.dispatch(SearchBar.removeAllSearchBarPins())
    store.dispatch(SearchBar.changeSearchBarInput(""))
  })

  ipcRenderer.on("toggleLeftSidebar", () => {
    store.dispatch(toggleLeftSidebar())
  })

  ipcRenderer.on("toggleRightSidebar", () => {
    store.dispatch(toggleRightSidebar())
  })

  ipcRenderer.on("resetState", () => {
    clearState()
    location.reload()
  })

  ipcRenderer.on("showPreferences", () => {
    store.dispatch(Modal.show("settings"))
  })

  ipcRenderer.on("back", () => {
    store.dispatch(goBack())
  })

  ipcRenderer.on("forward", () => {
    store.dispatch(goForward())
  })
}
