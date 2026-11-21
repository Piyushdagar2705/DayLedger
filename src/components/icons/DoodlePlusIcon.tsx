import type { SVGProps } from 'react';

interface DoodlePlusIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function DoodlePlusIcon({ size = 24, ...props }: DoodlePlusIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 4.2C12.05 6.8 12.04 9.4 12.02 12.02C12 14.64 12 17.26 12.06 19.84"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.25 12.03C6.85 11.99 9.46 11.99 12.06 12.01C14.66 12.03 17.25 12.02 19.85 12.07"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}