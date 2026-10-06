import { errorMessage } from "@shared/api/utils/errorNormalization";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import { ROUTES } from "@shared/constants/routes";

import { session } from "@shared/api/auth/session";
import { AuthPageShell } from "../../components/AuthPageShell";
import { LoginForm } from "./LoginForm";

export function LoginPage() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) return;
    void session
      .verifyEmail(token)
      .then(() => {
        toast.success("Email verified. Your API key is ready.");
        navigate({ to: ROUTES.welcome });
      })
      .catch((error: unknown) => toast.error(errorMessage(error)));
  }, [navigate]);
  return (
    <AuthPageShell
      title="Sign in to Optikk"
      subtitle="Welcome back. Pick up where your tenant left off."
      prompt="New to Optikk?"
      actionLabel="Create account"
      actionTo={ROUTES.signup}
    >
      <LoginForm />
      <SignupCta />
    </AuthPageShell>
  );
}

function SignupCta() {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-3 text-[11.5px] text-foreground-muted">
        <span className="h-px flex-1 bg-border" />
        <span>New to Optikk?</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <Link
        to={ROUTES.signup}
        data-testid="login-create-account"
        className="mt-4 flex h-[42px] w-full items-center justify-center rounded-md border border-border bg-card font-semibold text-[13.5px] text-foreground no-underline transition-colors duration-150 hover:border-foreground-muted hover:bg-surface-inset"
      >
        Create an account
      </Link>
    </div>
  );
}
