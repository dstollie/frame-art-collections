import type { LoadedCollection } from "./collections.ts"
import { SITE_URL, UHD_PX, isLandscape, longEdge, type Curator, type Item } from "./types.ts"

export interface IndexEntry {
  id: string
  title: string
  description: string
  tags: string[]
  curator: Curator
  url: string
  count: number
  landscape_count: number
  uhd_count: number
  ai_generated_count: number
  licences: Record<string, number>
  cover: { id: string; title: string; artist: string; thumbnail: string; width: number; height: number }
}

export interface Index {
  schema_version: 1
  generated_at: string
  commit?: string
  totals: { collections: number; items: number; unique_items: number }
  collections: IndexEntry[]
}

const preview = (i: Item) => i.thumbnail ?? i.image_4k ?? i.image

export function buildIndex(
  all: LoadedCollection[],
  opts: { now?: Date; commit?: string; baseUrl?: string } = {},
): Index {
  const base = opts.baseUrl ?? SITE_URL
  const unique = new Set<string>()
  const collections = all.map(({ collection: c }): IndexEntry => {
    const licences: Record<string, number> = {}
    for (const i of c.items) {
      licences[i.licence] = (licences[i.licence] ?? 0) + 1
      unique.add(i.image)
    }
    const cover = c.items.find((i) => i.id === c.cover) ?? c.items[0]!
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      tags: c.tags,
      curator: c.curator,
      url: `${base}/collections/${c.id}.json`,
      count: c.items.length,
      landscape_count: c.items.filter(isLandscape).length,
      uhd_count: c.items.filter((i) => longEdge(i) >= UHD_PX).length,
      ai_generated_count: c.items.filter((i) => i.ai_generated).length,
      licences,
      cover: {
        id: cover.id,
        title: cover.title,
        artist: cover.artist,
        thumbnail: preview(cover),
        width: cover.width,
        height: cover.height,
      },
    }
  })
  return {
    schema_version: 1,
    generated_at: (opts.now ?? new Date()).toISOString(),
    ...(opts.commit ? { commit: opts.commit } : {}),
    totals: {
      collections: collections.length,
      items: collections.reduce((n, c) => n + c.count, 0),
      unique_items: unique.size,
    },
    collections,
  }
}
