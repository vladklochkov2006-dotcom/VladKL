import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3, DoubleSide, Color } from 'three';
import { Html, Sphere, MeshDistortMaterial, GradientTexture } from '@react-three/drei';
import { Market } from '../types';

interface PlanetProps {
  market: Market;
  onSelect: (market: Market) => void;
  isSelected: boolean;
  distanceToShip?: number;
}

export const Planet: React.FC<PlanetProps> = ({ market, onSelect, isSelected, distanceToShip }) => {
  const meshRef = useRef<Mesh>(null);
  const atmosphereRef = useRef<Mesh>(null);
  const cloudsRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Randomize planet traits based on ID (deterministic)
  const traits = useMemo(() => {
    const idNum = parseInt(market.id.split('-')[1]);
    return {
      hasRings: idNum % 3 === 0,
      isGasGiant: idNum % 2 === 0,
      rotationSpeed: (Math.random() * 0.5 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
      textureNoise: Math.random()
    };
  }, [market.id]);

  // Scale planet based on volume (logarithmic scale)
  const scale = Math.max(1.5, Math.log10(market.volume) / 2.5);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * traits.rotationSpeed * 0.2;
    }
    // Rotate clouds/atmosphere separately
    if (cloudsRef.current) {
        cloudsRef.current.rotation.y += delta * traits.rotationSpeed * 0.25;
        cloudsRef.current.rotation.z += delta * 0.05;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y -= delta * traits.rotationSpeed * 0.1;
    }
  });

  const glowColor = market.yesPrice > 0.5 ? '#0aff68' : '#ff2a2a';
  const isNearby = distanceToShip !== undefined && distanceToShip < 20;

  // Generate band colors for gas giants
  const bandColors = useMemo(() => {
     const base = new Color(market.color);
     return [
         base.clone().multiplyScalar(0.8).getStyle(),
         base.clone().multiplyScalar(1.2).getStyle(),
         base.clone().multiplyScalar(0.6).getStyle(),
         base.clone().getStyle()
     ];
  }, [market.color]);

  return (
    <group position={new Vector3(...market.coordinates)}>
      
      {traits.isGasGiant ? (
         // --- GAS GIANT VISUALS ---
         <Sphere args={[1, 64, 64]} ref={meshRef} scale={[scale, scale, scale]} onClick={(e) => { e.stopPropagation(); onSelect(market); }}>
            <MeshDistortMaterial
                color={market.color}
                envMapIntensity={0.6}
                clearcoat={0.3}
                clearcoatRoughness={0}
                metalness={0.2}
                distort={0.4} // Significant distortion for gas fluid look
                speed={2}
            >
                {/* Gradient Texture for Bands */}
                <GradientTexture
                    stops={[0, 0.4, 0.6, 1]} 
                    colors={bandColors} 
                    size={1024} 
                />
            </MeshDistortMaterial>
         </Sphere>
      ) : (
        // --- TERRESTRIAL PLANET VISUALS ---
        <group onClick={(e) => { e.stopPropagation(); onSelect(market); }}>
            {/* Core Surface */}
            <Sphere args={[1, 64, 64]} ref={meshRef} scale={[scale, scale, scale]}>
                <meshStandardMaterial
                    color={market.color}
                    roughness={0.9}
                    metalness={0.1}
                />
            </Sphere>
            
            {/* Dynamic Cloud/Surface Layer */}
            <Sphere args={[1.02, 64, 64]} ref={cloudsRef} scale={[scale, scale, scale]}>
                 <MeshDistortMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.4}
                    distort={0.3} // Subtle shifting patterns
                    speed={1.5}
                    roughness={0.2}
                 />
            </Sphere>
        </group>
      )}

      {/* Atmosphere Glow (Common) */}
      <mesh ref={atmosphereRef} scale={[scale * 1.25, scale * 1.25, scale * 1.25]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={glowColor}
          transparent
          opacity={0.1}
          side={DoubleSide}
          blending={2}
          depthWrite={false}
        />
      </mesh>

      {/* Rings (Common) */}
      {traits.hasRings && (
        <mesh rotation={[Math.PI / 2.5, 0, 0]} scale={[scale, scale, scale]}>
          <ringGeometry args={[1.4, 2.4, 128]} />
          <meshStandardMaterial 
            color={market.color} 
            transparent 
            opacity={0.5} 
            side={DoubleSide} 
            roughness={0.6}
            metalness={0.4}
          />
        </mesh>
      )}
      
      {/* Floating UI */}
      {(hovered || isSelected || isNearby) && (
        <Html distanceFactor={40}>
          <div className={`transition-all duration-300 ${isSelected ? 'scale-110' : 'scale-100'}`}>
            <div className="bg-black/60 backdrop-blur-md border border-white/20 p-3 rounded-lg text-white w-56 font-rajdhani shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-cosmos-cyan tracking-wider">{market.category}</span>
                    {isNearby && <span className="text-[10px] bg-cosmos-purple px-1 rounded animate-pulse">IN RANGE</span>}
                </div>
                <div className="text-sm font-semibold leading-tight mb-2 shadow-black drop-shadow-md">{market.question.substring(0, 50)}...</div>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-300">
                    <div className="bg-white/10 rounded px-1 py-0.5 text-center">
                        VOL: ${(market.volume / 1000).toFixed(0)}k
                    </div>
                    <div className="bg-white/10 rounded px-1 py-0.5 text-center" style={{ color: glowColor }}>
                        ODDS: {(market.yesPrice * 100).toFixed(0)}%
                    </div>
                </div>
            </div>
            {/* Connecting Line */}
            <div className="w-0.5 h-8 bg-gradient-to-b from-white/50 to-transparent mx-auto"></div>
          </div>
        </Html>
      )}
    </group>
  );
};