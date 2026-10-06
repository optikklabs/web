import { errorMessage } from "@shared/api/utils/errorNormalization";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Lock, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { ROUTES } from "@shared/constants/routes";

import { safeAuthRedirect } from "@shared/api/auth/redirect";
import { session } from "@shared/api/auth/session";

import { useAppStore } from "@app/store/appStore";
import {
  AuthField,
  AuthSubmitButton,
  PasswordVisibilityButton,
} from "../../components/AuthFormControls";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Please enter your email").email("Please enter a valid email"),
  password: z.string().min(1, "Please enter your password"),
});

export function LoginForm() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ strict: false }) as { redirect?: string };
  const setTimeRange = useAppStore((s) => s.setTimeRange);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }

    setIsSubmitting(true);
    try {
      await session.login(parsed.data.email, parsed.data.password);
    } catch (error: unknown) {
      toast.error(errorMessage(error));
      setIsSubmitting(false);
      return;
    }

    setTimeRange({ kind: "relative", preset: "30m", label: "Last 30 minutes", minutes: 30 });
    toast.success("Login successful!");
    navigate({ to: safeAuthRedirect(redirect) as string & {} });
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      <AuthField
        id="email"
        testIdPrefix="login"
        label="Work email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@company.com"
        icon={<Mail size={15} strokeWidth={2} />}
        required
        autoComplete="email"
      />
      <AuthField
        id="password"
        testIdPrefix="login"
        label={
          <div className="flex w-full items-center justify-between">
            <span>Password</span>
            <Link
              to="/forgot-password"
              className="font-normal text-[var(--login-link)] normal-case tracking-normal no-underline hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        }
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={setPassword}
        placeholder="••••••••••••"
        icon={<Lock size={15} strokeWidth={2} />}
        required
        autoComplete="current-password"
        endSlot={<PasswordVisibilityButton visible={showPassword} onChange={setShowPassword} />}
      />
      <AuthSubmitButton testIdPrefix="login" loading={isSubmitting}>
        Sign in
      </AuthSubmitButton>
      <RequestAccessLine />
      <LegalLine />
    </form>
  );
}

function RequestAccessLine() {
  return (
    <p className="mt-4 text-center text-[12.5px] text-foreground-muted">
      Want to deploy your own instance?{" "}
      <a
        href={ROUTES.selfHost}
        className="font-semibold text-[var(--login-link)] no-underline hover:underline"
      >
        Self-host now
      </a>
    </p>
  );
}

function LegalLine() {
  return (
    <p className="mx-auto mt-[22px] max-w-[320px] text-center text-[11px] text-foreground-muted leading-[1.5]">
      By signing in you agree to Optikk&apos;s{" "}
      <a href={ROUTES.terms} className="text-foreground-secondary underline">
        Terms of Service
      </a>{" "}
      and{" "}
      <a href={ROUTES.privacy} className="text-foreground-secondary underline">
        Privacy Policy
      </a>
      .
    </p>
  );
}
