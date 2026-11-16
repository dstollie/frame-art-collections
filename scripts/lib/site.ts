// The static GitHub Pages site: a gallery of the collections and one page per collection.
import type { Index, IndexEntry } from "./index.ts"
import { SITE_URL, UHD_PX, longEdge, type Collection, type Item, type Licence } from "./types.ts"

const REPO = "https://github.com/dstollie/frame-art-collections"
const APP = "https://github.com/dstollie/ha-frame-art"
const NEW_ISSUE = `${REPO}/issues/new?template=new-collection.yml`
const ADD_APP_REPO =
  "https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fdstollie%2Fha-frame-art"

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!)

/** A preview about `px` wide: a Wikimedia thumbnail step, a IIIF size, or the thumbnail as it is. */
export function sizedThumb(item: Pick<Item, "thumbnail" | "iiif" | "image_4k" | "image">, px: number): string {
  if (item.iiif) return `${item.iiif}/full/${px},/0/default.jpg`
  const thumb = item.thumbnail ?? item.image_4k ?? item.image
  return /\/\d+px-[^/]+$/.test(thumb) ? thumb.replace(/\/\d+px-([^/]+)$/, `/${px}px-$1`) : thumb
}

const licenceLabel = (l: Licence | string) =>
  l === "PD"
    ? "Public domain"
    : l === "CC0-1.0"
      ? "CC0"
      : l.replace(/^CC-BY-SA-/, "CC BY-SA ").replace(/^CC-BY-/, "CC BY ")

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en")} ${n === 1 ? one : many}`

const CSS = `
:root{--ink:#15171F;--cream:#F6F0E6;--paper:#FBF8F2;--muted:#5B5F6B;--line:#E4DDD0;--verm:#F2542D;--cobalt:#3159D8;--gilt:#E3B341;
--bezel:#15171F;--serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;--sans:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{--ink:#F6F0E6;--cream:#1B1E27;--paper:#101219;--muted:#A9ADB8;--line:#2A2F3D;--cobalt:#8EA6FF;--bezel:#3A4052}}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 var(--sans)}
a{color:inherit}img{max-width:100%}
.wrap{max-width:76rem;margin:auto;padding:0 1.25rem}
nav{display:flex;align-items:center;gap:1.25rem;padding:1rem 0}
nav .brand{display:flex;align-items:center;gap:.6rem;text-decoration:none;margin-right:auto}
nav .brand img{width:34px;height:34px}nav .brand b{font:700 1.2rem var(--serif)}nav .brand span{font-size:.72rem;font-weight:700;letter-spacing:.12em;color:var(--verm)}
nav a.l{text-decoration:none;color:var(--muted);font-size:.95rem}nav a.l:hover{color:var(--ink)}
.hero{padding:3.5rem 0 2.5rem;display:grid;gap:2rem;grid-template-columns:1.2fr 1fr;align-items:center}
.hero h1{font:700 clamp(2.2rem,5vw,3.6rem)/1.05 var(--serif);margin:0 0 1rem;letter-spacing:-.01em}
.hero p{font-size:1.15rem;color:var(--muted);margin:0 0 1.5rem;max-width:34rem}
.stats{display:flex;gap:1.75rem;margin:0 0 1.75rem;color:var(--muted)}.stats strong{display:block;font:700 1.8rem var(--serif);color:var(--ink)}
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.75rem 1.2rem;border-radius:999px;font-weight:600;text-decoration:none;border:2px solid var(--ink)}
.btn.primary{background:var(--verm);border-color:var(--verm);color:#fff}.btn+.btn{margin-left:.5rem}
.mosaic{display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem;transform:rotate(-2deg)}
.frame{background:var(--bezel);padding:5px;box-shadow:0 10px 24px -10px rgba(0,0,0,.45)}
.frame>div{background:#F6F0E6;padding:7%}.frame img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#ddd}
.bar{position:sticky;top:0;z-index:2;background:var(--paper);padding:.8rem 0;border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}
.bar input{flex:1 1 16rem;font:inherit;padding:.6rem .9rem;border:1px solid var(--line);border-radius:999px;background:var(--cream);color:var(--ink)}
.chip{font:inherit;font-size:.85rem;padding:.35rem .8rem;border-radius:999px;border:1px solid var(--line);background:none;color:var(--ink);cursor:pointer}
.chip[aria-pressed=true]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.grid{display:grid;gap:2rem 1.5rem;grid-template-columns:repeat(auto-fill,minmax(17rem,1fr));padding:2rem 0 3rem}
.card{text-decoration:none;display:block}.card:hover .frame{transform:translateY(-3px)}.card .frame{transition:transform .15s}
.card h3{font:700 1.15rem/1.25 var(--serif);margin:.9rem 0 .25rem}.card p{margin:0 0 .4rem;color:var(--muted);font-size:.92rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.meta{font-size:.8rem;color:var(--muted)}
.empty{display:none;padding:3rem 0;text-align:center;color:var(--muted)}
section.band{background:var(--cream);border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:3rem 0}
section h2{font:700 2rem var(--serif);margin:0 0 .5rem}.lead{color:var(--muted);margin:0 0 1.75rem;max-width:44rem}
.routes{display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))}
.route{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:1.25rem}.route h3{margin:.25rem 0 .4rem;font:700 1.15rem var(--serif)}.route p{margin:0 0 .75rem;color:var(--muted);font-size:.95rem}
.route .n{font-weight:800;color:var(--verm)}.route a{color:var(--cobalt);font-weight:600}
code{font-size:.9em;background:var(--cream);padding:.1em .35em;border-radius:4px}
footer{padding:2.5rem 0 3rem;color:var(--muted);font-size:.88rem}footer a{color:var(--muted)}
.head{display:grid;gap:2.5rem;grid-template-columns:1fr 1.1fr;align-items:center;padding:2rem 0 2.5rem}
.head h1{font:700 clamp(2rem,4vw,3rem)/1.1 var(--serif);margin:.25rem 0 .75rem}
.tags{display:flex;flex-wrap:wrap;gap:.4rem;margin:1rem 0}.tag{font-size:.8rem;padding:.2rem .65rem;border-radius:999px;background:var(--cream);border:1px solid var(--line)}
.use{border-left:4px solid var(--verm);background:var(--cream);padding:1rem 1.25rem;border-radius:0 12px 12px 0;margin:1.25rem 0}
.use p{margin:.25rem 0}
.works{display:grid;gap:1.5rem 1.25rem;grid-template-columns:repeat(auto-fill,minmax(14rem,1fr));padding:1.5rem 0 3rem}
.work{text-decoration:none}.work img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:var(--cream);border-radius:4px}
.work b{display:block;margin-top:.5rem;font-weight:600;font-size:.95rem;line-height:1.3}.work small{display:block;color:var(--muted);font-size:.82rem}
.badge{display:inline-block;font-size:.7rem;font-weight:700;padding:.05rem .4rem;border-radius:4px;margin:.3rem .25rem 0 0;border:1px solid var(--line)}
.badge.ai{background:var(--cobalt);border-color:var(--cobalt);color:#fff}.badge.uhd{background:var(--gilt);border-color:var(--gilt);color:#15171F}
.credit{font-size:.75rem;color:var(--muted);margin-top:.2rem}
@media (max-width:760px){.hero,.head{grid-template-columns:1fr}.mosaic{display:none}.btn+.btn{margin:.5rem 0 0}}
`

function page(opts: { title: string; description: string; root: string; path: string; body: string; script?: string }) {
  const r = opts.root
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
<link rel="icon" href="${r}favicon.svg" type="image/svg+xml"><link rel="icon" href="${r}favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="${r}apple-touch-icon.png">
<link rel="canonical" href="${SITE_URL}/${opts.path}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(opts.title)}">
<meta property="og:description" content="${esc(opts.description)}"><meta property="og:url" content="${SITE_URL}/${opts.path}">
<meta property="og:image" content="${SITE_URL}/brand/social-preview.png"><meta name="twitter:card" content="summary_large_image">
<style>${CSS}</style></head><body>
<div class="wrap"><nav><a class="brand" href="${r}index.html"><picture><source srcset="${r}brand/mark-dark.svg" media="(prefers-color-scheme: dark)"><img src="${r}brand/mark.svg" alt=""></picture><b>Frame Art</b><span>COLLECTIONS</span></a>
<a class="l" href="${r}index.html#browse">Browse</a><a class="l" href="${r}index.html#contribute">Contribute</a><a class="l" href="${APP}">Get Frame Art</a><a class="l" href="${REPO}">GitHub</a></nav></div>
${opts.body}
<footer class="wrap">Every work here is public domain, CC0, CC BY or CC BY-SA; the licence and source are on each work. The collection files are CC0, the code is MIT.
Frame Art is an independent project, not made by Samsung or Home Assistant. <a href="${REPO}">Source on GitHub</a> · <a href="${r}index.json">index.json</a> · <a href="${r}schema/collection.v1.schema.json">schema</a></footer>
${opts.script ? `<script>${opts.script}</script>` : ""}
</body></html>
`
}

const framed = (src: string, alt: string, eager = false) =>
  `<div class="frame"><div><img ${eager ? "" : 'loading="lazy" '}src="${esc(src)}" alt="${esc(alt)}"></div></div>`

const card = (
  c: IndexEntry,
) => `<a class="card" href="c/${c.id}.html" data-tags="${esc(c.tags.join(" "))}" data-text="${esc(
  `${c.title} ${c.description} ${c.tags.join(" ")} ${c.curator.name}`.toLowerCase(),
)}">${framed(sizedThumb({ thumbnail: c.cover.thumbnail, image: c.cover.thumbnail }, 500), c.cover.title)}
<h3>${esc(c.title)}</h3><p>${esc(c.description)}</p>
<div class="meta">${plural(c.count, "work")} · ${c.uhd_count} in 4K${c.ai_generated_count ? ` · ${c.ai_generated_count} AI` : ""} · by ${esc(c.curator.name)}</div></a>`

const FILTER_JS = `
const q=document.getElementById('q'),chips=[...document.querySelectorAll('.chip')],cards=[...document.querySelectorAll('.card')],empty=document.querySelector('.empty');
let tag='';
function run(){const t=q.value.trim().toLowerCase();let n=0;for(const c of cards){const ok=(!tag||c.dataset.tags.split(' ').includes(tag))&&(!t||c.dataset.text.includes(t));c.hidden=!ok;if(ok)n++}empty.style.display=n?'none':'block';
const u=new URL(location);tag?u.searchParams.set('tag',tag):u.searchParams.delete('tag');t?u.searchParams.set('q',t):u.searchParams.delete('q');history.replaceState(null,'',u)}
for(const c of chips)c.onclick=()=>{tag=tag===c.dataset.tag?'':c.dataset.tag;for(const o of chips)o.setAttribute('aria-pressed',String(o.dataset.tag===tag));run()};
q.oninput=run;const p=new URLSearchParams(location.search);q.value=p.get('q')||'';tag=p.get('tag')||'';for(const o of chips)o.setAttribute('aria-pressed',String(o.dataset.tag===tag));run();
`

export function renderIndexPage(index: Index): string {
  const counts = new Map<string, number>()
  for (const c of index.collections) for (const t of c.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  const topTags = [...counts]
    .filter(([, n]) => n > 1)
    .toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 16)
  const uhd = index.collections.reduce((n, c) => n + c.uhd_count, 0)
  const mosaic = index.collections
    .filter((c) => c.cover.width > c.cover.height)
    .slice(0, 6)
    .map((c) =>
      framed(sizedThumb({ thumbnail: c.cover.thumbnail, image: c.cover.thumbnail }, 330), c.cover.title, true),
    )
    .join("")
  const body = `<div class="wrap"><header class="hero"><div>
<h1>Free art for your Frame, curated by everyone.</h1>
<p>Openly licensed paintings, prints and plates from museums worldwide, in collections you can hang on a Samsung The Frame with <a href="${APP}">Frame Art</a> for Home Assistant. Every one of them is free to use, and anyone can add a collection.</p>
<div class="stats"><div><strong>${index.totals.collections}</strong> collections</div><div><strong>${index.totals.unique_items.toLocaleString("en")}</strong> works</div><div><strong>${uhd.toLocaleString("en")}</strong> in 4K</div></div>
<a class="btn primary" href="${NEW_ISSUE}">+ Add your collection</a><a class="btn" href="${APP}#quick-start">Get Frame Art</a>
</div><div class="mosaic" aria-hidden="true">${mosaic}</div></header>
<div class="bar" id="browse"><input id="q" type="search" placeholder="Search collections, artists, moods…" aria-label="Search collections">
${topTags.map(([t]) => `<button class="chip" data-tag="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join("")}</div>
<main class="grid">${index.collections.map(card).join("")}</main>
<p class="empty">No collection matches. <a href="${NEW_ISSUE}">Make it yourself?</a></p></div>
<section class="band" id="contribute"><div class="wrap">
<h2>Add your collection</h2>
<p class="lead">Got a theme you'd leave on your wall for a week? Share it, and it shows up for every Frame Art user. Three ways in, all ending in a pull request that CI checks for licences, resolution and duplicates.</p>
<div class="routes">
<div class="route"><span class="n">1</span><h3>Fill in a form</h3><p>Give it a title and paste links to works on Wikimedia Commons, Wikidata, SMK or The Met. A bot writes the file and opens the pull request.</p><a href="${NEW_ISSUE}">Open the form →</a></div>
<div class="route"><span class="n">2</span><h3>Ask an AI agent</h3><p>Clone the repository and ask Claude Code or Codex to <em>"add a collection of misty landscapes"</em>. The <code>add-collection</code> skill finds openly licensed 4K works.</p><a href="${REPO}/tree/main/.agents/skills/add-collection">Read the skill →</a></div>
<div class="route"><span class="n">3</span><h3>Open a pull request</h3><p><code>pnpm new</code> builds the JSON from a list of links; <code>pnpm validate</code> checks it.</p><a href="${REPO}/blob/main/CONTRIBUTING.md">Contributing guide →</a></div>
</div>
<p class="lead" style="margin-top:1.75rem">New here? Pick a <a href="${REPO}/labels/good%20first%20collection">good first collection</a>, or say hi in <a href="${REPO}/discussions">Discussions</a>.</p>
</div></section>
<section class="wrap" style="padding:3rem 1.25rem 0"><h2>Use them</h2>
<p class="lead"><b>In Frame Art</b> every collection is there already: the app syncs this site every night, and you switch collections on or off under <b>Settings → Collections</b>. Don't have it yet? <a href="${ADD_APP_REPO}">Add the Frame Art repository to Home Assistant</a>.<br>
<b>In your own app</b>, read <a href="index.json"><code>index.json</code></a> and the manifests it points to (<a href="schema/collection.v1.schema.json">schema</a>). Free to use, no key.</p></section>`
  return page({
    title: "Frame Art collections: free art for Samsung The Frame",
    description: `${index.totals.collections} free, openly licensed art collections with ${index.totals.unique_items} works for Samsung The Frame, curated by the community.`,
    root: "",
    path: "",
    body,
    script: FILTER_JS,
  })
}

const work = (i: Item) => `<a class="work" href="${esc(i.source_url)}" rel="noopener">
<img loading="lazy" src="${esc(sizedThumb(i, 500))}" alt="${esc(i.title)}">
<b>${esc(i.title)}</b><small>${esc(i.artist)}${i.year === null ? "" : ` · ${i.date ? esc(i.date) : i.year}`}</small>
<span class="badge">${esc(licenceLabel(i.licence))}</span>${longEdge(i) >= UHD_PX ? '<span class="badge uhd">4K</span>' : ""}${i.ai_generated ? '<span class="badge ai">AI</span>' : ""}
${i.attribution ? `<div class="credit">${esc(i.attribution)}</div>` : ""}</a>`

export function renderCollectionPage(c: Collection, entry: IndexEntry): string {
  const cover = c.items.find((i) => i.id === c.cover) ?? c.items[0]!
  const curator = c.curator.github
    ? `<a href="https://github.com/${esc(c.curator.github)}">${esc(c.curator.name)}</a>`
    : c.curator.url
      ? `<a href="${esc(c.curator.url)}">${esc(c.curator.name)}</a>`
      : esc(c.curator.name)
  const licences = Object.entries(entry.licences)
    .toSorted((a, b) => b[1] - a[1])
    .map(([l, n]) => `${esc(licenceLabel(l))} (${n})`)
    .join(" · ")
  const body = `<div class="wrap"><header class="head">${framed(sizedThumb(cover, 1280), cover.title, true)}<div>
<div class="meta">Collection · curated by ${curator}</div>
<h1>${esc(c.title)}</h1><p class="lead" style="margin:0">${esc(c.description)}</p>
<div class="tags">${c.tags.map((t) => `<a class="tag" href="../index.html?tag=${encodeURIComponent(t)}">${esc(t)}</a>`).join("")}</div>
<div class="meta">${plural(entry.count, "work")} · ${entry.landscape_count} landscape · ${entry.uhd_count} in 4K${entry.ai_generated_count ? ` · ${entry.ai_generated_count} made with AI` : ""}<br>${licences}</div>
<div class="use"><p><b>In Frame Art:</b> already there. Open <b>Settings → Collections</b> and switch on <i>${esc(c.title)}</i>.</p>
<p>No Frame Art yet? <a href="${APP}#quick-start">Install it</a> in three steps.</p></div>
<a class="btn" href="../collections/${c.id}.json">Download JSON</a><a class="btn" href="${REPO}/edit/main/collections/${c.id}.json">Improve it on GitHub</a>
</div></header>
<h2 style="font:700 1.5rem var(--serif);margin:1rem 0 0">The works</h2>
<main class="works">${c.items.map(work).join("")}</main></div>`
  return page({
    title: `${c.title} · Frame Art collections`,
    description: c.description,
    root: "../",
    path: `c/${c.id}.html`,
    body,
  })
}
