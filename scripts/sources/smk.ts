import { getJson } from "../lib/http.ts"

const API = "https://api.smk.dk/api/v1/art/search/"

export interface SmkWork {
  objectNumber: string
  title: string
  artist: string
  died: number | null
  year: number | null
  dateText: string
  width: number
  height: number
  iiif: string
  image: string
  thumbnail: string
  pageUrl: string
  colors: string[]
  brightness: number | null
}

interface SmkItem {
  object_number: string
  titles?: { title: string; language?: string; type?: string }[]
  production?: {
    creator?: string
    creator_forename?: string
    creator_surname?: string
    creator_date_of_death?: string
  }[]
  production_date?: { start?: string; period?: string }[]
  image_width?: number
  image_height?: number
  image_iiif_id?: string
  image_native?: string
  image_thumbnail?: string
  frontend_url?: string
  public_domain?: boolean
  rights?: string
  colors?: string[]
  brightness?: number
}

function toWork(i: SmkItem): SmkWork | null {
  if (!i.public_domain || !i.image_iiif_id || !i.image_width || !i.image_height || !i.image_native) return null
  const titles = i.titles ?? []
  const title = (
    titles.find((t) => t.language === "engelsk") ??
    titles.find((t) => t.type === "museumstitel") ??
    titles[0]
  )?.title
  const p = i.production?.[0]
  const artist =
    p?.creator_forename && p.creator_surname ? `${p.creator_forename} ${p.creator_surname}` : (p?.creator ?? "")
  const d = i.production_date?.[0]
  return {
    objectNumber: i.object_number,
    title: title?.trim() || "Untitled",
    artist: artist || "Unknown",
    died: p?.creator_date_of_death ? Number(p.creator_date_of_death.slice(0, 4)) : null,
    year: d?.start ? Number(d.start.slice(0, 4)) : null,
    dateText: d?.period ?? "",
    width: i.image_width,
    height: i.image_height,
    iiif: i.image_iiif_id,
    image: i.image_native,
    thumbnail: `${i.image_iiif_id.replace("//iip.smk.dk", "//iip-thumb.smk.dk")}/full/!1024,/0/default.jpg`,
    pageUrl: i.frontend_url ?? `https://open.smk.dk/artwork/image/${i.object_number}`,
    colors: i.colors ?? [],
    brightness: i.brightness ?? null,
  }
}

/** Public-domain paintings with an image, for a free-text query and optional extra filters. */
export async function search(keys: string, filters: string[] = [], max = 2000): Promise<SmkWork[]> {
  const out: SmkWork[] = []
  const all = ["[public_domain:true]", "[has_image:true]", "[object_names:maleri]", ...filters].join(",")
  for (let offset = 0; offset < max; offset += 100) {
    const params = new URLSearchParams({ keys, offset: String(offset), rows: "100", filters: all })
    const res = await getJson<{ found: number; items?: SmkItem[] }>(`${API}?${params}`, { gapMs: 500 })
    for (const i of res?.items ?? []) {
      const w = toWork(i)
      if (w) out.push(w)
    }
    if (!res?.items?.length || offset + 100 >= res.found) break
  }
  return out
}

export async function byObjectNumber(objectNumber: string): Promise<SmkWork | null> {
  const res = await getJson<{ items?: SmkItem[] }>(
    `https://api.smk.dk/api/v1/art/?object_number=${encodeURIComponent(objectNumber)}`,
    { gapMs: 500 },
  )
  const item = res?.items?.[0]
  return item ? toWork(item) : null
}
