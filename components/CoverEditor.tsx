
import React, { useState, useRef } from 'react';
import { generateCoverImage } from '../services/gemini';
import { CoverVersion } from '../types';

interface CoverEditorProps {
  onApprove: (versions: CoverVersion[], selectedIndex: number) => void;
  initialTitle: string;
}

export const CoverEditor: React.FC<CoverEditorProps> = ({ onApprove, initialTitle }) => {
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState('');
  const [fontName, setFontName] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [referenceBase64, setReferenceBase64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Armazena até 3 versões
  const [versions, setVersions] = useState<CoverVersion[]>([]);
  const [activeVersionIndex, setActiveVersionIndex] = useState<number>(-1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setReferenceBase64(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!title) return alert('Insira o texto em destaque.');
    if (!fontName) return alert('Por favor, informe o nome ou link da fonte desejada.');
    if (!referenceBase64) return alert('Selecione uma foto principal.');
    if (versions.length >= 3) return alert('Você já atingiu o limite de 3 versões.');
    
    setIsGenerating(true);
    try {
      const result = await generateCoverImage(title, subtitle, fontName, userPrompt, referenceBase64);
      const newVersion: CoverVersion = {
        imageUrl: result.imageUrl,
        description: result.description,
        title,
        subtitle,
        fontName
      };
      const updatedVersions = [...versions, newVersion];
      setVersions(updatedVersions);
      setActiveVersionIndex(updatedVersions.length - 1);
    } catch (err) {
      alert('Erro ao gerar capa. Verifique sua conexão.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentVersion = activeVersionIndex >= 0 ? versions[activeVersionIndex] : null;

  return (
    <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#e8dfd5] flex flex-col md:flex-row animate-fade-in mx-auto">
      {/* Painel Lateral */}
      <div className="p-6 md:p-8 md:w-2/5 space-y-6 border-b md:border-b-0 md:border-r border-[#e8dfd5] overflow-y-auto max-h-[85vh] no-scrollbar bg-white">
        <div className="space-y-1">
          <h3 className="text-[11px] font-bold text-[#4a3728] uppercase tracking-[0.3em]">Design Editorial 2D</h3>
          <p className="text-[10px] text-[#8c7a6b] font-serif italic"></p>
        </div>

        <div className="space-y-4">
          {/* Foto Base */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-[#8c7a6b] uppercase tracking-widest">1. Foto Principal (Nítida)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-28 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-all overflow-hidden group relative ${referenceBase64 ? 'border-amber-600' : 'border-[#e8dfd5] hover:bg-stone-50'}`}
            >
              {referenceBase64 ? (
                <>
                  <img src={referenceBase64} className="w-full h-full object-cover" alt="Referência" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-full">Alterar Foto</span>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <span className="text-[9px] font-bold text-[#8c7a6b] uppercase">Upload Foto</span>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-[#8c7a6b] uppercase tracking-widest">2. Texto em destaque no álbum</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Ex: Júlia & Rafael"
                className="w-full bg-[#fcfaf7] border border-[#e8dfd5] rounded-xl p-3 text-xs outline-none focus:border-amber-600 shadow-sm" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-[#8c7a6b] uppercase tracking-widest">3. Sub título do texto em destaque</label>
              <input 
                type="text" 
                value={subtitle} 
                onChange={(e) => setSubtitle(e.target.value)} 
                placeholder="Ex: Pré-casamento | 2024"
                className="w-full bg-[#fcfaf7] border border-[#e8dfd5] rounded-xl p-3 text-xs outline-none focus:border-amber-600 shadow-sm" 
              />
            </div>

            <div className="space-y-2 p-3 bg-[#fcfaf7] rounded-xl border border-[#e8dfd5]">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[9px] font-bold text-[#4a3728] uppercase tracking-widest">4. Nome ou Link da Fonte</label>
                <a href="https://www.dafont.com/pt/" target="_blank" rel="noopener noreferrer" className="text-[8px] font-bold text-amber-700 uppercase underline decoration-amber-200">Visitar DaFont</a>
              </div>
              <input 
                type="text" 
                value={fontName} 
                onChange={(e) => setFontName(e.target.value)} 
                className="w-full bg-white border border-[#e8dfd5] rounded-lg p-2 text-[10px] outline-none focus:border-amber-600" 
                placeholder="Digite o nome da fonte ou cole o link do DaFont aqui" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-[#8c7a6b] uppercase tracking-widest">5. Prompt de Estilo Extra</label>
              <textarea value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} rows={2} className="w-full bg-[#fcfaf7] border border-[#e8dfd5] rounded-xl p-3 text-xs outline-none resize-none shadow-sm" placeholder="Ex: Detalhes em bronze, estritamente 2D..." />
            </div>
          </div>
        </div>

        <button 
          onClick={handleGenerate} 
          disabled={isGenerating || !referenceBase64 || versions.length >= 3}
          className={`w-full py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg transition-all ${isGenerating || versions.length >= 3 ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-[#4a3728] text-white hover:bg-[#36281d]'}`}
        >
          {isGenerating ? 'Compondo Capa...' : versions.length >= 3 ? '3 Versões Geradas' : 'Criar 3 modelos de capa'}
        </button>

        {/* Versões */}
        {versions.length > 0 && (
          <div className="pt-4 border-t border-[#e8dfd5] space-y-3">
            <h4 className="text-[9px] font-bold text-[#4a3728] uppercase tracking-widest">Comparar Versões ({versions.length}/3)</h4>
            <div className="grid grid-cols-3 gap-2">
              {versions.map((v, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveVersionIndex(idx)}
                  className={`aspect-square rounded-lg border-2 overflow-hidden transition-all ${activeVersionIndex === idx ? 'border-amber-600 scale-105 shadow-md' : 'border-[#e8dfd5] opacity-60 hover:opacity-100'}`}
                >
                  <img src={v.imageUrl} className="w-full h-full object-cover" alt={`V${idx + 1}`} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="p-6 md:p-10 md:w-3/5 bg-[#fcfaf7] flex flex-col items-center justify-center space-y-6">
        <div className="relative aspect-[4/3] w-full max-w-[500px] bg-white shadow-2xl rounded-sm border border-[#e8dfd5] flex items-center justify-center overflow-hidden">
          {isGenerating ? (
             <div className="flex flex-col items-center space-y-4 text-center">
                <div className="w-10 h-10 border-2 border-amber-600/20 border-t-amber-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Simulando Tipografia na Base...</p>
             </div>
          ) : currentVersion ? (
            <div className="w-full h-full relative animate-fade-in">
              <img src={currentVersion.imageUrl} className="w-full h-full object-cover" alt="Preview Capa" />
              {/* Overlay de Segurança de Sangria (Apenas Visual) */}
              <div className="absolute inset-4 border border-dashed border-white/20 pointer-events-none"></div>
            </div>
          ) : (
            <div className="text-center opacity-40 px-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a3728]">Aguardando Geração</p>
              <p className="text-[8px] text-[#8c7a6b] mt-1 italic">Texto será posicionado centralizado na parte inferior (2D).</p>
            </div>
          )}
        </div>

        {versions.length > 0 && !isGenerating && (
          <div className="w-full max-w-[500px] space-y-4 animate-fade-in">
             <div className="bg-white/80 p-3 rounded-lg border border-[#e8dfd5] text-center">
                <p className="text-[9px] text-[#4a3728] font-bold uppercase tracking-wider">Versão {activeVersionIndex + 1} Selecionada</p>
                <p className="text-[8px] text-[#8c7a6b] font-serif italic line-clamp-1">"{currentVersion?.title}" com fonte {currentVersion?.fontName}</p>
             </div>
             <button 
              onClick={() => onApprove(versions, activeVersionIndex)} 
              className="w-full py-3 bg-green-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-green-700 transition-colors"
             >
               Confirmar e Iniciar Diagramação
             </button>
          </div>
        )}
      </div>
    </div>
  );
};