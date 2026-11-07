/**
 * JUDGES — public contract. Import only from "@/judges".
 *
 *   import { JudgesScene, type JudgesHandle } from "@/judges";
 *
 *   const judges = useRef<JudgesHandle>(null);
 *   <JudgesScene ref={judges} className="h-screen w-full" />
 *
 *   judges.current?.say(2, "What's your CAC?");          // judge 3 talks, glows, subtitle; duration from word count
 *   judges.current?.say(0, "Thanks.", 1200);              // explicit duration (ms)
 *   judges.current?.react(1, "nod");                      // nod | shake | disapprove | clap | think | texting | idle
 *
 * - Judge indices are 0..3, left to right from the presenter's view.
 * - One-shot reactions return to idle by themselves; "texting" loops until another reaction or "idle".
 * - The scene fills its parent; give the parent a size. Render it client-side only (WebGL).
 * - Subtitles use z-index 0..10, so app overlays (e.g. the feedback vignette) must sit above 10.
 * - Assets: public/judges/character.fbx + public/judges/animations/*.fbx.
 * - Optional prop `judges` (JudgeConfig[]) overrides positions/heights/tints/idles; default DEFAULT_JUDGES.
 */
export { JudgesScene, DEFAULT_JUDGES, type JudgesSceneProps } from "./JudgesScene";
export { JUDGE_REACTIONS, type JudgesHandle, type JudgeIndex, type JudgeReaction, type JudgeConfig } from "./types";
