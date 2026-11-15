import { UHD_PX, longEdge, type Item } from "../lib/types.ts"
import { fileInfo, resizeThumb, searchFiles, type CommonsFile } from "../sources/commons.ts"
import { search as smkSearch, type SmkWork } from "../sources/smk.ts"
import { works as wikidataWorks, type WikidataWork } from "../sources/wikidata.ts"

export interface Candidate {
  item: Item
  fame: number
  artistKey: string
  colourUrl: string
}

export type SourceSpec =
  | { kind: "wikidata"; where: string; limit?: number }
  | { kind: "commons"; query: string; max?: number; include?: RegExp; exclude?: RegExp; fame?: number }
  | { kind: "commons-files"; titles: string[]; fame?: number }
  | { kind: "smk"; keys: string; filters?: string[]; fame?: number }

const BAD_FILE =
  /\b(frame|framed|cadre|rahmen|gerahmt|detail|details|x-?ray|infrared|verso|in situ|installation view|signature)\b/i
const NOT_FOR_THE_LIVING_ROOM = /origine du monde/i
const IMAGE_MIME = /^image\/(jpeg|png|webp)$/

/** Conservative public-domain check on top of the source's own licence. */
export function plausiblyPublicDomain(year: number | null, died: number | null): boolean {
  if (year !== null && year > 1930) return false
  if (died !== null) return died <= 1955
  return year !== null && year <= 1880
}

function cleanFileTitle(title: string) {
  return title
    .replace(/^File:/, "")
    .replace(/\.(jpe?g|png|webp|tiff?)$/i, "")
    .replace(/\s*-\s*Google Art Project.*$/i, "")
    .replace(/\s*\(?BHL\d+\)?/g, "")
    .replace(/_/g, " ")
    .trim()
}

const short = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

function commonsItem(
  f: CommonsFile,
  id: string,
  meta: { title: string; artist: string; year: number | null; museum?: string },
): Item | null {
  if (!f.licence || !IMAGE_MIME.test(f.mime) || BAD_FILE.test(f.title)) return null
  const item: Item = {
    id,
    title: short(meta.title || cleanFileTitle(f.title), 300),
    artist: short(meta.artist || "Unknown", 200),
    year: meta.year,
    image: f.url,
    thumbnail: f.thumb,
    width: f.width,
    height: f.height,
    licence: f.licence,
    source: meta.museum ? `${short(meta.museum, 120)} via Wikimedia Commons` : "Wikimedia Commons",
    source_url: f.descriptionUrl,
    ai_generated: false,
  }
  if (f.width > UHD_PX && f.thumb !== f.url) item.image_4k = resizeThumb(f.thumb, UHD_PX)
  if (f.licence.startsWith("CC-BY"))
    item.attribution = short(`${f.artist || "Unknown"}, ${f.licenceName}, via Wikimedia Commons`, 300)
  return item
}

const yearFrom = (s: string) => {
  const m = /\b(1[0-9]{3}|20[0-2][0-9])\b/.exec(s)
  return m ? Number(m[1]) : null
}

async function fromWikidata(where: string, limit: number): Promise<Candidate[]> {
  const ws = await wikidataWorks(where, limit)
  const files = await fileInfo([...new Set(ws.map((w) => w.fileTitle))])
  const out: Candidate[] = []
  for (const w of ws) {
    const f = files.get(w.fileTitle)
    if (!f || !plausiblyPublicDomain(w.year, w.creatorDied)) continue
    const item = commonsItem(f, `wikidata-${w.qid}`, {
      title: w.label || f.objectName,
      artist: w.creator || (f.artist.length < 80 ? f.artist : ""),
      year: w.year,
      museum: w.collection,
    })
    if (item)
      out.push({
        item,
        fame: w.sitelinks,
        artistKey: w.creatorQid ?? item.artist,
        colourUrl: resizeThumb(f.thumb, 120),
      })
  }
  return out
}

function fromCommonsFiles(files: CommonsFile[], fame: number, ai = false): Candidate[] {
  const out: Candidate[] = []
  for (const f of files) {
    const year = yearFrom(f.date) ?? yearFrom(f.title)
    const artist = f.artist.length < 80 ? f.artist.replace(/\s*\(.*?\)\s*/g, " ").trim() : ""
    const item = commonsItem(f, `commons-${f.sha1.slice(0, 12)}`, {
      title: f.objectName.length < 200 ? f.objectName : "",
      artist,
      year,
    })
    if (!item) continue
    item.ai_generated = ai
    out.push({ item, fame, artistKey: item.artist, colourUrl: resizeThumb(f.thumb, 120) })
  }
  return out
}

export function fromSmk(ws: SmkWork[], fame: number): Candidate[] {
  return ws
    .filter((w) => plausiblyPublicDomain(w.year, w.died))
    .map((w) => ({
      item: {
        id: `smk-${w.objectNumber.replace(/[^A-Za-z0-9_.-]/g, "_")}`,
        title: short(w.title, 300),
        artist: w.artist,
        year: w.year,
        ...(w.dateText ? { date: w.dateText.slice(0, 80) } : {}),
        image: w.image,
        ...(longEdge(w) > UHD_PX ? { image_4k: `${w.iiif}/full/!${UHD_PX},${UHD_PX}/0/default.jpg` } : {}),
        thumbnail: w.thumbnail,
        iiif: w.iiif,
        width: w.width,
        height: w.height,
        licence: "PD" as const,
        source: "SMK – Statens Museum for Kunst",
        source_url: w.pageUrl,
        ai_generated: false,
      },
      fame,
      artistKey: w.artist,
      colourUrl: `${w.iiif.replace("//iip.smk.dk", "//iip-thumb.smk.dk")}/full/!120,120/0/default.jpg`,
    }))
}

export async function gather(spec: SourceSpec, ai = false): Promise<Candidate[]> {
  switch (spec.kind) {
    case "wikidata":
      return fromWikidata(spec.where, spec.limit ?? 1200)
    case "commons": {
      const files = (await searchFiles(spec.query, spec.max ?? 500)).filter(
        (f) => (!spec.include || spec.include.test(f.title)) && (!spec.exclude || !spec.exclude.test(f.title)),
      )
      return fromCommonsFiles(files, spec.fame ?? 3, ai)
    }
    case "commons-files": {
      const info = await fileInfo(spec.titles)
      return fromCommonsFiles([...info.values()], spec.fame ?? 3, ai)
    }
    case "smk":
      return fromSmk(await smkSearch(spec.keys, spec.filters), spec.fame ?? 4)
  }
}

export function orientationFactor(width: number, height: number) {
  const a = width / height
  if (a >= 1.25) return 1.6
  if (a > 1.05) return 1.35
  if (a >= 0.95) return 1.1
  return 1
}

export const score = (c: Candidate) =>
  (c.fame + 1) * orientationFactor(c.item.width, c.item.height) * (longEdge(c.item) >= UHD_PX ? 1.25 : 1)

export interface Pick {
  landscapeOnly?: boolean
  size: number
  minPx: number
  perArtist: number
  rank?: (c: Candidate) => number
}

export function select(cands: Candidate[], opts: Pick): Candidate[] {
  const rank = opts.rank ?? score
  const seenId = new Set<string>()
  const seenImage = new Set<string>()
  const perArtist = new Map<string, number>()
  const out: Candidate[] = []
  for (const c of cands.toSorted((a, b) => rank(b) - rank(a) || a.item.id.localeCompare(b.item.id))) {
    if (out.length >= opts.size) break
    if (longEdge(c.item) < opts.minPx || seenId.has(c.item.id) || seenImage.has(c.item.image)) continue
    if (opts.landscapeOnly && c.item.width < c.item.height * 1.15) continue
    if (NOT_FOR_THE_LIVING_ROOM.test(c.item.title)) continue
    const key = c.artistKey.toLowerCase()
    const n = perArtist.get(key) ?? 0
    if (key !== "unknown" && n >= opts.perArtist) continue
    perArtist.set(key, n + 1)
    seenId.add(c.item.id)
    seenImage.add(c.item.image)
    out.push(c)
  }
  return out
}

export type { WikidataWork }
