# Contributing

Thanks for adding art. A good collection is one you would actually leave on your wall for a week.

**First time?** Pick an issue labelled [good first collection](https://github.com/dstollie/frame-art-collections/labels/good%20first%20collection): the theme is chosen, you find the works. The [issue form](https://github.com/dstollie/frame-art-collections/issues/new?template=new-collection.yml) needs no Git at all, and the [`add-collection` skill](.agents/skills/add-collection/SKILL.md) lets an AI agent do the searching. Questions go in [Discussions](https://github.com/dstollie/frame-art-collections/discussions).

## Curation rules

1. **Open licences only.** Public domain, CC0, CC BY or CC BY-SA. No NC, no ND, no "free for personal use", no "found it on Pinterest". `source_url` must point to a page that states the licence.
2. **Credit when the licence asks for it.** CC BY and CC BY-SA works need an `attribution` line: author, licence and where it is from.
3. **Big enough for 4K.** The Frame is a 3840×2160 panel. CI fails below 1920 px on the long edge and warns below 3840 px. Prefer the largest file the source has.
4. **Landscape first.** Works between about 1.3:1 and 2:1 fill the screen best. Portrait works are welcome in collections meant for a Frame on its side (say so in the description).
5. **Mark AI art.** Anything made with a generative model gets `"ai_generated": true`. Only use AI images with an explicit open licence (see [knowledge/sources.md](knowledge/sources.md#ai-generated-art) for what qualifies). No images of real people, no imitation of living artists.
6. **No duplicates.** Don't add the same work twice to a collection, and don't submit a collection that is mostly another one; extend that one instead.
7. **Whole works.** No photos of frames, gallery walls, details or X-rays, unless the collection is about them.
8. **A real theme.** A title and one or two sentences that tell people why these works belong together.

## Where to find works

- **Wikimedia Commons** and **Wikidata** cover almost every museum. On Commons, check the licence box on the file page and look for the largest version (`Original file`). Google Art Project scans are usually the sharpest.
- **SMK** (open.smk.dk), **The Met** (metmuseum.org, "Public Domain" filter): use the object page URL.
- Other museums: if the work is on Commons, link the Commons file. If not, upload it there first (with the museum's open-access licence), then link it.

## Process

- Open a pull request, or use the issue form and let the bot open one.
- CI validates the schema, licences, duplicates and resolution, and loads a sample of the image URLs.
- A maintainer looks at the collection as a whole: theme, quality, variety. Expect small edits.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org) with a scope: `feat(collections): Add misty-mornings`, `fix(collections): Replace broken image in winter`, `feat(seed): …`, `fix(validate): …`.

## Changing the schema

The schema is versioned. Additive, optional fields can go into v1. Anything that would break an app reading v1 needs `collection.v2.schema.json`, a migration of the manifests, and a period where the index publishes both.
