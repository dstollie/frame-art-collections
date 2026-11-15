import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { ROOT, loadCollections, serialise } from "./lib/collections.ts"
import { buildIndex, type IndexEntry } from "./lib/index.ts"

const DIST = join(ROOT, "dist")
rmSync(DIST, { recursive: true, force: true })
mkdirSync(join(DIST, "collections"), { recursive: true })

const all = loadCollections()
for (const { collection } of all)
  writeFileSync(join(DIST, "collections", `${collection.id}.json`), serialise(collection))
cpSync(join(ROOT, "schema"), join(DIST, "schema"), { recursive: true })

const index = buildIndex(all, process.env.GITHUB_SHA ? { commit: process.env.GITHUB_SHA } : {})
writeFileSync(join(DIST, "index.json"), `${JSON.stringify(index)}\n`)

const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => `&#${ch.charCodeAt(0)};`)
const card = (c: IndexEntry) => `
<a class="card" href="collections/${c.id}.json">
  <img loading="lazy" src="${esc(c.cover.thumbnail)}" alt="${esc(c.cover.title)}">
  <div><h2>${esc(c.title)}</h2><p>${esc(c.description)}</p>
  <small>${c.count} works · ${c.landscape_count} landscape · ${c.uhd_count} 4K${c.ai_generated_count ? ` · ${c.ai_generated_count} AI` : ""} · by ${esc(c.curator.name)}</small></div>
</a>`

writeFileSync(
  join(DIST, "index.html"),
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Frame Art collections</title>
<style>
body{font:15px/1.5 system-ui,sans-serif;margin:0;background:#111;color:#eee}
header{padding:2rem 1.5rem 1rem;max-width:72rem;margin:auto}
header a{color:#9cf}
main{display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fill,minmax(20rem,1fr));padding:1.5rem;max-width:72rem;margin:auto}
.card{display:block;background:#1c1c1c;border-radius:8px;overflow:hidden;color:inherit;text-decoration:none}
.card img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:#222}
.card div{padding:.75rem 1rem 1rem}.card h2{font-size:1.05rem;margin:0 0 .25rem}.card p{margin:0 0 .5rem;color:#bbb}
small{color:#888}
</style></head><body>
<header><h1>Frame Art collections</h1>
<p>${index.totals.collections} free, openly licensed collections with ${index.totals.unique_items} works for Samsung The Frame.
Machine-readable: <a href="index.json">index.json</a> · schema <a href="schema/collection.v1.schema.json">collection.v1</a> ·
<a href="https://github.com/dstollie/frame-art-collections">add your own collection</a></p></header>
<main>${index.collections.map(card).join("")}</main>
</body></html>
`,
)
process.stdout.write(`dist/: ${index.totals.collections} collections, ${index.totals.items} items\n`)
