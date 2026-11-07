import { useEffect, useRef } from "react";
import { JUDGE_REACTIONS, JudgesScene, type JudgeIndex, type JudgesHandle } from "./index";

const LINES = [
  "Who is paying for this today, and how much?",
  "How is this different from just rehearsing in front of a mirror?",
  "What does your retention look like after the first week?",
  "Walk me through your go-to-market for the first thousand users.",
];
const KEYS = ["q", "w", "e", "r"];

export function JudgesDemo() {
  const judges = useRef<JudgesHandle>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = KEYS.indexOf(e.key.toLowerCase());
      if (i >= 0 && !e.repeat) judges.current?.say(i as JudgeIndex, LINES[i]!);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed inset-0">
      <JudgesScene ref={judges} />
      <div className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-4 gap-2 p-3">
        {LINES.map((line, i) => (
          <div key={i} className="flex flex-wrap gap-1 rounded-lg bg-black/60 p-2 text-xs text-white">
            <button
              className="rounded bg-white/20 px-2 py-1 font-semibold hover:bg-white/30"
              onClick={() => judges.current?.say(i as JudgeIndex, line)}
            >
              Say ({KEYS[i]!.toUpperCase()})
            </button>
            {JUDGE_REACTIONS.map((r) => (
              <button
                key={r}
                className="rounded bg-white/10 px-2 py-1 hover:bg-white/25"
                onClick={() => judges.current?.react(i as JudgeIndex, r)}
              >
                {r}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
