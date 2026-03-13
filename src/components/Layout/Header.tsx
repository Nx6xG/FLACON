import { NavLink, useLocation } from 'react-router-dom';
import { Library, Search, Trophy, Heart, BarChart3, Settings, LogOut, Menu, X, CalendarDays, ArrowLeftRight, Clock, MoreHorizontal } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User | null;
  onSignOut: () => void;
}

const primaryNav = [
  { to: '/', icon: Library, label: 'Sammlung' },
  { to: '/search', icon: Search, label: 'Suche' },
  { to: '/ranking', icon: Trophy, label: 'Ranking' },
  { to: '/wishlist', icon: Heart, label: 'Wunschliste' },
  { to: '/stats', icon: BarChart3, label: 'Statistiken' },
];

const secondaryNav = [
  { to: '/wear', icon: CalendarDays, label: 'Tagebuch' },
  { to: '/compare', icon: ArrowLeftRight, label: 'Vergleich' },
  { to: '/timeline', icon: Clock, label: 'Timeline' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const allNav = [...primaryNav, ...secondaryNav];

export function Header({ user, onSignOut }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const moreRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isSecondaryActive = secondaryNav.some((item) => location.pathname === item.to);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  // Close "more" dropdown on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [moreOpen]);

  // Hide header on scroll down (mobile only), show on scroll up
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onScroll = () => {
      if (!mq.matches) { setHidden(false); return; }
      const y = window.scrollY;
      if (y > lastScrollY.current && y > 80) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-50 bg-bg/85 backdrop-blur-xl border-b border-border pt-[env(safe-area-inset-top)] transition-transform duration-300 ${hidden && !mobileOpen ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <NavLink to="/" className="font-display text-2xl font-light tracking-[6px] text-gold uppercase">
            <span className="font-semibold">F</span>lacon
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {primaryNav.map(({ to, icon: Icon, label }) => (
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

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-sm text-[13px] font-medium transition-all ${
                  moreOpen || isSecondaryActive ? 'text-gold bg-surface-2' : 'text-txt-dim hover:text-txt hover:bg-surface'
                }`}
              >
                <MoreHorizontal size={16} />
                Mehr
              </button>

              {moreOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-xl py-1 z-50">
                  {secondaryNav.map(({ to, icon: Icon, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all ${
                          isActive ? 'text-gold bg-surface-2' : 'text-txt-dim hover:text-txt hover:bg-surface'
                        }`
                      }
                    >
                      <Icon size={15} />
                      {label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

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
          <nav className="flex flex-col p-6 gap-1">
            {primaryNav.map(({ to, icon: Icon, label }) => (
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

            <div className="my-2 border-t border-border" />
            <span className="px-4 text-[10px] text-txt-muted uppercase tracking-wider mb-1">Weitere</span>

            {secondaryNav.map(({ to, icon: Icon, label }) => (
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
                className="flex items-center gap-3 px-4 py-3 rounded-sm text-base font-medium text-txt-muted hover:text-txt mt-2 border-t border-border pt-5"
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
