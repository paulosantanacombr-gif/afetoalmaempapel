import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { title, subtitle, fontName, extraStyle } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro"
    });

    const prompt = `
Create a luxury wedding album cover.

TITLE: "${title}"
SUBTITLE: "${subtitle}"
FONT NAME: "${fontName}"
STYLE NOTES: "${extraStyle}"

Rules:
- Text centered at bottom safe area
- Flat 2D typography
- Gold or bronze colors
- Image remains sharp
`;

    const result = await model.generateContent(prompt);

    const text =
      result.response.candidates?.[0]?.content?.parts
        ?.map(p => p.text)
        .join("\n") || "";

    // ✅ APENAS UMA resposta
    return res.status(200).json({
      prompt,
      description: text
    });

  } catch (error) {
    // ✅ APENAS UMA resposta
    return res.status(500).json({
      error: "Erro ao gerar com Gemini"
    });
  }
}
