
import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  Download, 
  Share2, 
  ArrowLeft, 
  Wand2, 
  Palette, 
  Layout, 
  CheckCircle2, 
  Loader2,
  Trash2,
  FileText,
  Smartphone,
  RotateCw
} from 'lucide-react';
import { AppScreen, AppState, PhotoSize, SheetSize, ExportFormat, SheetOrientation } from './types';
import { PHOTO_SIZES, SHEET_SIZES, BG_COLORS, THEME } from './constants';
import { fileToBase64, resizeAndCrop, generateSheetLayout, prepareImageForAi } from './utils/imageUtils';
import { GeminiService } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    screen: AppScreen.HOME,
    originalImage: null,
    editedImage: null,
    selectedSize: PHOTO_SIZES[0],
    bgColor: BG_COLORS[0].value,
    sheetSize: SHEET_SIZES[0],
    sheetOrientation: 'portrait',
    exportFormat: 'JPG',
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Обработка...');
  const [sheetPreview, setSheetPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const gemini = new GeminiService();

  const resetApp = () => {
    setState({
      screen: AppScreen.HOME,
      originalImage: null,
      editedImage: null,
      selectedSize: PHOTO_SIZES[0],
      bgColor: BG_COLORS[0].value,
      sheetSize: SHEET_SIZES[0],
      sheetOrientation: 'portrait',
      exportFormat: 'JPG',
    });
    setAiPrompt('');
    setSheetPreview(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setLoadingText('Загрузка изображения...');
      try {
        const base64 = await fileToBase64(file);
        setState(prev => ({ ...prev, originalImage: base64, screen: AppScreen.EDITOR }));
      } catch (err) {
        alert("Ошибка при чтении файла");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleApplyAi = async () => {
    if (!state.originalImage) return;
    setIsLoading(true);
    setLoadingText('ИИ улучшает ваше фото...');
    
    try {
      // Оптимизируем изображение перед отправкой в ИИ
      const optimizedImage = await prepareImageForAi(state.originalImage);
      
      const result = await gemini.processImage(
        optimizedImage, 
        aiPrompt || "Professional document photo quality", 
        state.bgColor
      );
      
      setState(prev => ({ ...prev, editedImage: result }));
    } catch (err: any) {
      console.error(err);
      alert(`Ошибка ИИ: ${err.message || "Пожалуйста, попробуйте другое фото или более короткий запрос."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToPreview = async () => {
    const base = state.editedImage || state.originalImage;
    if (!base) return;
    
    setIsLoading(true);
    setLoadingText('Применение размеров...');
    try {
      const cropped = await resizeAndCrop(base, state.selectedSize.width, state.selectedSize.height);
      setState(prev => ({ ...prev, editedImage: cropped, screen: AppScreen.PREVIEW }));
    } catch (err) {
      alert("Ошибка при обрезке фото");
    } finally {
      setIsLoading(false);
    }
  };

  const generateSheet = async () => {
    if (!state.editedImage) return;
    setIsLoading(true);
    setLoadingText('Генерация листа для печати...');
    try {
      const layout = await generateSheetLayout(
        state.editedImage,
        state.selectedSize,
        state.sheetSize,
        state.exportFormat,
        state.sheetOrientation
      );
      setSheetPreview(layout as string);
      setState(prev => ({ ...prev, screen: AppScreen.EXPORT }));
    } catch (err) {
      alert("Ошибка при генерации листа");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResult = () => {
    if (!sheetPreview) return;
    const link = document.createElement('a');
    link.href = sheetPreview;
    const ext = state.exportFormat.toLowerCase();
    link.download = `DocPhoto_${state.selectedSize.label.replace(' ', '')}_${state.sheetSize.label}_${state.sheetOrientation}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center text-center px-6 animate-fadeIn">
      <Loader2 className="w-16 h-16 text-emerald-400 animate-spin mb-6" />
      <h3 className="text-xl font-bold mb-2">{loadingText}</h3>
      <p className="text-emerald-300 opacity-70 text-sm">Это может занять некоторое время</p>
    </div>
  );

  const renderHome = () => (
    <div className="flex flex-col h-screen overflow-hidden bg-emerald-950 p-6 safe-pt safe-pb">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <div className="relative">
          <div className="w-28 h-28 bg-emerald-700 rounded-[32px] flex items-center justify-center shadow-2xl rotate-3">
             <Smartphone className="w-14 h-14 text-white -rotate-3" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-400 p-2 rounded-full shadow-lg">
            <ImageIcon className="w-6 h-6 text-emerald-950" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">DocPhoto AI</h1>
          <p className="text-emerald-200 opacity-80 font-medium px-4">
            Профессиональные фотографии для паспорта и документов прямо в вашем телефоне
          </p>
        </div>

        <div className="w-full max-w-xs space-y-4 mt-8">
          <button 
            onClick={() => cameraInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all py-5 rounded-[24px] font-bold text-lg text-emerald-950 shadow-xl shadow-emerald-900/40"
          >
            <Camera className="w-6 h-6" />
            Сделать фото
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-4 bg-emerald-800 hover:bg-emerald-700/80 active:scale-95 border border-emerald-600/30 transition-all py-5 rounded-[24px] font-bold text-lg shadow-lg"
          >
            <Upload className="w-6 h-6" />
            Выбрать файл
          </button>
        </div>

        <div className="mt-8 flex items-center gap-2 text-emerald-300/50 text-xs">
          <CheckCircle2 className="w-4 h-4" />
          Бесплатно и без регистрации
        </div>
      </div>

      <input type="file" accept="image/*" capture="user" ref={cameraInputRef} className="hidden" onChange={handleFileUpload} />
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
    </div>
  );

  const renderEditor = () => (
    <div className="flex flex-col h-screen bg-emerald-950 animate-fadeIn safe-pt safe-pb overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-emerald-900 shadow-md">
        <button onClick={resetApp} className="p-2 hover:bg-emerald-800 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-bold text-emerald-50">Редактор</span>
        <button 
          onClick={handleProceedToPreview} 
          className="bg-emerald-500 text-emerald-950 font-bold px-5 py-2 rounded-xl active:scale-95 transition-all shadow-lg"
        >
          Далее
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex items-center justify-center bg-black/20 p-4">
        <div className="relative group">
          <img 
            src={state.editedImage || state.originalImage || ''} 
            alt="Main Workspace" 
            className="max-w-full max-h-[50vh] rounded-xl shadow-2xl object-contain border border-emerald-800"
          />
          {state.editedImage && (
            <button 
              onClick={() => setState(prev => ({ ...prev, editedImage: null }))}
              className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-full shadow-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-emerald-900 rounded-t-[40px] p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.4)] border-t border-emerald-700/30">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex gap-2">
            <div className="flex-1 bg-emerald-950/50 border border-emerald-700 rounded-2xl flex items-center px-4 focus-within:ring-2 focus-within:ring-emerald-400 transition-all">
              <input 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Запрос для ИИ (напр: освежить лицо)"
                className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-emerald-700"
              />
            </div>
            <button 
              onClick={handleApplyAi}
              className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 p-4 rounded-2xl shadow-lg active:scale-95 transition-all"
              title="Применить ИИ"
            >
              < Wand2 className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <Palette className="w-3 h-3" /> Фон
              </p>
              <div className="flex gap-2">
                {BG_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setState(prev => ({ ...prev, bgColor: color.value }))}
                    className={`w-9 h-9 rounded-full border-2 transition-all ring-offset-2 ring-offset-emerald-900 ${state.bgColor === color.value ? 'border-emerald-400 scale-110 ring-2 ring-emerald-400' : 'border-transparent opacity-60'}`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                Размер (см)
              </p>
              <select 
                value={state.selectedSize.label}
                onChange={(e) => {
                  const size = PHOTO_SIZES.find(s => s.label === e.target.value);
                  if (size) setState(prev => ({ ...prev, selectedSize: size }));
                }}
                className="w-full bg-emerald-950 border border-emerald-700 rounded-xl px-3 py-2 text-sm text-emerald-100 outline-none"
              >
                {PHOTO_SIZES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="flex flex-col h-screen bg-emerald-950 animate-fadeIn safe-pt safe-pb">
      <div className="flex items-center justify-between p-4 bg-emerald-900">
        <button onClick={() => setState(prev => ({ ...prev, screen: AppScreen.EDITOR }))} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="font-bold">Предпросмотр</h2>
        <button onClick={generateSheet} className="bg-emerald-500 text-emerald-950 font-bold px-6 py-2 rounded-xl shadow-lg">
          Создать лист
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col items-center">
        <div className="space-y-2 text-center">
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Готовое фото</p>
          <div className="bg-white p-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] rounded-lg">
            <img src={state.editedImage || ''} alt="Result" className="max-h-[250px] rounded border border-gray-100" />
          </div>
          <p className="text-emerald-300/50 text-xs mt-2 italic">{state.selectedSize.label} • {state.bgColor === '#FFFFFF' ? 'Белый фон' : 'Цветной фон'}</p>
        </div>

        <div className="w-full max-w-sm space-y-6 bg-emerald-900/40 p-6 rounded-[32px] border border-emerald-800 shadow-xl">
           <div className="space-y-3">
             <h3 className="text-sm font-bold flex items-center gap-3">
               <Layout className="w-5 h-5 text-emerald-400" />
               Параметры печати
             </h3>
             <div className="grid grid-cols-3 gap-2">
               {SHEET_SIZES.map(sheet => (
                 <button 
                   key={sheet.label}
                   onClick={() => setState(prev => ({ ...prev, sheetSize: sheet }))}
                   className={`flex flex-col items-center py-3 rounded-xl transition-all border ${state.sheetSize.label === sheet.label ? 'bg-emerald-500 text-emerald-950 border-emerald-300 font-bold shadow-lg scale-105' : 'bg-emerald-800/50 text-emerald-300 border-emerald-700 opacity-60'}`}
                 >
                   <span className="text-sm">{sheet.label}</span>
                   <span className="text-[10px]">{sheet.width}x{sheet.height}мм</span>
                 </button>
               ))}
             </div>
           </div>

           <div className="space-y-3">
             <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
               <RotateCw className="w-3 h-3" /> Ориентация листа
             </h3>
             <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setState(prev => ({ ...prev, sheetOrientation: 'portrait' }))}
                  className={`py-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${state.sheetOrientation === 'portrait' ? 'bg-emerald-600 border-white' : 'bg-transparent border-emerald-800 text-emerald-500 opacity-50'}`}
                >
                  <div className="w-4 h-6 border-2 border-current rounded-sm" />
                  Книжная
                </button>
                <button 
                  onClick={() => setState(prev => ({ ...prev, sheetOrientation: 'landscape' }))}
                  className={`py-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${state.sheetOrientation === 'landscape' ? 'bg-emerald-600 border-white' : 'bg-transparent border-emerald-800 text-emerald-500 opacity-50'}`}
                >
                  <div className="w-6 h-4 border-2 border-current rounded-sm" />
                  Альбомная
                </button>
             </div>
           </div>

           <div className="space-y-3">
             <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Формат сохранения</h3>
             <div className="flex gap-2">
               {['JPG', 'PNG', 'PDF'].map(fmt => (
                 <button 
                   key={fmt}
                   onClick={() => setState(prev => ({ ...prev, exportFormat: fmt as ExportFormat }))}
                   className={`flex-1 py-3 rounded-xl font-bold border transition-all ${state.exportFormat === fmt ? 'bg-emerald-100 text-emerald-950 border-white' : 'bg-transparent border-emerald-800 text-emerald-500 opacity-50'}`}
                 >
                   {fmt}
                 </button>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderExport = () => (
    <div className="flex flex-col h-screen bg-emerald-950 animate-fadeIn safe-pt safe-pb">
      <div className="flex items-center justify-between p-4 bg-emerald-900">
        <button onClick={() => setState(prev => ({ ...prev, screen: AppScreen.PREVIEW }))} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-bold">Экспорт</span>
        <button onClick={resetApp} className="text-emerald-400 font-medium px-2 py-1">
          Заново
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
        <div className={`w-full max-w-sm bg-white rounded-lg shadow-2xl overflow-hidden mb-8 border-4 border-emerald-800/20`}>
           {state.exportFormat === 'PDF' ? (
             <div className={`bg-gray-50 flex flex-col items-center justify-center p-8 text-center text-gray-500 ${state.sheetOrientation === 'landscape' ? 'aspect-[1.4/1]' : 'aspect-[1/1.4]'}`}>
               <FileText className="w-20 h-20 text-emerald-600 mb-4" />
               <p className="font-bold text-lg">PDF Документ Готов</p>
               <p className="text-xs">Формат: {state.sheetSize.label} ({state.sheetOrientation === 'landscape' ? 'Альбом' : 'Книга'})</p>
             </div>
           ) : (
             <img src={sheetPreview || ''} alt="Final Layout" className="w-full h-auto" />
           )}
        </div>

        <div className="w-full max-w-sm flex flex-col gap-6">
          <button 
            onClick={downloadResult}
            className="group flex items-center justify-center gap-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 py-5 rounded-[24px] font-extrabold text-xl shadow-2xl active:scale-95 transition-all"
          >
            <Download className="w-7 h-7" />
            Сохранить {state.exportFormat}
          </button>
          
          <div className="grid grid-cols-2 gap-4">
             <button className="flex items-center justify-center gap-2 bg-emerald-900/80 p-4 rounded-2xl border border-emerald-700/50 hover:bg-emerald-800 transition-colors">
               <Share2 className="w-5 h-5 text-emerald-400" />
               <span className="text-sm font-semibold">Поделиться</span>
             </button>
             <button onClick={() => window.print()} className="flex items-center justify-center gap-2 bg-emerald-900/80 p-4 rounded-2xl border border-emerald-700/50 hover:bg-emerald-800 transition-colors">
               <Smartphone className="w-5 h-5 text-emerald-400" />
               <span className="text-sm font-semibold">Печать</span>
             </button>
          </div>
        </div>

        <div className="mt-auto py-8 text-emerald-300/30 text-[10px] uppercase tracking-widest text-center">
          docphoto ai • pwa application • build v1.2
        </div>
      </div>
    </div>
  );

  return (
    <main className="max-w-screen-md mx-auto min-h-screen bg-emerald-950 text-white select-none">
      {state.screen === AppScreen.HOME && renderHome()}
      {state.screen === AppScreen.EDITOR && renderEditor()}
      {state.screen === AppScreen.PREVIEW && renderPreview()}
      {state.screen === AppScreen.EXPORT && renderExport()}

      {isLoading && <LoadingOverlay />}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        * {
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }
        input, select {
          -webkit-user-select: text;
        }
      `}</style>
    </main>
  );
};

export default App;
