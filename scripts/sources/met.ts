import { getJson, probeImage } from "../lib/http.ts"

const API = "https://collectionapi.metmuseum.org/public/collection/v1/objects"

export interface MetWork {
  objectId: number
  title: string
  artist: string
  year: number | null
  dateText: string
  image: string
  thumbnail: string
  width: number
  height: number
  pageUrl: string
}

interface MetObject {
  objectID: number
  isPublicDomain?: boolean
  primaryImage?: string
  primaryImageSmall?: string
  title?: string
  artistDisplayName?: string
  culture?: string
  objectDate?: string
  objectBeginDate?: number
  objectURL?: string
}

/** One public-domain Met object with the pixel size read from its image header. */
export async function object(id: number): Promise<MetWork | null> {
  const o = await getJson<MetObject>(`${API}/${id}`, { gapMs: 200 })
  if (!o?.isPublicDomain || !o.primaryImage) return null
  const probe = await probeImage(o.primaryImage, { gapMs: 200 })
  if (!probe.size) return null
  return {
    objectId: o.objectID,
    title: o.title?.trim() || "Untitled",
    artist: o.artistDisplayName?.trim() || o.culture?.trim() || "Unknown",
    year: o.objectBeginDate ?? null,
    dateText: o.objectDate ?? "",
    image: o.primaryImage,
    thumbnail: o.primaryImageSmall || o.primaryImage,
    width: probe.size.width,
    height: probe.size.height,
    pageUrl: o.objectURL ?? `https://www.metmuseum.org/art/collection/search/${o.objectID}`,
  }
}
