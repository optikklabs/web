import { errorMessage } from "@shared/api/utils/errorNormalization";
import { Link, useNavigate } from "@tanstack/react-router";
import { Building2, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { ROUTES } from "@shared/constants/routes";

import { session } from "@shared/api/auth/session";
import {
  AuthField,
  AuthFieldError,
  AuthSubmitButton,
  PasswordVisibilityButton,
} from "../../components/AuthFormControls";

const signupSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name"),
  orgName: z.string().trim().min(1, "Please enter your organization"),
  email: z.string().trim().min(1, "Please enter your email").email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  acceptedTerms: z
    .boolean()
    .refine((v) => v, { message: "Please accept the Terms of Service and Privacy Policy" }),
});

type SignupField = keyof z.infer<typeof signupSchema>;
type FieldErrors = Partial<Record<SignupField, string>>;

function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as SignupField | undefined;
    if (field != null && errors[field] == null) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

export function SignupForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = (field: SignupField): void => {
    setErrors((current) => (current[field] == null ? current : { ...current, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ name, orgName, email, password, acceptedTerms });
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setErrors({});

    setIsSubmitting(true);
    let result: "verificationRequired" | "signedIn";
    try {
      result = await session.signup(parsed.data);
    } catch (error: unknown) {
      toast.error(errorMessage(error));
      setIsSubmitting(false);
      return;
    }

    if (result === "signedIn") {
      toast.success("Account created.");
      navigate({ to: ROUTES.welcome });
      return;
    }
    toast.success("Check your email to verify your account.");
    navigate({ to: ROUTES.login });
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      <AuthField
        id="name"
        testIdPrefix="signup"
        label="Your name"
        type="text"
        value={name}
        onChange={(v) => {
          setName(v);
          clearError("name");
        }}
        placeholder="Ada Lovelace"
        icon={<User size={15} strokeWidth={2} />}
        autoComplete="name"
        error={errors.name}
      />
      <AuthField
        id="orgName"
        testIdPrefix="signup"
        label="Organization"
        type="text"
        value={orgName}
        onChange={(v) => {
          setOrgName(v);
          clearError("orgName");
        }}
        placeholder="Acme, Inc."
        icon={<Building2 size={15} strokeWidth={2} />}
        autoComplete="organization"
        error={errors.orgName}
      />
      <AuthField
        id="email"
        testIdPrefix="signup"
        label="Work email"
        type="email"
        value={email}
        onChange={(v) => {
          setEmail(v);
          clearError("email");
        }}
        placeholder="you@company.com"
        icon={<Mail size={15} strokeWidth={2} />}
        autoComplete="email"
        error={errors.email}
      />
      <AuthField
        id="password"
        testIdPrefix="signup"
        label="Password"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(v) => {
          setPassword(v);
          clearError("password");
        }}
        placeholder="At least 8 characters"
        icon={<Lock size={15} strokeWidth={2} />}
        autoComplete="new-password"
        endSlot={<PasswordVisibilityButton visible={showPassword} onChange={setShowPassword} />}
        error={errors.password}
      />
      <TermsCheckbox
        checked={acceptedTerms}
        onChange={(v) => {
          setAcceptedTerms(v);
          clearError("acceptedTerms");
        }}
        error={errors.acceptedTerms}
      />
      <AuthSubmitButton testIdPrefix="signup" loading={isSubmitting}>
        Create account
      </AuthSubmitButton>
      <SignInLine />
    </form>
  );
}

function SignInLine() {
  return (
    <p className="mt-4 text-center text-[12.5px] text-foreground-muted">
      Already have an account?{" "}
      <Link
        to={ROUTES.login}
        className="font-semibold text-[var(--login-link)] no-underline hover:underline"
      >
        Sign in
      </Link>
    </p>
  );
}

function TermsCheckbox({
  checked,
  onChange,
  error,
}: {
  readonly checked: boolean;
  readonly onChange: (next: boolean) => void;
  readonly error?: string;
}) {
  return (
    <div className="mt-4 grid gap-1.5">
      <label className="flex cursor-pointer items-start gap-2.5 text-[12px] text-foreground-muted leading-[1.5]">
        <input
          id="acceptedTerms"
          data-testid="signup-terms"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error != null || undefined}
          aria-describedby={error != null ? "acceptedTerms-error" : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
        />
        <span>
          I agree to Optikk&apos;s{" "}
          <a href={ROUTES.terms} className="text-foreground-secondary underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href={ROUTES.privacy} className="text-foreground-secondary underline">
            Privacy Policy
          </a>
          .
        </span>
      </label>
      {error && <AuthFieldError id="acceptedTerms" message={error} />}
    </div>
  );
}
