import { toApiErrorShape } from "@/shared/api/utils/errorNormalization";
import { Button } from "@/shared/components/primitives/ui/button";
import Loading from "@/shared/components/ui/feedback/Loading";
import { type ErrorComponentProps, Outlet, createRootRoute } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[var(--bg-surface)] p-6">
      <AlertCircle color="var(--color-error, #ef4444)" className="mb-4" size={48} />
      <h2 className="mb-2 font-semibold text-[var(--color-error)] text-xl">Unexpected Error</h2>
      <p className="mb-6 text-[var(--text-secondary)] text-sm">{toApiErrorShape(error).message}</p>
      <Button variant="secondary" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}

export const Route = createRootRoute({
  pendingComponent: () => <Loading fullscreen />,
  errorComponent: RootErrorComponent,
  component: Outlet,
});
