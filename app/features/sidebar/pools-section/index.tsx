import {useImportOnDrop} from "app/features/import/use-import-on-drop"
import get from "lodash/get"
import React, {useEffect, useState} from "react"
import {useDispatch, useSelector} from "react-redux"
import Current from "src/js/state/Current"
import WorkspaceStatuses from "src/js/state/WorkspaceStatuses"
import {
  SectionContents,
  StyledSection,
  DropOverlay,
  SectionToolbar,
  SectionSearch
} from "../common"
import EmptySection from "src/js/components/common/EmptySection"
import FileFilled from "src/js/icons/FileFilled"
import styled from "styled-components"
import {Tree} from "react-arborist"
import {useSectionTreeDefaults} from "../hooks"
import PoolItem from "./pool-item"
import renamePool from "src/js/flows/renamePool"
import {Pool} from "src/js/state/Pools/types"

const StyledEmptySection = styled(EmptySection).attrs({icon: <FileFilled />})``

const poolSearch = (term: string, items: Pool[]): Pool[] => {
  return items.filter(({name}) =>
    JSON.stringify({name})
      .toLowerCase()
      .includes(term.toLowerCase())
  )
}

const PoolsSection = () => {
  const dispatch = useDispatch()
  const workspace = useSelector(Current.getWorkspace)
  const id = get(workspace, ["id"], "")
  const lakeStatus = useSelector(WorkspaceStatuses.get(id))
  const pools = useSelector(Current.getPools)
  const [filteredPools, setFilteredPools] = useState(pools)
  const [{isOver}, drop] = useImportOnDrop()
  const {resizeRef, defaults} = useSectionTreeDefaults()

  useEffect(() => {
    setFilteredPools(pools)
  }, [pools])

  const renderContents = () => {
    if (lakeStatus === "disconnected")
      return <StyledEmptySection message="Unable to connect to service." />
    if (lakeStatus === "login-required")
      return <StyledEmptySection message="Login required to view pools." />
    if (pools.length === 0)
      return (
        <StyledEmptySection message="You have no pools yet. Create a pool by importing data." />
      )
    if (filteredPools.length === 0)
      return <StyledEmptySection message="No pools match the search term." />

    const handleRename = (poolId: string, name: string) => {
      dispatch(renamePool(id, poolId, name))
    }

    return (
      <Tree
        {...defaults}
        data={{
          id: "root",
          items: filteredPools.sort((a, b) => (a.name > b.name ? 1 : -1))
        }}
        onEdit={handleRename}
      >
        {PoolItem}
      </Tree>
    )
  }

  const onPoolSearch = (e) => {
    setFilteredPools(poolSearch(e.target?.value, pools))
  }

  return (
    <StyledSection>
      <SectionContents
        ref={(r) => {
          resizeRef(r)
          drop(r)
        }}
      >
        {renderContents()}
        <DropOverlay show={isOver}>Drop to import...</DropOverlay>
      </SectionContents>
      <SectionToolbar>
        <SectionSearch placeholder="Search pools..." onChange={onPoolSearch} />
      </SectionToolbar>
    </StyledSection>
  )
}

export default PoolsSection
