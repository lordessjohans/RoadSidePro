
import React from 'react';

interface KeySelectionGateProps {
  onKeySelected: () => void;
  title: string;
  description: string;
}

export const KeySelectionGate: React.FC<KeySelectionGateProps> = ({ onKeySelected, title, description }) => {
  const handleSelectKey = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      onKeySelected();
    } catch (e) {
      console.error("Failed to open key selector", e);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md mx-auto my-12 text-center">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <p className="text-slate-600 mb-8">{description}</p>
      <div className="bg-blue-50 p-4 rounded-lg mb-8 text-sm text-blue-800">
        <p>This feature requires a selected API key from a paid GCP project. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline font-semibold">View billing docs</a></p>
      </div>
      <button 
        onClick={handleSelectKey}
        className="w-full bg-slate-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
      >
        Select API Key to Unlock
      </button>
    </div>
  );
};
