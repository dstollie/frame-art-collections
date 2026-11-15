import type { SourceSpec } from "./pipeline.ts"

export interface Def {
  id: string
  title: string
  description: string
  tags: string[]
  sources: SourceSpec[]
  size?: number
  minPx?: number
  perArtist?: number
  ai?: boolean
  landscapeOnly?: boolean
}

const painting = "?item wdt:P31 wd:Q3305213 ."
const movement = (q: string) =>
  `${painting} { ?item wdt:P135 wd:${q} . } UNION { ?item wdt:P170 ?mc . ?mc wdt:P135 wd:${q} . }`
const genre = (q: string) => `${painting} ?item wdt:P136 wd:${q} .`
const depicts = (...qs: string[]) =>
  `${painting} VALUES ?d { ${qs.map((q) => `wd:${q}`).join(" ")} } ?item wdt:P180 ?d .`
const byArtists = (...qs: string[]) =>
  `VALUES ?c { ${qs.map((q) => `wd:${q}`).join(" ")} } ?item wdt:P170 ?c . ?item wdt:P31 ?t . VALUES ?t { wd:Q3305213 wd:Q11060274 wd:Q18218093 wd:Q93184 wd:Q1278452 wd:Q15123870 }`

export const DEFS: Def[] = [
  {
    id: "famous-landscape-paintings",
    title: "Famous paintings in landscape format",
    description:
      "The best-known public-domain paintings that fill a wide screen, ranked by how often Wikipedia writes about them.",
    tags: ["masterpieces", "painting", "landscape-format"],
    sources: [
      { kind: "wikidata", where: `${painting} ?item wikibase:sitelinks ?fsl . FILTER(?fsl >= 8)`, limit: 3000 },
    ],
    size: 200,
    perArtist: 6,
    landscapeOnly: true,
  },
  {
    id: "impressionism",
    title: "Impressionism",
    description:
      "Monet, Renoir, Pissarro, Sisley, Morisot and their circle: light, weather and modern life in loose, visible brushwork.",
    tags: ["impressionism", "painting", "19th-century"],
    sources: [{ kind: "wikidata", where: movement("Q40415"), limit: 1500 }],
    size: 200,
    perArtist: 25,
  },
  {
    id: "post-impressionism",
    title: "Post-Impressionism",
    description: "Van Gogh, Cézanne, Gauguin and their contemporaries pushing colour and form past Impressionism.",
    tags: ["post-impressionism", "painting", "19th-century"],
    sources: [{ kind: "wikidata", where: movement("Q166713"), limit: 1500 }],
    size: 180,
    perArtist: 25,
  },
  {
    id: "neo-impressionism",
    title: "Pointillism and Neo-Impressionism",
    description:
      "Seurat, Signac, Cross and Van Rysselberghe: luminous scenes built from dots and dashes of pure colour.",
    tags: ["pointillism", "neo-impressionism", "painting"],
    sources: [{ kind: "wikidata", where: movement("Q150091"), limit: 800 }],
    size: 100,
    perArtist: 20,
  },
  {
    id: "dutch-golden-age",
    title: "Dutch Golden Age",
    description:
      "Seventeenth-century Dutch painting: Vermeer, Rembrandt, Hals, Ruisdael, Steen and the masters of light, interiors and skies.",
    tags: ["dutch-golden-age", "baroque", "painting", "17th-century"],
    sources: [
      { kind: "wikidata", where: movement("Q2352880"), limit: 1500 },
      {
        kind: "wikidata",
        where: `${painting} ?item wdt:P195 wd:Q190804 ; wdt:P571 ?inc . FILTER(YEAR(?inc) >= 1600 && YEAR(?inc) < 1700)`,
        limit: 1500,
      },
    ],
    size: 200,
    perArtist: 12,
  },
  {
    id: "romantic-landscapes",
    title: "Romantic landscapes",
    description: "Turner, Friedrich, Constable and the Romantics: sublime mountains, storms, mist and dramatic skies.",
    tags: ["romanticism", "landscape", "painting", "19th-century"],
    sources: [{ kind: "wikidata", where: `${movement("Q37068")} ?item wdt:P136 wd:Q191163 .`, limit: 1500 }],
    size: 160,
    perArtist: 15,
  },
  {
    id: "hudson-river-school",
    title: "Hudson River School",
    description: "Cole, Church, Bierstadt and Moran: luminous American wilderness on a grand scale.",
    tags: ["hudson-river-school", "landscape", "american", "painting"],
    sources: [{ kind: "wikidata", where: movement("Q943853"), limit: 1200 }],
    size: 150,
    perArtist: 25,
  },
  {
    id: "barbizon-and-realist-landscapes",
    title: "Barbizon school",
    description: "Corot, Rousseau, Daubigny and Millet painting the forests and fields around Fontainebleau from life.",
    tags: ["barbizon", "realism", "landscape", "painting"],
    sources: [{ kind: "wikidata", where: movement("Q143357"), limit: 1000 }],
    size: 120,
    perArtist: 25,
  },
  {
    id: "seascapes",
    title: "Seascapes",
    description:
      "Ships, coasts, storms and calm water, from Dutch marine painters to Aivazovsky, Turner and Winslow Homer.",
    tags: ["seascape", "marine", "sea", "painting"],
    sources: [
      { kind: "wikidata", where: genre("Q158607"), limit: 2000 },
      { kind: "wikidata", where: genre("Q11766734"), limit: 1000 },
    ],
    size: 200,
    perArtist: 12,
  },
  {
    id: "still-life",
    title: "Still life",
    description:
      "Fruit, flowers, tables and objects: centuries of still-life painting, from Dutch banquet pieces to Cézanne.",
    tags: ["still-life", "painting"],
    sources: [{ kind: "wikidata", where: genre("Q170571"), limit: 2000 }],
    size: 180,
    perArtist: 10,
  },
  {
    id: "flower-paintings",
    title: "Flower paintings",
    description: "Bouquets and blossoms by Ruysch, Van Huysum, Fantin-Latour, Van Gogh, Monet and more.",
    tags: ["flowers", "still-life", "painting"],
    sources: [{ kind: "wikidata", where: genre("Q12303833"), limit: 1500 }],
    size: 150,
    perArtist: 12,
  },
  {
    id: "ukiyo-e-landscapes",
    title: "Ukiyo-e: Hokusai and Hiroshige",
    description: "Japanese woodblock prints of Mount Fuji, waves, rain and the roads and bridges of Edo-period Japan.",
    tags: ["ukiyo-e", "japanese", "woodblock-print", "landscape"],
    sources: [
      { kind: "wikidata", where: byArtists("Q5586", "Q200798"), limit: 1500 },
      {
        kind: "commons",
        query: 'deepcat:"One Hundred Famous Views of Edo" filew:>2800',
        max: 400,
        exclude: /van gogh|copy|photo/i,
      },
    ],
    size: 180,
    minPx: 2500,
    perArtist: 120,
  },
  {
    id: "symbolism",
    title: "Symbolism",
    description: "Dreams, myths and moods by Böcklin, Redon, Moreau, Khnopff and the Symbolists.",
    tags: ["symbolism", "painting", "19th-century"],
    sources: [{ kind: "wikidata", where: movement("Q164800"), limit: 1200 }],
    size: 120,
    perArtist: 12,
  },
  {
    id: "art-nouveau-and-secession",
    title: "Art Nouveau and the Vienna Secession",
    description: "Klimt, Mucha, Schiele and Moser: gold, ornament and flowing lines around 1900.",
    tags: ["art-nouveau", "secession", "painting"],
    sources: [
      { kind: "wikidata", where: `${painting} VALUES ?m { wd:Q34636 wd:Q208208 } ?item wdt:P135 ?m .`, limit: 1200 },
    ],
    size: 120,
    perArtist: 25,
  },
  {
    id: "early-expressionism",
    title: "Early Expressionism",
    description: "Munch, Marc, Macke, Kirchner and Schiele: bold colour and emotion before 1930.",
    tags: ["expressionism", "painting", "20th-century"],
    sources: [{ kind: "wikidata", where: movement("Q80113"), limit: 1500 }],
    size: 120,
    perArtist: 15,
  },
  {
    id: "abstract-pioneers",
    title: "Pioneers of abstraction",
    description:
      "Kandinsky, Mondrian, Malevich, Klee, Hilma af Klint, Delaunay and Marc: the first abstract paintings, all public domain.",
    tags: ["abstract", "modern", "painting", "20th-century"],
    sources: [
      {
        kind: "wikidata",
        where: byArtists("Q61064", "Q151803", "Q130777", "Q44007", "Q436267", "Q33978", "Q44054", "Q33981"),
        limit: 2000,
      },
      { kind: "wikidata", where: movement("Q128115"), limit: 800 },
    ],
    size: 150,
    minPx: 2400,
    perArtist: 30,
  },
  {
    id: "pre-raphaelites",
    title: "Pre-Raphaelites",
    description: "Rossetti, Millais, Waterhouse and Burne-Jones: jewel-like colour, legends and detailed nature.",
    tags: ["pre-raphaelite", "painting", "19th-century"],
    sources: [{ kind: "wikidata", where: movement("Q184814"), limit: 800 }],
    size: 100,
    perArtist: 20,
  },
  {
    id: "tonalism-and-nocturnes",
    title: "Tonalism and nocturnes",
    description:
      "Soft, hazy and muted: Whistler's nocturnes, Inness and the American Tonalists. Calm art for the evening.",
    tags: ["tonalism", "nocturne", "painting", "calm"],
    sources: [
      { kind: "wikidata", where: movement("Q1786363"), limit: 800 },
      { kind: "wikidata", where: `${painting} ?item wdt:P170 wd:Q203643 .`, limit: 300 },
    ],
    size: 100,
    perArtist: 30,
  },
  {
    id: "danish-golden-age",
    title: "Danish Golden Age",
    description:
      "Clear Nordic light by Eckersberg, Købke, Lundbye, Skovgaard and Dreyer, straight from SMK, the National Gallery of Denmark.",
    tags: ["danish-golden-age", "nordic", "painting", "smk"],
    sources: [
      { kind: "smk", keys: "Eckersberg" },
      { kind: "smk", keys: "Købke" },
      { kind: "smk", keys: "Lundbye" },
      { kind: "smk", keys: "Skovgaard" },
      { kind: "smk", keys: "Dankvart Dreyer" },
      { kind: "smk", keys: "Vilhelm Kyhn" },
      { kind: "smk", keys: "Constantin Hansen" },
      { kind: "smk", keys: "Rørbye" },
      { kind: "smk", keys: "Thorald Læssøe" },
    ],
    size: 160,
    minPx: 3000,
    perArtist: 25,
  },
  {
    id: "hammershoi-and-nordic-stillness",
    title: "Hammershøi and Nordic stillness",
    description:
      "Quiet grey interiors, empty rooms and soft daylight by Vilhelm Hammershøi, Peter Ilsted, L.A. Ring and Danish contemporaries.",
    tags: ["hammershoi", "nordic", "interiors", "calm", "smk"],
    sources: [
      { kind: "smk", keys: "Hammershøi", fame: 8 },
      { kind: "smk", keys: "Ilsted" },
      { kind: "smk", keys: "L.A. Ring" },
      { kind: "smk", keys: "Holsøe" },
      { kind: "smk", keys: "Theodor Philipsen" },
      { kind: "wikidata", where: `${painting} ?item wdt:P170 wd:Q380706 .`, limit: 300 },
    ],
    size: 120,
    minPx: 3000,
    perArtist: 45,
  },
  {
    id: "skagen-painters",
    title: "Skagen painters",
    description: "Krøyer, Anna and Michael Ancher on the beaches of Skagen: blue hours, summer evenings and fishermen.",
    tags: ["skagen", "nordic", "painting", "sea"],
    sources: [
      { kind: "wikidata", where: movement("Q726483"), limit: 800 },
      { kind: "smk", keys: "Krøyer" },
      { kind: "smk", keys: "Ancher" },
    ],
    size: 100,
    perArtist: 40,
  },
  {
    id: "winter",
    title: "Winter",
    description:
      "Snowy villages, frozen rivers and skaters on the ice, from Avercamp and Bruegel to Monet and Hammershøi.",
    tags: ["winter", "season", "snow", "painting"],
    sources: [{ kind: "wikidata", where: depicts("Q1311", "Q7561", "Q779272"), limit: 2000 }],
    size: 150,
    perArtist: 10,
  },
  {
    id: "spring",
    title: "Spring",
    description: "Orchards in blossom, fresh green fields and the first warm days.",
    tags: ["spring", "season", "painting"],
    sources: [{ kind: "wikidata", where: depicts("Q1312", "Q871991", "Q236371"), limit: 2000 }],
    size: 120,
    perArtist: 10,
  },
  {
    id: "summer",
    title: "Summer",
    description: "Beaches, haystacks, wheat fields and long evenings in the sun.",
    tags: ["summer", "season", "painting"],
    sources: [{ kind: "wikidata", where: depicts("Q1313", "Q40080", "Q62577"), limit: 2000 }],
    size: 120,
    perArtist: 10,
  },
  {
    id: "autumn",
    title: "Autumn",
    description: "Golden forests, harvests and misty October light.",
    tags: ["autumn", "season", "painting"],
    sources: [{ kind: "wikidata", where: depicts("Q1314"), limit: 2000 }],
    size: 120,
    perArtist: 10,
  },
  {
    id: "night-and-moonlight",
    title: "Night and moonlight",
    description: "Moonlit harbours, starry skies and lamplit streets. Made for The Frame after dark.",
    tags: ["night", "moonlight", "painting", "dark"],
    sources: [{ kind: "wikidata", where: depicts("Q575", "Q1058800", "Q405", "Q523"), limit: 2000 }],
    size: 150,
    perArtist: 10,
  },
  {
    id: "mountains",
    title: "Mountains",
    description: "Alps, fjords, volcanoes and Mount Fuji: mountain landscapes from three centuries.",
    tags: ["mountains", "landscape", "painting"],
    sources: [{ kind: "wikidata", where: depicts("Q8502", "Q46831", "Q8072", "Q39231"), limit: 2000 }],
    size: 150,
    perArtist: 10,
  },
  {
    id: "rivers-and-lakes",
    title: "Rivers and lakes",
    description: "Calm water, reflections and riverbanks, from Ruisdael to Monet's Seine.",
    tags: ["water", "landscape", "painting", "calm"],
    sources: [{ kind: "wikidata", where: depicts("Q4022", "Q23397", "Q34038"), limit: 2000 }],
    size: 150,
    perArtist: 10,
  },
  {
    id: "cityscapes",
    title: "Cityscapes",
    description: "Venice by Canaletto, Paris boulevards by Pissarro and Caillebotte, and other city views.",
    tags: ["cityscape", "architecture", "painting"],
    sources: [
      { kind: "wikidata", where: genre("Q1935974"), limit: 2000 },
      { kind: "wikidata", where: genre("Q166030"), limit: 1000 },
    ],
    size: 160,
    perArtist: 10,
  },
  {
    id: "animals",
    title: "Animals in art",
    description: "Horses, cats, dogs, cows and wild animals by Stubbs, Dürer, Marc, Rosa Bonheur and others.",
    tags: ["animals", "painting"],
    sources: [
      { kind: "wikidata", where: genre("Q16875712"), limit: 2000 },
      { kind: "wikidata", where: genre("Q2302151"), limit: 1500 },
    ],
    size: 150,
    perArtist: 10,
  },
  {
    id: "botanical-illustration",
    title: "Botanical illustration",
    description:
      "Hand-coloured plates by Redouté, Merian and the great botanical artists; mostly portrait format, ideal for a Frame on its side.",
    tags: ["botanical", "flowers", "illustration", "portrait-format"],
    sources: [
      {
        kind: "commons",
        query: 'deepcat:"Pierre-Joseph Redouté" filew:>2500',
        max: 600,
        exclude: /rue|street|statue|grave|bust|portrait of/i,
      },
      {
        kind: "commons",
        query: 'deepcat:"Maria Sibylla Merian" filew:>2500',
        max: 300,
        exclude: /statue|portrait|stamp|banknote/i,
      },
      { kind: "commons", query: 'deepcat:"Curtis\'s Botanical Magazine" filew:>2500', max: 300 },
    ],
    size: 160,
    minPx: 2500,
    perArtist: 80,
  },
  {
    id: "art-forms-in-nature",
    title: "Ernst Haeckel: Art Forms in Nature",
    description:
      "Haeckel's 1904 plates of jellyfish, radiolarians, corals and orchids: symmetry and pattern from nature.",
    tags: ["haeckel", "nature", "illustration", "portrait-format"],
    sources: [{ kind: "commons", query: 'deepcat:"Kunstformen der Natur" filew:>2500', max: 600 }],
    size: 100,
    minPx: 2500,
    perArtist: 100,
  },
  {
    id: "birds-of-america",
    title: "Audubon: The Birds of America",
    description: "John James Audubon's life-size bird plates from the Havell edition (1827–1838).",
    tags: ["birds", "audubon", "illustration", "nature"],
    sources: [
      {
        kind: "commons",
        query: 'deepcat:"The Birds of America" filew:>3840',
        max: 800,
        exclude: /page|title|cover|text/i,
      },
    ],
    size: 150,
    perArtist: 150,
  },
  {
    id: "antique-maps",
    title: "Antique maps",
    description:
      "World maps, celestial charts and atlases from the 14th to the 19th century, scanned at very high resolution.",
    tags: ["maps", "cartography", "history"],
    sources: [
      { kind: "commons", query: 'incategory:"Featured pictures of maps" filew:>4000', max: 300, fame: 10 },
      {
        kind: "commons",
        query: 'deepcat:"Old maps of the world" filew:>5000',
        max: 800,
        exclude: /\b(text|page|title|index|cover)\b/i,
      },
      { kind: "commons", query: 'deepcat:"Celestial maps" filew:>4000', max: 300 },
    ],
    size: 150,
    perArtist: 15,
  },
]
