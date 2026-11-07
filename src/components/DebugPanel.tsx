import { useState } from "react";
import { activeSource, publish } from "@/signals";
import { useSignal } from "@/signals/useSignal";

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const orb = useSignal("orbLevel");
  const fb = useSignal("feedback");
  const slide = useSignal("slide");

  return (
    <div className="fixed bottom-4 right-4 z-[110] w-64 rounded-lg border border-border bg-card/90 font-mono text-xs text-card-foreground backdrop-blur">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-muted-foreground hover:text-foreground"
      >
        <span>DEBUG</span>
        <span>{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-border px-3 py-3">
          <Row k="orbLevel" v={orb?.toFixed(3) ?? "—"} />
          <Row k="feedback" v={fb ? `${fb.color} ${fb.intensity.toFixed(2)}` : "—"} />
          <Row k="slide" v={slide ?? "—"} />
          <label className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              checked={paused}
              onChange={(e) => {
                setPaused(e.target.checked);
                activeSource.setPaused?.(e.target.checked);
              }}
            />
            Pause mock
          </label>
          <div className="flex gap-1">
            {(["red", "green", "neutral"] as const).map((c) => (
              <button
                key={c}
                onClick={() => publish("feedback", { color: c, intensity: c === "neutral" ? 0 : 1 })}
                className="flex-1 rounded border border-border px-1 py-1 hover:bg-accent"
              >
                {c}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground">Keys 1–4 switch screens</p>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span>{v}</span>
    </div>
  );
}
