
import React, { useState, useEffect } from 'react';

interface Tech {
  id: number;
  name: string;
  lat: number;
  lng: number;
  rating: number;
  eta: number;
  type: 'auto' | 'bike';
}

export const DispatchMap: React.FC = () => {
  const [status, setStatus] = useState<'browsing' | 'requesting' | 'dispatched' | 'arriving'>('browsing');
  const [selectedTech, setSelectedTech] = useState<Tech | null>(null);
  const [techs, setTechs] = useState<Tech[]>([]);

  useEffect(() => {
    // Simulated technician locations around the user
    const mockTechs: Tech[] = [
      { id: 1, name: 'Mike (Master Tech)', lat: 35, lng: 35, rating: 4.9, eta: 8, type: 'auto' },
      { id: 2, name: 'Sarah (Bike Specialist)', lat: 65, lng: 25, rating: 4.8, eta: 12, type: 'bike' },
      { id: 3, name: 'John (Roadside Pro)', lat: 25, lng: 75, rating: 5.0, eta: 5, type: 'auto' },
    ];
    setTechs(mockTechs);
  }, []);

  const handleRequest = () => {
    setStatus('requesting');
    setTimeout(() => {
      setStatus('dispatched');
      setSelectedTech(techs[2]); // Pick the closest one for demo
    }, 2500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full relative bg-slate-900 overflow-hidden">
      {/* Map Background (Mock) */}
      <div className="absolute inset-0 z-0 bg-slate-800 opacity-50">
        <div className="w-full h-full relative overflow-hidden">
           {/* Grid lines to simulate map */}
           <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
           
           {/* User pulse */}
           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
           </div>

           {/* Tech markers */}
           {status === 'browsing' && techs.map(tech => (
             <div 
               key={tech.id}
               className="absolute transition-all duration-700 -translate-x-1/2 -translate-y-full"
               style={{ left: `${tech.lat}%`, top: `${tech.lng}%` }}
             >
                <div className="relative group cursor-pointer pointer-events-auto">
                  {/* Marker Pin Shadow */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/40 blur-[2px] rounded-full"></div>
                  
                  {/* High Visibility Marker */}
                  <div className="bg-white p-1 rounded-full shadow-2xl flex items-center gap-2 border-2 border-slate-900 animate-bounce pr-3">
                    <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-sm">
                      {tech.type === 'auto' ? '🚗' : '🚲'}
                    </div>
                    <div className="flex flex-col leading-none">
                      <span className="text-[14px] font-black text-slate-900">{tech.eta}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">min</span>
                    </div>
                  </div>
                  
                  {/* Tail/Indicator */}
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-900 mx-auto -mt-1"></div>
                </div>
             </div>
           ))}

           {status === 'dispatched' && selectedTech && (
             <div className="absolute transition-all duration-1000 ease-linear -translate-x-1/2 -translate-y-full" style={{ left: '50%', top: '48%' }}>
                <div className="bg-green-500 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 animate-pulse border-2 border-white">
                   <span className="text-xs font-black uppercase tracking-tighter">Tech On Way</span>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Interface Overlays */}
      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        <div className="p-4">
           <div className="bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl pointer-events-auto border border-slate-200">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-slate-800">Your Current Location</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Automatic dispatch ready</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="mt-auto p-4 space-y-4">
           {status === 'browsing' && (
             <div className="bg-white rounded-3xl p-6 shadow-2xl pointer-events-auto space-y-4 animate-in slide-in-from-bottom-10 duration-500">
                <div className="flex justify-between items-center">
                   <div>
                      <h2 className="text-xl font-bold text-slate-800">Request Repairman</h2>
                      <p className="text-xs text-slate-500">Nearest tech is 5 minutes away</p>
                   </div>
                   <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-600">3 AVAILABLE</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 border-2 border-slate-900 rounded-2xl p-3 flex flex-col items-center gap-2 transition-all">
                      <span className="text-2xl">🚗</span>
                      <span className="text-[10px] font-bold">Auto Repair</span>
                      <span className="text-xs font-bold text-blue-600">$49.00 Flat</span>
                   </div>
                   <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center gap-2 opacity-50">
                      <span className="text-2xl">🚲</span>
                      <span className="text-[10px] font-bold">Bike Repair</span>
                      <span className="text-xs font-bold text-blue-600">$29.00 Flat</span>
                   </div>
                </div>

                <button 
                  onClick={handleRequest}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl shadow-slate-300 hover:bg-slate-800 active:scale-95 transition-all"
                >
                   Request On-Site Assistance
                </button>
             </div>
           )}

           {status === 'requesting' && (
             <div className="bg-white rounded-3xl p-8 shadow-2xl pointer-events-auto text-center space-y-6">
                <div className="relative w-20 h-20 mx-auto">
                   <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div>
                   <h2 className="text-xl font-bold text-slate-800">Finding Your Technician</h2>
                   <p className="text-sm text-slate-500">Connecting to the nearest available Master Tech...</p>
                </div>
             </div>
           )}

           {status === 'dispatched' && selectedTech && (
             <div className="bg-white rounded-3xl p-6 shadow-2xl pointer-events-auto space-y-6 animate-in slide-in-from-bottom-10 duration-500">
                <div className="flex items-center justify-between border-b pb-4">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl border-4 border-white shadow-lg overflow-hidden">
                         👤
                      </div>
                      <div>
                         <h2 className="text-lg font-bold text-slate-800">{selectedTech.name}</h2>
                         <div className="flex items-center gap-1">
                            <span className="text-yellow-400 text-xs">★</span>
                            <span className="text-xs font-bold text-slate-600">{selectedTech.rating}</span>
                         </div>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-2xl font-black text-slate-900">{selectedTech.eta}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MINS</div>
                   </div>
                </div>

                <div className="flex gap-4">
                   <button className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 005.516 5.516l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
                      Call Tech
                   </button>
                   <button className="w-16 bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                   </button>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl flex items-center gap-3">
                   <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs">ℹ️</div>
                   <p className="text-[10px] text-blue-800 leading-tight">Your tech is en route with specialized tools for your <b>auto repair</b>. Please stay in your safe location.</p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
