import assert from "node:assert/strict"
import { test } from "node:test"

import { plausiblyPublicDomain } from "../seed/pipeline.ts"
import { mapLicence } from "../sources/commons.ts"
import { parseRef } from "./resolve.ts"

test("parses every supported reference form", () => {
  assert.deepEqual(parseRef("https://commons.wikimedia.org/wiki/File:A_b%C3%A9.jpg"), {
    kind: "commons",
    title: "File:A bé.jpg",
  })
  assert.deepEqual(parseRef("file:X.png"), { kind: "commons", title: "File:X.png" })
  assert.deepEqual(parseRef("https://www.wikidata.org/wiki/Q12418"), { kind: "wikidata", qid: "Q12418" })
  assert.deepEqual(parseRef("- Q42"), { kind: "wikidata", qid: "Q42" })
  assert.deepEqual(parseRef("https://open.smk.dk/artwork/image/KMS3352"), { kind: "smk", objectNumber: "KMS3352" })
  assert.deepEqual(parseRef("met:436535"), { kind: "met", id: 436535 })
  assert.equal(parseRef("# comment"), null)
  assert.equal(parseRef("https://example.com/x.jpg"), null)
})

test("maps Commons licence names onto the allowed list", () => {
  assert.equal(mapLicence("Public domain"), "PD")
  assert.equal(mapLicence("CC0"), "CC0-1.0")
  assert.equal(mapLicence("CC BY-SA 4.0"), "CC-BY-SA-4.0")
  assert.equal(mapLicence("CC BY 2.5"), "CC-BY-2.5")
  assert.equal(mapLicence("CC BY-NC 4.0"), null)
  assert.equal(mapLicence("GPL"), null)
})

test("public-domain sanity check", () => {
  assert.ok(plausiblyPublicDomain(1889, 1890))
  assert.ok(!plausiblyPublicDomain(1935, 1940))
  assert.ok(!plausiblyPublicDomain(1925, 1970))
  assert.ok(!plausiblyPublicDomain(null, null))
  assert.ok(plausiblyPublicDomain(1700, null))
})
