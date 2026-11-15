import { loadCollections } from "./lib/collections.ts"
import { buildIndex } from "./lib/index.ts"

const index = buildIndex(loadCollections(), process.env.GITHUB_SHA ? { commit: process.env.GITHUB_SHA } : {})
process.stdout.write(`${JSON.stringify(index, null, 2)}\n`)
