
import { jsPDF } from "jspdf";
import { Project, Photo, AlbumSize } from "../types";
import { renderSpreadToBlob } from "../utils/export";
import { SIZE_CONFIG } from "../constants";

export const generateAlbumPdf = async (
  project: Project,
  onProgress: (current: number, total: number) => void
): Promise<{ blob: Blob, fileName: string }> => {
  const spreadsToExport = project.spreads.filter(
    (s) => s.layoutOptions && s.layoutOptions.length > 0 && s.photos.length > 0
  );

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 5;

  // Página 0: Capa Ativa
  const activeCover = project.coverVersions[project.selectedCoverIndex];
  if (activeCover && activeCover.imageUrl) {
    pdf.addImage(activeCover.imageUrl, "PNG", 0, 0, pageWidth, pageHeight);
    if (spreadsToExport.length > 0) pdf.addPage();
  }

  if (spreadsToExport.length === 0 && (!activeCover || !activeCover.imageUrl)) {
    throw new Error("O álbum está vazio.");
  }

  const config = SIZE_CONFIG[project.size];
  const spreadWidthMm = config.widthCm * 10;
  const spreadHeightMm = config.heightCm * 10;

  const scale = (pageWidth - (margin * 2)) / spreadWidthMm;
  const renderWidth = spreadWidthMm * scale;
  const renderHeight = spreadHeightMm * scale;

  for (let i = 0; i < spreadsToExport.length; i += 2) {
    if (i > 0) pdf.addPage();

    onProgress(i + 1, spreadsToExport.length);
    const blob1 = await renderSpreadToBlob(
      spreadsToExport[i].layoutOptions![spreadsToExport[i].selectedOptionIndex],
      project.photos,
      project.size
    );
    const dataUrl1 = await blobToDataUrl(blob1);
    
    pdf.addImage(dataUrl1, "JPEG", (pageWidth - renderWidth) / 2, margin, renderWidth, renderHeight);
    pdf.setDrawColor(240, 240, 240);
    pdf.rect((pageWidth - renderWidth) / 2, margin, renderWidth, renderHeight);

    if (i + 1 < spreadsToExport.length) {
      onProgress(i + 2, spreadsToExport.length);
      const blob2 = await renderSpreadToBlob(
        spreadsToExport[i + 1].layoutOptions![spreadsToExport[i + 1].selectedOptionIndex],
        project.photos,
        project.size
      );
      const dataUrl2 = await blobToDataUrl(blob2);
      
      const yPos2 = margin + renderHeight + margin;
      pdf.addImage(dataUrl2, "JPEG", (pageWidth - renderWidth) / 2, yPos2, renderWidth, renderHeight);
      pdf.rect((pageWidth - renderWidth) / 2, yPos2, renderWidth, renderHeight);
    }
  }

  const fileName = `Afeto_Projeto_${project.clientName.replace(/\s+/g, '_')}.pdf`;
  
  return { blob: pdf.output('blob'), fileName };
};

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};