import type { Colour } from "./colour.ts"

export interface Mood {
  id: string
  title: string
  description: string
  tags: string[]
  size?: number
  /** > 0 when the colour fits, higher is better. */
  fit: (c: Colour) => number
}

export const MOODS: Mood[] = [
  {
    id: "mood-blue-hour",
    title: "Blue hour",
    description: "Paintings dominated by blues: dusk, sea, sky and cool shadows. Landscape format, picked by colour.",
    tags: ["colour", "blue", "mood", "calm"],
    fit: (c) => (c.blue >= 0.3 ? c.blue : 0),
  },
  {
    id: "mood-golden-light",
    title: "Golden light",
    description:
      "Warm ochres, golds and amber light: harvests, sunsets and glowing interiors. Landscape format, picked by colour.",
    tags: ["colour", "warm", "gold", "mood"],
    fit: (c) => (c.warm >= 0.45 && c.l > 0.3 ? c.warm : 0),
  },
  {
    id: "mood-green-calm",
    title: "Green calm",
    description:
      "Forests, meadows and gardens where green dominates. Restful art for a living room. Landscape format, picked by colour.",
    tags: ["colour", "green", "mood", "calm"],
    fit: (c) => (c.green >= 0.3 ? c.green : 0),
  },
  {
    id: "mood-dark-and-moody",
    title: "Dark and moody",
    description:
      "Low-key paintings with deep shadows that look natural on The Frame in a dim room at night. Picked by brightness.",
    tags: ["colour", "dark", "mood", "night"],
    fit: (c) => (c.l < 0.24 ? 0.3 - c.l : 0),
  },
  {
    id: "mood-light-and-airy",
    title: "Light and airy",
    description:
      "Pale, bright, low-contrast works: hazy skies, beaches and sunlit rooms for a bright space. Picked by brightness.",
    tags: ["colour", "light", "mood", "bright"],
    fit: (c) => (c.l > 0.62 && c.s < 0.4 ? c.l : 0),
  },
  {
    id: "mood-red-and-rose",
    title: "Reds and roses",
    description: "Paintings with strong reds, pinks and crimson. Picked by colour.",
    tags: ["colour", "red", "mood"],
    size: 100,
    fit: (c) => (c.red >= 0.18 ? c.red : 0),
  },
]
