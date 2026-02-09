
export enum AlbumSize {
  SIZE_10X30 = '10x30cm',
  SIZE_15X40 = '15x40cm'
}

export interface PhotoQuality {
  sharpness: number;
  exposure: number;
  overall: number;
  brightness: number;
  issues: string[];
}

export interface Photo {
  id: string;
  url: string;
  name: string;
  width: number;
  height: number;
  dpi: number;
  aspectRatio: number;
  file: File;
  quality: PhotoQuality;
  timestamp: number;
}

export interface LayoutSlot {
  photoId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  aspectRatio: number;
  objectFit: 'contain';
  priority?: 'principal' | 'secundaria';
}

export interface LayoutOption {
  id: string;
  slots: LayoutSlot[];
  description: string;
}

export interface Spread {
  id: string;
  photos: string[];
  layoutOptions?: LayoutOption[];
  selectedOptionIndex: number;
  isGenerating?: boolean;
}

export interface CoverVersion {
  imageUrl: string;
  description: string;
  title: string;
  subtitle: string;
  fontName: string;
}

export interface Project {
  id: string;
  clientName: string;
  size: AlbumSize;
  createdAt: Date;
  photos: Photo[];
  spreads: Spread[];
  coverVersions: CoverVersion[];
  selectedCoverIndex: number;
  status: 'editing' | 'approved';
}
