import { probeImage, request } from "./http.ts"
import type { Finding } from "./rules.ts"
import type { Collection, Item } from "./types.ts"

/** Deterministic per day, so a rerun checks the same sample and a new day checks others. */
export function sample<T>(list: T[], n: number, seed: string): T[] {
  if (list.length <= n) return [...list]
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const rnd = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy.slice(0, n)
}

async function checkItem(file: string, item: Item): Promise<Finding[]> {
  const out: Finding[] = []
  const add = (level: Finding["level"], message: string) => out.push({ level, file, item: item.id, message })

  const probe = await probeImage(item.image, { gapMs: 300 }).catch((e: unknown) => e as Error)
  if (probe instanceof Error) add("error", `image unreachable: ${probe.message}`)
  else if (!probe.ok) add("error", `image returned HTTP ${probe.status}`)
  else if (!probe.size) {
    if (!probe.contentType.startsWith("image/")) add("error", `image is ${probe.contentType || "not an image"}`)
  } else {
    const { width, height } = probe.size
    const off = Math.abs(width / height - item.width / item.height)
    if (off > 0.02) add("error", `image is ${width}×${height}, manifest says ${item.width}×${item.height}`)
    else if (Math.max(width, height) < Math.max(item.width, item.height) * 0.95)
      add("warning", `image is ${width}×${height}, smaller than the declared ${item.width}×${item.height}`)
  }

  for (const [field, url] of [
    ["thumbnail", item.thumbnail],
    ["image_4k", item.image_4k],
  ] as const) {
    if (!url) continue
    const p = await probeImage(url, { gapMs: 300 }).catch((e: unknown) => e as Error)
    if (p instanceof Error || !p.ok) add("error", `${field} unreachable`)
  }
  if (item.iiif) {
    const r = await request(`${item.iiif}/info.json`, { gapMs: 300, retries: 1 }).catch((e: unknown) => e as Error)
    if (r instanceof Error || !r.ok) add("warning", "IIIF info.json unreachable")
  }
  return out
}

export async function checkUrls(file: string, c: Collection, n: number, seed: string): Promise<Finding[]> {
  const picked = sample(c.items, n, `${seed}:${c.id}`)
  const cover = c.items.find((i) => i.id === c.cover)
  if (cover && !picked.includes(cover)) picked.push(cover)
  const out: Finding[] = []
  for (const item of picked) out.push(...(await checkItem(file, item)))
  return out
}
