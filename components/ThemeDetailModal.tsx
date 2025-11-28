import React, { useEffect, useState } from 'react';
import { ThemeItem } from '../types';
import { NeoButton, NeoBadge } from './NeoComponents';
import { analyzeTheme } from '../services/geminiService';
import { X, Download, Eye, Sparkles, ShoppingBag } from 'lucide-react';

interface Props {
  theme: ThemeItem | null;
  onClose: () => void;
}

export const ThemeDetailModal: React.FC<Props> = ({ theme, onClose }) => {
  const [aiData, setAiData] = useState<{ analysis: string, features: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (theme) {
      setAiData(null);
      // Automatically trigger AI analysis when modal opens
      handleAnalyze(theme);
    }
  }, [theme]);

  const handleAnalyze = async (currentTheme: ThemeItem) => {
    setLoading(true);
    const result = await analyzeTheme(currentTheme);
    setAiData(result);
    setLoading(false);
  };

  if (!theme) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-4 border-black shadow-neo-lg flex flex-col md:flex-row animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-neo-pink border-2 border-black shadow-neo hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          <X size={24} />
        </button>

        {/* Left: Image */}
        <div className="w-full md:w-1/2 border-b-4 md:border-b-0 md:border-r-4 border-black bg-gray-100 flex items-center justify-center p-8">
           <div className="relative w-full aspect-[4/3] group">
              <img 
                src={theme.imageUrl} 
                alt={theme.name} 
                className="w-full h-full object-cover border-2 border-black shadow-neo group-hover:shadow-neo-lg transition-all"
              />
              <div className="absolute -bottom-4 -left-4 bg-neo-yellow border-2 border-black px-4 py-1 font-bold shadow-neo transform -rotate-2">
                {theme.category}
              </div>
           </div>
        </div>

        {/* Right: Info */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col gap-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {theme.tags.map(tag => (
                <NeoBadge key={tag} color="bg-neo-blue">{tag}</NeoBadge>
              ))}
            </div>
            <h2 className="text-4xl font-black font-sans uppercase tracking-tighter mb-2">{theme.name}</h2>
            <p className="text-gray-600 font-mono text-sm">Design by {theme.author}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="border-2 border-black p-4 bg-neo-bg">
                <p className="text-xs font-bold uppercase mb-1">价格 Price</p>
                <p className="text-2xl font-black">{theme.price === 0 ? 'FREE' : `$${theme.price}`}</p>
             </div>
             <div className="border-2 border-black p-4 bg-neo-bg">
                <p className="text-xs font-bold uppercase mb-1">下载量 Downloads</p>
                <p className="text-2xl font-black">{theme.downloads.toLocaleString()}</p>
             </div>
          </div>

          {/* AI Section */}
          <div className="border-2 border-black p-4 bg-white relative mt-2">
             <div className="absolute -top-3 left-4 bg-black text-white px-2 py-0.5 text-xs font-bold flex items-center gap-1">
               <Sparkles size={12} className="text-neo-yellow" /> AI 设计解析
             </div>
             
             {loading ? (
               <div className="flex flex-col items-center justify-center py-4 gap-2">
                 <div className="w-8 h-8 border-4 border-black border-t-neo-pink rounded-full animate-spin"></div>
                 <p className="text-sm font-mono animate-pulse">Gemini is thinking...</p>
               </div>
             ) : aiData ? (
               <div className="space-y-3">
                 <p className="text-sm font-medium leading-relaxed italic">"{aiData.analysis}"</p>
                 <div className="flex flex-wrap gap-2 mt-2">
                    {aiData.features.map((f, i) => (
                      <span key={i} className="text-xs border border-black px-1.5 py-0.5 bg-neo-green font-bold">
                        ✓ {f}
                      </span>
                    ))}
                 </div>
               </div>
             ) : (
                <div className="text-center py-2">
                   <NeoButton size="sm" onClick={() => handleAnalyze(theme)}>
                     <Sparkles size={16} /> 点击生成 AI 分析
                   </NeoButton>
                </div>
             )}
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <NeoButton size="lg" className="w-full">
              <ShoppingBag size={20} />
              {theme.price === 0 ? '免费下载' : '立即购买'}
            </NeoButton>
            <NeoButton variant="secondary" size="md" className="w-full">
              <Eye size={20} />
              实时预览 Demo
            </NeoButton>
          </div>
        </div>
      </div>
    </div>
  );
};