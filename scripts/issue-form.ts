import { appendFileSync, readFileSync, writeFileSync } from "node:fs"

/** Turns a "New collection" issue form body into new-collection.ts arguments. Untrusted input: validate everything. */
export function parseForm(body: string): Record<string, string> {
  const out: Record<string, string> = {}
  const parts = body.split(/^###\s+/m).slice(1)
  for (const part of parts) {
    const nl = part.indexOf("\n")
    const label = part.slice(0, nl).trim().toLowerCase()
    const value = part.slice(nl + 1).trim()
    out[label] = value === "_No response_" ? "" : value
  }
  return out
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const GH = /^[A-Za-z0-9-]{1,39}$/

export interface Request {
  id: string
  title: string
  description: string
  tags: string
  curator: string
  github: string
  works: string
  ai: boolean
}

export function toRequest(form: Record<string, string>, author: string): Request | string {
  const id = (form["collection id"] ?? "").trim()
  if (!SLUG.test(id) || id.length < 3 || id.length > 64)
    return "Collection id must be 3–64 characters of lowercase letters, digits and dashes."
  const title = (form["title"] ?? "").trim()
  const description = (form["description"] ?? "").replace(/\s+/g, " ").trim()
  if (title.length < 3 || title.length > 80) return "Title must be 3–80 characters."
  if (description.length < 20 || description.length > 600) return "Description must be 20–600 characters."
  const works = (form["works"] ?? "").replace(/^```\w*\n?|```$/gm, "").trim()
  if (!works) return "Add at least one work."
  const github = GH.test(author) ? author : ""
  return {
    id,
    title,
    description,
    tags: (form["tags"] ?? "").replace(/[^a-z0-9,\- ]/gi, ""),
    curator: (form["curator name"] ?? "").trim() || github || "Anonymous",
    github,
    works,
    ai: /\[x\]/i.test(form["ai-generated"] ?? ""),
  }
}

if (import.meta.main) {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH!, "utf8")) as {
    issue: { body: string; user: { login: string } }
  }
  const req = toRequest(parseForm(event.issue.body ?? ""), event.issue.user.login)
  const out = process.env.GITHUB_OUTPUT!
  if (typeof req === "string") {
    appendFileSync(out, `error<<EOF\n${req}\nEOF\n`)
    process.exit(0)
  }
  writeFileSync(".cache-works.txt", req.works)
  writeFileSync(
    ".cache-args.json",
    JSON.stringify([
      "--id",
      req.id,
      "--title",
      req.title,
      "--description",
      req.description,
      "--tags",
      req.tags,
      "--curator",
      req.curator,
      ...(req.github ? ["--github", req.github] : []),
      "--works",
      ".cache-works.txt",
      ...(req.ai ? ["--ai"] : []),
    ]),
  )
  appendFileSync(out, `id=${req.id}\n`)
}
