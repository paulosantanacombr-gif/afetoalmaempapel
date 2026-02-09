
import React, { useState } from 'react';
import { Project, Spread, Photo } from '../types';
import { SIZE_CONFIG } from '../constants';

interface SpreadEditorProps {
  spread: Spread;
  project: Project;
  onUpdateSpread: (updated: Spread) => void;
  onGenerateAI: () => void;
}

export const SpreadEditor: React.FC<SpreadEditorProps> = ({ spread, project, onUpdateSpread, onGenerateAI }) => {
  const [selectingForSlot, setSelectingForSlot] = useState<number | null>(null);
  const config = SIZE_CONFIG[project.size];
  const currentLayout = spread.layoutOptions?.[spread.selectedOptionIndex];

  // Helper para converter medidas em cm para porcentagem
  const toPct = (val: number, base: number) => (val / base) * 100;

  const handlePhotoSelect = (newPhotoId: string) => {
    if (selectingForSlot === null || !currentLayout) return;

    const newSlots = [...currentLayout.slots];
    newSlots[selectingForSlot] = { ...newSlots[selectingForSlot], photoId: newPhotoId };

    const newLayoutOptions = [...(spread.layoutOptions || [])];
    newLayoutOptions[spread.selectedOptionIndex] = {
      ...currentLayout,
      slots: newSlots
    };

    const newPhotos = newSlots.map(s => s.photoId);

    onUpdateSpread({
      ...spread,
      photos: newPhotos,
      layoutOptions: newLayoutOptions
    });
    setSelectingForSlot(null);
  };

  return (
    <div className="flex flex-col items-center group relative w-full mb-12 md:mb-24">
      {/* Photo Selector Modal */}
      {selectingForSlot !== null && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-6xl max-h-[90vh] md:max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xs md:text-sm font-bold text-[#4a3728] uppercase tracking-widest">Trocar Imagem</h3>
                <p className="text-[9px] text-gray-400 uppercase mt-1">Selecione uma foto do acervo</p>
              </div>
              <button onClick={() => setSelectingForSlot(null)} className="p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            {/* Grid de fotos ajustado */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 no-scrollbar">
              {project.photos.map(photo => (
                <button 
                  key={photo.id}
                  onClick={() => handlePhotoSelect(photo.id)}
                  className="relative group cursor-pointer overflow-hidden bg-gray-100 rounded-lg border border-gray-200 transition-all hover:shadow-lg active:scale-98 flex flex-col"
                >
                  {/* Imagem com proporção original e object-contain */}
                  <div 
                    className="relative w-full overflow-hidden bg-stone-50 rounded-t-md flex-shrink-0"
                    // Calcula paddingTop para manter o aspect ratio da imagem como placeholder
                    style={{ paddingTop: `${(photo.height / photo.width) * 100}%` }} 
                  >
                    <img 
                      src={photo.url} 
                      className="absolute inset-0 w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" 
                      alt={photo.name} 
                    />
                  </div>
                  
                  {/* Botão "USAR" separado, abaixo da imagem e acima dos metadados */}
                  <div className="p-3 bg-white border-b border-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="bg-white/90 text-[9px] px-3 py-2 rounded-full font-bold uppercase text-[#4a3728] shadow-md">Usar</span>
                  </div>

                  {/* Detalhes da foto */}
                  <div className="flex-1 p-3 bg-white border-t border-gray-100 flex flex-col justify-between">
                    <div>
                      <span className="block truncate text-[10px] font-medium text-gray-700">{photo.name}</span>
                      <span className={`block text-[9px] font-bold mt-1 ${photo.dpi < 300 ? 'text-red-500' : 'text-green-600'}`}>
                        {Math.round(photo.dpi)} DPI
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header da Lâmina */}
      <div className="mb-4 md:mb-6 flex flex-col items-center space-y-3 w-full">
        <div className="flex flex-col md:flex-row items-center gap-4">
           <span className="text-[9px] md:text-[10px] font-bold text-[#4a3728] uppercase tracking-[0.3em]">Lâmina {project.spreads.indexOf(spread) + 1}</span>
           
           <div className="flex items-center space-x-2 md:space-x-4">
             {spread.layoutOptions && spread.layoutOptions.length > 0 && (
              <div className="flex bg-white/60 backdrop-blur-sm border border-[#e8dfd5] rounded-full p-0.5 shadow-sm">
                {spread.layoutOptions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => onUpdateSpread({...spread, selectedOptionIndex: i})}
                    className={`px-3 md:px-5 py-1 md:py-1 rounded-full text-[8px] md:text-[9px] font-bold transition-all ${
                      spread.selectedOptionIndex === i ? 'bg-[#4a3728] text-white' : 'text-[#8c7a6b]'
                    }`}
                  >
                    Estilo {i + 1}
                  </button>
                ))}
              </div>
             )}

             <button 
              onClick={onGenerateAI}
              disabled={spread.isGenerating}
              className="p-1.5 md:p-2 rounded-full bg-white border border-[#e8dfd5] text-[#8c7a6b] shadow-sm disabled:opacity-20 hover:border-amber-600 hover:text-amber-600 transition-colors"
              title="Otimizar Diagramação"
             >
              <svg className={`w-3.5 h-3.5 md:w-4 md:h-4 ${spread.isGenerating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
             </button>
           </div>
        </div>
      </div>

      {/* Container da Lâmina Responsivo - Borda Luxo */}
      <div 
        className={`w-full max-w-[1000px] bg-white shadow-2xl relative border-8 border-white transition-all duration-700 ease-out overflow-hidden group/spread ring-1 ring-[#e8dfd5] ${spread.isGenerating ? 'opacity-40 scale-[0.99] grayscale' : 'opacity-100 scale-100'}`}
        style={{ 
          aspectRatio: `${config.widthCm} / ${config.heightCm}`,
        }}
      >
        {/* Marca da dobra central elegante */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-stone-200 to-transparent z-10 pointer-events-none opacity-30"></div>

        {currentLayout ? (
          currentLayout.slots.map((slot, idx) => {
            const photo = project.photos.find(p => p.id === slot.photoId);
            if (!photo) return null;

            return (
              <div 
                key={`${slot.photoId}-${idx}`}
                className="absolute transition-all duration-1000 ease-in-out group/slot flex items-center justify-center overflow-hidden"
                style={{
                  left: `${toPct(slot.x, config.widthCm)}%`,
                  top: `${toPct(slot.y, config.heightCm)}%`,
                  width: `${toPct(slot.width, config.widthCm)}%`,
                  height: `${toPct(slot.height, config.heightCm)}%`,
                }}
              >
                <img 
                  src={photo.url} 
                  alt="" 
                  className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-700 group-hover/slot:scale-105" 
                />
                
                <button 
                  onClick={() => setSelectingForSlot(idx)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover/slot:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"
                >
                  <div className="bg-white/95 text-[#4a3728] px-3 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-xl flex items-center space-x-2 active:scale-95 transition-transform border border-[#e8dfd5]">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    <span>Editar Slot</span>
                  </div>
                </button>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-3 bg-[#fcfaf7]">
             {spread.photos.length > 0 ? (
               <div className="flex flex-col items-center space-y-4">
                 <div className="w-6 h-6 border-2 border-[#4a3728]/20 border-t-[#4a3728] rounded-full animate-spin"></div>
                 <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#4a3728]">Otimizando Layout...</span>
               </div>
             ) : (
               <div className="text-[10px] text-[#8c7a6b] uppercase tracking-widest italic opacity-40">Lâmina não diagramada</div>
             )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center space-x-3 opacity-60 group-hover:opacity-100 transition-opacity">
        <div className="h-[1px] w-8 bg-[#e8dfd5]"></div>
        <span className="text-[8px] text-[#8c7a6b] font-bold uppercase tracking-[0.2em]">
           {spread.photos.length} fotos nesta composição
        </span>
        <div className="h-[1px] w-8 bg-[#e8dfd5]"></div>
      </div>
    </div>
  );
};