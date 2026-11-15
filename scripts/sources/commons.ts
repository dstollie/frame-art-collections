import { getJson } from "../lib/http.ts"
import type { Licence } from "../lib/types.ts"

const API = "https://commons.wikimedia.org/w/api.php"
const GAP = 400

export interface CommonsFile {
  title: string
  url: string
  descriptionUrl: string
  width: number
  height: number
  mime: string
  sha1: string
  thumb: string
  licence: Licence | null
  licenceName: string
  artist: string
  credit: string
  objectName: string
  date: string
}

interface ImageInfo {
  url: string
  descriptionurl: string
  width: number
  height: number
  mime: string
  sha1: string
  thumburl?: string
  extmetadata?: Record<string, { value: string } | undefined>
}

interface QueryResult {
  continue?: Record<string, string>
  query?: {
    pages?: Record<string, { title: string; missing?: string; imageinfo?: ImageInfo[] }>
    normalized?: { from: string; to: string }[]
    search?: { title: string }[]
    categorymembers?: { title: string }[]
  }
}

export const stripHtml = (s: string) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const stripQuery = (u: string) => u.split("?")[0]!

export function mapLicence(short: string): Licence | null {
  const s = short.trim()
  if (/^(public domain|pdm|pd\b|pd-)/i.test(s)) return "PD"
  if (/^cc0/i.test(s)) return "CC0-1.0"
  const m = /^cc[ -]by(-sa)?[ -](\d\.\d)$/i.exec(s)
  if (!m) return null
  const licence = `CC-BY${m[1] ? "-SA" : ""}-${m[2]}`
  return ["2.0", "2.5", "3.0", "4.0"].includes(m[2]!) ? (licence as Licence) : null
}

/** The thumbnail URL for another width, built from the one the API returned. */
export const resizeThumb = (thumb: string, width: number) => thumb.replace(/\/(\d+)px-([^/]+)$/, `/${width}px-$2`)

function toFile(page: { title: string; imageinfo?: ImageInfo[] }): CommonsFile | null {
  const ii = page.imageinfo?.[0]
  if (!ii) return null
  const meta = (k: string) => stripHtml(ii.extmetadata?.[k]?.value ?? "")
  const licenceName = meta("LicenseShortName")
  return {
    title: page.title,
    url: stripQuery(ii.url),
    descriptionUrl: ii.descriptionurl,
    width: ii.width,
    height: ii.height,
    mime: ii.mime,
    sha1: ii.sha1,
    thumb: stripQuery(ii.thumburl ?? ii.url),
    licence: mapLicence(licenceName),
    licenceName,
    artist: meta("Artist"),
    credit: meta("Credit"),
    objectName: meta("ObjectName"),
    date: meta("DateTimeOriginal"),
  }
}

const IIPROPS = {
  prop: "imageinfo",
  iiprop: "url|size|mime|sha1|extmetadata",
  iiurlwidth: "960",
  iiextmetadatafilter: "LicenseShortName|Artist|Credit|ObjectName|DateTimeOriginal",
  format: "json",
  formatversion: "1",
}

/** Image info for up to 50 file titles per request. */
export async function fileInfo(titles: string[]): Promise<Map<string, CommonsFile>> {
  const out = new Map<string, CommonsFile>()
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50)
    const params = new URLSearchParams({ action: "query", titles: batch.join("|"), ...IIPROPS })
    const res = await getJson<QueryResult>(`${API}?${params}`, { gapMs: GAP })
    const back = new Map((res?.query?.normalized ?? []).map((n) => [n.to, n.from]))
    for (const page of Object.values(res?.query?.pages ?? {})) {
      const f = toFile(page)
      if (f) out.set(back.get(page.title) ?? page.title, f)
    }
  }
  return out
}

/** Files from a CirrusSearch query (supports incategory:, deepcat:, filew:, hastemplate:). */
export async function searchFiles(query: string, max: number): Promise<CommonsFile[]> {
  const out: CommonsFile[] = []
  let cont: Record<string, string> = {}
  while (out.length < max) {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: query,
      gsrnamespace: "6",
      gsrlimit: "50",
      ...IIPROPS,
      ...cont,
    })
    const res = await getJson<QueryResult>(`${API}?${params}`, { gapMs: GAP })
    for (const page of Object.values(res?.query?.pages ?? {})) {
      const f = toFile(page)
      if (f) out.push(f)
    }
    if (!res?.continue?.gsroffset) break
    cont = { gsroffset: res.continue.gsroffset, continue: res.continue.continue ?? "" }
  }
  return out
}
