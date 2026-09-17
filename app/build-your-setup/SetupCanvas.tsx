'use client';
import { Component, Suspense, useState, type ReactNode } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, Gltf, Grid, OrbitControls } from '@react-three/drei';
import { ItemModel } from './items';

/** What a piece is drawn from: a built-in shape, or an uploaded .glb. */
export type PieceSource =
  | { kind: 'builtin'; model: string; color: string }
  | { kind: 'glb'; url: string };

export type Piece = {
  uid: string;
  x: number;
  y: number;
  z: number;
  /** Radians around the vertical axis. */
  rotation: number;
  scale: number;
  source: PieceSource;
  /** Radius of the selection ring drawn on the floor. */
  ringSize: number;
};

type Props = {
  pieces: Piece[];
  selected?: string | null;
  onSelect?: (uid: string | null) => void;
  /**
   * Leave undefined to make the scene display-only. Customers get it undefined
   * so pieces stay exactly where the admin panel put them; the admin panel
   * passes it so a piece can be dragged into place.
   */
  onMove?: (uid: string, x: number, z: number) => void;
};

const FLOOR = 11;

/**
 * A .glb that fails to load (deleted file, bad upload, offline) would otherwise
 * throw through Suspense and blank the whole canvas. Swallow it per piece so
 * the rest of the scene survives.
 */
class PieceBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function PieceModel({ source }: { source: PieceSource }) {
  if (source.kind === 'builtin') {
    return <ItemModel model={source.model} color={source.color} />;
  }
  return (
    <PieceBoundary>
      <Suspense fallback={null}>
        <Gltf src={source.url} castShadow receiveShadow />
      </Suspense>
    </PieceBoundary>
  );
}

function Scene({ pieces, selected, onSelect, onMove }: Props) {
  const [dragging, setDragging] = useState<string | null>(null);
  const canDrag = Boolean(onMove);

  const handleGroundMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging || !onMove) return;
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
        onPointerMissed={() => onSelect?.(null)}
        onClick={() => onSelect?.(null)}
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

      {pieces.map((piece) => {
        const isSelected = selected === piece.uid;
        return (
          <group
            key={piece.uid}
            position={[piece.x, piece.y, piece.z]}
            rotation={[0, piece.rotation, 0]}
            scale={piece.scale}
            onPointerDown={(event: ThreeEvent<PointerEvent>) => {
              if (!onSelect && !canDrag) return;
              event.stopPropagation();
              onSelect?.(piece.uid);
              if (canDrag) setDragging(piece.uid);
            }}
            onPointerUp={stopDragging}
          >
            <PieceModel source={piece.source} />
            {isSelected ? (
              <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry
                  args={[piece.ringSize * 0.5, piece.ringSize * 0.5 + 0.08, 32]}
                />
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
      onPointerMissed={() => props.onSelect?.(null)}
    >
      <color attach="background" args={['#faf9f6']} />
      <fog attach="fog" args={['#faf9f6', 18, 34]} />
      <Scene {...props} />
    </Canvas>
  );
}
