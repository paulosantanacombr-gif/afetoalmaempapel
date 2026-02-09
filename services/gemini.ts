import { GoogleGenerativeAI } from "@google/generative-ai";
import { Photo, AlbumSize, LayoutOption, LayoutSlot } from "../types";
import { SIZE_CONFIG } from "../constants";

// Função para inicializar o cliente da IA com a chave correta
const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Corrigido de cnv para env
  if (!apiKey) {
    throw new Error("A chave da API não está configurada");
  }
  return new GoogleGenerativeAI(apiKey);
};

const FIXED_COVER_PROMPT_BASE = `Create a modern luxury photo album cover layout, using any provided photo as the base image.
IMAGE RULES
Use the provided photo as a full-frame background.
The photo must remain 100% sharp and natural, with no artificial blur or softening.
Preserve original lighting, texture, and details.
DESIGN STYLE
Modern, elegant, editorial wedding album design.
Clean, minimal, timeless aesthetic.
Strong use of negative space.
The design must feel premium and emotional, never cluttered.
TEXT POSITION & STRUCTURE
Place all visible text in the bottom area of the layout.
Respect print safe margins, keeping text far from edges and cut lines.
Center text horizontally.
TEXT ELEMENTS (EDITABLE BY CLIENT)
TEXT 1 — EVENT TYPE
Small, subtle text (example: “pré-casamento”).
Simple, clean typography.
Discreet and elegant.
TEXT 2 — MAIN TITLE (NAMES)
Large, visually dominant text.
Script or calligraphic style with elegant curves and flourishes.
The font style must follow the font name provided by the client.
The font name is not fixed; it is defined by the client.
FONT CONTROL (CLIENT-DEFINED)
The client provides the name of the font to be used.
Apply the chosen font consistently to the main title.
Do not invent or override the client’s font choice.
COLOR & EFFECTS
Use elegant, warm tones (gold, bronze, soft neutral hues).
Subtle tonal variation allowed (light gradient feel).
The text must be strictly 2D, flat, with no heavy shadows, no 3D extrusions, and no aggressive effects.
OUTPUT
High-resolution
Print-ready
Album cover suitable for luxury wedding photobooks
Style reference: minimal luxury wedding album cover, editorial 2D typography-focused design`;

export const generateCoverImage = async (
  title: string,
  subtitle: string,
  fontName: string,
  userPromptExtension: string, 
  referenceImageBase64?: string
): Promise<{ imageUrl: string, description: string }> => {
  const genAI = getAiClient();
  // Utilizando o modelo estável mais recente para geração de imagens
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const fullPrompt = `${FIXED_COVER_PROMPT_BASE}

SPECIFIC DATA FOR THIS GENERATION:
- TEXT 2 (MAIN TITLE): "${title}"
- TEXT 1 (EVENT TYPE / SUBTITLE): "${subtitle}"
- CLIENT CHOSEN FONT: "${fontName}"
- ADDITIONAL STYLE REQUEST: "${userPromptExtension}"

FINAL INSTRUCTION: Center the text "${title}" and "${subtitle}" horizontally in the BOTTOM SAFE AREA of the cover. Ensure the text is 2D and flat. Use colors like gold or bronze for the typography. Ensure the background photo remains sharp. Generate a professional horizontal cover.`;

  const parts: any[] = [{ text: fullPrompt }];

  if (referenceImageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: referenceImageBase64.split(',')[1] || referenceImageBase64
      }
    });
  }

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
  });

  const response = await result.response;
  let imageUrl = '';
  let description = 'Capa de luxo minimalista com tipografia 2D centralizada na parte inferior.';

  for (const part of response.candidates?.[0].content.parts || []) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
    } else if (part.text) {
      description = part.text;
    }
  }

  if (!imageUrl) throw new Error("Falha ao compor a arte da capa.");

  return { imageUrl, description };
};

export const generateSpreadLayouts = async (
  photos: Photo[], 
  albumSize: AlbumSize
): Promise<LayoutOption[]> => {
  const config = SIZE_CONFIG[albumSize];
  const width = config.widthCm;
  const height = config.heightCm;
  const margin = 0.8; 
  const gap = 0.4;    

  const safeW = width - (margin * 2);
  const safeH = height - (margin * 2);

  const count = photos.length;
  let slots: LayoutSlot[] = [];

  if (count === 1) {
    slots = [{
      photoId: photos[0].id,
      x: margin, y: margin, width: safeW, height: safeH,
      rotation: 0, aspectRatio: photos[0].aspectRatio, objectFit: 'contain'
    }];
  } else if (count === 2) {
    const w = (safeW - gap) / 2;
    slots = photos.map((p, i) => ({
      photoId: p.id,
      x: margin + (i * (w + gap)),
      y: margin,
      width: w,
      height: safeH,
      rotation: 0, aspectRatio: p.aspectRatio, objectFit: 'contain'
    }));
  } else if (count === 3) {
    const w = (safeW - (gap * 2)) / 3;
    slots = photos.map((p, i) => ({
      photoId: p.id,
      x: margin + (i * (w + gap)),
      y: margin,
      width: w,
      height: safeH,
      rotation: 0, aspectRatio: p.aspectRatio, objectFit: 'contain'
    }));
  } else if (count === 4) {
    const w = (safeW - (gap * 3)) / 4;
    slots = photos.map((p, i) => ({
      photoId: p.id,
      x: margin + (i * (w + gap)),
      y: margin,
      width: w,
      height: safeH,
      rotation: 0, aspectRatio: p.aspectRatio, objectFit: 'contain'
    }));
  } else if (count >= 5 && count <= 6) {
    const cols = 3;
    const rows = 2;
    const w = (safeW - (gap * (cols - 1))) / cols;
    const h = (safeH - (gap * (rows - 1))) / rows;
    slots = photos.map((p, i) => ({
      photoId: p.id,
      x: margin + ((i % cols) * (w + gap)),
      y: margin + (Math.floor(i / cols) * (h + gap)),
      width: w,
      height: h,
      rotation: 0, aspectRatio: p.aspectRatio, objectFit: 'contain'
    }));
  } else {
    const cols = Math.ceil(count / 2);
    const rows = 2;
    const w = (safeW - (gap * (cols - 1))) / cols;
    const h = (safeH - (gap * (rows - 1))) / rows;

    slots = photos.map((p, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        photoId: p.id,
        x: margin + (col * (w + gap)),
        y: margin + (row * (h + gap)),
        width: w,
        height: h,
        rotation: 0, aspectRatio: p.aspectRatio, objectFit: 'contain'
      };
    });
  }

  return [{
    id: 'panoramic-optimized-grid',
    description: `Layout Otimizado (Aproveitamento Máximo) para ${count} fotos`,
    slots: slots.slice(0, count)
  }];
};
