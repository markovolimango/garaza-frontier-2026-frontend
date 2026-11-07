import { publish, type FeedbackColor } from "../bus";
import type { SignalSource } from "./types";

const COLORS: FeedbackColor[] = ["red", "green", "neutral"];

export class MockSource implements SignalSource {
  private orbTimer: ReturnType<typeof setInterval> | null = null;
  private fbTimer: ReturnType<typeof setTimeout> | null = null;
  private level = 0.5;
  private velocity = 0;
  private paused = false;

  start() {
    if (this.orbTimer) return;
    // Smooth random walk at ~20 Hz
    this.orbTimer = setInterval(() => {
      if (this.paused) return;
      this.velocity = this.velocity * 0.85 + (Math.random() - 0.5) * 0.04;
      this.level += this.velocity;
      if (this.level < 0) {
        this.level = 0;
        this.velocity = Math.abs(this.velocity);
      } else if (this.level > 1) {
        this.level = 1;
        this.velocity = -Math.abs(this.velocity);
      }
      publish("orbLevel", this.level);
    }, 50);
    this.scheduleFeedback();
  }

  private scheduleFeedback() {
    this.fbTimer = setTimeout(() => {
      if (!this.paused) {
        publish("feedback", {
          color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
          intensity: Math.random(),
        });
      }
      this.scheduleFeedback();
    }, 2000 + Math.random() * 2000);
  }

  stop() {
    if (this.orbTimer) clearInterval(this.orbTimer);
    if (this.fbTimer) clearTimeout(this.fbTimer);
    this.orbTimer = null;
    this.fbTimer = null;
  }

  setPaused(p: boolean) {
    this.paused = p;
  }

  isPaused() {
    return this.paused;
  }
}
