'use client';
import { useState } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, Grid, OrbitControls } from '@react-three/drei';
import { findItem } from './catalog';
import { ItemModel } from './items';

export type Placed = {
  uid: string;
  itemId: string;
  x: number;
  z: number;
  rotation: number;
};

type Props = {
  placed: Placed[];
  selected: string | null;
  onSelect: (uid: string | null) => void;
  onMove: (uid: string, x: number, z: number) => void;
};

const FLOOR = 11;

function Scene({ placed, selected, onSelect, onMove }: Props) {
  const [dragging, setDragging] = useState<string | null>(null);

  const handleGroundMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    const limit = FLOOR / 2 - 0.5;
    const x = Math.max(-limit, Math.min(limit, event.point.x));
    const z = Math.max(-limit, Math.min(limit, event.point.z));
    onMove(dragging, x, z);
  };

  const stopDragging = () => {
    if (!dragging) return;
    setDragging(null);
  };

  return (
    <>
      <hemisphereLight args={['#ffffff', '#c8c4b4', 1.1]} />
      <directionalLight
        castShadow
        position={[4.5, 7, 3.5]}
        intensity={1.7}
        shadow-mapSize={[1024, 1024]}
      >
        <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8, 0.1, 25]} />
      </directionalLight>

      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handleGroundMove}
        onPointerUp={stopDragging}
        onPointerMissed={() => onSelect(null)}
        onClick={() => onSelect(null)}
      >
        <planeGeometry args={[FLOOR, FLOOR]} />
        <meshStandardMaterial color="#efece2" />
      </mesh>

      <Grid
        args={[FLOOR, FLOOR]}
        cellSize={0.5}
        cellColor="#d8d4c6"
        sectionSize={2}
        sectionColor="#c3bfae"
        position={[0, 0.002, 0]}
        infiniteGrid={false}
        fadeDistance={22}
      />

      {placed.map((piece) => {
        const item = findItem(piece.itemId);
        if (!item) return null;
        const isSelected = selected === piece.uid;
        return (
          <group
            key={piece.uid}
            position={[piece.x, 0, piece.z]}
            rotation={[0, piece.rotation, 0]}
            onPointerDown={(event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation();
              onSelect(piece.uid);
              setDragging(piece.uid);
            }}
            onPointerUp={stopDragging}
          >
            <ItemModel model={item.model} color={item.color} />
            {isSelected ? (
              <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[item.size * 0.5, item.size * 0.5 + 0.08, 32]} />
                <meshBasicMaterial color="#a2834d" />
              </mesh>
            ) : null}
          </group>
        );
      })}

      <ContactShadows
        position={[0, 0.004, 0]}
        opacity={0.33}
        scale={FLOOR}
        blur={2.2}
        far={6}
      />
      <OrbitControls
        makeDefault
        enabled={!dragging}
        enablePan={false}
        minDistance={4}
        maxDistance={17}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0.6, 0]}
      />
    </>
  );
}

export default function SetupCanvas(props: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [6.5, 5, 7.5], fov: 42 }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <color attach="background" args={['#faf9f6']} />
      <fog attach="fog" args={['#faf9f6', 18, 34]} />
      <Scene {...props} />
    </Canvas>
  );
}
