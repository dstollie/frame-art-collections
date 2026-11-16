import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { IndexEntry } from "./index.ts"
import { esc, renderCollectionPage, renderIndexPage, sizedThumb } from "./site.ts"
import type { Collection, Item } from "./types.ts"

const item = (over: Partial<Item> = {}): Item => ({
  id: "commons-1",
  title: "Water <Lilies>",
  artist: "Claude Monet",
  year: 1906,
  image: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Lilies.jpg",
  thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Lilies.jpg/960px-Lilies.jpg",
  width: 6000,
  height: 4000,
  licence: "PD",
  source: "Art Institute of Chicago via Wikimedia Commons",
  source_url: "https://commons.wikimedia.org/wiki/File:Lilies.jpg",
  ai_generated: false,
  ...over,
})

const collection: Collection = {
  $schema: "https://dstollie.github.io/frame-art-collections/schema/collection.v1.schema.json",
  schema_version: 1,
  id: "water",
  title: "Water & light",
  description: 'Ponds, rivers and "reflections".',
  tags: ["water", "calm"],
  curator: { name: "Ada", github: "ada" },
  cover: "commons-1",
  items: [
    item(),
    item({ id: "commons-2", licence: "CC-BY-4.0", attribution: "Photo: Jane, CC BY 4.0", ai_generated: true }),
  ],
}

const entry: IndexEntry = {
  id: "water",
  title: "Water & light",
  description: collection.description,
  tags: ["water", "calm"],
  curator: { name: "Ada", github: "ada" },
  url: "https://example.test/collections/water.json",
  count: 2,
  landscape_count: 2,
  uhd_count: 2,
  ai_generated_count: 1,
  licences: { PD: 1, "CC-BY-4.0": 1 },
  cover: {
    id: "commons-1",
    title: "Water <Lilies>",
    artist: "Claude Monet",
    thumbnail: item().thumbnail!,
    width: 6000,
    height: 4000,
  },
}

describe("esc", () => {
  it("escapes HTML and quotes", () => {
    assert.equal(esc(`<a href="x">&'</a>`), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;")
  })
})

describe("sizedThumb", () => {
  it("asks Wikimedia for a smaller thumbnail step", () => {
    assert.match(sizedThumb(item(), 500), /\/500px-Lilies\.jpg$/)
  })
  it("uses IIIF when the item has it", () => {
    assert.equal(
      sizedThumb({ iiif: "https://iiif.example/abc", image: "https://iiif.example/abc/full/max/0/default.jpg" }, 500),
      "https://iiif.example/abc/full/500,/0/default.jpg",
    )
  })
  it("falls back to the thumbnail as is", () => {
    const thumb = "https://museum.example/t.jpg"
    assert.equal(sizedThumb(item({ thumbnail: thumb }), 500), thumb)
  })
})

describe("renderIndexPage", () => {
  const html = renderIndexPage({
    schema_version: 1,
    generated_at: "",
    totals: { collections: 1, items: 2, unique_items: 2 },
    collections: [entry],
  })

  it("links every collection to its page and escapes text", () => {
    assert.match(html, /href="c\/water\.html"/)
    assert.match(html, /Water &amp; light/)
    assert.doesNotMatch(html, /<Lilies>/)
  })
  it("carries tags for filtering and shows the totals", () => {
    assert.match(html, /data-tags="water calm"/)
    assert.match(html, /<strong>1<\/strong> collections/)
  })
  it("has the call to action and social meta", () => {
    assert.match(html, /issues\/new\?template=new-collection\.yml/)
    assert.match(html, /property="og:image"/)
  })
})

describe("renderCollectionPage", () => {
  const html = renderCollectionPage(collection, entry)

  it("lists every work with its licence and source", () => {
    assert.equal(html.match(/class="work"/g)?.length, 2)
    assert.match(html, /href="https:\/\/commons\.wikimedia\.org\/wiki\/File:Lilies\.jpg"/)
    assert.match(html, /CC BY 4\.0/)
  })
  it("shows attribution and marks AI works", () => {
    assert.match(html, /Photo: Jane, CC BY 4\.0/)
    assert.match(html, /class="badge ai"/)
  })
  it("links the manifest and the file to edit", () => {
    assert.match(html, /href="\.\.\/collections\/water\.json"/)
    assert.match(html, /edit\/main\/collections\/water\.json/)
  })
})
