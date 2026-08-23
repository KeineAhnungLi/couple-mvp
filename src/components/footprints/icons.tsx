import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 24) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none" });

export function FootprintIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <path d="M9.3 11.7c2.2.8 3.2 3 2.3 5.1-.9 2.2-3 3.4-5 2.6-2.2-.8-3.1-3-2.3-5.2.8-2.1 2.9-3.3 5-2.5Z" fill="currentColor" />
      <circle cx="7.2" cy="7.1" r="1.65" fill="currentColor" />
      <circle cx="10.2" cy="5.4" r="1.45" fill="currentColor" />
      <circle cx="13" cy="5.4" r="1.25" fill="currentColor" />
      <circle cx="15.2" cy="7" r="1.05" fill="currentColor" />
      <circle cx="16.4" cy="9.2" r=".85" fill="currentColor" />
    </svg>
  );
}

export function CalendarIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 3v4M17 3v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 14h2M12 14h2M17 14h.01M7 17.5h2M12 17.5h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BookHeartIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <path d="M4 4.5h5.2c1.6 0 2.8.7 2.8 2.2v13c0-1.4-1.2-2.2-2.8-2.2H4V4.5Zm16 0h-5.2c-1.6 0-2.8.7-2.8 2.2v13c0-1.4 1.2-2.2 2.8-2.2H20V4.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 10.8c1.5-2.1 4.8-.8 4.4 1.6-.3 1.7-2.3 2.9-4.4 4.4-2.1-1.5-4.1-2.7-4.4-4.4-.4-2.4 2.9-3.7 4.4-1.6Z" fill="currentColor" opacity=".8" />
    </svg>
  );
}

export function UserIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 21c.5-4.2 3.3-6.5 7.5-6.5s7 2.3 7.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.3" stroke="currentColor" strokeWidth="1.8" />
      <path d="m15.5 15.5 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PinIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <path d="M12 21s6-5.6 6-11a6 6 0 1 0-12 0c0 5.4 6 11 6 11Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function ClockIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CameraIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <path d="M4 8.5h3l1.2-2h7.6l1.2 2h3a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="14" r="3.3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 22, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 22, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <path d="m15 5-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SmileIcon({ size = 22, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M8.3 14.2c1 1.7 2.2 2.5 3.7 2.5s2.8-.8 3.7-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
