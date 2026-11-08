import { memo, useMemo } from "react";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import type { JudgeConfig } from "./types";

/**
 * Bright accent of a judge's tint (same hue), as a hex string.
 * Props passed to R3F elements must stay referentially stable: the dev-only TanStack
 * inject-source plugin adds `data-tsd-source` to JSX, and R3F throws on it during prop updates.
 */
export function accentOf(tint: string): string {
  const hsl = { h: 0, s: 0, l: 0 };
  new THREE.Color(tint).getHSL(hsl);
  return `#${new THREE.Color().setHSL(hsl.h, 0.85, 0.6).getHexString()}`;
}

const W = 8.4; // room width
const H = 3.3; // ceiling height
const BACK = -2.6;
const FRONT = 4.4;
const DEPTH = FRONT - BACK;
const MID_Z = (FRONT + BACK) / 2;

const WALL = "#171a24";
const PANEL = "#222634";
const TRIM = "#0b0c10";
const STRIP = "#7fb4ff";

/** Emissive strip that ignores lighting/tone mapping so it reads as a light source. */
function Strip({ args, position, color = STRIP, opacity = 1 }: { args: [number, number, number]; position: [number, number, number]; color?: THREE.ColorRepresentation; opacity?: number }) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshBasicMaterial color={color} toneMapped={false} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

function BackWall() {
  const slats = useMemo(() => Array.from({ length: 23 }, (_, i) => -W / 2 + 0.35 + i * 0.35), []);
  return (
    <group position={[0, 0, BACK]}>
      <mesh position={[0, H / 2, 0]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color={WALL} roughness={0.9} />
      </mesh>
      {/* vertical acoustic slats */}
      {slats.map((x) => (
        <mesh key={x} position={[x, H / 2 + 0.15, 0.04]}>
          <boxGeometry args={[0.16, H - 0.9, 0.08]} />
          <meshStandardMaterial color={PANEL} roughness={0.75} />
        </mesh>
      ))}
      {/* dark screen behind the panel with a faint frame */}
      <mesh position={[0, 1.95, 0.1]}>
        <boxGeometry args={[3.4, 1.25, 0.04]} />
        <meshStandardMaterial color="#07080c" roughness={0.3} metalness={0.4} />
      </mesh>
      <Strip args={[3.5, 0.012, 0.01]} position={[0, 2.585, 0.13]} opacity={0.5} />
      <Strip args={[3.5, 0.012, 0.01]} position={[0, 1.315, 0.13]} opacity={0.5} />
      {/* cove light along the top and base of the wall */}
      <Strip args={[W, 0.025, 0.02]} position={[0, H - 0.18, 0.1]} />
      <Strip args={[W, 0.015, 0.02]} position={[0, 0.06, 0.1]} opacity={0.6} />
      {/* skirting */}
      <mesh position={[0, 0.05, 0.06]}>
        <boxGeometry args={[W, 0.1, 0.04]} />
        <meshStandardMaterial color={TRIM} />
      </mesh>
    </group>
  );
}

function SideWall({ side }: { side: 1 | -1 }) {
  const x = (side * W) / 2;
  const pillars = [-1.6, 0.6, 2.8];
  return (
    <group>
      <mesh position={[x, H / 2, MID_Z]} rotation-y={-side * (Math.PI / 2)}>
        <planeGeometry args={[DEPTH, H]} />
        <meshStandardMaterial color={WALL} roughness={0.9} />
      </mesh>
      {pillars.map((z) => (
        <group key={z} position={[x - side * 0.08, 0, z]}>
          <mesh position={[0, H / 2, 0]}>
            <boxGeometry args={[0.16, H, 0.34]} />
            <meshStandardMaterial color={PANEL} roughness={0.8} />
          </mesh>
          {/* vertical sconce strip */}
          <Strip args={[0.02, 1.1, 0.06]} position={[-side * 0.09, 1.9, 0]} opacity={0.75} />
        </group>
      ))}
    </group>
  );
}

function Ceiling() {
  return (
    <group position={[0, H, 0]}>
      <mesh position={[0, 0, MID_Z]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[W, DEPTH]} />
        <meshStandardMaterial color="#0c0d12" roughness={1} />
      </mesh>
      {/* recessed light panels over the table */}
      {[-1.65, 0, 1.65].map((x) => (
        <Strip key={x} args={[1.1, 0.01, 0.4]} position={[x, -0.01, -0.5]} color="#cfe0ff" opacity={0.12} />
      ))}
    </group>
  );
}

function Floor() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, MID_Z]}>
      <planeGeometry args={[W, DEPTH]} />
      <MeshReflectorMaterial
        color="#0d0f14"
        roughness={0.85}
        metalness={0.2}
        blur={[400, 120]}
        resolution={512}
        mixBlur={1}
        mixStrength={1.6}
        depthScale={0.8}
        minDepthThreshold={0.3}
        maxDepthThreshold={1.2}
        mirror={0}
      />
    </mesh>
  );
}

function Table({ judges }: { judges: JudgeConfig[] }) {
  return (
    <group>
      {/* top */}
      <mesh position={[0, 0.745, 0]}>
        <boxGeometry args={[5.0, 0.06, 1.0]} />
        <meshStandardMaterial color="#1d2029" roughness={0.35} metalness={0.3} />
      </mesh>
      {/* front panel */}
      <mesh position={[0, 0.37, 0.46]}>
        <boxGeometry args={[4.9, 0.68, 0.04]} />
        <meshStandardMaterial color="#14161d" roughness={0.6} />
      </mesh>
      {/* light strip under the top edge */}
      <Strip args={[4.9, 0.012, 0.012]} position={[0, 0.705, 0.49]} />
      {/* per-judge nameplate glow in their accent color */}
      {judges.map((j, i) => (
        <group key={i} position={[j.position[0], 0, 0.485]}>
          <Strip args={[0.46, 0.022, 0.01]} position={[0, 0.52, 0]} color={accentOf(j.tint)} opacity={0.7} />
          <Strip args={[0.46, 0.004, 0.01]} position={[0, 0.06, 0]} color={accentOf(j.tint)} opacity={0.5} />
        </group>
      ))}
      {/* legs */}
      {[-2.35, 2.35].map((x) => (
        <mesh key={x} position={[x, 0.36, 0]}>
          <boxGeometry args={[0.08, 0.72, 0.9]} />
          <meshStandardMaterial color={TRIM} />
        </mesh>
      ))}
    </group>
  );
}

function Chair({ x, z }: { x: number; z: number }) {
  const mat = <meshStandardMaterial color="#1a1c23" roughness={0.55} metalness={0.15} />;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.46, 0]}>
        <boxGeometry args={[0.54, 0.08, 0.52]} />
        {mat}
      </mesh>
      {/* tall executive back */}
      <mesh position={[0, 0.98, -0.26]} rotation-x={-0.08}>
        <boxGeometry args={[0.54, 0.98, 0.08]} />
        {mat}
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.42]} />
        <meshStandardMaterial color="#2a2d36" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.28, 0.3, 0.04, 20]} />
        <meshStandardMaterial color="#202229" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Downward colored spotlight on a judge's seat (no ceiling hotspot like a point light). */
function JudgeSpot({ x, z, color }: { x: number; z: number; color: string }) {
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(x, 0.6, z + 0.2);
    return o;
  }, [x, z]);
  return (
    <>
      <primitive object={target} />
      <spotLight position={[x, H - 0.05, z + 0.5]} target={target} color={color} angle={0.42} penumbra={0.8} intensity={9} distance={5} decay={1.4} />
    </>
  );
}

/** Dark, defined boardroom: slatted back wall, pillars, cove lighting, reflective floor, per-judge light pools. */
export const Room = memo(function Room({ judges }: { judges: JudgeConfig[] }) {
  return (
    <group>
      <Floor />
      <BackWall />
      <SideWall side={-1} />
      <SideWall side={1} />
      <Ceiling />
      {/* soft wash grazing the back wall so the slats read */}
      <spotLight position={[0, H - 0.1, BACK + 1.6]} angle={1.0} penumbra={1} intensity={6} distance={6} decay={1.2} color="#9db8ff" />
      <Table judges={judges} />
      {judges.map((j, i) => (
        <group key={i}>
          <Chair x={j.position[0]} z={j.position[2] - 0.1} />
          {/* soft colored pool over each judge */}
          <JudgeSpot x={j.position[0]} z={j.position[2]} color={accentOf(j.tint)} />
        </group>
      ))}
    </group>
  );
});
