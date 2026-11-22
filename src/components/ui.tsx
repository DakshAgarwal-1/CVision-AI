import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
};

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`card p-5 ${hover ? 'card-hover' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-lg font-bold text-navy-800">{title}</h2>
        {subtitle && <p className="text-sm text-navy-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type BadgeProps = {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'mint' | 'amber' | 'peach';
  size?: 'sm' | 'md';
};

export function Badge({ children, variant = 'neutral', size = 'sm' }: BadgeProps) {
  const variants: Record<string, string> = {
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    neutral: 'bg-navy-100 text-navy-600',
    mint: 'bg-accent-mint text-emerald-700',
    amber: 'bg-accent-amber text-amber-700',
    peach: 'bg-accent-peach text-orange-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-lg font-semibold ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  color?: string;
  showPercentage?: boolean;
};

export function ProgressBar({
  value,
  max = 100,
  label,
  color,
  showPercentage = true,
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);

  const barColor =
    color ||
    (percentage >= 80
      ? 'from-emerald-400 to-emerald-500'
      : percentage >= 50
      ? 'from-primary-400 to-indigo-500'
      : percentage >= 25
      ? 'from-amber-400 to-orange-400'
      : 'from-orange-400 to-red-400');

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-navy-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-bold text-navy-800">{percentage}%</span>
          )}
        </div>
      )}
      <div className="h-2.5 w-full bg-navy-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

type SkillPillProps = {
  children: ReactNode;
  variant?: 'matched' | 'missing' | 'neutral';
};

export function SkillPill({ children, variant = 'neutral' }: SkillPillProps) {
  const variants = {
    matched: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    missing: 'bg-red-50 text-red-600 border border-red-200',
    neutral: 'bg-primary-50 text-primary-700 border border-primary-100',
  };

  return (
    <span className={`skill-pill ${variants[variant]}`}>
      {children}
    </span>
  );
}

type ButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
};

export function Button({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: `${base} text-white bg-gradient-to-r from-primary-500 to-indigo-500 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`,
    secondary: `${base} text-navy-700 bg-white border border-navy-200 hover:border-primary-300 hover:bg-primary-50`,
    ghost: `${base} text-navy-600 hover:bg-navy-100`,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

type StatCardProps = {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  badge?: ReactNode;
  bgClass: string;
  iconBg: string;
};

export function StatCard({ icon, title, value, subtitle, badge, bgClass, iconBg }: StatCardProps) {
  return (
    <div className={`card p-5 ${bgClass} border-0`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {badge}
      </div>
      <p className="text-sm font-medium text-slate-700 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-xs text-slate-600">{subtitle}</p>
    </div>
  );
}

type AvatarProps = {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  src?: string | null;
};

export function Avatar({ name, size = 'md', src }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-primary-500 to-indigo-500 text-white font-semibold flex items-center justify-center`}>
      {initials}
    </div>
  );
}

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4 text-primary-400">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-navy-700 mb-1">{title}</h3>
      <p className="text-sm text-navy-500 max-w-sm mb-4">{message}</p>
      {action}
    </div>
  );
}

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-3" style={{ borderWidth: '3px' }} />
      <p className="text-sm text-navy-500">{message}</p>
    </div>
  );
}
