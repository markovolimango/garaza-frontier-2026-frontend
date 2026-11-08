import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { subscribe } from "@/signals";

/** Converts any CSS color (incl. oklch) to a THREE.Color via a 1px canvas. */
function cssColor(el: HTMLElement | null, name: string, fallback: string) {
  const raw = el ? getComputedStyle(el).getPropertyValue(name).trim() : "";
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Color(fallback);
  ctx.fillStyle = fallback;
  ctx.fillStyle = raw || fallback;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return new THREE.Color().setRGB((r ?? 0) / 255, (g ?? 0) / 255, (b ?? 0) / 255, THREE.SRGBColorSpace);
}

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
`;

const VERT = /* glsl */ `
uniform float uTime; uniform float uAmp;
varying vec3 vN; varying vec3 vView; varying float vNoise; varying vec3 vPos;
${NOISE}
float disp(vec3 p){
  float n = snoise(p*1.4 + uTime*0.35)*0.6 + snoise(p*3.1 - uTime*0.55)*0.3 + snoise(p*6.0 + uTime*0.8)*0.1;
  return n;
}
void main(){
  vec3 p = position;
  float n = disp(normalize(p));
  vNoise = n;
  vec3 np = p + normal * n * uAmp;
  // recompute normal from neighbours
  vec3 t = normalize(cross(normal, vec3(0.,1.,0.001)));
  vec3 b = normalize(cross(normal, t));
  float e = 0.01;
  vec3 pt = normalize(p + t*e); vec3 pb = normalize(p + b*e);
  vec3 a1 = pt + normalize(pt) * disp(pt) * uAmp;
  vec3 a2 = pb + normalize(pb) * disp(pb) * uAmp;
  vec3 nn = normalize(cross(a1 - np, a2 - np));
  if (dot(nn, normal) < 0.) nn = -nn;
  vN = normalize(normalMatrix * nn);
  vec4 mv = modelViewMatrix * vec4(np, 1.);
  vView = normalize(-mv.xyz);
  vPos = np;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
uniform vec3 cA; uniform vec3 cB; uniform vec3 cC; uniform vec3 cHi; uniform float uTime; uniform float uGlow;
varying vec3 vN; varying vec3 vView; varying float vNoise; varying vec3 vPos;
${NOISE}
void main(){
  float fres = pow(1. - max(dot(vN, vView), 0.), 2.5);
  float swirl = snoise(vPos*2.2 + vec3(0., uTime*0.4, uTime*0.2));
  vec3 col = mix(cC, cB, smoothstep(-0.6, 0.6, vNoise));
  col = mix(col, cA, smoothstep(0.0, 0.9, swirl) * 0.8);
  vec3 L = normalize(vec3(-0.5, 0.7, 0.8));
  float diff = max(dot(vN, L), 0.);
  float spec = pow(max(dot(reflect(-L, vN), vView), 0.), 40.);
  col *= 0.35 + diff * 0.8;
  col += cHi * spec * 0.9;
  col += mix(cA, cHi, 0.4) * fres * (0.8 + uGlow * 1.4);
  gl_FragColor = vec4(col, 1.);
}`;

interface Palette { a: THREE.Color; b: THREE.Color; c: THREE.Color; hi: THREE.Color }

function Blob({ palette, level }: { palette: Palette; level: React.MutableRefObject<number> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Points>(null);
  const state = useRef({ cur: 0, time: 0 });
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 }, uAmp: { value: 0.12 }, uGlow: { value: 0.3 },
      cA: { value: palette.a }, cB: { value: palette.b }, cC: { value: palette.c }, cHi: { value: palette.hi },
    }),
    [palette],
  );
  const particles = useMemo(() => {
    const n = 900, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * Math.PI * 2, v = Math.acos(2 * Math.random() - 1), r = 1.45 + Math.random() * 0.6;
      pos[i * 3] = r * Math.sin(v) * Math.cos(u);
      pos[i * 3 + 1] = r * Math.cos(v) * 0.35;
      pos[i * 3 + 2] = r * Math.sin(v) * Math.sin(u);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = state.current;
    s.cur += (level.current - s.cur) * (1 - Math.pow(0.001, dt));
    s.time += dt * (0.6 + s.cur * 1.6);
    const breathe = Math.sin(performance.now() / 1400) * 0.02;
    uniforms.uTime.value = s.time;
    uniforms.uAmp.value = 0.08 + s.cur * 0.22;
    uniforms.uGlow.value = s.cur;
    const sc = 0.9 + s.cur * 0.2 + breathe;
    mesh.current?.scale.setScalar(sc);
    if (mesh.current) mesh.current.rotation.y += dt * 0.15;
    shellRef.current?.scale.setScalar(sc * (1.12 + s.cur * 0.08));
    if (ring.current) {
      ring.current.rotation.y += dt * (0.2 + s.cur * 0.6);
      ring.current.rotation.z = 0.35;
    }
  });

  return (
    <>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1, 64]} />
        <shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} />
      </mesh>
      <mesh ref={shellRef}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial color={palette.a} transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
      </mesh>
      <points ref={ring} geometry={particles}>
        <pointsMaterial color={palette.hi} size={0.018} transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </>
  );
}

export default function OrbScene({ min = 0, max = 1 }: { min?: number; max?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const level = useRef(0);
  useEffect(() => subscribe("orbLevel", (v) => {
    level.current = Math.min(1, Math.max(0, (v - min) / (max - min || 1)));
  }), [min, max]);

  return (
    <div ref={host} className="absolute inset-0">
      <PaletteGate host={host}>{(p) => (
        <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }} gl={{ alpha: true, antialias: true }} dpr={[1, 2]}>
          <Blob palette={p} level={level} />
        </Canvas>
      )}</PaletteGate>
    </div>
  );
}

function PaletteGate({ host, children }: { host: React.RefObject<HTMLDivElement | null>; children: (p: Palette) => React.ReactNode }) {
  const [p, setP] = useState<Palette | null>(null);
  useEffect(() => {
    const el = host.current;
    setP({
      a: cssColor(el, "--orb-a", "#7c5cff"),
      b: cssColor(el, "--orb-b", "#22d3ee"),
      c: cssColor(el, "--orb-c", "#2563eb"),
      hi: cssColor(el, "--orb-hi", "#ffffff"),
    });
  }, [host]);
  return p ? <>{children(p)}</> : null;
}
