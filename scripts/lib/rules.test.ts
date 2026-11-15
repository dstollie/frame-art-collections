import assert from "node:assert/strict"
import { test } from "node:test"

import type { LoadedCollection } from "./collections.ts"
import { collectionFindings, overlapFindings, schemaFindings } from "./rules.ts"
import { SCHEMA_URL, type Collection, type Item } from "./types.ts"

const item = (n: number, over: Partial<Item> = {}): Item => ({
  id: `test-${n}`,
  title: `Work ${n}`,
  artist: "Someone",
  year: 1880,
  image: `https://example.org/${n}.jpg`,
  width: 4000,
  height: 2500,
  licence: "PD",
  source: "Example Museum",
  source_url: `https://example.org/works/${n}`,
  ai_generated: false,
  ...over,
})

const collection = (items: Item[], over: Partial<Collection> = {}): Collection => ({
  $schema: SCHEMA_URL,
  schema_version: 1,
  id: "test-collection",
  title: "Test collection",
  description: "A collection used by the unit tests.",
  tags: ["test"],
  curator: { name: "Tester" },
  cover: items[0]?.id ?? "",
  items,
  ...over,
})

const file = "/x/collections/test-collection.json"

test("a valid collection passes the schema", () => {
  assert.deepEqual(schemaFindings(file, collection([item(1)])), [])
})

test("non-open licences are rejected", () => {
  const raw = collection([{ ...item(1), licence: "CC-BY-NC-4.0" as Item["licence"] }])
  assert.ok(schemaFindings(file, raw).some((f) => f.message.includes("licence")))
})

test("CC-BY needs an attribution line", () => {
  const raw = collection([item(1, { licence: "CC-BY-4.0" })])
  assert.ok(schemaFindings(file, raw).some((f) => f.message.includes("attribution")))
  assert.deepEqual(
    schemaFindings(file, collection([item(1, { licence: "CC-BY-4.0", attribution: "Jane, CC BY 4.0" })])),
    [],
  )
})

test("ai_generated is required", () => {
  const { ai_generated: _, ...rest } = item(1)
  assert.ok(schemaFindings(file, collection([rest as Item])).length)
})

test("duplicates within a collection are errors", () => {
  const ids = collectionFindings(file, collection([item(1), item(1, { image: item(5).image })]))
  assert.deepEqual(
    ids.map((x) => x.message),
    ["duplicate item id"],
  )
  const images = collectionFindings(file, collection([item(2, { image: item(3).image }), item(3)]))
  assert.deepEqual(
    images.map((x) => x.message),
    ["same image as test-2"],
  )
})

test("resolution: below minimum is an error, below 4K a warning", () => {
  const f = collectionFindings(
    file,
    collection([item(1, { width: 1600, height: 900 }), item(2, { width: 3000, height: 2000 })]),
  )
  assert.equal(f.filter((x) => x.level === "error").length, 1)
  assert.equal(f.filter((x) => x.level === "warning").length, 1)
})

test("the cover must be one of the items and the file name must match the id", () => {
  const f = collectionFindings("/x/collections/other.json", collection([item(1)], { cover: "test-9" }))
  assert.equal(f.length, 2)
})

test("a collection that mostly repeats another one is flagged", () => {
  const big = collection(
    [1, 2, 3, 4, 5].map((n) => item(n)),
    { id: "big", title: "Big" },
  )
  const small = collection(
    [1, 2, 3, 4].map((n) => item(n)),
    { id: "small", title: "Small" },
  )
  const loaded: LoadedCollection[] = [
    { file: "/x/big.json", raw: big, collection: big },
    { file: "/x/small.json", raw: small, collection: small },
  ]
  const f = overlapFindings(loaded)
  assert.equal(f.length, 1)
  assert.equal(f[0]!.file, "/x/small.json")
})
