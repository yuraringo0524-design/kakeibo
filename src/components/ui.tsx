import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export function PageHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: boolean;
  right?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-[var(--bg)]/90 backdrop-blur px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 flex items-center gap-2 border-b border-[var(--border)]">
      {onBack && (
        <button
          onClick={() => navigate(-1)}
          className="tap-target -ml-2 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5"
          aria-label="戻る"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      <h1 className="text-lg font-bold flex-1 truncate">{title}</h1>
      {right}
    </header>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-4 ${className}`}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1 mb-2">
      <h2 className="text-sm font-bold text-[var(--text-muted)]">{children}</h2>
      {action}
    </div>
  );
}

export function ProgressBar({
  ratio,
  color = 'var(--color-orange-500)',
  warnColor = 'var(--color-warn-500)',
  warn = false,
  height = 10,
}: {
  ratio: number;
  color?: string;
  warnColor?: string;
  warn?: boolean;
  height?: number;
}) {
  const pct = Math.min(100, Math.max(0, ratio * 100));
  return (
    <div
      className="w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden"
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background: warn ? warnColor : color,
          backgroundImage: warn
            ? 'repeating-linear-gradient(135deg, rgba(255,255,255,0.25) 0 6px, transparent 6px 12px)'
            : undefined,
        }}
      />
    </div>
  );
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--text-muted)]">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex bg-black/5 dark:bg-white/10 rounded-full p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 text-sm font-bold py-1.5 rounded-full transition-colors tap-target ${
            value === opt.value
              ? 'bg-[var(--card)] text-orange-600 shadow-sm'
              : 'text-[var(--text-muted)]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '削除する',
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-6 sm:pb-4">
      <div className="card w-full max-w-sm p-5 animate-toast">
        <h3 className="font-bold text-base mb-1">{title}</h3>
        <p className="text-sm text-[var(--text-muted)] mb-5">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 tap-target rounded-2xl border border-[var(--border)] font-bold text-sm py-3"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 tap-target rounded-2xl font-bold text-sm py-3 text-white ${
              danger ? 'bg-warn-500' : 'bg-orange-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FormField({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-bold text-[var(--text-muted)] mb-1.5">{label}</label>
      {children}
      {error && (
        <p className="text-xs text-warn-500 font-bold mt-1 flex items-center gap-1">⚠ {error}</p>
      )}
    </div>
  );
}

export const inputClass =
  'w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 tap-target';
