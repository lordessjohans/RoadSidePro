
import React, { useState, useEffect } from 'react';
import { getDailyDeals } from '../services/geminiService';
import { ChatInterface } from './ChatInterface';
import { AppMode } from '../types';

interface Deal {
  title: string;
  description: string;
  url: string;
}

export const PartsShop: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await getDailyDeals();
        const text = response.text || "";
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        // Simple heuristic to extract items from the grounded response
        // In a production app, we'd use a more robust parser or specific schema.
        const lines = text.split('\n').filter(l => l.trim().length > 10);
        const extractedDeals: Deal[] = [];
        
        const urls = groundingChunks?.map((c: any) => c.web?.uri).filter(Boolean) || [];

        lines.slice(0, 5).forEach((line, idx) => {
          extractedDeals.push({
            title: line.split(':')[0] || "Featured Part",
            description: line.substring(line.indexOf(':') + 1).trim(),
            url: urls[idx] || urls[0] || "#"
          });
        });

        setDeals(extractedDeals);
      } catch (err) {
        console.error("Failed to fetch daily deals", err);
      } finally {
        setLoadingDeals(false);
      }
    };

    fetchDeals();
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full overflow-hidden bg-slate-50">
      {/* Daily Deals Section */}
      <div className="bg-white border-b border-slate-200 p-4 shrink-0 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-amber-100 text-amber-600 p-1.5 rounded-lg">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z"></path></svg>
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">AI Daily Deal Finder</h3>
          <span className="text-[10px] font-bold text-amber-500 animate-pulse bg-amber-50 px-2 py-0.5 rounded-full ml-auto">UPDATED DAILY</span>
        </div>

        <div className="flex gap-4 min-w-max pb-2">
          {loadingDeals ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="w-64 h-24 bg-slate-100 rounded-2xl animate-pulse"></div>
            ))
          ) : (
            deals.map((deal, i) => (
              <a 
                key={i} 
                href={deal.url} 
                target="_blank" 
                className="w-72 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 truncate mb-1">{deal.title}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2 whitespace-normal leading-tight">{deal.description}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">BEST PRICE</span>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </div>
              </a>
            ))
          )}
        </div>
      </div>

      {/* Main Shop Interface */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ChatInterface mode={AppMode.MAPS} />
      </div>
    </div>
  );
};
