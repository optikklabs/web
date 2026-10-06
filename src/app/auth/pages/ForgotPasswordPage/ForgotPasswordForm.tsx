import { errorMessage } from "@shared/api/utils/errorNormalization";
import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { session } from "@shared/api/auth/session";
import { AuthField, AuthSubmitButton } from "../../components/AuthFormControls";

const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Please enter your email").email("Please enter a valid email"),
});

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }

    setIsSubmitting(true);
    try {
      await session.forgotPassword(parsed.data.email);
      setIsSuccess(true);
      toast.success("If your email is registered, a reset link has been sent.");
    } catch (error: unknown) {
      toast.error(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="rounded-md border border-border bg-card p-4 text-[13.5px] text-foreground">
        <p className="mb-2 font-semibold">Check your inbox</p>
        <p className="text-foreground-muted">
          We've sent a password reset link to <strong>{email}</strong>. It will expire in 30
          minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      <AuthField
        id="email"
        testIdPrefix="forgot"
        label="Work email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@company.com"
        icon={<Mail size={15} strokeWidth={2} />}
        required
        autoComplete="email"
      />
      <AuthSubmitButton testIdPrefix="forgot" loading={isSubmitting}>
        Send reset link
      </AuthSubmitButton>
    </form>
  );
}
