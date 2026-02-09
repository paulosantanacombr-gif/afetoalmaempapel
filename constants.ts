
import { AlbumSize } from './types';

export const CM_TO_PX = 32.0; // Ajustado para que 30cm caiba melhor em telas padrão (960px wide)
export const MARGIN_MM = 10; 
export const MARGIN_PX = (MARGIN_MM / 10) * CM_TO_PX;

export const SIZE_CONFIG = {
  [AlbumSize.SIZE_10X30]: {
    widthCm: 30,
    heightCm: 10,
    widthPx: 30 * CM_TO_PX,
    heightPx: 10 * CM_TO_PX,
  },
  [AlbumSize.SIZE_15X40]: {
    widthCm: 40,
    heightCm: 15,
    widthPx: 40 * CM_TO_PX,
    heightPx: 15 * CM_TO_PX,
  }
};

export const MIN_DPI = 300;
