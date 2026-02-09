
import React from 'react';
import { Photo } from '../types';
import { MIN_DPI } from '../constants';

interface PhotoCardProps {
  photo: Photo;
  onClick?: () => void;
  className?: string;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onClick, className }) => {
  const isLowDpi = photo.dpi < MIN_DPI;
  const isLowQuality = photo.quality.overall < 50 || photo.quality.issues.length > 0;

  return (
    <div 
      onClick={onClick}
      className={`relative group cursor-pointer overflow-hidden bg-gray-100 rounded border border-gray-200 transition-all hover:shadow-md ${className}`}
    >
      <img 
        src={photo.url} 
        alt={photo.name} 
        className="w-full h-32 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
      />
      
      {/* Quality Overlay Bar */}
      <div className="absolute top-0 left-0 right-0 p-1 flex justify-between pointer-events-none">
        <div className="flex gap-1">
          {photo.quality.issues.map((issue, i) => (
            <div key={i} className="bg-red-500/90 text-white text-[7px] px-1 py-0.5 rounded shadow-sm backdrop-blur-sm">
              {issue}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/95 backdrop-blur-sm border-t border-gray-100">
        <div className="flex justify-between items-center mb-1">
          <span className="truncate max-w-[60%] text-[10px] font-medium text-gray-700">{photo.name}</span>
          <span className={`text-[9px] font-bold ${isLowDpi ? 'text-red-500' : 'text-green-600'}`}>
            {Math.round(photo.dpi)} DPI
          </span>
        </div>
        
        {/* Quality Score Bars */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[7px] text-gray-400 w-8 uppercase">Nitidez</span>
            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${photo.quality.sharpness < 40 ? 'bg-orange-400' : 'bg-green-400'}`}
                style={{ width: `${photo.quality.sharpness}%` }}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[7px] text-gray-400 w-8 uppercase">Exp.</span>
            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${photo.quality.exposure < 50 ? 'bg-orange-400' : 'bg-green-400'}`}
                style={{ width: `${photo.quality.exposure}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {isLowQuality && (
        <div className="absolute top-1 right-1 bg-amber-400 text-white p-1 rounded-full shadow-lg scale-75">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      )}
    </div>
  );
};