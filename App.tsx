
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Project, AlbumSize, Photo, Spread, CoverVersion } from './types';
import { SIZE_CONFIG, MIN_DPI } from './constants';
import { generateSpreadLayouts } from './services/gemini';
import { SpreadEditor } from './components/SpreadEditor';
import { CoverEditor } from './components/CoverEditor';
import { FinalizeOrderModal } from './components/FinalizeOrderModal';
// import { ApiKeySelectionModal } from './components/ApiKeySelectionModal'; // Removido
import { analyzeImageQuality } from './utils/imageAnalysis';
import { generateAlbumPdf } from './services/pdf';

// A declaração global de window.aistudio é removida, pois a seleção da API Key do cliente não será mais usada.

const MAX_PHOTOS = 40;
const TOTAL_SPREADS = 10;
const LOGO_URL = 'https://i.ibb.co/bgmtZ3rz/Chat-GPT-Image-9-de-fev-de-2026-00-15-36.png'; // Novo URL do logotipo

const App: React.FC = () => {
  // Removido 'apiKeySelection' do tipo de 'view'
  const [view, setView] = useState<'dashboard' | 'cover' | 'editor'>('dashboard');
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAutoDiagramming, setIsAutoDiagramming] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [exporting, setExporting] = useState<{ current: number, total: number, type: 'drive' | 'pdf' | 'submission' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [clientName, setClientName] = useState('');
  const [albumSize, setAlbumSize] = useState<AlbumSize>(AlbumSize.SIZE_10X30);

  const createProject = async () => {
    if (!clientName) return alert('Por favor, insira o nome do cliente.');

    // Removida a verificação da API Key do cliente
    // const hasKey = await window.aistudio.hasSelectedApiKey();
    // if (!hasKey) {
    //   setView('apiKeySelection');
    //   return;
    // }

    const initialSpreads: Spread[] = Array.from({ length: TOTAL_SPREADS }, (_, i) => ({
      id: (i + 1).toString(),
      photos: [],
      selectedOptionIndex: 0
    }));
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      clientName,
      size: albumSize,
      createdAt: new Date(),
      photos: [],
      spreads: initialSpreads,
      coverVersions: [],
      selectedCoverIndex: 0,
      status: 'editing'
    };
    setProject(newProject);
    setView('cover');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !project) return;
    const currentCount = project.photos.length;
    const remainingSlots = MAX_PHOTOS - currentCount;
    if (remainingSlots <= 0) return alert(`Limite de ${MAX_PHOTOS} fotos atingido.`);
    setLoading(true);
    
    const config = SIZE_CONFIG[project.size];
    const filesArray = Array.from(e.target.files).slice(0, remainingSlots);
    
    const newPhotos: Photo[] = await Promise.all(
      filesArray.map((file: File) => new Promise<Photo>((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          const qualityMetrics = analyzeImageQuality(img);
          const dpi = (img.width) / (config.widthCm / 2.54);
          resolve({
            id: Math.random().toString(36).substr(2, 9),
            url, name: file.name, width: img.width, height: img.height,
            aspectRatio: img.width / img.height, dpi, file, quality: qualityMetrics,
            timestamp: file.lastModified
          });
        };
        img.src = url;
      }))
    );
    const sortedPhotos = [...project.photos, ...newPhotos].sort((a, b) => a.timestamp - b.timestamp);
    setProject({ ...project, photos: sortedPhotos });
    setLoading(false);
  };

  const distributeAndGenerate = async () => {
    if (!project || project.photos.length < 2) return alert("Adicione fotos para gerar o álbum.");
    setIsAutoDiagramming(true);
    
    const allPhotosSorted = [...project.photos].sort((a, b) => a.timestamp - b.timestamp);
    const updatedSpreads = project.spreads.map(s => ({ ...s, photos: [] as string[] }));
    
    const n = allPhotosSorted.length;
    const sizeBase = Math.floor(n / TOTAL_SPREADS);
    const remainder = n % TOTAL_SPREADS;
    
    let currentIdx = 0;
    for (let i = 0; i < TOTAL_SPREADS; i++) {
      const chunkSize = sizeBase + (i < remainder ? 1 : 0);
      if (chunkSize > 0) {
        updatedSpreads[i].photos = allPhotosSorted.slice(currentIdx, currentIdx + chunkSize).map(p => p.id);
        currentIdx += chunkSize;
      }
    }

    setProject({ ...project, spreads: updatedSpreads });

    const spreadPromises = updatedSpreads.map(async (spread) => {
      if (spread.photos.length === 0) return spread;
      const spreadPhotos = spread.photos.map(id => allPhotosSorted.find(p => p.id === id)).filter((p): p is Photo => !!p);
      const options = await generateSpreadLayouts(spreadPhotos, project.size);
      return { ...spread, layoutOptions: options, selectedOptionIndex: 0, isGenerating: false };
    });

    const finalSpreads = await Promise.all(spreadPromises);
    setProject(prev => prev ? { ...prev, spreads: finalSpreads } : null);
    setIsAutoDiagramming(false);
  };

  const runMagicLayout = async (spreadIndex: number) => {
    if (!project) return;
    const spread = project.spreads[spreadIndex];
    if (spread.photos.length === 0) return;
    
    setProject(prev => {
      if (!prev) return null;
      const nextSpreads = [...prev.spreads];
      nextSpreads[spreadIndex] = { ...spread, isGenerating: true };
      return { ...prev, spreads: nextSpreads };
    });

    try {
      const spreadPhotos = spread.photos.map(id => project.photos.find(p => p.id === id)).filter((p): p is Photo => !!p);
      const options = await generateSpreadLayouts(spreadPhotos, project.size);
      setProject(prev => {
        if (!prev) return null;
        const nextSpreads = [...prev.spreads];
        nextSpreads[spreadIndex] = { ...spread, layoutOptions: options, selectedOptionIndex: 0, isGenerating: false };
        return { ...prev, spreads: nextSpreads };
      });
    } catch (err) {
      setProject(prev => {
        if (!prev) return null;
        const nextSpreads = [...prev.spreads];
        nextSpreads[spreadIndex] = { ...spread, isGenerating: false };
        return { ...prev, spreads: nextSpreads };
      });
    }
  };

  const handleDownloadOnly = async () => {
    if (!project) return;
    try {
      setExporting({ current: 0, total: project.spreads.filter(s => s.photos.length > 0).length, type: 'pdf' });
      const { blob, fileName } = await generateAlbumPdf(project, (current, total) => {
        setExporting({ current, total, type: 'pdf' });
      });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err: any) {
      alert(`Erro no download: ${err.message}`);
    } finally {
      setExporting(null);
    }
  };

  const handleFinalizeSubmission = async (formData: { name: string, email: string, orderNumber: string }) => {
    if (!project) return;
    try {
      setExporting({ current: 0, total: project.spreads.filter(s => s.photos.length > 0).length, type: 'submission' });
      
      // Gera o PDF
      const { blob: pdfBlob, fileName } = await generateAlbumPdf(project, (current, total) => {
        setExporting({ current, total, type: 'submission' });
      });

      // Trigger download
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Simulação de envio para paulosantana.com.br@gmail.com
      // Em um ambiente real, aqui faríamos um fetch para uma API de envio de email
      console.log('--- Simulação de Envio de Pedido por Email ---');
      console.log(`Email com PDF anexado (${fileName}, ${(pdfBlob.size / (1024 * 1024)).toFixed(2)} MB)`);
      console.log('Enviado para: paulosantana.com.br@gmail.com');
      console.log('Dados do Pedido:');
      console.log(`  Responsável: ${formData.name}`);
      console.log(`  Email de Contato: ${formData.email}`);
      console.log(`  Número do Pedido: ${formData.orderNumber}`);
      console.log('-----------------------------------');

      await new Promise(resolve => setTimeout(resolve, 2000)); // Simula latência de rede
      
      alert('Pedido finalizado com sucesso! O álbum foi baixado e uma simulação de envio de e-mail foi realizada para nossa central de produção.');
      setIsFinalizing(false);
    } catch (err: any) {
      alert(`Erro ao enviar pedido: ${err.message}`);
    } finally {
      setExporting(null);
    }
  };

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#fcfaf7] flex items-center justify-center p-6 text-[#4a3728]">
        <div className="max-w-md w-full space-y-8 animate-fade-in">
          <div className="flex flex-col items-center">
            <img src={LOGO_URL} alt="Afeto" className="w-full max-w-[280px] h-auto mb-4" />
          </div>
          <div className="bg-white p-8 rounded-2xl border border-[#e8dfd5] shadow-xl space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#8c7a6b] uppercase tracking-widest">Nome do Cliente / Projeto</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ex: Família Silva" className="w-full bg-[#fcfaf7] border border-[#e8dfd5] rounded-xl p-4 outline-none focus:border-[#4a3728] transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#8c7a6b] uppercase tracking-widest">Produto</label>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setAlbumSize(AlbumSize.SIZE_10X30)} className={`p-4 border rounded-xl text-[10px] font-bold transition-all ${albumSize === AlbumSize.SIZE_10X30 ? 'bg-[#4a3728] text-white' : 'bg-white text-[#8c7a6b]'}`}>Afeto 10x30cm</button>
                <button onClick={() => setAlbumSize(AlbumSize.SIZE_10X30)} className={`p-4 border rounded-xl text-[10px] font-bold transition-all ${albumSize === AlbumSize.SIZE_15X40 ? 'bg-[#4a3728] text-white' : 'bg-white text-[#8c7a6b]'}`}>Afeto 15x40cm</button>
              </div>
            </div>
            <button onClick={createProject} className="w-full bg-[#4a3728] text-[#fcfaf7] py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-[#36281d] transition-colors">Iniciar</button>
          </div>
        </div>
      </div>
    );
  }

  // Removido o caso 'apiKeySelection'
  // if (view === 'apiKeySelection') {
  //   return (
  //     <ApiKeySelectionModal 
  //       onClose={() => setView('dashboard')} 
  //       onSuccess={() => {
  //         setProject(prev => prev ? { ...prev, status: 'editing' } : null); 
  //         setView('cover'); 
  //       }}
  //     />
  //   );
  // }

  if (view === 'cover' && project) {
    return (
      <div className="min-h-screen bg-[#f4f1ed] flex flex-col items-center justify-center p-4">
        <header className="mb-8 flex flex-col items-center">
           <img src={LOGO_URL} alt="Afeto" className="h-12 w-auto mb-4" />
           <div className="h-[1px] w-24 bg-[#e8dfd5] mb-4"></div>
           <h2 className="text-[10px] font-bold text-[#8c7a6b] uppercase tracking-[0.3em]">Passo 1: Composição da Capa</h2>
        </header>
        <CoverEditor 
          initialTitle={project.clientName} 
          onApprove={(versions, selectedIndex) => {
            setProject({ 
              ...project, 
              coverVersions: versions,
              selectedCoverIndex: selectedIndex
            });
            setView('editor');
          }} 
        />
        {/* Botão "Pular para Lâminas" mais destacado */}
        <button 
          onClick={() => setView('editor')} 
          className="mt-12 md:mt-16 w-full max-w-xs bg-white border border-[#e8dfd5] text-[#8c7a6b] px-8 py-4 rounded-xl text-[10px] md:text-sm font-bold uppercase tracking-widest shadow-xl hover:bg-stone-50 hover:shadow-2xl transition-all"
        >
          Pular para Lâminas (Capa Padrão)
        </button>
      </div>
    );
  }

  const activeCover = project?.coverVersions[project?.selectedCoverIndex];

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfaf7]">
      <header className={`sticky top-0 z-50 border-b border-[#e8dfd5] px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/95 backdrop-blur-md`}>
        <div className="flex items-center justify-between md:justify-start md:space-x-6">
          <div className="flex items-center space-x-3">
            <button onClick={() => setView('dashboard')} className="text-[#8c7a6b] hover:text-[#4a3728] transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg></button>
            <img src={LOGO_URL} alt="Afeto" className="h-8 md:h-10 w-auto" />
          </div>
          <div className="flex flex-col items-end md:items-start md:ml-4">
            <h2 className="text-[11px] md:text-xs font-bold text-gray-800 truncate max-w-[120px] md:max-w-none">{project?.clientName}</h2>
            <p className="text-[8px] text-[#8c7a6b] uppercase tracking-[0.1em]">{project?.size}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center md:justify-end gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-stone-100 text-[#8c7a6b] rounded-lg text-[9px] font-bold uppercase tracking-widest whitespace-nowrap"
          >
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
             <span>Add ({project?.photos.length})</span>
          </button>
          <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
           
          {project && project.photos.length >= 2 && !isAutoDiagramming && (
            <button onClick={distributeAndGenerate} className="px-3 py-2 bg-amber-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest whitespace-nowrap shadow-sm hover:bg-amber-700">Gerar Álbum</button>
          )}

          <button 
            onClick={handleDownloadOnly}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-green-600 text-green-600 rounded-lg text-[9px] font-bold uppercase tracking-widest whitespace-nowrap hover:bg-green-600 hover:text-white transition-all shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <span>PDF</span>
          </button>

          <button 
            onClick={() => setIsFinalizing(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#4a3728] text-white rounded-lg text-[9px] font-bold uppercase tracking-widest whitespace-nowrap hover:bg-[#36281d] transition-all shadow-md"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            <span>Finalizar Pedido</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 md:px-12 py-8 md:py-16 bg-[#f4f1ed] flex flex-col space-y-16 md:space-y-32 items-center relative">
        {(isAutoDiagramming || exporting || loading) && (
          <div className="fixed inset-0 z-[100] bg-[#fcfaf7]/90 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="text-center space-y-4 animate-fade-in max-w-xs">
              <div className="w-12 h-12 border-2 border-amber-600/20 border-t-amber-600 rounded-full animate-spin mx-auto"></div>
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-[#4a3728] uppercase tracking-[0.2em]">
                  {isAutoDiagramming ? 'Diagramando Álbum' : loading ? 'Processando' : exporting?.type === 'submission' ? 'Enviando Pedido' : 'Gerando PDF'}
                </h4>
                <p className="text-[9px] text-[#8c7a6b] font-serif italic">Isso levará apenas alguns segundos...</p>
                {exporting && (
                   <p className="text-[8px] text-[#8c7a6b] uppercase tracking-widest mt-2">{exporting.current} de {exporting.total} lâminas</p>
                )}
              </div>
            </div>
          </div>
        )}

        {isFinalizing && project && (
          <FinalizeOrderModal 
            project={project} 
            onClose={() => setIsFinalizing(false)} 
            onSubmit={handleFinalizeSubmission} 
          />
        )}
        
        {project && project.photos.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 opacity-80 mt-10 md:mt-20 px-6 text-center">
             <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border border-[#e8dfd5] shadow-sm">
                <svg className="w-10 h-10 text-[#8c7a6b] opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
             </div>
             <div className="space-y-3">
               <h3 className="text-xs font-bold text-[#4a3728] uppercase tracking-widest">Seu álbum está vazio</h3>
               <p className="text-[10px] text-[#8c7a6b] uppercase tracking-widest leading-relaxed">Faça o upload das fotos do cliente para iniciar a diagramação automática.</p>
             </div>
             <button onClick={() => fileInputRef.current?.click()} className="w-full md:w-auto px-10 py-4 bg-[#4a3728] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-transform">Selecionar Fotos</button>
          </div>
        )}

        <div className="w-full max-w-5xl space-y-20 md:space-y-32 pb-20">
          {/* Cover Mini Preview */}
          {activeCover && (
            <div className="w-full flex flex-col items-center space-y-4 mb-8">
               <span className="text-[10px] font-bold text-[#4a3728] uppercase tracking-widest">Capa Personalizada (Versão {project.selectedCoverIndex + 1})</span>
               <div className="w-48 aspect-square rounded-lg border border-[#e8dfd5] overflow-hidden shadow-lg group relative">
                 <img src={activeCover.imageUrl} className="w-full h-full object-cover" alt="Capa" />
                 <button 
                  onClick={() => setView('cover')}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                 >
                   <span className="text-[8px] text-white font-bold uppercase">Gerar/Trocar Versões</span>
                 </button>
               </div>
            </div>
          )}

          {project?.spreads.map((spread, idx) => (
            <SpreadEditor 
              key={spread.id} 
              spread={spread} 
              project={project} 
              onGenerateAI={() => runMagicLayout(idx)} 
              onUpdateSpread={(updated) => {
                setProject(prev => prev ? { ...prev, spreads: prev.spreads.map((s, i) => i === idx ? updated : s) } : null);
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;