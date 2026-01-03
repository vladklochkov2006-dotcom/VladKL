import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Group, MathUtils } from 'three';
import { Cone, Cylinder } from '@react-three/drei';

interface SpaceshipProps {
  onPositionChange: (pos: Vector3) => void;
  onWarpToggle: (isWarping: boolean) => void;
}

export const Spaceship: React.FC<SpaceshipProps> = ({ onPositionChange, onWarpToggle }) => {
  const shipRef = useRef<Group>(null);
  const { camera } = useThree();

  // Стан клавіш
  const keys = useRef<{ [key: string]: boolean }>({});
  
  // Внутрішній стан руху
  const speed = useRef(0);
  const rotationState = useRef({ yaw: Math.PI, pitch: 0, roll: 0 });

  // НАЛАШТУВАННЯ
  const SETTINGS = {
    MAX_SPEED: 70,
    BOOST_SPEED: 140,
    ACCEL: 3.5,
    TURN_SPEED: 2.0,      // Швидкість повороту
    STABILITY: 4.5,       // Наскільки швидко вирівнюється горизонт
    MAX_PITCH: 0.8,       // Обмеження нахилу носа
    MAX_ROLL: 0.6,        // Візуальний нахил при повороті
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!shipRef.current) return;

    // 1. ЛОГІКА ШВИДКОСТІ
    const isBoosting = keys.current['ShiftLeft'];
    onWarpToggle(isBoosting);
    
    let targetSpeed = 0;
    if (keys.current['KeyW'] || keys.current['Space']) {
        targetSpeed = isBoosting ? SETTINGS.BOOST_SPEED : SETTINGS.MAX_SPEED;
    } else if (keys.current['KeyS']) {
        targetSpeed = -20;
    } else {
        targetSpeed = 5; 
    }
    
    speed.current = MathUtils.lerp(speed.current, targetSpeed, delta * SETTINGS.ACCEL);

    // 2. СТАБІЛЬНЕ КЕРУВАННЯ (YXZ)
    // Yaw (Ліво/Право)
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) {
      rotationState.current.yaw += SETTINGS.TURN_SPEED * delta;
      rotationState.current.roll = MathUtils.lerp(rotationState.current.roll, SETTINGS.MAX_ROLL, delta * 5);
    } else if (keys.current['KeyD'] || keys.current['ArrowRight']) {
      rotationState.current.yaw -= SETTINGS.TURN_SPEED * delta;
      rotationState.current.roll = MathUtils.lerp(rotationState.current.roll, -SETTINGS.MAX_ROLL, delta * 5);
    } else {
      // АВТОВИРІВНЮВАННЯ КРЕНУ
      rotationState.current.roll = MathUtils.lerp(rotationState.current.roll, 0, delta * SETTINGS.STABILITY);
    }

    // Pitch (Верх/Низ)
    if (keys.current['ArrowUp']) {
      rotationState.current.pitch = MathUtils.lerp(rotationState.current.pitch, -SETTINGS.MAX_PITCH, delta * 3);
    } else if (keys.current['ArrowDown']) {
      rotationState.current.pitch = MathUtils.lerp(rotationState.current.pitch, SETTINGS.MAX_PITCH, delta * 3);
    } else {
      // АВТОВИРІВНЮВАННЯ НОСА
      rotationState.current.pitch = MathUtils.lerp(rotationState.current.pitch, 0, delta * SETTINGS.STABILITY);
    }

    // Застосовуємо ротацію до об'єкта
    shipRef.current.rotation.set(
      rotationState.current.pitch, 
      rotationState.current.yaw, 
      rotationState.current.roll, 
      'YXZ'
    );

    // 3. РУХ ВПЕРЕД
    shipRef.current.translateZ(speed.current * delta);

    // 4. СУПЕР-СТАБІЛЬНА КАМЕРА
    const zOffset = isBoosting ? 25 : 18;
    const yOffset = isBoosting ? 8 : 6;
    
    const relativeCameraOffset = new Vector3(0, yOffset, -zOffset);
    const cameraOffset = relativeCameraOffset.applyQuaternion(shipRef.current.quaternion);
    const targetCameraPos = shipRef.current.position.clone().add(cameraOffset);
    
    camera.position.lerp(targetCameraPos, 0.2);
    camera.lookAt(shipRef.current.position);

    onPositionChange(shipRef.current.position.clone());
  });

  return (
    <group ref={shipRef}>
      {/* --- ОРИГІНАЛЬНА МОДЕЛЬ КОРАБЛЯ --- */}
      <group rotation={[0, 0, 0]}>
        {/* Main Body (Cone) */}
        <Cone args={[1, 4, 4]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial 
            color="#e2e8f0" 
            metalness={0.6} 
            roughness={0.3} 
            emissive="#2d3748"
            emissiveIntensity={0.2}
          />
        </Cone>
        
        {/* Cockpit */}
        <mesh position={[0, 0.5, 0.5]}>
          <boxGeometry args={[0.8, 0.6, 1.5]} />
          <meshStandardMaterial 
            color="#00f0ff" 
            emissive="#00f0ff" 
            emissiveIntensity={0.6} 
            transparent 
            opacity={0.9} 
          />
        </mesh>
        
        {/* Wings */}
        <mesh position={[0, 0, -1]}>
          <boxGeometry args={[4, 0.1, 1.5]} />
          <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.4} />
        </mesh>
        
        {/* Dual Engines */}
        <group position={[0, 0, -1.8]}>
          <Cylinder args={[0.3, 0.5, 1, 8]} position={[-1, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#475569" />
          </Cylinder>
          <Cylinder args={[0.3, 0.5, 1, 8]} position={[1, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#475569" />
          </Cylinder>
          
          {/* Engine Glow Effects */}
          <group position={[0, 0, -0.6]}>
             <mesh position={[-1, 0, 0]}>
                <sphereGeometry args={[0.3]} />
                <meshBasicMaterial color={keys.current['ShiftLeft'] ? "#00ffff" : "#d946ef"} />
             </mesh>
             <mesh position={[1, 0, 0]}>
                <sphereGeometry args={[0.3]} />
                <meshBasicMaterial color={keys.current['ShiftLeft'] ? "#00ffff" : "#d946ef"} />
             </mesh>
             <pointLight position={[0, 0, 0]} intensity={3} color="cyan" distance={10} />
          </group>
        </group>
      </group>
    </group>
  );
};