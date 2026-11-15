import assert from "node:assert/strict"
import { test } from "node:test"

import { parseForm, toRequest } from "./issue-form.ts"

const body = `### Collection id

misty-mornings

### Title

Misty mornings

### Description

Fog over fields, rivers and towns at dawn.

### Tags

mist, landscape, calm

### Curator name

_No response_

### Works

\`\`\`text
Q12418
File:Example.jpg
\`\`\`

### AI-generated

- [ ] These works were made with generative AI
`

test("parses an issue form body", () => {
  const req = toRequest(parseForm(body), "octocat")
  assert.ok(typeof req !== "string")
  assert.equal(req.id, "misty-mornings")
  assert.equal(req.curator, "octocat")
  assert.equal(req.works, "Q12418\nFile:Example.jpg")
  assert.equal(req.ai, false)
})

test("rejects bad ids and shell tricks", () => {
  assert.equal(typeof toRequest(parseForm(body.replace("misty-mornings", "x; rm -rf /")), "octocat"), "string")
  const req = toRequest(parseForm(body.replace("mist, landscape", "$(curl evil)")), "octocat")
  assert.ok(typeof req !== "string" && !req.tags.includes("$("))
})
