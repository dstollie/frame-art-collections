import { getJson } from "../lib/http.ts"

const SPARQL = "https://query.wikidata.org/sparql"

export interface WikidataWork {
  qid: string
  label: string
  creator: string
  creatorQid: string | null
  creatorDied: number | null
  year: number | null
  dateText: string
  fileTitle: string
  sitelinks: number
  collection: string
}

interface Binding {
  [k: string]: { value: string } | undefined
}

const yearOf = (v: string | undefined) => {
  if (!v) return null
  const m = /^(-?\d{1,4})/.exec(v.replace(/^\+/, ""))
  return m ? Number(m[1]) : null
}

async function sparql(query: string): Promise<Binding[]> {
  const res = await getJson<{ results: { bindings: Binding[] } }>(SPARQL, {
    method: "POST",
    body: new URLSearchParams({ query }).toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/sparql-results+json" },
    gapMs: 1500,
    timeoutMs: 75_000,
    retries: 2,
  })
  if (!res) throw new Error(`SPARQL failed: ${query.trim().slice(0, 160)}`)
  return res.results.bindings
}

const qidOf = (b: Binding, k: string) => b[k]?.value.split("/").pop() ?? null
const cleanLabel = (v: string | undefined) => (!v || /^Q\d+$/.test(v) || v.startsWith("http") ? "" : v)

/**
 * Works matching `where` (a SPARQL group pattern binding ?item) that have a Commons image,
 * ranked by Wikipedia sitelinks as a proxy for how well known they are.
 */
export async function works(where: string, limit: number): Promise<WikidataWork[]> {
  const ranked = await sparql(`SELECT DISTINCT ?item ?sl WHERE {
  ${where}
  ?item wdt:P18 [] ; wikibase:sitelinks ?sl .
} ORDER BY DESC(?sl) LIMIT ${limit}`)
  const sitelinks = new Map(ranked.map((b) => [qidOf(b, "item")!, Number(b.sl?.value ?? 0)]))
  const byItem = new Map<string, WikidataWork>()
  const qids = [...sitelinks.keys()]
  for (let i = 0; i < qids.length; i += 150) {
    const values = qids
      .slice(i, i + 150)
      .map((q) => `wd:${q}`)
      .join(" ")
    const rows = await sparql(`SELECT ?item ?label ?creator ?creatorLabel ?death ?inc ?image ?collLabel WHERE {
  VALUES ?item { ${values} }
  ?item wdt:P18 ?image .
  OPTIONAL { ?item wdt:P170 ?creator . OPTIONAL { ?creator wdt:P570 ?death } }
  OPTIONAL { ?item wdt:P571 ?inc }
  OPTIONAL { ?item wdt:P195 ?coll }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "en,mul,nl,fr,de,es,it,da,sv,ja".
    ?item rdfs:label ?label . ?creator rdfs:label ?creatorLabel . ?coll rdfs:label ?collLabel .
  }
}`)
    for (const b of rows) {
      const qid = qidOf(b, "item")!
      const died = yearOf(b.death?.value)
      const year = yearOf(b.inc?.value)
      const prev = byItem.get(qid)
      if (prev) {
        if (died !== null && (prev.creatorDied === null || died > prev.creatorDied)) prev.creatorDied = died
        if (year !== null && (prev.year === null || year < prev.year)) prev.year = year
        if (!prev.collection) prev.collection = cleanLabel(b.collLabel?.value)
        continue
      }
      byItem.set(qid, {
        qid,
        label: cleanLabel(b.label?.value),
        creator: cleanLabel(b.creatorLabel?.value),
        creatorQid: qidOf(b, "creator"),
        creatorDied: died,
        year,
        dateText: "",
        fileTitle: `File:${decodeURIComponent(b.image!.value.split("/Special:FilePath/").pop()!).replace(/_/g, " ")}`,
        sitelinks: sitelinks.get(qid) ?? 0,
        collection: cleanLabel(b.collLabel?.value),
      })
    }
  }
  return [...byItem.values()].toSorted((a, b) => b.sitelinks - a.sitelinks)
}
