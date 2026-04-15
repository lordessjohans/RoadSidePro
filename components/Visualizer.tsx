
import React, { useState, useRef } from 'react';
import { generateVehicleImage, generateVehicleVideo } from '../services/geminiService';
import { ImageGenConfig, VideoGenConfig } from '../types';

export const Visualizer: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [imageConfig, setImageConfig] = useState<ImageGenConfig>({ size: '1K', aspectRatio: '16:9' });
  const [videoConfig, setVideoConfig] = useState<VideoGenConfig>({ aspectRatio: '16:9' });
  const [referenceImage, setReferenceImage] = useState<{ data: string, mimeType: string, preview: string } | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [view, setView] = useState<'image' | 'video'>('image');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setReferenceImage({
          data: base64,
          mimeType: file.type,
          preview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setLoadingMsg("Designing your custom vehicle concept...");
    try {
      const img = await generateVehicleImage(prompt, imageConfig, referenceImage ? { data: referenceImage.data, mimeType: referenceImage.mimeType } : undefined);
      setGeneratedImage(img);
      setGeneratedVideo(null); // Clear video when new image generated
    } catch (e) {
      console.error(e);
      alert("Failed to generate image. Please ensure your API key is correctly selected and active.");
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const handleAnimateImage = async () => {
    if (!generatedImage || loading) return;
    setLoading(true);
    try {
      const video = await generateVehicleVideo(
        `Cinematic drive of the vehicle in the image, professional lighting, smooth motion.`,
        generatedImage,
        videoConfig,
        (msg) => setLoadingMsg(msg)
      );
      setGeneratedVideo(video);
      setView('video');
    } catch (e) {
      console.error(e);
      alert("Failed to animate image. Please retry or check your project quota.");
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 space-y-8 pb-32">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
          <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          Vehicle Concept Visualizer
        </h3>
        
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Design Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your dream repair outcome or custom vehicle build... (e.g., 'Modern electric gravel bike in matte desert finish')"
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Reference Image (Optional)</label>
            <div className="flex gap-4 items-center">
              {!referenceImage ? (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 hover:border-indigo-300 transition-all group"
                >
                  <svg className="w-8 h-8 text-slate-300 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-400 mt-2">Upload File</span>
                </button>
              ) : (
                <div className="relative group">
                  <img src={referenceImage.preview} alt="Reference" className="w-32 h-32 object-cover rounded-xl border border-slate-200" />
                  <button 
                    onClick={() => setReferenceImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                  <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-[10px] font-bold">Ref Selected</span>
                  </div>
                </div>
              )}
              <div className="flex-1 text-xs text-slate-500 italic">
                {referenceImage 
                  ? "Reference image will guide the AI's generation. You can still modify the style with your prompt." 
                  : "Upload a photo of your vehicle or bike to use it as a base for the AI generation."}
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Resolution</label>
              <div className="flex gap-2">
                {(['1K', '2K', '4K'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => setImageConfig({ ...imageConfig, size })}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${imageConfig.size === size ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Aspect Ratio</label>
              <select
                value={imageConfig.aspectRatio}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setImageConfig({ ...imageConfig, aspectRatio: val });
                  setVideoConfig({ ...videoConfig, aspectRatio: val === '9:16' ? '9:16' : '16:9' });
                }}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-9"
              >
                <option value="16:9">Landscape (16:9)</option>
                <option value="9:16">Portrait (9:16)</option>
                <option value="1:1">Square (1:1)</option>
                <option value="4:3">Classic (4:3)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateImage}
            disabled={loading || !prompt.trim()}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:bg-slate-300 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
          >
            {loading ? 'Processing...' : 'Generate High-Res Concept'}
          </button>
        </div>
      </div>

      {(generatedImage || loading) && (
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative min-h-[400px] flex items-center justify-center ring-1 ring-white/10">
          {loading && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-white p-8">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-lg font-medium text-center max-w-sm animate-pulse">{loadingMsg}</p>
            </div>
          )}

          <div className="w-full h-full flex items-center justify-center p-4">
            {view === 'image' && generatedImage && (
              <img src={generatedImage} alt="Generated vehicle" className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-2xl" />
            )}
            {view === 'video' && generatedVideo && (
              <video src={generatedVideo} autoPlay loop muted controls className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-2xl" />
            )}
          </div>

          {generatedImage && !loading && (
            <div className="absolute bottom-6 left-6 right-6 flex justify-between gap-4">
               <div className="flex bg-slate-800/80 backdrop-blur rounded-xl p-1 p-2 gap-2">
                <button 
                  onClick={() => setView('image')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'image' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:text-white'}`}
                >
                  Concept
                </button>
                <button 
                  onClick={() => { if(generatedVideo) setView('video') }}
                  disabled={!generatedVideo}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${view === 'video' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:text-white'}`}
                >
                  Motion
                </button>
               </div>
               
               {!generatedVideo && (
                 <button 
                  onClick={handleAnimateImage}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold px-6 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30"
                 >
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path></svg>
                   Animate with Veo
                 </button>
               )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
