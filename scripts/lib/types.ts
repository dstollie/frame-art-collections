export const SCHEMA_URL = "https://dstollie.github.io/frame-art-collections/schema/collection.v1.schema.json"
export const SITE_URL = "https://dstollie.github.io/frame-art-collections"

export const LICENCES = [
  "CC0-1.0",
  "PD",
  "CC-BY-2.0",
  "CC-BY-2.5",
  "CC-BY-3.0",
  "CC-BY-4.0",
  "CC-BY-SA-2.0",
  "CC-BY-SA-2.5",
  "CC-BY-SA-3.0",
  "CC-BY-SA-4.0",
] as const
export type Licence = (typeof LICENCES)[number]

export const UHD_PX = 3840
export const MIN_PX = 1920

export interface Item {
  id: string
  title: string
  artist: string
  year: number | null
  date?: string
  image: string
  image_4k?: string
  thumbnail?: string
  iiif?: string
  width: number
  height: number
  licence: Licence
  attribution?: string
  source: string
  source_url: string
  ai_generated: boolean
  tags?: string[]
}

export interface Curator {
  name: string
  github?: string
  url?: string
}

export interface Collection {
  $schema: typeof SCHEMA_URL
  schema_version: 1
  id: string
  title: string
  description: string
  tags: string[]
  curator: Curator
  cover: string
  generator?: string
  items: Item[]
}

export const longEdge = (i: Pick<Item, "width" | "height">) => Math.max(i.width, i.height)
export const isLandscape = (i: Pick<Item, "width" | "height">) => i.width > i.height
