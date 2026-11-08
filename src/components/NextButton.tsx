import { Link } from "@tanstack/react-router";

export const SCREENS = ["/", "/presenter", "/judges", "/report"] as const;
export type ScreenPath = (typeof SCREENS)[number];

export function NextButton({ to, label }: { to: ScreenPath; label: string }) {
  return (
    <Link
      to={to}
      className="glass inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm text-foreground transition-colors hover:bg-accent"
    >
      {label} →
    </Link>
  );
}
