
import React, { useState, useRef, useEffect } from 'react';
import { RepairMessage, AppMode } from '../types';
import { searchGroundingAssistant, mapsGroundingAssistant, diagnoseAssistant } from '../services/geminiService';

interface ChatInterfaceProps {
  mode: AppMode;
  onRequestDispatch?: () => void;
}

interface MessageWithImage extends RepairMessage {
  imageUrl?: string;
  suggestDispatch?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode, onRequestDispatch }) => {
  const [messages, setMessages] = useState<MessageWithImage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<{ data: string, mimeType: string, preview: string } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          data: (reader.result as string).split(',')[1],
          mimeType: file.type,
          preview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachment) || loading) return;

    const userMsg: MessageWithImage = { 
      role: 'user', 
      text: input, 
      imageUrl: attachment?.preview,
      timestamp: Date.now() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const currentAttachment = attachment;
    
    setInput('');
    setAttachment(null);
    setLoading(true);

    try {
      let response;
      if (mode === AppMode.DIAGNOSE) {
        response = await diagnoseAssistant(
          currentInput || "Analyze this diagnostic image.", 
          currentAttachment ? { data: currentAttachment.data, mimeType: currentAttachment.mimeType } : undefined
        );
      } else if (mode === AppMode.SEARCH) {
        response = await searchGroundingAssistant(currentInput);
      } else {
        let loc;
        try {
          const position = await new Promise<GeolocationPosition>((res, rej) => 
            navigator.geolocation.getCurrentPosition(res, rej)
          );
          loc = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        } catch (err) {
          console.warn("Location permission denied", err);
        }
        response = await mapsGroundingAssistant(currentInput, loc);
      }

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const urls: Array<{ title: string; uri: string }> = [];

      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.web) urls.push({ title: chunk.web.title, uri: chunk.web.uri });
          if (chunk.maps) urls.push({ title: chunk.maps.title, uri: chunk.maps.uri });
        });
      }

      // Check if dispatch is suggested in text
      const text = response.text || "";
      const suggestDispatch = text.toLowerCase().includes("dispatch") || text.toLowerCase().includes("on-site tech");

      const modelMsg: MessageWithImage = {
        role: 'model',
        text: text || "I'm sorry, I couldn't generate a response.",
        urls: urls.length > 0 ? urls : undefined,
        suggestDispatch: suggestDispatch,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Error: Could not connect to the repair database. Please check your connection.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    if (mode === AppMode.DIAGNOSE) return "Type symptoms or upload dashboard photo...";
    if (mode === AppMode.SEARCH) return "Search for repair info...";
    return "Locate a repair service...";
  };

  const getWelcomeIcon = () => {
    if (mode === AppMode.DIAGNOSE) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      );
    }
    if (mode === AppMode.SEARCH) {
      return <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>;
    }
    return <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto w-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-8">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              {getWelcomeIcon()}
            </div>
            <h3 className="text-xl font-semibold">
              {mode === AppMode.DIAGNOSE ? "AI Visual Diagnostics" : mode === AppMode.SEARCH ? "Search Grounded Assistant" : "Maps Grounded Assistant"}
            </h3>
            <p className="text-slate-500 max-w-xs">
              {mode === AppMode.DIAGNOSE 
                ? "Snap a photo of your dashboard or type an error code for instant analysis." 
                : mode === AppMode.SEARCH 
                  ? "Ask about specific car parts or bicycle components." 
                  : "Find nearby repair shops or tire centers."}
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
              {m.imageUrl && (
                <img src={m.imageUrl} alt="Uploaded evidence" className="w-full max-h-48 object-cover rounded-lg mb-3" />
              )}
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</p>
              {m.urls && m.urls.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sources & Links</p>
                  {m.urls.map((url, idx) => (
                    <a key={idx} href={url.uri} target="_blank" className="block text-xs text-blue-500 hover:underline truncate">
                      🔗 {url.title || url.uri}
                    </a>
                  ))}
                </div>
              )}
            </div>
            {m.suggestDispatch && onRequestDispatch && (
              <button 
                onClick={onRequestDispatch}
                className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 animate-bounce"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"></path></svg>
                Request On-Site Tech Now
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex space-x-2 items-center shadow-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
              <span className="text-xs font-medium text-slate-400 ml-2">Master Tech is scanning...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white">
        {attachment && (
          <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl mb-3 border border-slate-100 animate-in slide-in-from-bottom-2">
            <img src={attachment.preview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">Visual evidence attached</p>
              <p className="text-[10px] text-slate-400">Ready for analysis</p>
            </div>
            <button onClick={() => setAttachment(null)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          {mode === AppMode.DIAGNOSE && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-blue-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={getPlaceholder()}
            className="flex-1 pl-4 pr-12 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
          />
          <button
            type="submit"
            disabled={loading || (!input.trim() && !attachment)}
            className="absolute right-2 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
};
