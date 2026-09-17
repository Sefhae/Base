'use client';
// Every catalog item is drawn from plain Three.js primitives, because the site
// ships no 3D model files. If real .glb models arrive later, swap the matching
// case below for a loaded model and nothing else has to change.

import { ExtrudeGeometry, Path, Shape } from 'three';

const WOOD = '#6f6151';
const LEAF = '#5f7355';
const METAL = '#8d9384';

// ---------------------------------------------------------------------------
// Heart arch frame — ported from the supplied OpenSCAD model.
//
// heart_base(size) is hull() of two circles side by side plus a small circle
// below. hull() produces a CONVEX shape, so the notch between the two lobes is
// absent in the original too; this port keeps that behaviour rather than
// "correcting" it.
//
// Lengths below are the OpenSCAD units (~millimetres). The whole group is
// scaled once at render time to sit in a scene measured in metres.
// ---------------------------------------------------------------------------
type Pt = [number, number];

const circlePoints = (cx: number, cy: number, r: number, steps = 72): Pt[] =>
  Array.from({ length: steps }, (_, i): Pt => {
    const angle = (i / steps) * Math.PI * 2;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  });

const cross = (o: Pt, a: Pt, b: Pt) =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

const halfHull = (input: Pt[]): Pt[] => {
  const hull: Pt[] = [];
  input.forEach((p) => {
    while (
      hull.length >= 2 &&
      cross(hull[hull.length - 2], hull[hull.length - 1], p) <= 0
    ) {
      hull.pop();
    }
    hull.push(p);
  });
  hull.pop();
  return hull;
};

/** The equivalent of OpenSCAD's hull(), via Andrew's monotone chain. */
const convexHull = (points: Pt[]): Pt[] => {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return [...halfHull(sorted), ...halfHull([...sorted].reverse())];
};

const heartOutline = (size: number, offsetY = 0): Pt[] =>
  convexHull([
    ...circlePoints(-size / 2, size / 2 + offsetY, size / 2),
    ...circlePoints(size / 2, size / 2 + offsetY, size / 2),
    ...circlePoints(0, -size / 2 + offsetY, 0.5),
  ]);

/** Replaces the original's bottom cube subtraction: clip everything below minY. */
const clipBelow = (points: Pt[], minY: number): Pt[] => {
  const out: Pt[] = [];
  points.forEach((cur, i) => {
    const prev = points[(i + points.length - 1) % points.length];
    const curIn = cur[1] >= minY;
    const prevIn = prev[1] >= minY;
    if (curIn !== prevIn) {
      const t = (minY - prev[1]) / (cur[1] - prev[1]);
      out.push([prev[0] + (cur[0] - prev[0]) * t, minY]);
    }
    if (curIn) out.push(cur);
  });
  return out;
};

const trace = (points: Pt[], target: Shape | Path) => {
  points.forEach(([x, y], i) => {
    if (i === 0) target.moveTo(x, y);
    else target.lineTo(x, y);
  });
  target.closePath();
};

const buildHeartFrame = () => {
  const shape = new Shape();
  trace(clipBelow(heartOutline(60), -20), shape);
  // The cut-out sits 8 units higher for an even wall thickness. Its lowest
  // point (-14.5) stays above the -20 floor cut, so a solid bar remains across
  // the bottom: this is a standing frame, not a walk-through arch.
  const hole = new Path();
  trace(heartOutline(45, 8), hole);
  shape.holes.push(hole);
  const geometry = new ExtrudeGeometry(shape, {
    depth: 20,
    bevelEnabled: false,
  });
  // Centre the thickness (OpenSCAD's center=true) and drop the cut edge to y=0.
  geometry.translate(0, 20, -10);
  return geometry;
};

// Built once and shared by every placed arch; the shape never changes.
const HEART_FRAME = buildHeartFrame();
/** Brings the ~120 x 80 unit model down to a ~2.9 m wide arch. */
const HEART_SCALE = 0.024;

function Arch({ color }: { color: string }) {
  return (
    <group scale={HEART_SCALE}>
      <mesh castShadow receiveShadow geometry={HEART_FRAME}>
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* The two steel-style base plates from the original model. */}
      {[-25, 25].map((x) => (
        <mesh key={x} castShadow receiveShadow position={[x, 2.5, 0]}>
          <boxGeometry args={[25, 5, 40]} />
          <meshStandardMaterial color={METAL} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function Letters({ color }: { color: string }) {
  const heights = [0.7, 0.55, 0.7, 0.55, 0.7, 0.55, 0.7];
  return (
    <group>
      {heights.map((h, i) => (
        <mesh key={i} castShadow position={[(i - 3) * 0.34, h / 2 + 0.06, 0]}>
          <boxGeometry args={[0.24, h, 0.1]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.45}
          />
        </mesh>
      ))}
      <mesh receiveShadow position={[0, 0.03, 0]}>
        <boxGeometry args={[2.4, 0.06, 0.28]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
    </group>
  );
}

function CandlePath({ color }: { color: string }) {
  const rows = [-0.45, 0.45];
  const steps = [-1.2, -0.6, 0, 0.6, 1.2];
  return (
    <group>
      {rows.map((z) =>
        steps.map((x) => (
          <group key={`${x}-${z}`} position={[x, 0, z]}>
            <mesh castShadow position={[0, 0.13, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.26, 10]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, 0.31, 0]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial
                color="#ffbe5c"
                emissive="#ffa42a"
                emissiveIntensity={2}
              />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
}

function PetalCircle({ color }: { color: string }) {
  const petals = Array.from({ length: 26 }, (_, i) => i);
  return (
    <group>
      {petals.map((i) => {
        const a = (i / petals.length) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 1.25, 0.02, Math.sin(a) * 1.25]}
            rotation={[-Math.PI / 2, 0, a]}
            scale={[1, 0.6, 1]}
          >
            <circleGeometry args={[0.16, 8]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

function Rug({ color }: { color: string }) {
  return (
    <group>
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[1.15, 1.15, 0.04, 32]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <torusGeometry args={[0.95, 0.03, 8, 32]} />
        <meshStandardMaterial color="#b6a289" />
      </mesh>
    </group>
  );
}

function FlowerStand({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.9, 10]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <mesh receiveShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.24, 0.26, 0.06, 16]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <mesh castShadow position={[0, 1.02, 0]}>
        <sphereGeometry args={[0.28, 14, 14]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.16, 0.92, 0.12]}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial color={LEAF} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Table({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.74, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.06, 28]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 0.37, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.72, 12]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <mesh receiveShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.34, 0.36, 0.06, 18]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
    </group>
  );
}

function Chair({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[0.44, 0.06, 0.44]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 0.72, -0.19]}>
        <boxGeometry args={[0.44, 0.5, 0.06]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {[
        [-0.18, -0.18],
        [0.18, -0.18],
        [-0.18, 0.18],
        [0.18, 0.18],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} castShadow position={[x, 0.22, z]}>
          <boxGeometry args={[0.05, 0.44, 0.05]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
      ))}
    </group>
  );
}

function BalloonColumn({ color }: { color: string }) {
  const levels = [0.35, 0.78, 1.18, 1.54, 1.85];
  return (
    <group>
      {levels.map((y, level) =>
        [0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2 + level * 0.5;
          const r = 0.22 - level * 0.02;
          return (
            <mesh
              key={`${y}-${i}`}
              castShadow
              position={[Math.cos(a) * r, y, Math.sin(a) * r]}
            >
              <sphereGeometry args={[0.23 - level * 0.02, 14, 14]} />
              <meshStandardMaterial
                color={i === 1 ? '#f0e4d6' : color}
                roughness={0.35}
              />
            </mesh>
          );
        }),
      )}
    </group>
  );
}

function CakeTable({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
        <boxGeometry args={[0.9, 0.06, 0.6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {[
        [-0.38, -0.23],
        [0.38, -0.23],
        [-0.38, 0.23],
        [0.38, 0.23],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} castShadow position={[x, 0.35, z]}>
          <boxGeometry args={[0.05, 0.7, 0.05]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.83, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.2, 20]} />
        <meshStandardMaterial color="#fbf6ee" />
      </mesh>
      <mesh castShadow position={[0, 0.99, 0]}>
        <cylinderGeometry args={[0.13, 0.15, 0.14, 20]} />
        <meshStandardMaterial color="#f3e2e6" />
      </mesh>
      <mesh position={[0, 1.11, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color="#ffbe5c"
          emissive="#ffa42a"
          emissiveIntensity={1.6}
        />
      </mesh>
    </group>
  );
}

function Backdrop({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 1.25, 0]}>
        <boxGeometry args={[2.2, 2.5, 0.09]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} castShadow position={[x, 0.05, 0.22]}>
          <boxGeometry args={[0.5, 0.1, 0.45]} />
          <meshStandardMaterial color={METAL} />
        </mesh>
      ))}
    </group>
  );
}

function StringLights({ color }: { color: string }) {
  const bulbs = Array.from({ length: 11 }, (_, i) => i);
  return (
    <group>
      {[-1.6, 1.6].map((x) => (
        <mesh key={x} castShadow position={[x, 1.1, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 2.2, 10]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
      ))}
      {bulbs.map((i) => {
        const t = i / (bulbs.length - 1);
        const x = -1.6 + t * 3.2;
        const y = 2.1 - Math.sin(t * Math.PI) * 0.42;
        return (
          <mesh key={i} position={[x, y, 0]}>
            <sphereGeometry args={[0.075, 10, 10]} />
            <meshStandardMaterial
              color={color}
              emissive="#ffb648"
              emissiveIntensity={2.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Lantern({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[0.26, 0.42, 0.26]} />
        <meshStandardMaterial
          color="#3c4a3f"
          transparent
          opacity={0.45}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial
          color={color}
          emissive="#ffa42a"
          emissiveIntensity={2.4}
        />
      </mesh>
      <mesh castShadow position={[0, 0.04, 0]}>
        <boxGeometry args={[0.3, 0.08, 0.3]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
    </group>
  );
}

function Uplight({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.17, 0.2, 0.18, 16]} />
        <meshStandardMaterial color="#3f4a41" />
      </mesh>
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.02, 16]} />
        <meshStandardMaterial
          color={color}
          emissive="#ffc46a"
          emissiveIntensity={2.6}
        />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <coneGeometry args={[0.3, 0.9, 16, 1, true]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.14}
          emissive={color}
          emissiveIntensity={0.7}
        />
      </mesh>
    </group>
  );
}

function MoonFrame({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 1.55, 0]}>
        <torusGeometry args={[1.1, 0.07, 12, 40]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const a = Math.PI * 0.15 + (i / 8) * Math.PI * 1.1;
        return (
          <mesh
            key={i}
            castShadow
            position={[Math.cos(a) * 1.1, 1.55 + Math.sin(a) * 1.1, 0.07]}
          >
            <sphereGeometry args={[0.17, 12, 12]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? LEAF : color}
              roughness={0.9}
            />
          </mesh>
        );
      })}
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} castShadow position={[x, 0.05, 0]}>
          <boxGeometry args={[0.4, 0.1, 0.4]} />
          <meshStandardMaterial color={METAL} />
        </mesh>
      ))}
    </group>
  );
}

function AisleRunner({ color }: { color: string }) {
  return (
    <group>
      <mesh receiveShadow position={[0, 0.015, 0]}>
        <boxGeometry args={[1.5, 0.03, 4.2]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const z = -1.9 + i * 0.35;
        return [-0.62, 0.62].map((x) => (
          <mesh
            key={`${i}-${x}`}
            position={[x + (i % 2) * 0.06, 0.04, z]}
            rotation={[-Math.PI / 2, 0, i]}
            scale={[1, 0.6, 1]}
          >
            <circleGeometry args={[0.11, 8]} />
            <meshStandardMaterial color="#cf5f66" roughness={0.9} />
          </mesh>
        ));
      })}
    </group>
  );
}

function LoveLetters({ color }: { color: string }) {
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} castShadow position={[(i - 1.5) * 0.42, 0.42, 0]}>
          <boxGeometry args={[0.32, 0.72, 0.12]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
      <mesh receiveShadow position={[0, 0.03, 0]}>
        <boxGeometry args={[1.8, 0.06, 0.3]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
    </group>
  );
}

function RoseColumn({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.14, 0.19, 1.24, 16]} />
        <meshStandardMaterial color="#efe8da" />
      </mesh>
      <mesh receiveShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.28, 0.3, 0.08, 18]} />
        <meshStandardMaterial color="#efe8da" />
      </mesh>
      <mesh castShadow position={[0, 1.42, 0]}>
        <sphereGeometry args={[0.34, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh
            key={i}
            castShadow
            position={[Math.cos(a) * 0.28, 1.28, Math.sin(a) * 0.28]}
          >
            <sphereGeometry args={[0.15, 10, 10]} />
            <meshStandardMaterial color={LEAF} roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

function ChampagneTable({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.76, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.05, 24]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.74, 12]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <mesh receiveShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.26, 0.28, 0.05, 16]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      {[-0.16, 0.16].map((x) => (
        <group key={x} position={[x, 0.79, 0.1]}>
          <mesh castShadow position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.035, 0.012, 0.18, 10]} />
            <meshStandardMaterial
              color="#e8f0ea"
              transparent
              opacity={0.65}
              roughness={0.15}
            />
          </mesh>
          <mesh position={[0, 0.005, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.012, 10]} />
            <meshStandardMaterial color="#e8f0ea" transparent opacity={0.7} />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 0.86, -0.13]}>
        <cylinderGeometry args={[0.13, 0.1, 0.16, 14]} />
        <meshStandardMaterial color="#9aa79b" />
      </mesh>
    </group>
  );
}

function RingPodium({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.16, 0.22, 0.84, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh receiveShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.3, 0.32, 0.06, 18]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 0.89, 0]}>
        <boxGeometry args={[0.2, 0.1, 0.2]} />
        <meshStandardMaterial color="#8d2f3f" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.055, 0.014, 8, 20]} />
        <meshStandardMaterial
          color="#d9b563"
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0, 1.06, 0]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial
          color="#eaf4ff"
          emissive="#bcd8ff"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

function PhotoFrame({ color }: { color: string }) {
  return (
    <group rotation={[0, 0, 0]}>
      <group position={[0, 0.78, 0]} rotation={[-0.12, 0, 0]}>
        {[
          [0, 0.44, 0.7, 0.07],
          [0, -0.44, 0.7, 0.07],
          [-0.32, 0, 0.07, 0.95],
          [0.32, 0, 0.07, 0.95],
        ].map(([x, y, w, h], i) => (
          <mesh key={i} castShadow position={[x, y, 0]}>
            <boxGeometry args={[w, h, 0.06]} />
            <meshStandardMaterial color={color} metalness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[0.6, 0.85, 0.02]} />
          <meshStandardMaterial color="#e9e4d8" />
        </mesh>
      </group>
      <mesh castShadow position={[0, 0.16, -0.14]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.07, 0.34, 0.07]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <mesh receiveShadow position={[0, 0.03, -0.05]}>
        <boxGeometry args={[0.5, 0.06, 0.34]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
    </group>
  );
}

export function ItemModel({ model, color }: { model: string; color: string }) {
  switch (model) {
    case 'arch':
      return <Arch color={color} />;
    case 'letters':
      return <Letters color={color} />;
    case 'candlePath':
      return <CandlePath color={color} />;
    case 'petalCircle':
      return <PetalCircle color={color} />;
    case 'rug':
      return <Rug color={color} />;
    case 'flowerStand':
      return <FlowerStand color={color} />;
    case 'table':
      return <Table color={color} />;
    case 'chair':
      return <Chair color={color} />;
    case 'balloonColumn':
      return <BalloonColumn color={color} />;
    case 'cakeTable':
      return <CakeTable color={color} />;
    case 'backdrop':
      return <Backdrop color={color} />;
    case 'stringLights':
      return <StringLights color={color} />;
    case 'lantern':
      return <Lantern color={color} />;
    case 'uplight':
      return <Uplight color={color} />;
    case 'moonFrame':
      return <MoonFrame color={color} />;
    case 'aisleRunner':
      return <AisleRunner color={color} />;
    case 'loveLetters':
      return <LoveLetters color={color} />;
    case 'roseColumn':
      return <RoseColumn color={color} />;
    case 'champagneTable':
      return <ChampagneTable color={color} />;
    case 'ringPodium':
      return <RingPodium color={color} />;
    case 'photoFrame':
      return <PhotoFrame color={color} />;
    default:
      return (
        <mesh castShadow position={[0, 0.3, 0]}>
          <boxGeometry args={[0.5, 0.6, 0.5]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
  }
}
