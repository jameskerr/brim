import {find, keys} from "lodash"
import {State} from "../types"
import {Pool} from "./types"

const selectors = {
  ids: (workspaceId: string) => (state: State) => {
    return keys(getWorkspace(state, workspaceId))
  },
  get: (workspaceId: string, poolId: string) => (state: State) => {
    return getWorkspace(state, workspaceId)[poolId]
  },
  getName: (workspaceId: string, poolId: string) => (state: State) => {
    const pool = getWorkspace(state, workspaceId)[poolId]
    return pool ? pool.name : ""
  },
  getByName: (workspaceId: string, name: string) => (state: State) => {
    const wsPools = getWorkspace(state, workspaceId)
    return find(wsPools, ["name", name])
  },
  raw: (state: State) => state.pools,
  getPools: (workspaceId: string | null) => (state: State): Pool[] => {
    const ws = getWorkspace(state, workspaceId)
    return Object.keys(ws).map((key) => {
      return {...ws[key]}
    })
  },
  getPoolNames: (workspaceId: string) => (state: State): string[] => {
    const ws = getWorkspace(state, workspaceId)
    return Object.keys(ws).map((key) => ws[key].name)
  },
  getIngestProgress: (workspaceId: string, poolId: string) => (
    state: State
  ) => {
    const ws = getWorkspace(state, workspaceId)
    const pool = ws[poolId]
    if (pool) return pool.ingest.progress
    else return null
  },
  getIngestWarnings: (workspaceId: string, poolId: string) => (
    state: State
  ) => {
    const ws = getWorkspace(state, workspaceId)
    const pool = ws[poolId]
    if (pool) return pool.ingest.warnings
    else return []
  }
}

function getWorkspace(
  state,
  id
): {
  [key: string]: Pool
} {
  if (!id) return {}
  return state.pools[id] || {}
}

export default selectors
