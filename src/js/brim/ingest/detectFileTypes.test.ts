/**
 * @jest-environment jsdom
 */

import data from "src/test/shared/data"
import detectFileTypes from "./detectFileTypes"

const json = data.getWebFile("sample.ndjson")
const pcap = data.getWebFile("sample.pcap")
const pcapng = data.getWebFile("sample.pcapng")
const unknown = data.getWebFile("plain.txt")
const zeek = data.getWebFile("sample.tsv")
const zng = data.getWebFile("sample.zng")
const zson = data.getWebFile("sample.zson")

test("add file types", async () => {
  const files = [pcap, pcapng, zeek, json, unknown, zng, zson]

  const types = await detectFileTypes(files)

  expect(types).toEqual([
    {type: "pcap", file: pcap},
    {type: "pcap", file: pcapng},
    {type: "log", file: zeek},
    {type: "log", file: json},
    {type: "log", file: unknown},
    {type: "log", file: zng},
    {type: "log", file: zson},
  ])
})
