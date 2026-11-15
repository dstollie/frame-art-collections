import assert from "node:assert/strict"
import { test } from "node:test"

import sharp from "sharp"

import { imageSize } from "./image-size.ts"

const make = (format: "jpeg" | "png" | "webp") =>
  sharp({ create: { width: 321, height: 123, channels: 3, background: "#369" } })
    .toFormat(format)
    .toBuffer()

for (const format of ["jpeg", "png", "webp"] as const) {
  test(`reads ${format} dimensions from the header`, async () => {
    const buf = await make(format)
    assert.deepEqual(imageSize(new Uint8Array(buf.subarray(0, 4096))), { width: 321, height: 123, type: format })
  })
}

test("returns null for non-images", () => {
  assert.equal(imageSize(new TextEncoder().encode("<!doctype html><html><body>blocked</body></html>")), null)
})
