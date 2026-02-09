
import React, { useState, useEffect } from 'react';
import { Project } from '../types';

interface FinalizeOrderModalProps {
  project: Project;
  onClose: () => void;
  onSubmit: (data: { name: string, email: string, orderNumber: string }) => void;
}

export const FinalizeOrderModal: React.FC<FinalizeOrderModalProps> = ({ project, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: project.clientName || '',
    email: '',
  });
  const [generatedOrderNumber, setGeneratedOrderNumber] = useState('');

  useEffect(() => {
    // Gerar um número de pedido único ao montar a modal
    const date = new Date();
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 caracteres aleatórios
    setGeneratedOrderNumber(`AF-${year}${month}${day}-${randomPart}`);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !generatedOrderNumber) {
      return alert('Por favor, preencha todos os campos e certifique-se que o número do pedido foi gerado.');
    }
    onSubmit({ name: formData.name, email: formData.email, orderNumber: generatedOrderNumber });
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-[#e8dfd5] flex flex-col">
        <div className="p-8 border-b border-[#f4f1ed] flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#4a3728] uppercase tracking-[0.2em]">Finalizar Pedido</h3>
            <p className="text-[10px] text-[#8c7a6b] font-serif italic">Seu álbum será enviado para paulosantana.com.br@gmail.com</p>
          </div>
          <button onClick={onClose} className="p-2 text-stone-300 hover:text-stone-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#8c7a6b] uppercase tracking-widest">Responsável pelo pedido</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="Ex: Paulo Santana" 
                className="w-full bg-[#fcfaf7] border border-[#e8dfd5] rounded-xl p-4 text-xs outline-none focus:border-amber-600 shadow-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#8c7a6b] uppercase tracking-widest">E-mail para Contato</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                placeholder="Ex: contato@paulosantana.com.br" 
                className="w-full bg-[#fcfaf7] border border-[#e8dfd5] rounded-xl p-4 text-xs outline-none focus:border-amber-600 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#8c7a6b] uppercase tracking-widest">Número do Pedido (Gerado Automaticamente)</label>
              <input 
                type="text" 
                name="orderNumber" 
                value={generatedOrderNumber} 
                readOnly 
                className="w-full bg-stone-100 border border-[#e8dfd5] rounded-xl p-4 text-xs outline-none text-gray-600 font-mono cursor-default shadow-sm"
              />
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-start space-x-4">
             <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
             </div>
             <p className="text-[9px] text-[#8c7a6b] font-medium leading-relaxed">Ao finalizar, geraremos o arquivo PDF de alta resolução e enviaremos todos os dados identificados para nossa central de produção.</p>
          </div>

          <button 
            type="submit" 
            className="w-full py-4 bg-[#4a3728] text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg hover:bg-[#36281d] active:scale-[0.98] transition-all"
          >
            Gerar PDF e Enviar Pedido
          </button>
        </form>
      </div>
    </div>
  );
};