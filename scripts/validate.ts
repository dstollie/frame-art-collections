import { appendFileSync } from "node:fs"
import { relative, resolve } from "node:path"
import { parseArgs } from "node:util"

import { ROOT, collectionFiles, loadCollections } from "./lib/collections.ts"
import { validateAll } from "./lib/rules.ts"
import { checkUrls } from "./lib/urls.ts"

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    "check-urls": { type: "boolean", default: false },
    sample: { type: "string", default: "6" },
    seed: { type: "string", default: new Date().toISOString().slice(0, 10) },
  },
})

const all = loadCollections()
const findings = validateAll(all)

const only = positionals.length ? new Set(positionals.map((p) => resolve(p))) : null
if (values["check-urls"]) {
  const targets = all.filter((l) => !only || only.has(l.file))
  const n = Number(values.sample)
  for (const { file, collection } of targets) {
    if (findings.some((f) => f.file === file && f.level === "error")) continue
    process.stdout.write(`checking URLs in ${collection.id} (${Math.min(n, collection.items.length)} sampled)\n`)
    findings.push(...(await checkUrls(file, collection, n, values.seed)))
  }
}

const rel = (f: string) => relative(ROOT, f)
const gh = !!process.env.GITHUB_ACTIONS
for (const f of findings) {
  const where = f.item ? `${rel(f.file)} [${f.item}]` : rel(f.file)
  if (gh) process.stdout.write(`::${f.level} file=${rel(f.file)}::${f.item ? `${f.item}: ` : ""}${f.message}\n`)
  else process.stdout.write(`${f.level === "error" ? "✗" : "!"} ${where}: ${f.message}\n`)
}

const errors = findings.filter((f) => f.level === "error")
const warnings = findings.length - errors.length
const items = all.reduce((n, l) => n + (Array.isArray(l.collection.items) ? l.collection.items.length : 0), 0)
const summary = `${collectionFiles().length} collections, ${items} items: ${errors.length} errors, ${warnings} warnings`
process.stdout.write(`\n${summary}\n`)
if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [`### Validation`, "", summary, ""]
  for (const f of findings.slice(0, 200))
    lines.push(
      `- ${f.level === "error" ? "❌" : "⚠️"} \`${rel(f.file)}\`${f.item ? ` \`${f.item}\`` : ""}: ${f.message}`,
    )
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`)
}
process.exit(errors.length ? 1 : 0)
