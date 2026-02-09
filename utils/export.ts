
import { Photo, LayoutOption, AlbumSize } from '../types';
import { SIZE_CONFIG } from '../constants';

const DPI = 300;
const CM_TO_INCH = 2.54;

export const renderSpreadToBlob = async (
  layout: LayoutOption,
  photos: Photo[],
  albumSize: AlbumSize
): Promise<Blob> => {
  const config = SIZE_CONFIG[albumSize];
  const widthCm = config.widthCm;
  const heightCm = config.heightCm;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error("Canvas context failed");

  // Cálculo rigoroso de pixels para 300 DPI
  // 30cm -> ~3543px | 10cm -> ~1181px
  canvas.width = Math.round((widthCm / CM_TO_INCH) * DPI);
  canvas.height = Math.round((heightCm / CM_TO_INCH) * DPI);

  const pxScale = canvas.width / widthCm;

  // Fundo branco de alta pureza
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Renderizar cada slot com interpolação de alta qualidade
  for (const slot of layout.slots) {
    const photo = photos.find(p => p.id === slot.photoId);
    if (!photo) continue;

    const img = new Image();
    img.src = photo.url;
    await new Promise((resolve) => { img.onload = resolve; });

    const dx = slot.x * pxScale;
    const dy = slot.y * pxScale;
    const dw = slot.width * pxScale;
    const dh = slot.height * pxScale;

    const imgRatio = photo.width / photo.height;
    const slotRatio = slot.width / slot.height;

    let renderW, renderH, ox, oy;

    if (imgRatio > slotRatio) {
      renderW = dw;
      renderH = dw / imgRatio;
      ox = dx;
      oy = dy + (dh - renderH) / 2;
    } else {
      renderH = dh;
      renderW = dh * imgRatio;
      ox = dx + (dw - renderW) / 2;
      oy = dy;
    }

    ctx.drawImage(img, ox, oy, renderW, renderH);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Erro na geração do arquivo de alta resolução"));
    }, 'image/jpeg', 0.98); // Qualidade máxima
  });
};
