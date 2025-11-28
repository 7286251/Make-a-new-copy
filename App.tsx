import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ThemeItem, ThemeCategory, CATEGORIES } from './types';
import { ALL_THEMES } from './services/mockData';
import { NeoButton, NeoCard, NeoBadge } from './components/NeoComponents';
import { ThemeDetailModal } from './components/ThemeDetailModal';
import { Search, Grid, Layout, Menu, Github, Twitter } from 'lucide-react';

// Items per page for "infinite" scroll simulation
const ITEMS_PER_PAGE = 24;

const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory>(ThemeCategory.ALL);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [selectedTheme, setSelectedTheme] = useState<ThemeItem | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle

  // Filter Logic
  const filteredThemes = useMemo(() => {
    return ALL_THEMES.filter(theme => {
      const matchesCategory = selectedCategory === ThemeCategory.ALL || theme.category === selectedCategory;
      const matchesSearch = theme.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            theme.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  // Pagination Logic
  const visibleThemes = filteredThemes.slice(0, displayedCount);
  const hasMore = visibleThemes.length < filteredThemes.length;

  const loadMore = () => {
    setDisplayedCount(prev => prev + ITEMS_PER_PAGE);
  };

  // Reset pagination when filter changes
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory, searchTerm]);

  return (
    <div className="min-h-screen text-black font-sans selection:bg-neo-pink selection:text-black">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b-4 border-black px-4 py-3 md:px-8 flex items-center justify-between shadow-neo">
        <div className="flex items-center gap-4">
           <button 
             className="md:hidden p-2 border-2 border-black shadow-neo active:shadow-none active:translate-y-1 transition-all"
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
           >
             <Menu size={24} />
           </button>
           <div className="flex items-center gap-2">
             <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black text-xl border-2 border-transparent hover:border-black hover:bg-white hover:text-black transition-colors cursor-pointer">
               B.
             </div>
             <h1 className="hidden md:block text-2xl font-black tracking-tighter uppercase">Brutal<span className="text-neo-purple">Themes</span></h1>
           </div>
        </div>

        <div className="flex-1 max-w-xl mx-4 md:mx-12">
           <div className="relative">
             <input 
               type="text" 
               placeholder="搜索主题 / Search themes..." 
               className="w-full h-12 border-2 border-black px-4 pl-12 font-mono text-sm focus:outline-none focus:shadow-neo transition-all placeholder:text-gray-400"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black" size={20} />
           </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
           <a href="#" className="hover:text-neo-blue transition-colors"><Github size={24} /></a>
           <a href="#" className="hover:text-neo-blue transition-colors"><Twitter size={24} /></a>
           <NeoButton variant="black" size="sm">Submit Theme</NeoButton>
        </div>
      </header>

      <div className="flex relative">
        
        {/* Sidebar (Desktop & Mobile) */}
        <aside className={`
          fixed md:sticky top-[76px] left-0 h-[calc(100vh-76px)] w-64 bg-white border-r-4 border-black z-30 
          transform transition-transform duration-300 ease-in-out overflow-y-auto
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-6 space-y-8">
            <div>
              <h3 className="font-black text-lg mb-4 flex items-center gap-2 uppercase">
                <Layout size={20} /> 分类 Categories
              </h3>
              <ul className="space-y-2">
                {CATEGORIES.map(cat => (
                  <li key={cat}>
                    <button 
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 border-2 font-bold transition-all text-sm
                        ${selectedCategory === cat 
                          ? 'bg-neo-yellow border-black shadow-neo' 
                          : 'border-transparent hover:border-black hover:bg-gray-100'
                        }
                      `}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
               <h3 className="font-black text-lg mb-4 uppercase">Tags</h3>
               <div className="flex flex-wrap gap-2">
                 {['React', 'Vue', 'Dark', 'Minimal', 'SaaS', 'Bold'].map(tag => (
                   <button 
                    key={tag}
                    onClick={() => setSearchTerm(tag)}
                    className="text-xs border-2 border-black px-2 py-1 hover:bg-neo-green transition-colors font-mono"
                   >
                     #{tag}
                   </button>
                 ))}
               </div>
            </div>
            
            <div className="p-4 border-2 border-black bg-neo-pink shadow-neo mt-8">
               <p className="font-bold text-sm mb-2">📢 想要独家定制?</p>
               <p className="text-xs mb-3">我们的工作室提供专业的新粗野主义设计服务。</p>
               <NeoButton size="sm" className="w-full text-xs">联系我们</NeoButton>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 md:max-w-[calc(100vw-256px)]">
          
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
             <div>
                <h2 className="text-4xl md:text-6xl font-black uppercase mb-2 leading-none">
                  {selectedCategory === ThemeCategory.ALL ? 'Latest Themes' : selectedCategory}
                </h2>
                <p className="font-mono text-gray-600 border-l-4 border-neo-green pl-4">
                  Found {filteredThemes.length} curated neo-brutalist resources.
                </p>
             </div>
             <div className="flex gap-2">
                <NeoButton size="sm" variant="secondary" onClick={() => { /* Sort Logic Placeholder */ }}>Sort: Newest</NeoButton>
                <NeoButton size="sm" variant="secondary" onClick={() => { /* Sort Logic Placeholder */ }}>Sort: Popular</NeoButton>
             </div>
          </div>

          {/* Grid */}
          {visibleThemes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {visibleThemes.map((theme) => (
                <NeoCard key={theme.id} onClick={() => setSelectedTheme(theme)} className="group flex flex-col h-full">
                  <div className="relative aspect-[4/3] border-b-2 border-black overflow-hidden bg-gray-200">
                     <img 
                      loading="lazy"
                      src={theme.imageUrl} 
                      alt={theme.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                     />
                     {theme.price === 0 && (
                       <div className="absolute top-2 right-2 bg-neo-green border-2 border-black px-2 py-0.5 text-xs font-bold shadow-sm rotate-3">
                         FREE
                       </div>
                     )}
                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="bg-white border-2 border-black px-4 py-2 font-bold shadow-neo transform -rotate-2">
                          View Details
                        </span>
                     </div>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col relative">
                    <div className={`absolute -top-4 left-4 ${theme.accentColor} border-2 border-black w-8 h-8 flex items-center justify-center shadow-sm`}>
                      <Grid size={16} />
                    </div>

                    <div className="mt-2 mb-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg leading-tight group-hover:underline decoration-2 underline-offset-2">{theme.name}</h3>
                        <span className="font-mono text-xs text-gray-500">{theme.id}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{theme.category}</p>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-auto">
                      {theme.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] uppercase font-bold border border-black px-1 bg-gray-50">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 border-t-2 border-black bg-neo-bg flex justify-between items-center">
                    <span className="font-black font-mono">
                      {theme.price === 0 ? '免费' : `$${theme.price}`}
                    </span>
                    <span className="text-xs font-bold flex items-center gap-1">
                      {theme.downloads > 1000 ? `${(theme.downloads/1000).toFixed(1)}k` : theme.downloads} DLs
                    </span>
                  </div>
                </NeoCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-4 border-dashed border-gray-300">
               <h3 className="text-2xl font-bold text-gray-400">没有找到匹配的主题 / No themes found</h3>
               <NeoButton className="mt-4" onClick={() => {
                 setSelectedCategory(ThemeCategory.ALL);
                 setSearchTerm('');
               }}>重置筛选 / Reset</NeoButton>
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="mt-16 flex justify-center">
              <NeoButton 
                size="lg" 
                onClick={loadMore}
                className="w-full max-w-md"
              >
                加载更多主题 / Load More Themes ({filteredThemes.length - visibleThemes.length} remaining)
              </NeoButton>
            </div>
          )}
          
          <footer className="mt-20 border-t-4 border-black pt-8 pb-12">
            <div className="grid md:grid-cols-4 gap-8">
               <div>
                  <h4 className="font-black text-xl mb-4">BRUTAL THEMES.</h4>
                  <p className="text-sm text-gray-600">
                    Curating the finest raw, unpolished, and bold web design resources for modern developers.
                  </p>
               </div>
               {/* Footer links placeholder */}
               <div>
                  <h4 className="font-bold mb-4 uppercase">Menu</h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:underline">Home</a></li>
                    <li><a href="#" className="hover:underline">About</a></li>
                    <li><a href="#" className="hover:underline">Submit</a></li>
                  </ul>
               </div>
            </div>
            <div className="mt-12 text-center font-mono text-xs">
              © {new Date().getFullYear()} BrutalThemes. All rights reserved. Design is not dead.
            </div>
          </footer>
        </main>
      </div>

      {/* Detail Modal */}
      {selectedTheme && (
        <ThemeDetailModal 
          theme={selectedTheme} 
          onClose={() => setSelectedTheme(null)} 
        />
      )}
    </div>
  );
};

export default App;