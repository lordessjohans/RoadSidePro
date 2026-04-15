
import React, { useState, useEffect } from 'react';
import { AppMode } from './types';
import { ChatInterface } from './components/ChatInterface';
import { Visualizer } from './components/Visualizer';
import { LiveAssist } from './components/LiveAssist';
import { DispatchMap } from './components/DispatchMap';
import { PartsShop } from './components/PartsShop';
import { KeySelectionGate } from './components/KeySelectionGate';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppMode>(AppMode.DIAGNOSE);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case AppMode.DIAGNOSE:
        return <ChatInterface mode={AppMode.DIAGNOSE} onRequestDispatch={() => setActiveTab(AppMode.DISPATCH)} />;
      case AppMode.SEARCH:
        return <ChatInterface mode={AppMode.SEARCH} />;
      case AppMode.MAPS:
        return <PartsShop />;
      case AppMode.LIVE_ASSIST:
        return <LiveAssist />;
      case AppMode.DISPATCH:
        return <DispatchMap />;
      case AppMode.VISUALIZE:
        if (!hasKey) {
          return (
            <KeySelectionGate 
              title="Unlock High-Performance AI" 
              description="To use cinematic vehicle animation (Veo) and ultra-high-resolution concepts (Gemini 3 Pro), you must select an authorized API key."
              onKeySelected={() => setHasKey(true)}
            />
          );
        }
        return <Visualizer />;
      default:
        return <ChatInterface mode={AppMode.DIAGNOSE} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold italic">R</div>
            <span className="text-xl font-bold tracking-tight text-slate-800 hidden sm:block">RoadSidePro</span>
          </div>
          
          <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${activeTab === AppMode.LIVE_ASSIST ? 'bg-red-500' : 'bg-blue-500'}`}></div>
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-widest">
              {activeTab === AppMode.LIVE_ASSIST ? 'Live Session' : activeTab === AppMode.DISPATCH ? 'Dispatch Active' : 'Master Tech Connected'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>

      {/* Persistent Navigation */}
      <nav className="bg-white border-t border-slate-200 pb-safe fixed bottom-0 left-0 right-0 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] overflow-x-auto">
        <div className="max-w-4xl mx-auto flex justify-around p-2 min-w-[420px]">
          <button 
            onClick={() => setActiveTab(AppMode.DIAGNOSE)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === AppMode.DIAGNOSE ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span className="text-[10px] font-bold uppercase tracking-wider">Diagnose</span>
          </button>

          <button 
            onClick={() => setActiveTab(AppMode.DISPATCH)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === AppMode.DISPATCH ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span className="text-[10px] font-bold uppercase tracking-wider">Dispatch</span>
          </button>

          <button 
            onClick={() => setActiveTab(AppMode.LIVE_ASSIST)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === AppMode.LIVE_ASSIST ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
          </button>
          
          <button 
            onClick={() => setActiveTab(AppMode.MAPS)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === AppMode.MAPS ? 'text-slate-900 bg-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            <span className="text-[10px] font-bold uppercase tracking-wider">Shops</span>
          </button>

          <button 
            onClick={() => setActiveTab(AppMode.VISUALIZE)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === AppMode.VISUALIZE ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            <span className="text-[10px] font-bold uppercase tracking-wider">Studio</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
