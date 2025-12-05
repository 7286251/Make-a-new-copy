
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Button } from './components/Button';
import { generateScript, polishScript } from './services/geminiService';
import { VideoDuration, ScriptState, ProductContext, DEFAULT_REFERENCE_SCRIPT } from './types';
import { UploadCloud, Clock, Wand2, Copy, FileText, PlayCircle, Edit3, Image as ImageIcon, Trash2, Video, CheckCircle, Eye, EyeOff } from 'lucide-react';

// --- Helper Components & Functions ---

// 1. Line Formatter: Handles the specific styling of script lines
const formatLine = (line: string, index: number) => {
  const trimmed = line.trim();
  
  // Headings (handled by SectionCard usually, but good for fallback)
  if (trimmed.startsWith('**总体分析**') || trimmed.startsWith('**镜头分析**') || trimmed.startsWith('**背景音乐分析**')) {
     return null; // Skip headers inside the content as they are used as card titles
  }
  if (trimmed.startsWith('---')) {
     return null; // Skip separators
  }

  // Timestamps (e.g., **00:00-00:02**)
  if (/^\*\*\d{2}:\d{2}/.test(trimmed)) {
    return <div key={index} className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded inline-block mt-4 mb-2 shadow-sm border border-indigo-100">{line.replace(/\*\*/g, '')}</div>;
  }

  // Key-Value pairs (e.g., **Key:** Value)
  const parts = line.split('：');
  if (parts.length > 1 && line.includes('**')) {
     const key = parts[0].replace(/\*\*/g, '').replace(/\*/g, '').trim();
     const value = parts.slice(1).join('：').trim();
     return (
       <div key={index} className="mb-2 pl-4 border-l-2 border-indigo-100 hover:border-indigo-300 transition-colors">
          <span className="font-semibold text-gray-800">{key}：</span>
          <span className="text-gray-600 leading-relaxed">{value}</span>
       </div>
     );
  }

  // Empty lines
  if (!trimmed) return <div key={index} className="h-2"></div>;
  
  // Standard text
  return <div key={index} className="text-gray-700 whitespace-pre-wrap leading-relaxed">{line}</div>;
};

// 2. Section Card: Display a script section with a copy button
const SectionCard: React.FC<{ title: string; content: string; icon?: React.ReactNode }> = ({ title, content, icon }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Pre-process content to remove the title line if it exists to avoid duplication
  const cleanContent = content.trim();

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden hover:shadow-md transition-shadow">
      <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm md:text-base">
          {icon}
          {title}
        </h3>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            copied 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-indigo-600'
          }`}
        >
          {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
          {copied ? '已复制' : '复制本段'}
        </button>
      </div>
      <div className="p-5 text-sm">
        {cleanContent.split('\n').map((line, idx) => formatLine(line, idx))}
      </div>
    </div>
  );
};

// 3. Parser: Splits the full script into sections
const parseScript = (fullScript: string) => {
  const sections = {
    overall: '',
    shots: '',
    music: '',
    other: '' // Fallback for unstructured text
  };

  // Identify split points
  const overallIdx = fullScript.indexOf('**总体分析**');
  const shotsIdx = fullScript.indexOf('**镜头分析**');
  const musicIdx = fullScript.indexOf('**背景音乐分析**');

  // Basic validation: if we don't find the main headers, treat as unstructured
  if (overallIdx === -1 && shotsIdx === -1) {
    sections.other = fullScript;
    return sections;
  }

  // Extract Overall Analysis
  if (overallIdx !== -1) {
    const endIdx = shotsIdx !== -1 ? shotsIdx : (musicIdx !== -1 ? musicIdx : fullScript.length);
    // Remove the header line itself from the content for cleaner display
    let text = fullScript.substring(overallIdx, endIdx).trim();
    text = text.replace('**总体分析**', '').trim();
    // Remove separator lines
    text = text.replace(/^---$/gm, '').trim();
    sections.overall = text;
  }

  // Extract Shot Analysis
  if (shotsIdx !== -1) {
    const endIdx = musicIdx !== -1 ? musicIdx : fullScript.length;
    let text = fullScript.substring(shotsIdx, endIdx).trim();
    text = text.replace('**镜头分析**', '').trim();
    text = text.replace(/^---$/gm, '').trim();
    sections.shots = text;
  }

  // Extract Music Analysis
  if (musicIdx !== -1) {
    let text = fullScript.substring(musicIdx).trim();
    text = text.replace('**背景音乐分析**', '').trim();
    text = text.replace(/^---$/gm, '').trim();
    sections.music = text;
  }

  return sections;
};


const App: React.FC = () => {
  // Context State
  const [productContext, setProductContext] = useState<ProductContext>({
    image: null,
    imagePreviewUrl: null,
    referenceVideo: null,
    referenceVideoUrl: null,
    referenceScript: DEFAULT_REFERENCE_SCRIPT,
    duration: '15s',
    referenceType: 'script', // Default to script
  });

  // App State
  const [scriptState, setScriptState] = useState<ScriptState>({
    isLoading: false,
    generatedScript: '',
    error: null,
  });

  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showScript, setShowScript] = useState(false); // Default script visibility to hidden
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [scriptState.generatedScript, isEditing]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductContext(prev => ({
          ...prev,
          image: file,
          imagePreviewUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      setProductContext(prev => ({
        ...prev,
        referenceVideo: file,
        referenceVideoUrl: videoUrl
      }));
    }
  };

  const removeImage = () => {
    setProductContext(prev => ({
      ...prev,
      image: null,
      imagePreviewUrl: null
    }));
  };

  const removeVideo = () => {
    setProductContext(prev => ({
      ...prev,
      referenceVideo: null,
      referenceVideoUrl: null
    }));
  };

  const handleGenerate = async () => {
    if (!productContext.image) {
      setScriptState(prev => ({ ...prev, error: "请上传产品图片" }));
      return;
    }

    if (productContext.referenceType === 'script' && !productContext.referenceScript.trim()) {
      setScriptState(prev => ({ ...prev, error: "内置脚本缺失，请刷新页面重试" }));
      return;
    }

    if (productContext.referenceType === 'video' && !productContext.referenceVideo) {
      setScriptState(prev => ({ ...prev, error: "请上传参考视频" }));
      return;
    }

    setScriptState({ isLoading: true, generatedScript: '', error: null });
    setIsEditing(false);

    try {
      const script = await generateScript(
        productContext.image,
        productContext.referenceScript,
        productContext.duration,
        productContext.referenceType === 'video' ? productContext.referenceVideo : undefined
      );
      setScriptState({ isLoading: false, generatedScript: script, error: null });
    } catch (err: any) {
      setScriptState({ isLoading: false, generatedScript: '', error: err.message || "生成失败" });
    }
  };

  const handlePolish = async () => {
    if (!scriptState.generatedScript) return;
    
    setScriptState(prev => ({ ...prev, isLoading: true }));
    try {
      const polished = await polishScript(scriptState.generatedScript);
      setScriptState({ isLoading: false, generatedScript: polished, error: null });
    } catch (err: any) {
      setScriptState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  };

  const copyToClipboard = () => {
    if (scriptState.generatedScript) {
      navigator.clipboard.writeText(scriptState.generatedScript);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const DurationButton = ({ val }: { val: VideoDuration }) => (
    <button
      onClick={() => setProductContext(prev => ({ ...prev, duration: val }))}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
        productContext.duration === val
          ? 'bg-indigo-600 text-white shadow-md'
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
      }`}
    >
      {val}
    </button>
  );

  // Parse the script for structured display
  const parsedSections = parseScript(scriptState.generatedScript);

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: Product Image */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <ImageIcon size={18} className="text-indigo-500"/> 1. 上传产品图
              </h2>
            </div>
            <div className="p-5">
              {!productContext.imagePreviewUrl ? (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">点击上传</span> 或拖拽图片至此</p>
                    <p className="text-xs text-gray-400">支持 JPG, PNG (最大 10MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              ) : (
                <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                  <img src={productContext.imagePreviewUrl} alt="Product" className="w-full h-64 object-contain" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button onClick={removeImage} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors">
                       <Trash2 size={20} />
                     </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Card 2: Reference Script & Config */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
             <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-indigo-500"/> 2. 参考内容与设置
              </h2>
            </div>
            
            <div className="p-5 space-y-5 flex-1">
              
              {/* Reference Type Toggle */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setProductContext(prev => ({...prev, referenceType: 'script'}))}
                  className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                    productContext.referenceType === 'script'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText size={16} className="mr-2" />
                  内置脚本模式
                </button>
                <button
                  onClick={() => setProductContext(prev => ({...prev, referenceType: 'video'}))}
                  className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                    productContext.referenceType === 'video'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Video size={16} className="mr-2" />
                  视频复刻模式
                </button>
              </div>

              {/* Conditional Input Area */}
              {productContext.referenceType === 'script' ? (
                <div className="animate-fade-in space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                      参考脚本配置
                    </label>
                    <button 
                      onClick={() => setShowScript(!showScript)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      {showScript ? <EyeOff size={12}/> : <Eye size={12}/>}
                      {showScript ? '隐藏详情' : '查看/编辑脚本'}
                    </button>
                  </div>
                  
                  {!showScript ? (
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-3">
                      <div className="p-2 bg-indigo-100 rounded-md shrink-0 text-indigo-600">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-indigo-900">已启用内置爆款模板</h3>
                        <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                          当前使用系统预设的“智能家居/3C数码”高转化率分镜模板。
                          <br/>
                          AI 将基于此模板的节奏和逻辑，自动填入您的产品信息。
                        </p>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs leading-relaxed resize-none font-mono"
                      placeholder="在此粘贴爆款视频的脚本或详细描述..."
                      value={productContext.referenceScript}
                      onChange={(e) => setProductContext(prev => ({...prev, referenceScript: e.target.value}))}
                    />
                  )}
                </div>
              ) : (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium text-gray-700 mb-2">上传参考视频</label>
                  {!productContext.referenceVideoUrl ? (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Video className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="mb-1 text-sm text-gray-500"><span className="font-semibold">点击上传视频</span></p>
                        <p className="text-xs text-gray-400">支持 MP4, WebM (最大 20MB)</p>
                      </div>
                      <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
                    </label>
                  ) : (
                    <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-black">
                      <video 
                        src={productContext.referenceVideoUrl} 
                        className="w-full h-40 object-cover opacity-80"
                        controls
                      />
                      <div className="absolute top-2 right-2">
                         <button onClick={removeVideo} className="bg-red-500/80 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors">
                           <Trash2 size={16} />
                         </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Duration Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock size={16} /> 目标视频时长
                </label>
                <div className="flex flex-wrap gap-2">
                  <DurationButton val="10s" />
                  <DurationButton val="15s" />
                  <DurationButton val="30s" />
                  <DurationButton val="60s" />
                  <DurationButton val="120s" />
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                isLoading={scriptState.isLoading}
                className="w-full h-12 text-base shadow-md mt-4"
                icon={<PlayCircle size={20} />}
              >
                {productContext.referenceType === 'script' ? '基于内置模板生成' : '基于视频复刻生成'}
              </Button>
              
              {scriptState.error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
                  ⚠️ {scriptState.error}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[600px]">
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2">
                 <h2 className="font-semibold text-gray-800">生成结果</h2>
                 {scriptState.generatedScript && (
                   <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200">
                     已完成
                   </span>
                 )}
              </div>
              <div className="flex gap-2">
                 <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-9 px-3 text-xs"
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={!scriptState.generatedScript}
                    icon={<Edit3 size={14}/>}
                 >
                   {isEditing ? '预览模式' : '编辑模式'}
                 </Button>
                 <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-3 text-xs"
                    onClick={handlePolish}
                    disabled={!scriptState.generatedScript || scriptState.isLoading}
                    icon={<Wand2 size={14}/>}
                 >
                   AI 润色
                 </Button>
                 <Button 
                    variant="primary" 
                    size="sm" 
                    className={`h-9 px-3 text-xs transition-all ${isCopied ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={copyToClipboard}
                    disabled={!scriptState.generatedScript}
                    icon={isCopied ? <CheckCircle size={14}/> : <Copy size={14}/>}
                 >
                   {isCopied ? '全篇复制' : '全篇复制'}
                 </Button>
              </div>
            </div>

            <div className="flex-1 p-0 overflow-y-auto bg-gray-50/50 relative">
              {scriptState.isLoading ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 animate-pulse mb-4">
                       <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                       <div className="w-3 h-3 bg-indigo-500 rounded-full delay-75"></div>
                       <div className="w-3 h-3 bg-indigo-500 rounded-full delay-150"></div>
                    </div>
                    <p className="text-gray-600 font-medium">SoraScript 正在{productContext.referenceType === 'video' ? '观看视频并构思' : '基于内置模板生成'}脚本...</p>
                    <p className="text-gray-400 text-sm mt-2">保持 90% 一致性 | 适配 {productContext.duration}</p>
                 </div>
              ) : !scriptState.generatedScript ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileText size={40} className="opacity-20 text-gray-900"/>
                  </div>
                  <p className="text-center max-w-sm">
                    左侧上传产品图并选择{productContext.referenceType === 'script' ? '内置模板' : '参考视频'}，<br/>AI 将为您生成专业的广告分镜脚本。
                  </p>
                </div>
              ) : isEditing ? (
                 <textarea
                    ref={textareaRef}
                    className="w-full h-full p-6 bg-white focus:outline-none font-mono text-sm leading-relaxed resize-none text-gray-800"
                    value={scriptState.generatedScript}
                    onChange={(e) => setScriptState(prev => ({...prev, generatedScript: e.target.value}))}
                  />
              ) : (
                <div className="p-6 bg-gray-50 min-h-full">
                  {/* Structured Display Mode */}
                  {parsedSections.overall || parsedSections.shots ? (
                    <>
                      {parsedSections.overall && (
                        <SectionCard 
                          title="总体分析" 
                          content={parsedSections.overall} 
                          icon={<Wand2 className="w-4 h-4 text-indigo-500"/>}
                        />
                      )}
                      
                      {parsedSections.shots && (
                        <SectionCard 
                          title="镜头分析 (Sora Prompt)" 
                          content={parsedSections.shots} 
                          icon={<Video className="w-4 h-4 text-indigo-500"/>}
                        />
                      )}
                      
                      {parsedSections.music && (
                        <SectionCard 
                          title="背景音乐分析" 
                          content={parsedSections.music} 
                        />
                      )}
                    </>
                  ) : (
                    /* Fallback to simple line-by-line if parsing fails */
                    <div className="prose prose-sm max-w-none p-4 bg-white rounded-lg shadow-sm">
                       {scriptState.generatedScript.split('\n').map((line, idx) => formatLine(line, idx))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default App;
