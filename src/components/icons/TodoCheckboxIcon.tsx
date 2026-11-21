import type { SVGProps } from 'react';

interface TodoCheckboxIconProps extends SVGProps<SVGSVGElement> {
  checked: boolean;
  size?: number;
}

const CHECKBOX_PATH_D =
  'M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16';

export function TodoCheckboxIcon({ checked, size = 16, className, ...props }: TodoCheckboxIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d={CHECKBOX_PATH_D}
        pathLength={575.0541381835938}
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition: 'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease',
          strokeDasharray: checked ? '70.5096664428711 9999999' : '241 9999999',
          strokeDashoffset: checked ? -262.2723388671875 : 0,
        }}
      />
    </svg>
  );
}