import assert from "node:assert/strict"
import { test } from "node:test"

import { sample } from "./urls.ts"

test("sampling is deterministic per seed and returns everything for small lists", () => {
  const list = Array.from({ length: 50 }, (_, i) => i)
  assert.deepEqual(sample(list, 5, "a"), sample(list, 5, "a"))
  assert.notDeepEqual(sample(list, 5, "a"), sample(list, 5, "b"))
  assert.equal(new Set(sample(list, 10, "x")).size, 10)
  assert.deepEqual(sample([1, 2], 5, "a"), [1, 2])
})
