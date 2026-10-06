import { X } from "lucide-react";
import { useState } from "react";

import { useAuthTenant } from "@app/store/authStore";

export function TrialBanner() {
  const tenant = useAuthTenant();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || tenant?.accountStatus !== "trialing" || tenant.trialEndsAt == null) {
    return null;
  }

  const daysLeft = Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / 86_400_000);
  if (daysLeft <= 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 border-border border-b bg-surface-inset px-4 py-1.5 text-[12.5px] text-foreground-secondary">
      <span>
        <span className="font-semibold text-foreground">
          {daysLeft} {daysLeft === 1 ? "day" : "days"} left
        </span>{" "}
        in your free trial.
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="rounded p-0.5 text-foreground-muted transition-colors hover:text-foreground-secondary"
      >
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  );
}
