import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import sharp from "sharp"

import { ROOT } from "../lib/collections.ts"
import { request } from "../lib/http.ts"

export interface Colour {
  /** Mean lightness 0..1 */
  l: number
  /** Mean saturation 0..1 */
  s: number
  /** Share of saturated pixels per hue family. */
  blue: number
  warm: number
  green: number
  red: number
}

const FILE = join(ROOT, ".cache", "colours.json")
const cache: Record<string, Colour | null> = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {}
export const saveColours = () => {
  mkdirSync(join(ROOT, ".cache"), { recursive: true })
  writeFileSync(FILE, JSON.stringify(cache))
}

function hsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h =
    max === r ? ((g - b) / d + (g < b ? 6 : 0)) * 60 : max === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60
  return [h, s, l]
}

export function analyse(pixels: Uint8Array): Colour {
  let l = 0
  let s = 0
  const fam = { blue: 0, warm: 0, green: 0, red: 0 }
  const n = pixels.length / 3
  for (let i = 0; i < pixels.length; i += 3) {
    const [h, sat, lig] = hsl(pixels[i]! / 255, pixels[i + 1]! / 255, pixels[i + 2]! / 255)
    l += lig
    s += sat
    if (sat < 0.18 || lig < 0.08 || lig > 0.95) continue
    if (h >= 185 && h < 260) fam.blue++
    else if (h >= 25 && h < 60) fam.warm++
    else if (h >= 65 && h < 170) fam.green++
    else if (h >= 340 || h < 15) fam.red++
  }
  return { l: l / n, s: s / n, blue: fam.blue / n, warm: fam.warm / n, green: fam.green / n, red: fam.red / n }
}

export async function colourOf(url: string): Promise<Colour | null> {
  if (url in cache) return cache[url] ?? null
  const res = await request(url, { gapMs: 150, retries: 2 }).catch(() => null)
  let result: Colour | null = null
  if (res?.ok) {
    const buf = Buffer.from(await res.arrayBuffer())
    const raw = await sharp(buf)
      .resize(32, 32, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer()
      .catch(() => null)
    if (raw) result = analyse(new Uint8Array(raw))
  }
  cache[url] = result
  return result
}
