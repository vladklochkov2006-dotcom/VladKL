import React, { Suspense, useState, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { Vector3 } from 'three';
import { Market } from '../types';
import { Planet } from './Planet';
import { Spaceship } from './Spaceship';
import { AsteroidField } from './AsteroidField';
// import { Perf } from 'r3f-perf'; // Рекомендую розкоментувати для дебагу FPS

interface UniverseSceneProps {
  markets: Market[];
  onSelectMarket: (market: Market) => void;
  selectedMarketId: string | null;
  onProximityChange: (market: Market | null) => void;
  onShipMove?: (pos: Vector3) => void;
}

interface SceneContentProps extends UniverseSceneProps {
    onCollision: () => void;
}

const SceneContent: React.FC<SceneContentProps> = ({ 
    markets, 
    onSelectMarket, 
    selectedMarketId, 
    onProximityChange, 
    onCollision, 
    onShipMove 
}) => {
    // ⚡ OPTIMIZATION: Використовуємо Ref для позиції, щоб не тригерити ре-рендер React дерева
    const shipPosRef = useRef(new Vector3(0, 0, 0));
    const [isWarping, setIsWarping] = useState(false);
    const lastNearestRef = useRef<string | null>(null);
    
    // Для оновлення батьківського UI (HUD) використовуємо тротлінг,
    // щоб React оновлювався не частіше 10 разів на сек, а не 60.
    const lastHudUpdate = useRef(0);

    const handleShipPosition = useCallback((pos: Vector3) => {
        shipPosRef.current.copy(pos);
        
        const now = Date.now();
        if (onShipMove && now - lastHudUpdate.current > 100) { // 100ms throttle
            onShipMove(pos);
            lastHudUpdate.current = now;
        }
    }, [onShipMove]);

    const handleWarpToggle = useCallback((warping: boolean) => {
        setIsWarping(warping);
    }, []);

    // Physics & Logic Loop
    useFrame(() => {
        // Оптимізація пошуку найближчого ринку
        let nearest: Market | null = null;
        let minDistSq = 25 * 25; // Порівнюємо квадрати відстані (швидше, ніж Math.sqrt)

        const shipX = shipPosRef.current.x;
        const shipY = shipPosRef.current.y;
        const shipZ = shipPosRef.current.z;

        // Простий цикл for швидший за map/reduce
        for (let i = 0; i < markets.length; i++) {
            const m = markets[i];
            const dx = m.coordinates[0] - shipX;
            const dy = m.coordinates[1] - shipY;
            const dz = m.coordinates[2] - shipZ;
            const distSq = dx*dx + dy*dy + dz*dz;
            
            if (distSq < minDistSq) {
                minDistSq = distSq;
                nearest = m;
            }
        }

        if (nearest?.id !== lastNearestRef.current) {
            lastNearestRef.current = nearest ? nearest.id : null;
            onProximityChange(nearest);
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 10, 30]} />
            
            {/* Lighting */}
            <ambientLight intensity={0.4} /> {/* Трохи темніше для контрасту */}
            <directionalLight position={[10, 20, 10]} intensity={1.5} color="#ffffff" castShadow />
            <pointLight position={[-50, -50, -50]} intensity={1.0} color="#bc13fe" distance={200} />
            <pointLight position={[50, 50, 50]} intensity={1.0} color="#00f0ff" distance={200} />
            
            {/* ⚡ OPTIMIZATION: Фіксована кількість зірок. Змінюємо лише швидкість/розмір, а не count */}
            <Stars 
                radius={200} 
                depth={100} 
                count={10000} // Фіксовано
                factor={6} 
                saturation={0.5} 
                fade 
                speed={isWarping ? 5 : 1} // Лише змінюємо швидкість
            />

            <AsteroidField shipPosition={shipPosRef.current} onCollision={onCollision} />
            
            <Spaceship onPositionChange={handleShipPosition} onWarpToggle={handleWarpToggle} />
            
            {/* Planets Rendering */}
            {markets.map((market) => (
                <Planet 
                    key={market.id} 
                    market={market} 
                    onSelect={onSelectMarket}
                    isSelected={selectedMarketId === market.id}
                    // Ми більше не передаємо точну distanceToShip сюди, щоб не ре-рендерити
                    // Планета сама може перевірити дистанцію, якщо їй треба (через ref), 
                    // або ми передаємо shipPosRef.current (але обережно з ре-рендерами)
                    // Для MVP поки залишимо як є, але майте на увазі - це місце для оптимізації №2
                    distanceToShip={0} // Placeholder, краще рахувати всередині Planet або ігнорувати
                />
            ))}

            {/* ✨ GAME JUICE: Пост-обробка для "кіношного" вигляду */}
            <EffectComposer disableNormalPass>
                <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.6} />
                <Vignette eskil={false} offset={0.1} darkness={0.6} />
                <Noise opacity={0.05} />
            </EffectComposer>
        </>
    );
}

export const UniverseScene: React.FC<UniverseSceneProps> = (props) => {
  const [isHit, setIsHit] = useState(false);
  const hitTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const handleCollision = useCallback(() => {
    // Debounce collision UI update
    if (hitTimeout.current) return;
    
    setIsHit(true);
    hitTimeout.current = setTimeout(() => {
        setIsHit(false);
        hitTimeout.current = null;
    }, 800);
  }, []);

  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-cosmos-dark select-none">
      {/* Collision Overlay - Optimized with CSS Animation classes logic ideally */}
      {isHit && (
         <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center animate-pulse">
            <div className="absolute inset-0 bg-red-600/20 mix-blend-overlay" />
            <div className="bg-black/80 px-10 py-6 rounded border-2 border-red-500 backdrop-blur-xl shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                <div className="text-red-500 font-bold text-5xl tracking-[0.2em] uppercase text-center drop-shadow-lg">
                    Warning
                </div>
                <div className="text-red-300 text-center mt-2 tracking-widest text-sm uppercase">Shield Integrity Critical</div>
            </div>
         </div>
      )}

      <Canvas dpr={[1, 2]} gl={{ antialias: false, toneMappingExposure: 1.1 }}>
        <color attach="background" args={['#050810']} /> {/* Deep space black */}
        <fog attach="fog" args={['#050810', 40, 400]} />
        {/* <Perf position="top-left" /> */}
        <Suspense fallback={null}>
            <SceneContent {...props} onCollision={handleCollision} />
        </Suspense>
      </Canvas>
    </div>
  );
};