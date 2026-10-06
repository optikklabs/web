import { pickByHash } from "@shared/utils/cyclic";

const PALETTE = [
  "var(--color-primary-subtle-25)",
  "var(--color-warning-subtle)",
  "var(--color-success-subtle)",
  "var(--color-error-subtle)",
  "var(--color-info-subtle)",
] as const;

function getInitials(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9]+/g, " ").trim();
  if (!cleaned) return "?";
  const [first = "", second] = cleaned.split(/\s+/);
  if (!second) return first.slice(0, 2).toUpperCase();
  return (first.charAt(0) + second.charAt(0)).toUpperCase();
}

interface ServiceAvatarProps {
  readonly serviceName: string;
  readonly size?: number;
}

export function ServiceAvatar({ serviceName, size = 44 }: ServiceAvatarProps) {
  const bg = pickByHash(PALETTE, serviceName);
  const fontSize = Math.max(9, Math.round(size * 0.32));
  return (
    <div
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-md font-semibold text-foreground"
      style={{
        backgroundColor: bg,
        width: size,
        height: size,
        fontSize,
      }}
    >
      {getInitials(serviceName)}
    </div>
  );
}
