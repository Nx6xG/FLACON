import { NavLink, useLocation } from 'react-router-dom';
import { Library, Search, Trophy, Heart, BarChart3, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User | null;
  onSignOut: () => void;
}

const navItems = [
  { to: '/', icon: Library, label: 'Sammlung' },
  { to: '/search', icon: Search, label: 'Suche' },
  { to: '/ranking', icon: Trophy, label: 'Ranking' },
  { to: '/wishlist', icon: Heart, label: 'Wunschliste' },
  { to: '/stats', icon: BarChart3, label: 'Statistiken' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Header({ user, onSignOut }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change (e.g. browser back)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-bg/85 backdrop-blur-xl border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <NavLink to="/" className="font-display text-2xl font-light tracking-[6px] text-gold uppercase">
            <span className="font-semibold">F</span>lacon
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-sm text-[13px] font-medium transition-all ${
                    isActive ? 'text-gold bg-surface-2' : 'text-txt-dim hover:text-txt hover:bg-surface'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}

            {user && (
              <button
                onClick={onSignOut}
                className="ml-2 p-2 text-txt-muted hover:text-txt transition-colors"
                title="Abmelden"
              >
                <LogOut size={16} />
              </button>
            )}
          </nav>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-txt-dim hover:text-txt"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-bg/95 backdrop-blur-xl md:hidden" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4rem)' }}>
          <nav className="flex flex-col p-6 gap-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-sm text-base font-medium transition-all ${
                    isActive ? 'text-gold bg-surface-2' : 'text-txt-dim hover:text-txt hover:bg-surface'
                  }`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            ))}

            {user && (
              <button
                onClick={() => { onSignOut(); setMobileOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-sm text-base font-medium text-txt-muted hover:text-txt mt-4 border-t border-border pt-6"
              >
                <LogOut size={20} />
                Abmelden
              </button>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
