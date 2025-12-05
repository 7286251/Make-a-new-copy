import React from 'react';
import { Clapperboard, Video, Sparkles, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 leading-none">SoraScript Pro</h1>
                  <p className="text-xs text-indigo-600 font-semibold tracking-wide uppercase mt-0.5">电商广告脚本大师</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
               <nav className="hidden md:flex space-x-2">
                  <span className="px-3 py-2 rounded-md text-sm font-medium bg-indigo-50 text-indigo-700 cursor-pointer">脚本生成</span>
                  <span className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer">历史记录</span>
               </nav>
               <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                 <Settings size={18} />
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
