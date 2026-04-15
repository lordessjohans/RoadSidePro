
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface ChatEntry {
  role: 'user' | 'model';
  text: string;
  isVoice?: boolean;
}

export const LiveAssist: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [textInput, setTextInput] = useState('');
  
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const startCall = async () => {
    setStatus('connecting');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('connected');
            setIsActive(true);
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Output Transcriptions (AI Speaking)
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setChatHistory(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'model' && last.isVoice) {
                   return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                }
                return [...prev, { role: 'model', text, isVoice: true }];
              });
            }

            // Handle Input Transcriptions (User Speaking)
            if (message.serverContent?.inputTranscription) {
               const text = message.serverContent.inputTranscription.text;
               setChatHistory(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'user' && last.isVoice) {
                   return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                }
                return [...prev, { role: 'user', text, isVoice: true }];
              });
            }
            
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const ctx = audioContextOutRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => endCall(),
          onerror: (e) => {
            console.error("Live error", e);
            setStatus('error');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: "You are a professional Rapid Response Roadside Technician. A user is stranded and needs immediate verbal and text guidance. Be calm, clear, and safety-focused. If the user types a message, acknowledge it naturally. Use short, direct instructions suited for voice and quick reading.",
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !sessionRef.current || !isActive) return;

    const messageText = textInput.trim();
    setChatHistory(prev => [...prev, { role: 'user', text: messageText, isVoice: false }]);
    
    // Send to Live Session
    sessionRef.current.sendRealtimeInput({
      text: messageText
    });
    
    setTextInput('');
  };

  const endCall = () => {
    setIsActive(false);
    setStatus('idle');
    setChatHistory([]);
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    audioContextInRef.current?.close();
    audioContextOutRef.current?.close();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden">
      {/* Voice Status Area */}
      <div className="flex flex-col items-center p-6 border-b border-white/10 shrink-0">
        <div className="relative mb-4">
          <div className={`w-24 h-24 rounded-full border-4 border-blue-500/20 flex items-center justify-center transition-all duration-500 ${isActive ? 'scale-105 shadow-[0_0_40px_rgba(59,130,246,0.3)]' : ''}`}>
            <div className={`w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center ${isActive ? 'animate-pulse' : ''}`}>
               <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
               </svg>
            </div>
          </div>
          {isActive && <div className="absolute -inset-2 border-2 border-blue-400 rounded-full animate-ping opacity-10"></div>}
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold tracking-tight">Rapid Response AI Tech</h2>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
            {status === 'idle' && "Ready for Call"}
            {status === 'connecting' && "Connecting..."}
            {status === 'connected' && "Live Voice Assistant Connected"}
            {status === 'error' && "Connection Error"}
          </p>
        </div>
      </div>

      {/* Chat/Transcript Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/50">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-40 text-center px-12">
            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            <p className="text-xs">History will appear here during your session. You can speak or type to the technician.</p>
          </div>
        )}
        {chatHistory.map((entry, i) => (
          <div key={i} className={`flex flex-col ${entry.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-xs ${
              entry.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-100 rounded-bl-none'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px]">
                {entry.isVoice ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"></path></svg>
                ) : (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"></path></svg>
                )}
                <span>{entry.role === 'user' ? 'You' : 'Technician'}</span>
              </div>
              <p className="leading-relaxed">{entry.text}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Controls Area */}
      <div className="p-4 bg-slate-900 border-t border-white/10 shrink-0 space-y-4">
        {isActive && (
          <form onSubmit={handleSendText} className="relative flex items-center">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type message to technician..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-500"
            />
            <button 
              type="submit"
              disabled={!textInput.trim()}
              className="absolute right-2 p-2 text-blue-400 hover:text-blue-300 disabled:opacity-30"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
            </button>
          </form>
        )}

        <div className="flex gap-4">
          {!isActive ? (
            <button 
              onClick={startCall}
              disabled={status === 'connecting'}
              className="flex-1 bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-bold shadow-lg shadow-blue-900/40 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              {status === 'connecting' ? 'Connecting...' : 'Start Voice Session'}
            </button>
          ) : (
            <button 
              onClick={endCall}
              className="flex-1 bg-red-600 hover:bg-red-700 py-4 rounded-2xl font-bold shadow-lg shadow-red-900/40 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              End Assistance
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
