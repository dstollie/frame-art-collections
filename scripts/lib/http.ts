import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { ROOT } from "./collections.ts"
import { imageSize, type Size } from "./image-size.ts"

export const USER_AGENT =
  "FrameArtCollections/1.0 (+https://github.com/dstollie/frame-art-collections; community art for Samsung The Frame)"

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const lastHit = new Map<string, number>()

/** Waits so that one host sees at most one request per `gapMs`. */
export async function polite(url: string, gapMs: number) {
  const host = new URL(url).host
  const wait = (lastHit.get(host) ?? 0) + gapMs - Date.now()
  if (wait > 0) await sleep(wait)
  lastHit.set(host, Date.now())
}

export interface FetchOpts {
  gapMs?: number
  headers?: Record<string, string>
  method?: string
  body?: string
  retries?: number
  timeoutMs?: number
}

export async function request(url: string, opts: FetchOpts = {}): Promise<Response> {
  const retries = opts.retries ?? 3
  for (let attempt = 0; ; attempt++) {
    await polite(url, opts.gapMs ?? 250)
    const init: RequestInit = {
      headers: { "User-Agent": USER_AGENT, ...opts.headers },
      redirect: "follow",
      signal: AbortSignal.timeout(opts.timeoutMs ?? 60_000),
    }
    if (opts.method) init.method = opts.method
    if (opts.body) init.body = opts.body
    const res = await fetch(url, init).catch((e: unknown) => e as Error)
    const retryable = res instanceof Error || res.status === 429 || res.status >= 500
    if (!retryable || attempt >= retries) {
      if (res instanceof Error) throw res
      return res
    }
    const after = res instanceof Error ? 0 : Number(res.headers.get("retry-after") ?? 0)
    await sleep(Math.max(after * 1000, 2000 * 2 ** attempt))
  }
}

const CACHE_DIR = join(ROOT, ".cache", "http")

/** GET JSON with an on-disk cache so seed reruns don't hit the sources again. */
export async function getJson<T>(url: string, opts: FetchOpts & { cache?: boolean } = {}): Promise<T | null> {
  const key = createHash("sha1")
    .update(`${opts.method ?? "GET"} ${url} ${opts.body ?? ""}`)
    .digest("hex")
  const file = join(CACHE_DIR, `${key}.json`)
  if (opts.cache !== false && existsSync(file)) return JSON.parse(readFileSync(file, "utf8")) as T
  const res = await request(url, { ...opts, headers: { Accept: "application/json", ...opts.headers } })
  if (!res.ok) return null
  const text = await res.text()
  const data = JSON.parse(text) as T
  if (opts.cache !== false) {
    mkdirSync(CACHE_DIR, { recursive: true })
    writeFileSync(file, text)
  }
  return data
}

export interface Probe {
  ok: boolean
  status: number
  contentType: string
  size: Size | null
}

/** Fetches the first bytes of an image and reads its pixel size from the header. */
export async function probeImage(url: string, opts: FetchOpts = {}): Promise<Probe> {
  const res = await request(url, { ...opts, headers: { Range: "bytes=0-262143", ...opts.headers }, retries: 2 })
  const contentType = res.headers.get("content-type") ?? ""
  if (!res.ok || !res.body) return { ok: false, status: res.status, contentType, size: null }
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (total < 262_144) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.length
  }
  await reader.cancel().catch(() => {})
  const buf = new Uint8Array(total)
  let off = 0
  for (const c of chunks) {
    buf.set(c, off)
    off += c.length
  }
  return { ok: true, status: res.status, contentType, size: imageSize(buf) }
}
