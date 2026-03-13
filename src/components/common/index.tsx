import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { X, Check } from 'lucide-react';

// === Button ===
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'font-body font-semibold rounded-sm cursor-pointer transition-all inline-flex items-center gap-2 tracking-wide disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gold text-bg hover:bg-gold-light hover:-translate-y-0.5',
    ghost: 'bg-surface text-txt-dim border border-border hover:border-border-light hover:text-txt',
    danger: 'bg-[#3a1a1a] text-accent-rose border border-[#4a2a2a] hover:bg-[#4a2222]',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-[13px]',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// === Modal ===
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, footer, wide }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';

      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') { onClose(); return; }

        // Focus trap
        if (e.key === 'Tab' && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus(); }
          } else {
            if (document.activeElement === last) { e.preventDefault(); first.focus(); }
          }
        }
      };

      window.addEventListener('keydown', handleKey);

      // Auto-focus first focusable element
      requestAnimationFrame(() => {
        const first = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea'
        );
        first?.focus();
      });

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKey);
      };
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => e.target === overlayRef.current && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div ref={modalRef} className={`bg-surface border border-border rounded-t-lg sm:rounded-lg w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} max-h-[90vh] sm:max-h-[85vh] flex flex-col animate-slide-up pb-[env(safe-area-inset-bottom)]`}>
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="font-display text-lg sm:text-xl text-txt truncate mr-2">{title}</h2>
          <button onClick={onClose} className="text-txt-muted hover:text-txt transition-colors p-1" aria-label="Schließen">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="p-4 border-t border-border shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

// === Star Rating ===
interface StarRatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md';
  label?: string;
}

export function StarRating({ value, max = 10, onChange, size = 'md', label }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const isReadonly = !onChange;
  const px = size === 'sm' ? 'w-5 h-5 sm:w-4 sm:h-4' : 'w-6 h-6 sm:w-5 sm:h-5';

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs text-txt-muted uppercase tracking-wider">{label}</span>}
      <div className="flex items-center gap-1">
        <div className="flex gap-0.5">
          {Array.from({ length: max }, (_, i) => {
            const filled = (hover || value) > i;
            return (
              <button
                key={i}
                type="button"
                disabled={isReadonly}
                className={`${px} transition-colors ${isReadonly ? 'cursor-default' : 'cursor-pointer'}`}
                onMouseEnter={() => !isReadonly && setHover(i + 1)}
                onMouseLeave={() => !isReadonly && setHover(0)}
                onClick={() => onChange?.(i + 1)}
              >
                <svg viewBox="0 0 20 20" fill={filled ? '#c9a96e' : '#3a342c'}>
                  <path d="M10 1l2.39 4.84L17.82 7l-3.91 3.81.92 5.39L10 13.47l-4.83 2.73.92-5.39L2.18 7l5.43-1.16L10 1z" />
                </svg>
              </button>
            );
          })}
        </div>
        <span className="text-sm text-txt-dim ml-1 font-body tabular-nums">{value}/{max}</span>
      </div>
    </div>
  );
}

// === Input ===
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-xs text-txt-muted uppercase tracking-wider">{label}</span>}
      <input
        className={`bg-surface-2 border border-border rounded-sm px-3 py-2.5 text-sm text-txt placeholder:text-txt-muted focus:outline-none focus:border-gold-dim transition-colors font-body ${className}`}
        {...props}
      />
    </label>
  );
}

// === Textarea ===
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-xs text-txt-muted uppercase tracking-wider">{label}</span>}
      <textarea
        className={`bg-surface-2 border border-border rounded-sm px-3 py-2.5 text-sm text-txt placeholder:text-txt-muted focus:outline-none focus:border-gold-dim transition-colors font-body resize-none ${className}`}
        {...props}
      />
    </label>
  );
}

// === Select ===
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-xs text-txt-muted uppercase tracking-wider">{label}</span>}
      <div className="relative">
        <select
          className={`bg-surface-2 border border-border rounded-sm px-3 py-2.5 pr-8 text-sm text-txt focus:outline-none focus:border-gold-dim transition-colors font-body appearance-none w-full ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-txt-muted" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </div>
    </label>
  );
}

// === Badge ===
interface BadgeProps {
  children: ReactNode;
  color?: string;
}

export function Badge({ children, color }: BadgeProps) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: color ? `${color}22` : 'var(--tw-surface-2, #242019)',
        color: color || '#9a9088',
        border: `1px solid ${color ? `${color}44` : '#3a342c'}`,
      }}
    >
      {children}
    </span>
  );
}

// === Tier Badge ===
const tierColors: Record<string, string> = {
  S: '#c9a96e',
  A: '#6a9a8a',
  B: '#7a8aaa',
  C: '#9a9088',
  D: '#c47a7a',
};

export function TierBadge({ tier }: { tier: string }) {
  const color = tierColors[tier] || '#9a9088';
  return (
    <span
      className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold font-body"
      style={{
        backgroundColor: `${color}22`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {tier}
    </span>
  );
}

// === Empty State ===
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-txt-muted mb-4">{icon}</div>
      <h3 className="font-display text-xl text-txt mb-2">{title}</h3>
      <p className="text-sm text-txt-muted max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

// === Toast ===
interface ToastItem {
  id: number;
  message: string;
  onUndo?: () => void;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, onUndo?: () => void) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, onUndo }]);
    const timer = setTimeout(() => {
      timers.current.delete(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, onUndo ? 5000 : 2500);
    timers.current.set(id, timer);
  }, []);

  return { toasts, show, dismiss };
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss?: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center w-[calc(100%-2rem)] sm:w-auto pb-[env(safe-area-inset-bottom)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 bg-surface-2 border border-gold-dim/40 rounded-sm px-4 py-2.5 shadow-lg animate-slide-up"
        >
          <Check size={14} className="text-accent-fresh shrink-0" />
          <span className="text-sm text-txt">{t.message}</span>
          {t.onUndo && (
            <button
              onClick={() => {
                t.onUndo?.();
                onDismiss?.(t.id);
              }}
              className="ml-2 text-xs font-semibold text-gold hover:text-gold-light transition-colors"
            >
              Rückgängig
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
