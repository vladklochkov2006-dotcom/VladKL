import React, { useMemo } from 'react';
import { Market } from '../types';
import { X, TrendingUp, Users, Activity, Clock, AlertCircle } from 'lucide-react';

interface MarketPanelProps {
  market: Market | null;
  onClose: () => void;
  onScan: () => void;
  isScanned: boolean;
}

// Простий компонент для малювання випадкового графіка (Sparkline)
const MockChart: React.FC<{ color: string }> = ({ color }) => {
    const points = useMemo(() => {
        let data = "M0,50 ";
        let y = 50;
        for(let x=0; x<=100; x+=5) {
            y += (Math.random() - 0.5) * 30;
            y = Math.max(10, Math.min(90, y)); // Clamp inside box
            data += `L${x * 3},${y} `;
        }
        return data;
    }, []);

    return (
        <div className="h-24 w-full bg-black/20 rounded-lg border border-white/5 overflow-hidden relative mb-4">
            <svg viewBox="0 0 300 100" className="w-full h-full preserve-3d">
                <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.5"/>
                        <stop offset="100%" stopColor={color} stopOpacity="0"/>
                    </linearGradient>
                </defs>
                <path d={points + "V100 H0 Z"} fill="url(#chartGradient)" />
                <path d={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="absolute top-2 right-2 text-[10px] text-white/50 font-mono">24H TREND</div>
        </div>
    );
};

export const MarketPanel: React.FC<MarketPanelProps> = ({ market, onClose, onScan, isScanned }) => {
  if (!market) return null;

  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = 100 - yesPercent;
  
  // Визначаємо колір теми на основі категорії (фоллбек на cyan)
  const themeColor = market.color || '#00f0ff';

  return (
    <div className="absolute top-0 right-0 h-full w-full md:w-[450px] bg-black/60 backdrop-blur-2xl border-l border-white/10 z-20 flex flex-col font-rajdhani shadow-[-20px_0_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-300">
      
      {/* HEADER */}
      <div className="p-6 pb-2 flex justify-between items-start">
         <div className="flex flex-col gap-1">
            <div 
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border"
                style={{ borderColor: themeColor, color: themeColor, backgroundColor: `${themeColor}20` }}
            >
                {market.category} SECTOR
            </div>
            <div className="text-[10px] text-gray-500 font-mono tracking-widest">ID: {market.id.toUpperCase()}</div>
         </div>
         <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
         >
            <X className="w-6 h-6" />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/40">
        
        {/* QUESTION */}
        <h2 className="text-2xl font-bold font-orbitron text-white leading-tight mb-6 drop-shadow-md">
            {market.question}
        </h2>

        {/* CHART */}
        <MockChart color={themeColor} />

        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/5 p-3 rounded border border-white/5 hover:border-white/20 transition-colors">
                <div className="text-gray-400 text-xs flex items-center gap-1 mb-1 font-orbitron">
                    <Activity className="w-3 h-3" /> VOL
                </div>
                <div className="text-lg font-bold text-white tracking-wider">${market.volume.toLocaleString()}</div>
            </div>
            <div className="bg-white/5 p-3 rounded border border-white/5 hover:border-white/20 transition-colors">
                <div className="text-gray-400 text-xs flex items-center gap-1 mb-1 font-orbitron">
                    <Clock className="w-3 h-3" /> ENDS
                </div>
                <div className="text-lg font-bold text-white tracking-wider text-sm truncate">
                    {market.endDate}
                </div>
            </div>
        </div>

        {/* PREDICTION BARS */}
        <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="flex justify-between text-sm font-bold mb-3 font-orbitron">
                <span className="text-cosmos-green drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]">YES {yesPercent}%</span>
                <span className="text-cosmos-red drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]">NO {noPercent}%</span>
            </div>
            <div className="h-6 bg-gray-900 rounded overflow-hidden flex relative ring-1 ring-white/10">
                <div 
                    className="bg-gradient-to-r from-green-900 to-cosmos-green h-full relative" 
                    style={{ width: `${yesPercent}%` }}
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay"></div>
                </div>
                <div 
                    className="bg-gradient-to-l from-red-900 to-cosmos-red h-full relative" 
                    style={{ width: `${noPercent}%` }}
                >
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay"></div>
                </div>
                
                {/* Center Divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 -translate-x-1/2"></div>
            </div>
            <div className="mt-2 text-[10px] text-center text-gray-500">Market Consensus</div>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed border-l-2 border-white/10 pl-4 mb-6">
            {market.description}
        </p>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-6 border-t border-white/10 bg-black/40">
        <button
            onClick={onScan}
            disabled={isScanned}
            className={`w-full py-4 rounded font-orbitron font-bold text-sm tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 relative overflow-hidden group
                ${isScanned 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5' 
                    : 'bg-white text-black hover:bg-cosmos-cyan hover:text-black hover:shadow-[0_0_30px_rgba(0,240,255,0.6)]'
                }
            `}
        >
            {isScanned ? (
                <>
                    <AlertCircle className="w-4 h-4" /> Data Uploaded
                </>
            ) : (
                <>
                    <TrendingUp className="w-4 h-4" /> 
                    <span>Analyze Market</span>
                </>
            )}
            
            {/* Hover shine effect */}
            {!isScanned && (
                <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg] group-hover:animate-[shine_1s_ease-in-out_infinite]" />
            )}
        </button>

        {isScanned && (
             <div className="mt-3 text-center text-xs text-cosmos-cyan font-mono animate-pulse">
                // TRANSACTION VERIFIED // +50 XP
             </div>
        )}
      </div>
    </div>
  );
};