---
name: add-collection
description: Add a new art collection (or extend one) in the frame-art-collections repo for Samsung The Frame. Use when someone says "add a collection of X", "make a collection with …", "add these works to …", or wants openly licensed high-resolution art collected for Frame Art. Finds public-domain/CC works, writes the manifest with `pnpm new`, validates it and opens a pull request.
---

# Add a collection

You turn a theme ("misty landscapes", "Hokusai's waves", "cats in Japanese prints") into `collections/<id>.json`, validated and in a pull request. Work in the root of the frame-art-collections repo. Read `AGENTS.md` and `CONTRIBUTING.md` first if you haven't.

## 0. Pin down the theme

If the request is vague, ask one question (for example "paintings only, or prints and photos too?"); otherwise state your assumption and go. Decide:

- `id`: kebab-case, 3–64 chars, not already in `collections/` (`ls collections`).
- `title` (≤ 80 chars) and a one- or two-sentence `description` that says what ties the works together.
- 2–6 `tags`.
- Target size: 20–80 works is a good collection. Quality beats quantity.

Check that no existing collection already covers the theme (`grep -il "<keyword>" collections/*.json`). If one does, extend it with `--append` instead.

## 1. Find works

Rules for every work:

- **Licence**: public domain, CC0, CC BY or CC BY-SA, stated on the source page. Nothing else.
- **Public domain sanity** (old art): created ≤ 1930 and artist died ≤ 1955. The tooling enforces this for Wikidata items.
- **Resolution**: ≥ 3840 px on the long edge preferred; never below 1920.
- **Format**: landscape first (≈ 1.3:1 to 2:1). No photos of frames, details, X-rays, versos.
- **AI images**: only with an explicit open licence on the file page (in practice Wikimedia Commons), mark with `--ai`, no real people, no "in the style of <living artist>".

Use these sources in this order. Always send a User-Agent and keep to one request at a time per host.

```sh
UA="FrameArtCollections/1.0 (+https://github.com/dstollie/frame-art-collections)"
```

**Wikidata** (best for paintings: ranked by fame via sitelinks). Adapt the pattern; useful properties are `P135` movement, `P136` genre, `P180` depicts, `P170` creator, `P195` collection. Painting is `wd:Q3305213`. Look up QIDs with `wbsearchentities`.

```sh
curl -s -H "User-Agent: $UA" -H 'Accept: application/sparql-results+json' \
  --data-urlencode 'query=SELECT DISTINCT ?item ?sl WHERE {
    ?item wdt:P31 wd:Q3305213 ; wdt:P180 wd:Q1311 .   # paintings that depict winter
    ?item wdt:P18 [] ; wikibase:sitelinks ?sl .
  } ORDER BY DESC(?sl) LIMIT 150' https://query.wikidata.org/sparql \
  | jq -r '.results.bindings[].item.value | split("/") | last'

curl -s -H "User-Agent: $UA" "https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&format=json&search=winter" | jq '.search[] | {id, description}'
```

**Wikimedia Commons** (prints, plates, maps, photos, AI art). CirrusSearch supports `incategory:`, `deepcat:`, `filew:>3840`, `hastemplate:`:

```sh
curl -s -H "User-Agent: $UA" -G https://commons.wikimedia.org/w/api.php \
  --data-urlencode action=query --data-urlencode list=search --data-urlencode srnamespace=6 \
  --data-urlencode 'srsearch=deepcat:"Thirty-six Views of Mount Fuji" filew:>3000' \
  --data-urlencode srlimit=50 --data-urlencode format=json | jq -r '.query.search[].title'
```

**SMK** (Danish and Nordic art, PD, large IIIF images):

```sh
curl -s -H "User-Agent: $UA" "https://api.smk.dk/api/v1/art/search/?keys=fog&rows=50&filters=%5Bpublic_domain:true%5D,%5Bhas_image:true%5D" \
  | jq -r '.items[] | "smk:\(.object_number)  \(.image_width)x\(.image_height)  \(.titles[0].title)"'
```

**The Met** (CC0 when public domain): `https://collectionapi.metmuseum.org/public/collection/v1.1/search?q=fog&hasImages=true&isPublicDomain=true&limit=50`, then reference objects as `met:<objectID>`.

Collect two to three times as many candidates as you need: on Wikidata many lesser-known works only have small images, and the tooling drops anything below 1920 px, without an open licence or not clearly public domain.

## 2. Write the works list and build the manifest

One reference per line in a temp file outside the repo (`mktemp`): Commons file page or `File:…`, Wikidata `Q…`, `smk:<object number>`, `met:<id>`. Put the works you like best first; the first landscape work becomes the cover.

```sh
works=$(mktemp)
cat > "$works" <<'EOF'
Q12418
https://commons.wikimedia.org/wiki/File:Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg
smk:KMS3352
met:436535
EOF
pnpm new --id misty-landscapes --title "Misty landscapes" \
  --description "Fog, haze and low clouds over fields, rivers and mountains." \
  --tags mist,landscape,calm --curator "<user's name>" --github <user's handle> --works "$works"
```

Add `--ai` for AI-generated works. Use `--append` to add to an existing collection.

Read the output: every `skipped:` line says why a work was rejected (licence, not public domain, too small, not found). Replace rejected works if the collection gets thin.

## 3. Review like a curator

- Look at the result: `jq -r '.items[] | "\(.width)x\(.height) \(.licence) \(.artist) – \(.title)"' collections/<id>.json`.
- Open a handful of `thumbnail` URLs (or view them as images) to catch photos of frames, damaged scans, near-duplicates and off-theme works. Remove those items from the JSON and, if the cover was one of them, set `cover` to another item id.
- Make sure no single artist dominates unless the collection is about that artist.

## 4. Validate

```sh
pnpm validate                                  # schema, licences, duplicates, resolution (whole repo)
pnpm validate:urls collections/<id>.json       # loads a sample of the images and checks their size
pnpm format:check
```

Fix every error. Warnings below 3840 px are allowed; mention them in the PR if there are many.

## 5. Open a pull request

```sh
git switch -c collection/<id>
git add collections/<id>.json
git commit -m "feat(collections): Add <id>"
git push -u origin collection/<id>      # no write access? `gh repo fork --remote` first, then push to your fork
gh pr create --title "feat(collections): Add <id>" --body-file <(sed -n '1,200p' .github/PULL_REQUEST_TEMPLATE.md)
```

Fill in the template: the theme in one or two sentences and the checklist. Report the PR link, the number of works, how many are landscape and ≥ 3840 px, and anything you skipped and why.
