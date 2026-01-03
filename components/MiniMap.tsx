import React, { useMemo } from 'react';
import { Vector3 } from 'three';
import { Market } from '../types';

interface MiniMapProps {
    shipPosition: Vector3;
    markets: Market[];
}

export const MiniMap: React.FC<MiniMapProps> = ({ shipPosition, markets }) => {
    // Радіус радару в ігрових одиницях
    const RANGE = 150; 
    // Розмір віджета в пікселях
    const SIZE = 200;

    // Фільтруємо і перетворюємо координати для 2D відображення
    const visibleBlips = useMemo(() => {
        return markets.map(market => {
            // Відносна позиція (Корабель завжди в центрі [0,0])
            const relX = market.coordinates[0] - shipPosition.x;
            const relZ = market.coordinates[2] - shipPosition.z; // Z в 3D = Y на 2D карті

            // Дистанція
            const dist = Math.sqrt(relX * relX + relZ * relZ);

            // Якщо поза радіусом - не показуємо (або можна "приклеювати" до краю)
            if (dist > RANGE) return null;

            // Мапимо в % (50% = центр)
            const left = 50 + (relX / RANGE) * 50;
            const top = 50 + (relZ / RANGE) * 50;

            return { id: market.id, left, top, color: market.color };
        }).filter(Boolean);
    }, [shipPosition, markets]);

    return (
        <div className="relative w-48 h-48 md:w-56 md:h-56">
            {/* Radar Container */}
            <div className="absolute inset-0 rounded-full bg-black/80 border border-cosmos-cyan/30 backdrop-blur-sm overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                
                {/* Grid Lines */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,transparent_60%,#00f0ff_60%,#00f0ff_61%,transparent_61%)]"></div>
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cosmos-cyan/20"></div>
                <div className="absolute left-1/2 top-0 h-full w-[1px] bg-cosmos-cyan/20"></div>

                {/* Radar Sweep Animation */}
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,240,255,0.1)_60deg,transparent_60deg)] animate-[spin_4s_linear_infinite] rounded-full origin-center"></div>

                {/* Ship Indicator (Center) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-cosmos-cyan shadow-[0_0_10px_white] z-10"></div>
                {/* Ship Direction Field of View */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[60px] border-b-white/5 pointer-events-none origin-bottom"></div>

                {/* Market Blips */}
                {visibleBlips.map((blip: any) => (
                    <div 
                        key={blip.id}
                        className="absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                        style={{ 
                            left: `${blip.left}%`, 
                            top: `${blip.top}%`,
                            backgroundColor: blip.color || '#fff',
                            boxShadow: `0 0 6px ${blip.color}`
                        }}
                    />
                ))}
            </div>
            
            <div className="absolute -bottom-6 w-full text-center text-[10px] font-mono text-cosmos-cyan/70 tracking-widest">
                RADAR: ACTIVE
            </div>
        </div>
    );
};