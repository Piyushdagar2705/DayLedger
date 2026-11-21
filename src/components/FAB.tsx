import { DoodlePlusIcon } from './icons/DoodlePlusIcon';

interface FABProps {
  onClick: () => void;
  ariaLabel: string;
  variant?: 'default' | 'icon-only';
}

export function FAB({ onClick, ariaLabel, variant = 'default' }: FABProps) {
  const isIconOnly = variant === 'icon-only';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`focus-ring touch-target inline-flex h-14 w-14 items-center justify-center rounded-xl transition active:translate-y-px ${
        isIconOnly ? 'bg-transparent border-none shadow-none text-white hover:text-indigo-300' : 'bg-accent text-white hover:bg-indigo-500'
      }`}
    >
      <DoodlePlusIcon aria-hidden="true" className="h-6 w-6" />
    </button>
  );
}
