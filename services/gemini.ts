
import { GoogleGenerativeAI } from "@google/genai";
import { Photo, AlbumSize, LayoutOption, LayoutSlot } from "../types";
import { SIZE_CONFIG } from "../constants";

/* ===============================
   Gemini Client
================================ */
const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("A chave da API Gemini não está configurada");
  }
  return new GoogleGenerativeAI(apiKey);
};

/* ===============================
   Prompt Base
================================ */
const FIXED_COVER_PROMPT_BASE = `
Create a modern luxury photo album cover layout using the provided image.

IMAGE RULES
- Use the photo as full-frame background
- Keep image 100% sharp, no blur
- Preserve natural lighting and texture

DESIGN STYLE
- Modern, minimal, editorial wedding album
- Luxury, emotional, clean negative space

TEXT POSITION
- All text at bottom safe area
- Centered horizontally
- Respect print cut margins

TEXT ELEMENTS
TEXT 1 (SUBTITLE)
- Small, elegant, discreet

TEXT 2 (MAIN TITLE)
- Large, dominant
- Script or calligraphic style
- MUST use the font name provided by client

FONT CONTROL
- Do NOT invent fonts
- Apply only client-chosen font

COLOR
- Gold, bronze, warm neutrals
- Flat 2D text
- No shadows, no 3D effects

OUTPUT
- High resolution
- Print ready
- Luxury wedding album cover
`;

/* ===============================
   Cover Prompt Generator
================================ */
export const generateCoverImage = async (
  title: string,
  subtitle: string,
  fontName: string,
  userPromptExtension: string
): Promise<{ prompt: string; description: string }> => {

  const genAI = getAiClient();

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro"
  });

  const fullPrompt = `
${FIXED_COVER_PROMPT_BASE}

SPECIFIC DATA:
- MAIN TITLE: "${title}"
- SUBTITLE: "${subtitle}"
- CLIENT FONT NAME: "${fontName}"
- EXTRA STYLE NOTES: "${userPromptExtension}"

FINAL INSTRUCTION:
Center both texts horizontally at the bottom safe area.
Ensure typography is flat 2D.
Use gold or bronze tones.
Do not modify image sharpness.
`;

  const result = await model.generateContent({
    contents: [{
      role: "user",
      parts: [{ text: fullPrompt }]
    }]
  });

  const responseText =
    result.response.candidates?.[0]?.content?.parts
      ?.map(p => p.text)
      .join("\n") || "";

  return {
    prompt: fullPrompt,
    description: responseText || "Capa minimalista de luxo com tipografia 2D na base."
  };
};

/* ===============================
   Layout Generator (OK)
================================ */
export const generateSpreadLayouts = async (
  photos: Photo[],
  albumSize: AlbumSize
): Promise<LayoutOption[]> => {

  const config = SIZE_CONFIG[albumSize];
  const margin = 0.8;
  const gap = 0.4;

  const safeW = config.widthCm - margin * 2;
  const safeH = config.heightCm - margin * 2;

  const count = photos.length;
  let slots: LayoutSlot[] = [];

  if (count <= 4) {
    const w = (safeW - gap * (count - 1)) / count;
    slots = photos.map((p, i) => ({
      photoId: p.id,
      x: margin + i * (w + gap),
      y: margin,
      width: w,
      height: safeH,
      rotation: 0,
      aspectRatio: p.aspectRatio,
      objectFit: "contain"
    }));
  } else {
    const cols = Math.ceil(count / 2);
    const rows = 2;
    const w = (safeW - gap * (cols - 1)) / cols;
    const h = (safeH - gap * (rows - 1)) / rows;

    slots = photos.map((p, i) => ({
      photoId: p.id,
      x: margin + (i % cols) * (w + gap),
      y: margin + Math.floor(i / cols) * (h + gap),
      width: w,
      height: h,
      rotation: 0,
      aspectRatio: p.aspectRatio,
      objectFit: "contain"
    }));
  }

  return [{
    id: "panoramic-optimized-grid",
    description: `Layout otimizado para ${count} fotos`,
    slots
  }];
};
