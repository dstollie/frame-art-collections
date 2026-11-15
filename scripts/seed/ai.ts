import type { Def } from "./defs.ts"

/**
 * Hand-picked from Wikimedia Commons (AI-generated images by genre, artstyle and subject).
 * Kept: openly licensed (PD-algorithm, CC0, CC BY, CC BY-SA), wall-art worthy, no real people,
 * no text or logos, no imitation of a living artist. See knowledge/sources.md for what was excluded and why.
 */
export const AI_DEFS: Def[] = [
  {
    id: "ai-art",
    title: "AI art: open-licensed landscapes and scenes",
    description:
      "Images made with generative AI models and released on Wikimedia Commons under an open licence or as public domain. Every work is marked ai_generated. Most are below 4K.",
    tags: ["ai-generated", "digital", "landscape", "fantasy"],
    ai: true,
    minPx: 1920,
    perArtist: 12,
    size: 60,
    sources: [
      {
        kind: "commons-files",
        titles: [
          "File:Ite - IA Midjourney versión 1.png",
          "File:Algorithmically-generated AI-generated artwork of a futuristic city.png",
          "File:'Greenwood Estates Vista City' by Midjourney.jpg",
          "File:Ite - IA Midjourney versión 2.png",
          "File:Algorithmically-generated AI-generated artwork of a futuristic city left in destruction.png",
          "File:Algorithmically-generated AI-generated artwork of a cyberpunk cityscape.png",
          "File:'Night 898' fantasy past city by Midjourney.jpg",
          "File:Hotel on the Coast - Flickr - Dennis S. Hurd.jpg",
          "File:19. Yüzyıl deniz savaşı çiz. Gemiler birbirine top atışları yapıyor, gemini 20251212 221544 0000.jpg",
          "File:Sanctuary of Ercole Vincitore Tivoli Render Model Gemini-generated.png",
          "File:'The Neighbourhood' scifi burough by AI.jpg",
          "File:It's Dark, It's Cold, It's Winter Canal Town (Seedream 4.5).webp",
          "File:Leuchtturm bei Nacht - Midjourney+Firefly+Photoshop.jpg",
          "File:Nativity scene background during day - 02.png",
          "File:Nativity scene - Provençal background during day - 02.png",
          "File:Scenic Forest Valley in the Late Afternoon (FLUX.1).jpg",
          "File:Scenic Valley in the Afternoon (Imagen 3.0 001 model).jpg",
          "File:Illuminated Valley in the Afternoon (Imagen 4.0).webp",
          "File:Digital painting street scenery - created with Blockade Labs app.jpg",
          "File:Stable Diffusion - In Spain - 1.png",
          "File:Nativity scene background during night - 02.png",
          "File:Nativity scene - Provençal background during day - 03.png",
          "File:Scenic Valley in the Afternoon Artistic (VQGAN+CLIP).jpg",
          "File:Nativity scene background during night - 01.png",
          "File:Karibikinsel - Midjourney+Firefly+Photoshop.jpg",
          "File:ChristmasScene.png",
          "File:Nativity scene background during day - 01.png",
          "File:Nativity scene - Provençal background during day - 01.png",
          "File:Nativity scene - Palestinian background during day.png",
          "File:Sunset Valley (FLUX 1.1 Pro Raw).webp",
          "File:Recostruccion con IA de los diseños de la Nueva Capital.png",
          "File:Room with an urealistic view on a forest landscape by AI; 'The Television's in Another Room'.jpg",
        ],
      },
    ],
  },
]
