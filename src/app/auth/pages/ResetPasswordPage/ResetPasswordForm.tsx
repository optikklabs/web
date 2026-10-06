import { errorMessage } from "@shared/api/utils/errorNormalization";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { session } from "@shared/api/auth/session";
import { ROUTES } from "@shared/constants/routes";
import {
  AuthField,
  AuthSubmitButton,
  PasswordVisibilityButton,
} from "../../components/AuthFormControls";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const { token } = useSearch({ strict: false }) as { token?: string };

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!token) {
      toast.error("Reset token is missing from the URL.");
      return;
    }

    const parsed = resetPasswordSchema.safeParse({ password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }

    setIsSubmitting(true);
    try {
      await session.resetPassword(token, parsed.data.password);
      toast.success("Password reset successfully. You can now sign in.");
      navigate({ to: ROUTES.login });
    } catch (error: unknown) {
      toast.error(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      <AuthField
        id="password"
        testIdPrefix="reset"
        label="New password"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={setPassword}
        placeholder="••••••••••••"
        icon={<Lock size={15} strokeWidth={2} />}
        required
        autoComplete="new-password"
        endSlot={<PasswordVisibilityButton visible={showPassword} onChange={setShowPassword} />}
      />
      <AuthSubmitButton testIdPrefix="reset" loading={isSubmitting}>
        Set password
      </AuthSubmitButton>
    </form>
  );
}
