import { fromSmk, gather, type Candidate } from "../seed/pipeline.ts"
import { fileInfo } from "../sources/commons.ts"
import { object as metObject } from "../sources/met.ts"
import { byObjectNumber as smkByObjectNumber } from "../sources/smk.ts"
import type { Item } from "./types.ts"

export type Ref =
  | { kind: "commons"; title: string }
  | { kind: "wikidata"; qid: string }
  | { kind: "smk"; objectNumber: string }
  | { kind: "met"; id: number }

/** Parses one line of a works list: a Commons file, Wikidata item, SMK or Met object, as URL or short form. */
export function parseRef(line: string): Ref | null {
  const s = line.trim().replace(/^[-*]\s+/, "")
  if (!s || s.startsWith("#")) return null
  let m = /(?:commons\.wikimedia\.org\/wiki\/|^)(File:[^?#]+)/i.exec(s)
  if (m)
    return {
      kind: "commons",
      title: decodeURIComponent(m[1]!)
        .replace(/_/g, " ")
        .replace(/^file:/i, "File:"),
    }
  m = /(?:wikidata\.org\/(?:wiki|entity)\/|^)(Q\d+)\b/.exec(s)
  if (m) return { kind: "wikidata", qid: m[1]! }
  m = /(?:open\.smk\.dk\/artwork\/image\/|^smk:)([A-Za-z0-9.\-_/ ]+?)\s*$/i.exec(s)
  if (m) return { kind: "smk", objectNumber: decodeURIComponent(m[1]!) }
  m = /(?:metmuseum\.org\/art\/collection\/search\/|^met:)(\d+)/i.exec(s)
  if (m) return { kind: "met", id: Number(m[1]) }
  return null
}

export interface Resolved {
  items: Item[]
  failed: { line: string; reason: string }[]
}

export async function resolve(lines: string[], ai: boolean): Promise<Resolved> {
  const items: Item[] = []
  const failed: Resolved["failed"] = []
  const push = (c: Candidate[] | Item[], line: string, reason: string) => {
    const got = c.map((x) => ("item" in x ? x.item : x))
    if (!got.length) failed.push({ line, reason })
    for (const i of got) items.push(ai ? { ...i, ai_generated: true } : i)
  }
  for (const line of lines) {
    const ref = parseRef(line)
    if (!ref) {
      if (line.trim() && !line.trim().startsWith("#"))
        failed.push({ line, reason: "not a Commons, Wikidata, SMK or Met reference" })
      continue
    }
    switch (ref.kind) {
      case "commons": {
        const info = await fileInfo([ref.title])
        const f = info.get(ref.title)
        if (!f) failed.push({ line, reason: "file not found on Commons" })
        else if (!f.licence) failed.push({ line, reason: `licence "${f.licenceName || "unknown"}" is not open` })
        else
          push(
            await gather({ kind: "commons-files", titles: [ref.title] }, ai),
            line,
            "unsupported file type or not public domain",
          )
        break
      }
      case "wikidata":
        push(
          await gather({ kind: "wikidata", where: `VALUES ?item { wd:${ref.qid} }`, limit: 1 }),
          line,
          "no open-licence image, or not public domain (needs creation ≤ 1930 and artist died ≤ 1955)",
        )
        break
      case "smk": {
        const w = await smkByObjectNumber(ref.objectNumber)
        push(w ? fromSmk([w], 4) : [], line, "not found, no image or not public domain at SMK")
        break
      }
      case "met": {
        const w = await metObject(ref.id)
        if (!w) failed.push({ line, reason: "not public domain or no image at The Met" })
        else
          items.push({
            id: `met-${w.objectId}`,
            title: w.title.slice(0, 300),
            artist: w.artist.slice(0, 200),
            year: w.year,
            ...(w.dateText ? { date: w.dateText.slice(0, 80) } : {}),
            image: w.image,
            thumbnail: w.thumbnail,
            width: w.width,
            height: w.height,
            licence: "CC0-1.0",
            source: "The Metropolitan Museum of Art",
            source_url: w.pageUrl,
            ai_generated: ai,
          })
        break
      }
    }
  }
  return { items, failed }
}
