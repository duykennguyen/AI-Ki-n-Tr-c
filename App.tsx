
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AppMode, GenerationState, DesignVariant, AnalysisResult } from './types';
import { ARCHITECTURAL_STYLES, FLOORPLAN_VARIANTS, RENOVATION_STYLES, LAND_PLANNING_STYLES } from './constants';
import { analyzeArchitecture, generateDesignVariant } from './geminiService';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SKETCH_TO_RENDER);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [userRequirement, setUserRequirement] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<DesignVariant | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [state, setState] = useState<GenerationState>({
    isAnalyzing: false,
    isGenerating: false,
    analysis: null,
    variants: [],
    error: null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'vi-VN';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setUserRequirement(prev => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setState(prev => ({ ...prev, analysis: null, variants: [], error: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    const canProcess = sourceImage || (mode === AppMode.LAND_TO_FLOORPLAN && userRequirement.trim().length > 10);
    if (!canProcess) return;

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    try {
      const analysis = await analyzeArchitecture(sourceImage, mode, userRequirement);
      setState(prev => ({ ...prev, isAnalyzing: false, analysis, isGenerating: true }));
      
      let targets;
      if (mode === AppMode.SKETCH_TO_RENDER) targets = ARCHITECTURAL_STYLES;
      else if (mode === AppMode.PERSPECTIVE_TO_FLOORPLAN) targets = FLOORPLAN_VARIANTS;
      else if (mode === AppMode.LAND_TO_FLOORPLAN) targets = LAND_PLANNING_STYLES;
      else targets = RENOVATION_STYLES;

      const generationPromises = targets.map(async (target) => {
        const imageUrl = await generateDesignVariant(sourceImage, mode, target, userRequirement);
        return {
          id: target.id,
          style: target.name,
          imageUrl,
          description: (target as any).description || (target as any).prompt
        };
      });
      const results = await Promise.all(generationPromises);
      setState(prev => ({ ...prev, isGenerating: false, variants: results }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ ...prev, isAnalyzing: false, isGenerating: false, error: "Đã có lỗi xảy ra. Hãy kiểm tra kết nối và thử lại." }));
    }
  };

  const regenerateSingleVariant = async (variantId: string) => {
    const canProcess = sourceImage || (mode === AppMode.LAND_TO_FLOORPLAN && userRequirement.trim().length > 10);
    if (!canProcess) return;
    
    let targets;
    if (mode === AppMode.SKETCH_TO_RENDER) targets = ARCHITECTURAL_STYLES;
    else if (mode === AppMode.PERSPECTIVE_TO_FLOORPLAN) targets = FLOORPLAN_VARIANTS;
    else if (mode === AppMode.LAND_TO_FLOORPLAN) targets = LAND_PLANNING_STYLES;
    else targets = RENOVATION_STYLES;

    const target = targets.find(t => t.id === variantId);
    if (!target) return;

    const originalVariants = [...state.variants];
    const index = originalVariants.findIndex(v => v.id === variantId);
    
    try {
      const newImageUrl = await generateDesignVariant(sourceImage, mode, target, userRequirement);
      originalVariants[index] = {
        ...originalVariants[index],
        imageUrl: newImageUrl
      };
      setState(prev => ({ ...prev, variants: originalVariants }));
    } catch (err) {
      console.error("Failed to regenerate variant:", err);
    }
  };

  const getModeTitle = () => {
    switch(mode) {
      case AppMode.SKETCH_TO_RENDER: return "Diễn Họa Phối Cảnh";
      case AppMode.PERSPECTIVE_TO_FLOORPLAN: return "Mặt Bằng Từ 3D";
      case AppMode.LAND_TO_FLOORPLAN: return "Thiết Kế Mặt Bằng Mới";
      case AppMode.HOME_RENOVATION: return "Cải Tạo Kiến Trúc";
      default: return "";
    }
  };

  const isBtnDisabled = state.isAnalyzing || state.isGenerating || (!sourceImage && !(mode === AppMode.LAND_TO_FLOORPLAN && userRequirement.trim().length > 10));

  return (
    <div className="min-h-screen">
      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-sky-900/10 blur-[120px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-amber-900/10 blur-[100px] rounded-full -z-10 -translate-x-1/2 translate-y-1/2"></div>

      {/* Modal View Detail */}
      {selectedVariant && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500"
          onClick={() => setSelectedVariant(null)}
        >
          <div 
            className="relative max-w-7xl w-full h-[85vh] flex flex-col items-center justify-center gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex-1 min-h-0">
              <img 
                src={selectedVariant.imageUrl} 
                alt={selectedVariant.style} 
                className="w-full h-full object-contain rounded-sm"
              />
            </div>
            <div className="w-full max-w-4xl glass-card p-8 gold-border text-center">
              <h3 className="text-3xl font-serif gold-text mb-4 italic">{selectedVariant.style}</h3>
              <p className="text-slate-400 text-sm leading-relaxed tracking-wide mb-6">{selectedVariant.description}</p>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = selectedVariant.imageUrl;
                    a.download = `Architect-${selectedVariant.id}.png`;
                    a.click();
                  }}
                  className="px-8 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-amber-100 transition-all"
                >
                  Tải Bản Vẽ
                </button>
                <button 
                  onClick={() => setSelectedVariant(null)}
                  className="px-8 py-3 border border-white/20 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Sidebar Nav */}
      <nav className="fixed left-0 top-0 bottom-0 w-72 flex flex-col py-8 border-r border-white/5 bg-black/40 backdrop-blur-md z-40 overflow-y-auto">
        <div className="px-8 mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 gold-gradient flex items-center justify-center rounded-sm shadow-lg shadow-amber-900/20">
              <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-lg font-serif italic gold-text">Architect Studio</span>
          </div>
          <div className="h-[1px] w-full bg-white/5 mt-4"></div>
        </div>

        <div className="flex-1 px-4 space-y-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 px-4 mb-2">Creative Flow</p>
          
          <button 
            onClick={() => { setMode(AppMode.SKETCH_TO_RENDER); setState(prev => ({ ...prev, variants: [] })); }}
            className={`w-full flex items-start gap-4 px-4 py-4 rounded-sm transition-all group ${mode === AppMode.SKETCH_TO_RENDER ? 'bg-white/5 border-l-2 border-amber-500' : 'hover:bg-white/5'}`}
          >
            <svg className={`w-5 h-5 mt-0.5 ${mode === AppMode.SKETCH_TO_RENDER ? 'text-amber-500' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="flex flex-col items-start text-left">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${mode === AppMode.SKETCH_TO_RENDER ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>Diễn Họa 3D</span>
              <span className="text-[9px] text-slate-600 group-hover:text-slate-500 mt-1 font-medium leading-tight">Biến phác thảo sơ bộ thành phối cảnh kiến trúc chân thực</span>
            </div>
          </button>

          <button 
            onClick={() => { setMode(AppMode.HOME_RENOVATION); setState(prev => ({ ...prev, variants: [] })); }}
            className={`w-full flex items-start gap-4 px-4 py-4 rounded-sm transition-all group ${mode === AppMode.HOME_RENOVATION ? 'bg-white/5 border-l-2 border-amber-500' : 'hover:bg-white/5'}`}
          >
            <svg className={`w-5 h-5 mt-0.5 ${mode === AppMode.HOME_RENOVATION ? 'text-amber-500' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <div className="flex flex-col items-start text-left">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${mode === AppMode.HOME_RENOVATION ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>Cải Tạo Công Trình</span>
              <span className="text-[9px] text-slate-600 group-hover:text-slate-500 mt-1 font-medium leading-tight">Thay đổi hoàn toàn thẩm mỹ trên nền kết cấu hiện có</span>
            </div>
          </button>

          <div className="h-[1px] w-full bg-white/5 my-4"></div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 px-4 mb-2">Floor Planning</p>

          <button 
            onClick={() => { setMode(AppMode.LAND_TO_FLOORPLAN); setState(prev => ({ ...prev, variants: [] })); }}
            className={`w-full flex items-start gap-4 px-4 py-4 rounded-sm transition-all group ${mode === AppMode.LAND_TO_FLOORPLAN ? 'bg-white/5 border-l-2 border-amber-500' : 'hover:bg-white/5'}`}
          >
            <svg className={`w-5 h-5 mt-0.5 ${mode === AppMode.LAND_TO_FLOORPLAN ? 'text-amber-500' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <div className="flex flex-col items-start text-left">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${mode === AppMode.LAND_TO_FLOORPLAN ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>Quy Hoạch Mới</span>
              <span className="text-[9px] text-slate-600 group-hover:text-slate-500 mt-1 font-medium leading-tight">Thiết kế mặt bằng 2D từ mảnh đất hoặc phác thảo</span>
            </div>
          </button>

          <button 
            onClick={() => { setMode(AppMode.PERSPECTIVE_TO_FLOORPLAN); setState(prev => ({ ...prev, variants: [] })); }}
            className={`w-full flex items-start gap-4 px-4 py-4 rounded-sm transition-all group ${mode === AppMode.PERSPECTIVE_TO_FLOORPLAN ? 'bg-white/5 border-l-2 border-amber-500' : 'hover:bg-white/5'}`}
          >
            <svg className={`w-5 h-5 mt-0.5 ${mode === AppMode.PERSPECTIVE_TO_FLOORPLAN ? 'text-amber-500' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A2 2 0 013 15.492V4.508a2 2 0 011.106-1.784L9 0l5.447 2.724A2 2 0 0115 4.508v10.984a2 2 0 01-1.106 1.784L9 20z" />
            </svg>
            <div className="flex flex-col items-start text-left">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${mode === AppMode.PERSPECTIVE_TO_FLOORPLAN ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>Mặt Bằng Từ 3D</span>
              <span className="text-[9px] text-slate-600 group-hover:text-slate-500 mt-1 font-medium leading-tight">Suy luận cấu trúc 2D từ góc nhìn phối cảnh 3D</span>
            </div>
          </button>
        </div>
      </nav>

      <main className="pl-72 min-h-screen">
        {/* Hero Banner */}
        <section className="h-[35vh] flex flex-col items-center justify-center border-b border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 L100 0" stroke="white" strokeWidth="0.05" />
              <path d="M0 0 L100 100" stroke="white" strokeWidth="0.05" />
            </svg>
          </div>
          <h1 className="text-5xl font-serif gold-text mb-4 tracking-tighter italic float-anim text-center px-4">{getModeTitle()}</h1>
          <p className="text-[10px] uppercase tracking-[0.5em] text-slate-500 font-medium italic">Empowered by Generative Architect Intelligence</p>
        </section>

        <section className="max-w-[1600px] mx-auto p-12 grid lg:grid-cols-12 gap-16">
          {/* Left Panel: Studio Workspace */}
          <div className="lg:col-span-4 space-y-12">
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-4">
                01 Workspace
                <div className="h-[1px] flex-1 bg-white/5"></div>
              </h2>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-square cursor-pointer border-t border-l border-white/10 bg-slate-900/20 group overflow-hidden transition-all hover:bg-slate-900/40 ${sourceImage ? 'ring-1 ring-amber-500/30' : ''}`}
              >
                {sourceImage ? (
                  <>
                    <img src={sourceImage} alt="Canvas" className="w-full h-full object-cover grayscale-[0.2] transition-all group-hover:scale-110 duration-[2s]" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-6 py-2 border border-white/20 bg-black/60 backdrop-blur-md">Thay đổi tư liệu</span>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 border border-white/5 rounded-full flex items-center justify-center mb-6 group-hover:border-amber-500/50 transition-colors">
                      <svg className="w-6 h-6 text-slate-600 group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {mode === AppMode.HOME_RENOVATION ? 'Tải lên ảnh hiện trạng cần cải tạo' : 
                         mode === AppMode.LAND_TO_FLOORPLAN ? 'Tải lên phác thảo hoặc sơ đồ đất (Tùy chọn)' :
                         'Tải lên phác thảo hoặc ảnh phối cảnh'}
                      </p>
                      {mode === AppMode.LAND_TO_FLOORPLAN && (
                        <p className="text-[9px] text-slate-600 font-medium italic">Bạn có thể tạo mặt bằng bằng mô tả chi tiết nếu không có ảnh phác thảo.</p>
                      )}
                    </div>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-4 flex-1">
                  02 Concept Notes
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                </h2>
              </div>
              
              <div className="relative group/textarea">
                <textarea 
                  value={userRequirement}
                  onChange={(e) => setUserRequirement(e.target.value)}
                  placeholder={
                    mode === AppMode.HOME_RENOVATION 
                      ? "Ví dụ: Giữ kết cấu hiện tại, thay gạch cũ bằng kính lớn, thêm ban công gỗ, ốp đá xám mặt tiền..."
                      : mode === AppMode.LAND_TO_FLOORPLAN
                      ? "Nhập thông số đất: Mảnh đất 5x20m, hướng Nam, xây 1 trệt 1 lầu cho gia đình 4 người, sân vườn hiện đại..."
                      : "Nhập ghi chú thiết kế của bạn... (Ví dụ: Ưu tiên vật liệu gạch trần, ánh sáng hoàng hôn...)"
                  }
                  className="w-full h-32 bg-slate-900/40 border border-white/5 p-4 pr-12 text-xs leading-relaxed text-slate-300 focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-slate-700 resize-none font-medium"
                />
                <button 
                  onClick={toggleListening}
                  title={isListening ? "Đang lắng nghe... Nhấp để dừng" : "Nhập bằng giọng nói"}
                  className={`absolute top-4 right-4 p-2 rounded-sm transition-all flex items-center justify-center ${isListening ? 'bg-amber-500/20 text-amber-500 animate-pulse' : 'text-slate-500 hover:text-amber-500 hover:bg-white/5'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isListening ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-3 3 3 3 0 01-3-3V5a3 3 0 013-3z" />
                    )}
                  </svg>
                </button>
              </div>
              
              <button 
                onClick={processImage}
                disabled={isBtnDisabled}
                className={`w-full py-4 text-xs font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 ${isBtnDisabled ? 'bg-slate-900 text-slate-700 cursor-not-allowed border border-white/5' : 'bg-white text-black hover:bg-amber-100 shadow-xl shadow-amber-900/10 hover:-translate-y-1'}`}
              >
                {(state.isAnalyzing || state.isGenerating) ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Khai triển thiết kế'}
              </button>
            </div>

            {state.analysis && (
              <div className="glass-card p-8 border-l-2 border-amber-500 animate-in fade-in slide-in-from-left-4 duration-1000">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500 mb-6 italic">Professional Analysis</h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-slate-500 mb-2 block">Nhận diện / Hiện trạng</label>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">{state.analysis.architectureStyle}</p>
                  </div>
                  <div className="border-t border-white/5 pt-4">
                    <label className="text-[9px] uppercase tracking-widest text-slate-500 mb-2 block">Ghi chú chuyên môn</label>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">{state.analysis.structureNotes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Showcase Gallery */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 flex items-center gap-4">
                03 Exhibition Gallery
                <div className="h-[1px] w-24 bg-white/5"></div>
              </h2>
              {state.variants.length > 0 && !state.isGenerating && (
                <button 
                  onClick={processImage}
                  className="flex items-center gap-2 px-4 py-2 border border-white/10 hover:border-amber-500/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-amber-500 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Tạo lại tất cả
                </button>
              )}
            </div>

            {state.variants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {state.variants.map((v, idx) => (
                  <div 
                    key={v.id} 
                    className="group relative"
                    style={{ animationDelay: `${idx * 150}ms` }}
                  >
                    <div 
                      className="aspect-[4/5] overflow-hidden bg-slate-900/50 relative cursor-pointer"
                      onClick={() => setSelectedVariant(v)}
                    >
                      <img 
                        src={v.imageUrl} 
                        alt={v.style} 
                        className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[3s] ease-out" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                      
                      {/* Individual Refresh Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          regenerateSingleVariant(v.id);
                        }}
                        className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-sm opacity-0 group-hover:opacity-100 transition-all hover:text-amber-500"
                        title="Tạo lại phương án này"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>

                      <div className="absolute bottom-0 left-0 p-8 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-500 mb-2 block">{v.style}</span>
                        <div className="h-[1px] w-0 group-hover:w-full bg-amber-500/50 transition-all duration-700 mb-4"></div>
                        <p className="text-[11px] text-slate-300 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 italic">
                          {v.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : state.isGenerating ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-[4/5] bg-slate-900/20 border border-white/5 animate-pulse flex items-center justify-center">
                    <div className="w-8 h-8 border border-white/10 rounded-full animate-spin"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[70vh] flex flex-col items-center justify-center text-center opacity-40">
                <div className="text-[100px] font-serif italic text-white/5 mb-8">Studio</div>
                <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-500">Chờ lệnh khai triển phương án thiết kế</p>
              </div>
            )}
          </div>
        </div >
      </main>

      {/* Subtle Footer */}
      <footer className="py-12 px-12 border-t border-white/5 text-center ml-72">
        <p className="text-[9px] font-bold uppercase tracking-[0.6em] text-slate-600">
          Powered by Gemini 3 Architect Intelligence • Precision & Aesthetics
        </p>
      </footer>
    </div>
  );
};

export default App;
