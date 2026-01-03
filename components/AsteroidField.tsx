import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, InstancedMesh, Object3D, MathUtils } from 'three';

interface AsteroidFieldProps {
  shipPosition: Vector3;
  onCollision: () => void;
}

export const AsteroidField: React.FC<AsteroidFieldProps> = ({ shipPosition, onCollision }) => {
  const count = 400; // Трохи менше, але вони будуть більшими та розкиданими
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  
  // Параметри зони польоту
  const FIELD_SIZE = 1200; // Розмір куба, в якому існують астероїди
  const HALF_FIELD = FIELD_SIZE / 2;

  // Генеруємо початкові випадкові зміщення (offsets)
  const asteroidData = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        // Рандомна позиція всередині нашого великого куба
        offset: new Vector3(
          MathUtils.randFloat(-HALF_FIELD, HALF_FIELD),
          MathUtils.randFloat(-HALF_FIELD * 0.2, HALF_FIELD * 0.2), // Космос плоский, як диск
          MathUtils.randFloat(-HALF_FIELD, HALF_FIELD)
        ),
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
        rotationSpeed: Math.random() * 0.01,
        scale: Math.random() * 8 + 2, // Робимо астероїди масивнішими
      });
    }
    return temp;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const collisionThresholdSq = 16.0; // Радіус корабля + астероїда

    asteroidData.forEach((data, i) => {
      // ГОЛОВНА МАГІЯ: MODULO
      // Розраховуємо позицію астероїда так, щоб він завжди був навколо корабля
      // Формула: ((позиція + зсув + пів_поля) % розмір_поля) - пів_поля
      let x = ((data.offset.x - shipPosition.x + HALF_FIELD) % FIELD_SIZE);
      if (x < 0) x += FIELD_SIZE;
      x -= HALF_FIELD;

      let y = ((data.offset.y - shipPosition.y + HALF_FIELD * 0.2) % (FIELD_SIZE * 0.2));
      if (y < 0) y += (FIELD_SIZE * 0.2);
      y -= (HALF_FIELD * 0.2);

      let z = ((data.offset.z - shipPosition.z + HALF_FIELD) % FIELD_SIZE);
      if (z < 0) z += FIELD_SIZE;
      z -= HALF_FIELD;

      // Глобальна позиція астероїда для розрахунку колізій
      const worldPos = new Vector3(x + shipPosition.x, y + shipPosition.y, z + shipPosition.z);

      // Візуальне оновлення
      dummy.position.set(worldPos.x, worldPos.y, worldPos.z);
      dummy.rotation.set(
        data.rotation[0] + state.clock.elapsedTime * data.rotationSpeed,
        data.rotation[1] + state.clock.elapsedTime * data.rotationSpeed,
        0
      );
      dummy.scale.setScalar(data.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // КОЛІЗІЇ (Тільки для тих, що близько)
      const distSq = shipPosition.distanceToSquared(worldPos);
      if (distSq < collisionThresholdSq * (data.scale * 0.5)) {
        onCollision();
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* Використовуємо більш "ломану" геометрію для вигляду каменю */}
      <dodecahedronGeometry args={[1, 1]} /> 
      <meshStandardMaterial 
        color="#4a4a4a" 
        roughness={1} 
        flatShading={true}
      />
    </instancedMesh>
  );
};