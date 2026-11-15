import { basename } from "node:path"

import addFormats from "ajv-formats"
import { Ajv2020 } from "ajv/dist/2020.js"

import schema from "../../schema/collection.v1.schema.json" with { type: "json" }
import type { LoadedCollection } from "./collections.ts"
import { MIN_PX, UHD_PX, longEdge, type Collection } from "./types.ts"

export type Level = "error" | "warning"

export interface Finding {
  level: Level
  file: string
  message: string
  item?: string
}

const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false })
addFormats.default(ajv)
const validateSchema = ajv.compile(schema)

export function schemaFindings(file: string, raw: unknown): Finding[] {
  if (validateSchema(raw)) return []
  return (validateSchema.errors ?? []).map((e) => ({
    level: "error",
    file,
    message: `schema: ${e.instancePath || "/"} ${e.message ?? "is invalid"}${e.params && "allowedValues" in e.params ? ` (${(e.params.allowedValues as string[]).join(", ")})` : ""}`,
  }))
}

const normaliseUrl = (u: string) =>
  u
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .toLowerCase()

export function collectionFindings(file: string, c: Collection): Finding[] {
  const out: Finding[] = []
  const add = (level: Level, message: string, item?: string) =>
    out.push(item ? { level, file, message, item } : { level, file, message })

  if (basename(file, ".json") !== c.id) add("error", `file name must be "${c.id}.json"`)
  if (!c.items.some((i) => i.id === c.cover)) add("error", `cover "${c.cover}" is not an item id in this collection`)

  const ids = new Set<string>()
  const images = new Map<string, string>()
  let belowUhd = 0
  for (const item of c.items) {
    if (ids.has(item.id)) add("error", "duplicate item id", item.id)
    ids.add(item.id)
    const key = normaliseUrl(item.image)
    const twin = images.get(key)
    if (twin) add("error", `same image as ${twin}`, item.id)
    images.set(key, item.id)

    const edge = longEdge(item)
    if (edge < MIN_PX) add("error", `${item.width}×${item.height} is below the ${MIN_PX} px minimum`, item.id)
    else if (edge < UHD_PX) belowUhd++
    if (item.licence.startsWith("CC-BY") && !item.attribution?.trim())
      add("error", `${item.licence} needs an attribution line`, item.id)
  }
  if (belowUhd)
    add(
      "warning",
      `${belowUhd} of ${c.items.length} items are below ${UHD_PX} px on the long edge (fine, but not 4K-sharp)`,
    )
  return out
}

/** Collections that mostly repeat another one are probably a duplicate submission. */
export function overlapFindings(all: LoadedCollection[]): Finding[] {
  const out: Finding[] = []
  const titles = new Map<string, string>()
  const sets = all.map(({ file, collection }) => ({
    file,
    c: collection,
    keys: new Set(collection.items.map((i) => normaliseUrl(i.image))),
  }))
  for (const { file, c } of sets) {
    const t = c.title.trim().toLowerCase()
    const other = titles.get(t)
    if (other) out.push({ level: "error", file, message: `title "${c.title}" is already used by ${other}` })
    titles.set(t, basename(file))
  }
  for (const a of sets) {
    for (const b of sets) {
      if (a === b || a.keys.size > b.keys.size || (a.keys.size === b.keys.size && a.file > b.file)) continue
      let shared = 0
      for (const k of a.keys) if (b.keys.has(k)) shared++
      const share = shared / a.keys.size
      if (share >= 0.8)
        out.push({
          level: "error",
          file: a.file,
          message: `${Math.round(share * 100)}% of its items are already in ${basename(b.file)}; extend that collection instead`,
        })
    }
  }
  return out
}

export function validateAll(all: LoadedCollection[]): Finding[] {
  const out: Finding[] = []
  for (const { file, raw, collection } of all) {
    const s = schemaFindings(file, raw)
    out.push(...s)
    if (!s.length) out.push(...collectionFindings(file, collection))
  }
  out.push(...overlapFindings(all.filter((l) => !schemaFindings(l.file, l.raw).length)))
  return out
}
