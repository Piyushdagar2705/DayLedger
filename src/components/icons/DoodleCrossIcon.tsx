import type { SVGProps } from 'react';

interface DoodleCrossIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function DoodleCrossIcon({ size = 18, ...props }: DoodleCrossIconProps) {
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
        d="M5.2 5.6C7.4 7.9 9.7 10.1 12 12.4C14.2 14.6 16.4 16.7 18.6 18.9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.4 5.4C16.1 7.8 13.8 10.2 11.5 12.5C9.2 14.9 7 17.2 4.8 19.4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}