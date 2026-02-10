export const generateCoverImage = async (
  title: string,
  subtitle: string,
  fontName: string,
  extraStyle: string
) => {
  // O front-end agora apenas pede para a sua nova API processar
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, subtitle, fontName, extraStyle })
  });

  if (!response.ok) throw new Error("Erro na comunicação com o servidor");
  
  return await response.json();
};
