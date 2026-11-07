import { useEffect, useRef } from "react";
import { subscribe } from "@/signals";

interface OrbProps {
  min?: number;
  max?: number;
  size?: number;
}

export function Orb({ min = 0, max = 1, size = 360 }: OrbProps) {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef(0);

  useEffect(() => {
    const unsub = subscribe("orbLevel", (v) => {
      const t = (v - min) / (max - min || 1);
      target.current = Math.min(1, Math.max(0, t));
    });
    let cur = 0;
    let raf = 0;
    const tick = () => {
      cur += (target.current - cur) * 0.08; // lerp
      const el = ref.current;
      if (el) {
        el.style.setProperty("--orb-scale", String(0.85 + cur * 0.3));
        el.style.setProperty("--orb-glow", String(0.25 + cur * 0.75));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      unsub();
      cancelAnimationFrame(raf);
    };
  }, [min, max]);

  return (
    <div ref={ref} className="orb" style={{ width: size, height: size }} aria-label="AI assistant">
      <div className="orb-glow" />
      <div className="orb-core" />
    </div>
  );
}
