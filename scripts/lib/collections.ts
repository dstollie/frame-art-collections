import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import type { Collection, Item } from "./types.ts"

export const ROOT = new URL("../../", import.meta.url).pathname
export const COLLECTIONS_DIR = join(ROOT, "collections")

export interface LoadedCollection {
  file: string
  raw: unknown
  collection: Collection
}

export function collectionFiles(dir = COLLECTIONS_DIR): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .toSorted()
    .map((f) => join(dir, f))
}

export function loadCollections(files = collectionFiles()): LoadedCollection[] {
  return files.map((file) => {
    const raw: unknown = JSON.parse(readFileSync(file, "utf8"))
    return { file, raw, collection: raw as Collection }
  })
}

const ITEM_KEYS: (keyof Item)[] = [
  "id",
  "title",
  "artist",
  "year",
  "date",
  "image",
  "image_4k",
  "thumbnail",
  "iiif",
  "width",
  "height",
  "licence",
  "attribution",
  "source",
  "source_url",
  "ai_generated",
  "tags",
]

function orderItem(item: Item): Item {
  const out: Record<string, unknown> = {}
  for (const k of ITEM_KEYS) if (item[k] !== undefined) out[k] = item[k]
  return out as unknown as Item
}

export function serialise(c: Collection): string {
  const ordered = {
    $schema: c.$schema,
    schema_version: c.schema_version,
    id: c.id,
    title: c.title,
    description: c.description,
    tags: c.tags,
    curator: c.curator,
    cover: c.cover,
    ...(c.generator ? { generator: c.generator } : {}),
    items: c.items.map(orderItem),
  }
  return `${JSON.stringify(ordered, null, 2)}\n`
}

export function writeCollection(c: Collection, dir = COLLECTIONS_DIR): string {
  const file = join(dir, `${c.id}.json`)
  writeFileSync(file, serialise(c))
  return file
}
