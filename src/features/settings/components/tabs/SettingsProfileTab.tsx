import { errorMessage } from "@shared/api/utils/errorNormalization";
import { Button } from "@shared/components/primitives/ui/button";
import { Card as Surface } from "@shared/components/primitives/ui/card";
import { Lock, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useAuthStore } from "@app/store/authStore";
import { session } from "@shared/api/auth/session";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Please enter your current password"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long"),
});

export default function SettingsProfileTab(): JSX.Element {
  const user = useAuthStore((s) => s.user);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }

    setIsSubmitting(true);
    try {
      await session.changePassword(parsed.data.currentPassword, parsed.data.newPassword);
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: unknown) {
      toast.error(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Surface elevation={1} padding="lg" className="settings-card max-w-2xl">
      <div className="mb-md flex items-center gap-sm">
        <User size={20} />
        <h3 className="m-0 font-semibold text-lg">Profile Information</h3>
      </div>
      <div className="border-t" />

      <div className="py-md">
        <div className="mb-md flex flex-col gap-xs">
          <span className="text-muted text-xs uppercase tracking-wide">Name</span>
          <span className="font-medium">{user?.name ?? "No name set"}</span>
        </div>
        <div className="flex flex-col gap-xs">
          <span className="text-muted text-xs uppercase tracking-wide">Email</span>
          <span className="font-medium">{user?.email}</span>
        </div>
      </div>

      <div className="mt-lg mb-md flex items-center gap-sm">
        <Lock size={20} />
        <h3 className="m-0 font-semibold text-lg">Change Password</h3>
      </div>
      <div className="border-t" />

      <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-sm py-md">
        <div className="flex flex-col gap-xs">
          <label
            htmlFor="current-password"
            className="font-semibold text-foreground-secondary text-xs uppercase tracking-wide"
          >
            Current Password
          </label>
          <input
            id="current-password"
            className="w-full rounded border border-border bg-card px-sm py-xs text-sm"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-xs">
          <label
            htmlFor="new-password"
            className="font-semibold text-foreground-secondary text-xs uppercase tracking-wide"
          >
            New Password
          </label>
          <input
            id="new-password"
            className="w-full rounded border border-border bg-card px-sm py-xs text-sm"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="mt-xs">
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Changing..." : "Change Password"}
          </Button>
        </div>
      </form>
    </Surface>
  );
}
