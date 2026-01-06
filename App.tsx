import React, { useState, useEffect, useRef } from 'react';
import { generateMarkets, getRankTitle } from './services/marketService';
import { Market, Quest, UserState } from './types';
import { UniverseScene } from './components/UniverseScene';
import { HUD } from './components/HUD';
import { MarketPanel } from './components/MarketPanel';
import { Rocket, Gamepad2, Scan } from 'lucide-react';
import { Vector3 } from 'three';

const INITIAL_QUESTS: Quest[] = [
  { id: 'q1', title: 'Void Explorer', description: 'Fly to and analyze 3 different markets.', target: 3, progress: 0, completed: false, reward: 150, type: 'explore' },
  { id: 'q2', title: 'Whale Watcher', description: 'Find a market with over $500k volume.', target: 1, progress: 0, completed: false, reward: 300, type: 'explore' }
];

export default function App() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [nearestMarket, setNearestMarket] = useState<Market | null>(null);
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  
  // 🔥 ФІКС: Ініціалізуємо об'єкт відразу з Vector3, щоб MiniMap не отримував undefined
  const shipSyncRef = useRef({ 
    position: new Vector3(0, 0, 0), 
    rotation: 0 
  });
  
  const shipPositionRef = useRef(new Vector3(0, 0, 0));

  const [userState, setUserState] = useState<UserState>({ level: 1, points: 0, title: 'Rookie Rover', scannedMarkets: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => { 
      setMarkets(generateMarkets(50)); 
      setIsLoading(false); 
    }, 1500);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
        if ((e.code === 'KeyE' || e.code === 'Enter') && nearestMarket) handleSelectMarket(nearestMarket);
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nearestMarket]);

  // Функція оновлення даних корабля
  const handleShipMove = (pos: Vector3, rotation: number) => {
      if (shipSyncRef.current) {
          shipSyncRef.current.position.copy(pos);
          shipSyncRef.current.rotation = rotation;
      }
      if (shipPositionRef.current) {
          shipPositionRef.current.copy(pos);
      }
  };

  const selectedMarket = markets.find(m => m.id === selectedMarketId) || null;
  const handleSelectMarket = (market: Market) => setSelectedMarketId(market.id);
  const handleClosePanel = () => setSelectedMarketId(null);

  const handleScanMarket = () => {
    if (!selectedMarket || userState.scannedMarkets.includes(selectedMarket.id)) return;
    const newPoints = userState.points + 50;
    const newTitle = getRankTitle(newPoints);
    const newScanned = [...userState.scannedMarkets, selectedMarket.id];
    setUserState(prev => ({ ...prev, points: newPoints, title: newTitle, scannedMarkets: newScanned }));
    setQuests(prevQuests => prevQuests.map(q => {
      if (q.completed) return q;
      let newProgress = q.progress;
      if (q.id === 'q1') newProgress += 1;
      else if (q.id === 'q2' && selectedMarket.volume > 500000) newProgress = 1;
      return { ...q, progress: newProgress, completed: newProgress >= q.target };
    }));
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-cosmos-dark flex flex-col items-center justify-center text-white font-orbitron">
        <Rocket className="w-12 h-12 text-cosmos-cyan animate-bounce mb-4" />
        <div className="text-xl tracking-widest animate-pulse">INITIALIZING WARP DRIVE...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-cosmos-dark text-white">
      <UniverseScene 
        markets={markets} 
        onSelectMarket={handleSelectMarket}
        selectedMarketId={selectedMarketId}
        onProximityChange={setNearestMarket}
        onShipMove={handleShipMove}
        shipPositionRef={shipPositionRef}
      />
      
      <HUD 
        userState={userState} 
        quests={quests} 
        shipSyncRef={shipSyncRef}
        markets={markets} 
      />
      
      {/* Flight Controls UI */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none select-none">
        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-lg text-white font-rajdhani shadow-lg max-w-[320px]">
            <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
            <Gamepad2 className="text-cosmos-cyan w-4 h-4" />
            <span className="font-bold text-cosmos-cyan tracking-widest text-sm">FLIGHT CONTROLS</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] text-gray-300 font-mono">
                <div className="flex items-center justify-between">
                    <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold border border-white/10">SPACE</span>
                    <span className="text-orange-400 font-bold drop-shadow-[0_0:5px_rgba(255,165,0,0.8)]">THRUST</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold border border-white/10">SHIFT</span>
                    <span className="text-red-400 font-bold">BRAKE</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold border border-white/10">W / S</span>
                    <span className="text-gray-400">PITCH</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold border border-white/10">A / D</span>
                    <span className="text-gray-400">TURN</span>
                </div>
                <div className="col-span-2 flex items-center justify-between mt-1 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1">
                        <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold border border-white/10">LMB</span>
                        <span className="text-[9px] opacity-50">(MOUSE)</span>
                    </div>
                    <span className="text-fuchsia-400 font-bold drop-shadow-[0_0:8px_rgba(255,0,255,0.8)]">WARP DRIVE</span>
                </div>
            </div>
        </div>
      </div>

      {nearestMarket && !selectedMarket && (
         <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-cosmos-panel border border-cosmos-cyan p-4 rounded-xl flex items-center gap-4 animate-bounce shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                <div className="w-10 h-10 rounded-full bg-cosmos-cyan/20 flex items-center justify-center text-cosmos-cyan"><Scan className="w-6 h-6" /></div>
                <div>
                    <div className="text-cosmos-cyan font-bold font-orbitron text-sm">TARGET LOCK: {nearestMarket.category}</div>
                    <div className="text-white text-xs font-rajdhani">Press <kbd className="bg-white/20 px-1 rounded">E</kbd> to Access Market Data</div>
                </div>
            </div>
         </div>
      )}
      
      <MarketPanel 
        market={selectedMarket} 
        onClose={handleClosePanel} 
        onScan={handleScanMarket} 
        isScanned={selectedMarketId ? userState.scannedMarkets.includes(selectedMarketId) : false} 
      />
    </div>
  );
}