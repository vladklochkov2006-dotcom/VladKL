import React, { useState, useEffect, useCallback } from 'react';
import { getMarkets, getRankTitle } from './services/marketService';
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
  const [shipPosition, setShipPosition] = useState<Vector3>(new Vector3(0,0,0));
  const [isLoading, setIsLoading] = useState(true);
  
  const [userState, setUserState] = useState<UserState>({
    level: 1,
    points: 0,
    title: 'Rookie Rover',
    scannedMarkets: []
  });

  // Ініціалізація даних
  useEffect(() => {
    const initData = async () => {
      try {
        const data = await getMarkets();
        setMarkets(data);
      } catch (error) {
        console.error("Failed to load universe:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  // --- СИСТЕМА СТАБІЛІЗАЦІЇ ВСЕСВІТУ (Floating Origin) ---
  const handleShipMove = useCallback((newPos: Vector3) => {
    // Якщо гравець відлетів далі ніж на 2000 одиниць
    if (newPos.length() > 2000) {
      const shift = newPos.clone(); // Вектор зміщення
      
      // 1. Зміщуємо позиції всіх ринків у протилежному напрямку
      setMarkets(prevMarkets => prevMarkets.map(m => ({
        ...m,
        position: [m.position[0] - shift.x, m.position[1] - shift.y, m.position[2] - shift.z]
      })));

      // 2. Корабель фактично "телепортується" в 0,0,0
      setShipPosition(new Vector3(0, 0, 0));
      
      console.log("🚀 Universe Recalibrated: Origin Shift Performed");
    } else {
      setShipPosition(newPos);
    }
  }, []);

  // Керування клавішею взаємодії
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.code === 'KeyE' || e.code === 'Enter') && nearestMarket) {
        handleSelectMarket(nearestMarket);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nearestMarket]);

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
        <div className="text-xs font-rajdhani text-gray-500 mt-2">Floating Origin Stabilizer: ON</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-cosmos-dark">
      <UniverseScene 
        markets={markets} 
        onSelectMarket={handleSelectMarket}
        selectedMarketId={selectedMarketId}
        onProximityChange={setNearestMarket}
        onShipMove={handleShipMove} // Використовуємо наш новий стабілізатор
      />
      
      <HUD 
        userState={userState} 
        quests={quests} 
        shipPosition={shipPosition}
        markets={markets}
      />
      
      {/* Flight Controls UI */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none select-none opacity-80">
        <div className="bg-black/60 backdrop-blur-md p-4 rounded-lg border border-white/10 text-white/70 font-rajdhani">
            <div className="flex items-center gap-2 mb-2 text-cosmos-cyan font-bold uppercase text-[10px] tracking-tighter">
                <Gamepad2 className="w-3 h-3" /> Navigation Core
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                <span><kbd className="bg-white/10 px-1 rounded text-white">W/S</kbd> Pitch</span>
                <span><kbd className="bg-white/10 px-1 rounded text-white">A/D</kbd> Turn</span>
                <span><kbd className="bg-white/10 px-1 rounded text-white">SPACE</kbd> Thrust</span>
                <span><kbd className="bg-white/10 px-1 rounded text-white">SHIFT</kbd> Warp</span>
            </div>
        </div>
      </div>

      {/* Target Detection UI */}
      {nearestMarket && !selectedMarket && (
         <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 animate-in fade-in zoom-in duration-300">
            <div className="bg-black/80 border border-cosmos-cyan/50 p-4 rounded-xl flex items-center gap-4 shadow-[0_0_30px_rgba(0,240,255,0.2)] backdrop-blur-md">
                <Scan className="w-6 h-6 text-cosmos-cyan animate-pulse" />
                <div>
                    <div className="text-cosmos-cyan font-bold font-orbitron text-[10px] tracking-widest">SIGNAL DETECTED</div>
                    <div className="text-white text-lg font-bold leading-tight">{nearestMarket.category}</div>
                    <div className="text-white/40 text-[10px] mt-1 italic">Press E to link systems</div>
                </div>
            </div>
         </div>
      )}
      
      {selectedMarket && (
        <MarketPanel 
            market={selectedMarket} 
            onClose={handleClosePanel}
            onScan={handleScanMarket}
            isScanned={userState.scannedMarkets.includes(selectedMarket.id)}
        />
      )}
    </div>
  );
}