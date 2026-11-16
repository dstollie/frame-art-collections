import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { ROOT, loadCollections, serialise } from "./lib/collections.ts"
import { buildIndex } from "./lib/index.ts"
import { renderCollectionPage, renderIndexPage } from "./lib/site.ts"

const DIST = join(ROOT, "dist")
rmSync(DIST, { recursive: true, force: true })
mkdirSync(join(DIST, "collections"), { recursive: true })

const all = loadCollections()
for (const { collection } of all)
  writeFileSync(join(DIST, "collections", `${collection.id}.json`), serialise(collection))
cpSync(join(ROOT, "schema"), join(DIST, "schema"), { recursive: true })

const index = buildIndex(all, process.env.GITHUB_SHA ? { commit: process.env.GITHUB_SHA } : {})
writeFileSync(join(DIST, "index.json"), `${JSON.stringify(index)}\n`)

cpSync(join(ROOT, "site"), DIST, { recursive: true })
writeFileSync(join(DIST, "index.html"), renderIndexPage(index))
mkdirSync(join(DIST, "c"))
const entries = new Map(index.collections.map((e) => [e.id, e]))
for (const { collection } of all)
  writeFileSync(join(DIST, "c", `${collection.id}.html`), renderCollectionPage(collection, entries.get(collection.id)!))
writeFileSync(join(DIST, ".nojekyll"), "")
process.stdout.write(`dist/: ${index.totals.collections} collections, ${index.totals.items} items\n`)
