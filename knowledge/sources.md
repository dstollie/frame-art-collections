# Sources of openly licensed, high-resolution art

Research for the seed and for contributors, checked on 15 November 2026. "Tested" means a scripted request from this repo's tooling, with the `FrameArtCollections/1.0` User-Agent, from a home connection.

What The Frame needs: a JPEG or PNG of at least 3840 px on the long edge (4K panel), ideally landscape (16:9 is the panel; anything from about 1.3:1 to 2:1 crops well), a licence that allows anyone to display and redistribute it, and a host that serves images to scripts without a browser challenge.

## Summary

| Source | Licence of the images | Key needed | Max resolution | Used in seed | Why |
|---|---|---|---|---|---|
| **Wikidata + Wikimedia Commons** | PD (PD-Art), CC0, CC BY, CC BY-SA per file | no | often 4,000–30,000 px (Google Art Project scans) | **yes, backbone** | Covers almost every museum; sitelinks give a fame ranking; licence per file in `extmetadata`; 3840 px renditions on `upload.wikimedia.org` |
| **SMK (National Gallery of Denmark)** | Public Domain Mark | no | 4,000–9,000 px, IIIF | **yes** | Clean API with pixel sizes, IIIF, colours and brightness |
| **The Met** | CC0 when `isPublicDomain` | no | 3,000–6,000 px originals | contributions (`met:`) | No pixel size in the API; the tooling reads it from the JPEG header with a range request. `/v1/search` was retired 1 Oct 2026, use `/v1.1/search` |
| Rijksmuseum | CC0 / PDM | no | very large, IIIF on `iiif.micr.io` | via Wikidata/Commons | Linked Art API needs one request per object; nearly all highlights are on Commons |
| Art Institute of Chicago | CC0 | no | ~3,000 px via IIIF | no | IIIF host answers scripts with 403/404 (Cloudflare), even with `AIC-User-Agent`; the app cannot fetch reliably. Its works reach the seed through Commons copies |
| Cleveland Museum of Art | CC0 | no | `print` JPEG ~3,400 px, `full` TIFF up to 14k | no | The JPEG is below 4K and the TIFF is too heavy for a Pi; fine for a future generator with a 3,400 px floor |
| National Gallery of Art (US) | CC0 | no | IIIF, large | not yet | No search API, but the open-data CSVs on GitHub (`published_images.csv`) have IIIF URLs and pixel sizes: a good next generator |
| Smithsonian Open Access | CC0 | api.data.gov key | varies | no | Key needed, so CI and contributors can't reproduce runs without one |
| Europeana | mixed per record (incl. "In Copyright") | yes | varies | no | Key plus per-record rights; quality is uneven |
| Paris Musées | CC0 for public-domain works | token (GraphQL) | ~3,000–6,000 px | no | Token needed; many works also on Commons |
| Getty Museum | Open Content (no restrictions) | no | large, IIIF | no | Good quality, but the licence is Getty's own grant, not CC0; Commons mirrors much of it as PD-Art |
| Yale (YCBA, Yale Art Gallery) | PD images via IIIF | no | large | no | LUX API is fine; not needed for the first seed |
| Library of Congress | no known restrictions | no | huge maps | no | `loc.gov` returned 403 to scripted requests; Commons mirrors many LoC maps |
| Biodiversity Heritage Library | PD / CC | no | large | via Commons | Botanical plates come through Commons categories |
| David Rumsey Map Collection | CC BY-NC-SA | no | huge | **excluded** | Non-commercial licence |

## How the seed uses them

- **Wikidata** finds works by movement (`P135`, on the work or on its creator), genre (`P136`), depicted subject (`P180`), creator (`P170`) or collection (`P195`), with an image (`P18`). Works are ranked by `wikibase:sitelinks` (number of Wikipedia articles), a decent proxy for "recognised masterpiece".
- **Commons** `imageinfo` gives the original URL, pixel size, MIME type, SHA-1 and licence (`LicenseShortName`). Only `Public domain`, `CC0`, `CC BY x.y` and `CC BY-SA x.y` pass; everything else (NC, ND, GPL, unknown) is dropped.
- **Public-domain sanity check** on top of the Commons tag: created in 1930 or earlier, and the artist died in 1955 or earlier (so the work is PD in the US and in 70-years-after-death countries in 2026). Works with neither date known must be from 1880 or earlier.
- **Ranking** within a collection: fame × orientation (≥1.25:1 ×1.6, landscape ×1.35, square ×1.1) × resolution (≥3840 px ×1.25), with a cap per artist so collections don't become one painter. Minimum 2,800 px on the long edge for paintings (2,400–2,500 for prints and plates), and the validator warns below 3,840.
- **Colour moods** come from a 32×32 downsample of each candidate's thumbnail (lightness, saturation, share of blue, warm, green and red pixels).
- Files with `frame`, `detail`, `x-ray`, `verso` and similar in the title are skipped: frames and crops look wrong on The Frame.

Practical notes:

- Wikimedia asks for a descriptive User-Agent. Thumbnails at standard widths (120, 330, 960, 1280, 3840) work; the seed uses 960 for `thumbnail` and 3840 for `image_4k`. Original URLs come back with `utm_` query parameters; the tooling strips them.
- One SPARQL query that combines ranking, labels and OPTIONALs over thousands of works times out. Rank first (`SELECT DISTINCT ?item ?sl … ORDER BY DESC(?sl) LIMIT n`), then fetch details in batches of 150 with `VALUES`.
- SMK's `lang=en` parameter switches the filter vocabulary: `object_names:maleri` returns nothing with it. Leave it out.

## AI-generated art

**Finding: there is very little openly licensed, wall-quality AI art, and almost none at 4K.** The only source with clear, per-file licences is Wikimedia Commons. The seed has one hand-picked collection of 32 works, 18 of them at 3840 px or more, all marked `ai_generated: true`.

Included, from Commons (`AI-generated images by genre`, `by artstyle`, `by subject`, `Colorful AI-generated images`):

- Licence `Public domain` (template `PD-algorithm`), `CC0`, `CC BY 4.0` or `CC BY-SA 4.0`, as stated on the file page. CC BY and CC BY-SA works carry an attribution line.
- Hand-reviewed on a contact sheet: landscapes, cities and scenes only. Excluded were real people (politicians, "AI models"), text, logos, maps, diagrams, comics, copyrighted characters, and anything "in the style of" a named living artist.

What `PD-algorithm` means: the US Copyright Office does not register works without human authorship, and the courts agreed in *Thaler v. Perlmutter* (D.C. Cir., 2025). In the EU, copyright needs a human author's own intellectual creation, so purely generated images are very likely unprotected too. The UK is the exception: section 9(3) CDPA gives "computer-generated works" 50 years of protection. Treat `PD` on AI images as "public domain in the US, likely in the EU, uncertain in the UK".

Excluded, and why:

| Source | Why not |
|---|---|
| Midjourney gallery / Explore | Images belong to the subscriber under Midjourney's terms; no open licence. Copies on Commons are only usable when the uploader released them |
| *Théâtre D'opéra Spatial* (Jason Allen) | Registration was refused, but ownership is still being litigated (*Allen v. Perlmutter*); left out |
| Lexica, PlaygroundAI, OpenArt, NightCafe galleries | No licence stated per image, or terms that reserve rights to the platform or the prompter |
| Civitai | Model licences vary (some restrict use of outputs); images have no per-file licence |
| DeviantArt AI | All rights reserved by default; a Commons file sourced from DeviantArt with a PD claim was dropped |
| Pixabay, Pexels, Unsplash (AI sections) | Their own licences, not CC: they restrict redistribution of unaltered copies, which is exactly what a shared collection does |
| Adobe Firefly / Adobe Stock | Commercial licence |
| DiffusionDB | CC0, but 512–768 px Stable Diffusion outputs: far below 4K |
| LAION and similar datasets | Links to scraped, mostly copyrighted images; no licence for the images |

Contributors who make their own AI art can add it: publish it on Wikimedia Commons under CC0 or CC BY(-SA) first, then reference the file. That gives the work a stable host and a public licence statement.

## Ideas for the next generators

- NGA open-data CSV: American landscapes, Impressionism, with IIIF and exact sizes.
- Rijksmuseum direct (Linked Art + IIIF) for prints and drawings that are not on Commons.
- Cleveland with a 3,400 px floor for its many CC0 Asian paintings and textiles.
