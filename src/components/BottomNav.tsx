import { useEffect } from 'react';
import { BarChart3, ClipboardList, Home, Receipt } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Home',
    icon: Home,
    end: true,
  },
  {
    to: '/expenses',
    label: 'Expenses',
    icon: Receipt,
  },
  {
    to: '/todos',
    label: 'Todos',
    icon: ClipboardList,
  },
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: BarChart3,
  },
];

interface AnimatedNavIconProps {
  icon: LucideIcon;
  isActive: boolean;
  className: string;
}

const LAVA_PLAYBACK_RATE = 0.65;

function scaledDuration(baseDuration: number): number {
  return baseDuration / LAVA_PLAYBACK_RATE;
}

function AnimatedNavIcon({ icon: Icon, isActive, className }: AnimatedNavIconProps) {
  const controls = useAnimationControls();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      controls.set({ scale: 1, y: 0 });
      return;
    }

    if (!isActive) {
      void controls.start({ scale: 1, y: 0, transition: { duration: scaledDuration(0.12) } });
      return;
    }

    void controls.start({
      scale: [1, 0.78, 1.16, 0.98, 1],
      y: [0, 2, -1, 0, 0],
      transition: {
        duration: scaledDuration(0.42),
        times: [0, 0.28, 0.55, 0.78, 1],
      },
    });

    return () => {
      controls.stop();
    };
  }, [controls, isActive, prefersReducedMotion]);

  return (
    <motion.span aria-hidden="true" className={`inline-flex ${className}`} initial={false} animate={controls}>
      <Icon aria-hidden="true" className="h-4 w-4" />
    </motion.span>
  );
}

export function BottomNav() {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-borderSubtle bg-bgBase/95 backdrop-blur"
      style={{
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 px-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="group focus-ring touch-target flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition-colors"
            >
              {({ isActive }) => (
                <>
                  <AnimatedNavIcon
                    icon={Icon}
                    isActive={isActive}
                    className={isActive ? 'text-accent' : 'text-textMuted group-hover:text-textPrimary'}
                  />
                  <span className={isActive ? 'text-accent' : 'text-textMuted group-hover:text-textPrimary'}>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
