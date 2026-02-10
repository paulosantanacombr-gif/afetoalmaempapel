import { GoogleGenerativeAI } from "@google/genai"; // Biblioteca que você já tem

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { title, subtitle, fontName, extraStyle } = req.body;

    // Aqui o código busca a chave secreta que está salva na Vercel
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Crie uma descrição para capa de álbum: ${title}, ${subtitle}, Fonte: ${fontName}. Estilo: ${extraStyle}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return res.status(200).json({ description: response.text() });
  } catch (error) {
    return res.status(500).json({ error: "Erro na API do Gemini" });
  }
}
