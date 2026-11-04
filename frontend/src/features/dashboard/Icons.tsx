import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;
export function BikeIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="10" cy="37" r="6" />
      <circle cx="38" cy="37" r="6" />
      <circle cx="33" cy="8" r="4" fill="currentColor" stroke="none" />
      <path d="m24 15-9 8 8 7v9M24 15l6 8h7" />
    </svg>
  );
}
export function ArrowIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}
export function InfoIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6m0 4h.01" />
    </svg>
  );
}
