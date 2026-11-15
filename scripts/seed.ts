import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { parseArgs } from "node:util"

import { ROOT, writeCollection } from "./lib/collections.ts"
import { SCHEMA_URL, isLandscape, type Collection } from "./lib/types.ts"
import { AI_DEFS } from "./seed/ai.ts"
import { colourOf, saveColours, type Colour } from "./seed/colour.ts"
import { DEFS, type Def } from "./seed/defs.ts"
import { MOODS } from "./seed/moods.ts"
import { gather, score, select, type Candidate } from "./seed/pipeline.ts"

const { values } = parseArgs({
  options: {
    only: { type: "string" },
    dry: { type: "boolean", default: false },
    "no-moods": { type: "boolean", default: false },
  },
})
const only = values.only ? new Set(values.only.split(",")) : null
const POOL_DIR = join(ROOT, ".cache", "pool")
mkdirSync(POOL_DIR, { recursive: true })

export const CURATOR = { name: "Frame Art seed", github: "dstollie" }
const GENERATOR = "scripts/seed.ts"

function toCollection(def: Pick<Def, "id" | "title" | "description" | "tags">, picked: Candidate[]): Collection {
  const cover = picked.find((c) => isLandscape(c.item)) ?? picked[0]!
  return {
    $schema: SCHEMA_URL,
    schema_version: 1,
    id: def.id,
    title: def.title,
    description: def.description,
    tags: def.tags,
    curator: CURATOR,
    cover: cover.item.id,
    generator: GENERATOR,
    items: picked.map((c) => c.item),
  }
}

function report(def: { id: string }, pool: Candidate[], picked: Candidate[]) {
  const land = picked.filter((c) => isLandscape(c.item)).length
  const uhd = picked.filter((c) => Math.max(c.item.width, c.item.height) >= 3840).length
  process.stdout.write(`${def.id}: pool ${pool.length}, picked ${picked.length} (${land} landscape, ${uhd} ≥3840px)\n`)
}

async function runDef(def: Def) {
  const pool: Candidate[] = []
  for (const spec of def.sources) {
    const got = await gather(spec, def.ai).catch((e: unknown) => {
      process.stderr.write(`  ${def.id}: ${spec.kind} failed: ${(e as Error).message}\n`)
      return []
    })
    pool.push(...got)
  }
  writeFileSync(join(POOL_DIR, `${def.id}.json`), JSON.stringify(pool))
  const picked = select(pool, {
    size: def.size ?? 150,
    minPx: def.minPx ?? 2800,
    perArtist: def.perArtist ?? 10,
    ...(def.landscapeOnly ? { landscapeOnly: true } : {}),
  })
  report(def, pool, picked)
  if (!values.dry && picked.length >= 12) writeCollection(toCollection(def, picked))
}

for (const def of [...DEFS, ...AI_DEFS]) if (!only || only.has(def.id)) await runDef(def)

if (!values["no-moods"] && (!only || MOODS.some((m) => only.has(m.id)))) {
  const pool = new Map<string, Candidate>()
  for (const def of DEFS) {
    const file = join(POOL_DIR, `${def.id}.json`)
    if (!existsSync(file)) continue
    for (const c of JSON.parse(readFileSync(file, "utf8")) as Candidate[])
      if (Math.max(c.item.width, c.item.height) >= 3000 && c.item.width >= c.item.height) pool.set(c.item.id, c)
  }
  const ranked = [...pool.values()].toSorted((a, b) => score(b) - score(a)).slice(0, 4000)
  const colours = new Map<string, Colour>()
  let done = 0
  for (const c of ranked) {
    const col = await colourOf(c.colourUrl)
    if (col) colours.set(c.item.id, col)
    if (++done % 250 === 0) {
      saveColours()
      process.stdout.write(`  colours ${done}/${ranked.length}\n`)
    }
  }
  saveColours()
  for (const mood of MOODS) {
    if (only && !only.has(mood.id)) continue
    const fits = ranked.filter((c) => {
      const col = colours.get(c.item.id)
      return col && mood.fit(col) > 0
    })
    const picked = select(fits, {
      size: mood.size ?? 120,
      minPx: 3000,
      perArtist: 8,
      rank: (c) => Math.log(score(c) + 1) * mood.fit(colours.get(c.item.id)!),
    })
    report(mood, fits, picked)
    if (!values.dry && picked.length >= 12) writeCollection(toCollection(mood, picked))
  }
}
