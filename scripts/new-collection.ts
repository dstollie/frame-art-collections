import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { parseArgs } from "node:util"

import { COLLECTIONS_DIR, writeCollection } from "./lib/collections.ts"
import { resolve } from "./lib/resolve.ts"
import { collectionFindings, schemaFindings } from "./lib/rules.ts"
import { SCHEMA_URL, isLandscape, type Collection } from "./lib/types.ts"

const HELP = `Create or extend a collection from a list of works.

  pnpm new --id <slug> --title <title> --description <text> --tags a,b --curator <name> [--github <handle>] --works <file|->
  pnpm new --id <existing-slug> --append --works <file|->

Each line of the works list is one of:
  https://commons.wikimedia.org/wiki/File:Example.jpg   (or File:Example.jpg)
  https://www.wikidata.org/wiki/Q12418                  (or Q12418)
  https://open.smk.dk/artwork/image/KMS3352             (or smk:KMS3352)
  https://www.metmuseum.org/art/collection/search/436535 (or met:436535)
Blank lines and lines starting with # are ignored. Add --ai when the works are AI-generated.`

const { values } = parseArgs({
  options: {
    id: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    tags: { type: "string" },
    curator: { type: "string" },
    github: { type: "string" },
    works: { type: "string" },
    append: { type: "boolean", default: false },
    ai: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
})

if (values.help || !values.id || !values.works) {
  process.stdout.write(`${HELP}\n`)
  process.exit(values.help ? 0 : 1)
}

const id = values.id
const file = join(COLLECTIONS_DIR, `${id}.json`)
const exists = existsSync(file)
if (exists && !values.append) {
  process.stderr.write(`${id}.json exists; pass --append to add works to it\n`)
  process.exit(1)
}

const text = values.works === "-" ? readFileSync(0, "utf8") : readFileSync(values.works, "utf8")
const { items, failed } = await resolve(text.split(/\r?\n/), values.ai)

const base: Collection = exists
  ? (JSON.parse(readFileSync(file, "utf8")) as Collection)
  : {
      $schema: SCHEMA_URL,
      schema_version: 1,
      id,
      title: values.title ?? "",
      description: values.description ?? "",
      tags: (values.tags ?? "")
        .split(",")
        .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
        .filter(Boolean),
      curator: { name: values.curator ?? "", ...(values.github ? { github: values.github.replace(/^@/, "") } : {}) },
      cover: "",
      items: [],
    }

const known = new Set(base.items.map((i) => i.id))
const added = items.filter((i) => !known.has(i.id) && (known.add(i.id), true))
base.items.push(...added)
if (!base.cover || !base.items.some((i) => i.id === base.cover))
  base.cover = (base.items.find(isLandscape) ?? base.items[0])?.id ?? ""

for (const f of failed) process.stdout.write(`skipped: ${f.line.trim()} (${f.reason})\n`)
if (!base.items.length) {
  process.stderr.write("no usable works; nothing written\n")
  process.exit(1)
}
const path = writeCollection(base)
process.stdout.write(`${exists ? "updated" : "created"} ${path}: +${added.length} works, ${base.items.length} total\n`)

const findings = [...schemaFindings(path, JSON.parse(readFileSync(path, "utf8"))), ...collectionFindings(path, base)]
for (const f of findings) process.stdout.write(`${f.level}: ${f.item ? `${f.item}: ` : ""}${f.message}\n`)
process.exit(findings.some((f) => f.level === "error") ? 2 : 0)
