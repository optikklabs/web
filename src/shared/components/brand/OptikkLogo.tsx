import { useId } from "react";

interface OptikkLogoProps {
  readonly size?: number;
  readonly className?: string;
  readonly title?: string;
}

export function OptikkLogo({ size = 24, className, title }: OptikkLogoProps) {
  const gradientId = useId().replaceAll(":", "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      className={className}
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient
          id={gradientId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#5B5FD6" />
          <stop offset="100%" stopColor="#4FA9D8" />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="80" fill={`url(#${gradientId})`} />

      <polygon
        points="256,133 390,203 256,273 122,203"
        fill="none"
        stroke="white"
        strokeWidth="24"
        strokeLinejoin="round"
      />

      <polyline
        points="140,258 256,318 372,258"
        fill="none"
        stroke="white"
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <polyline
        points="140,318 256,378 372,318"
        fill="none"
        stroke="white"
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
