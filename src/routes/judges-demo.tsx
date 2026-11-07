import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const JudgesDemo = lazy(() => import("@/judges/JudgesDemo").then((m) => ({ default: m.JudgesDemo })));

export const Route = createFileRoute("/judges-demo")({
  component: () => (
    <ClientOnly>
      <Suspense fallback={null}>
        <JudgesDemo />
      </Suspense>
    </ClientOnly>
  ),
});
