import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  icon?: ReactNode;
  accent?: 'default' | 'warning' | 'info' | 'success';
}

const ACCENT: Record<NonNullable<StatCardProps['accent']>, { fg: string; iconBg: string; iconFg: string; ring: string }> = {
  default: { fg: '#111110', iconBg: 'rgba(17,17,16,0.06)', iconFg: '#6B6A65', ring: 'rgba(17,17,16,0.08)' },
  warning: { fg: '#111110', iconBg: 'rgba(212,140,30,0.14)', iconFg: '#B86B00', ring: 'rgba(212,140,30,0.22)' },
  info:    { fg: '#111110', iconBg: 'rgba(31,91,170,0.12)', iconFg: '#1F5BAA', ring: 'rgba(31,91,170,0.20)' },
  success: { fg: '#111110', iconBg: 'rgba(47,122,63,0.12)', iconFg: '#2F7A3F', ring: 'rgba(47,122,63,0.22)' },
};

export function StatCard({ label, value, icon, accent = 'default' }: StatCardProps) {
  const tone = ACCENT[accent];
  return (
    <div
      className="flex flex-col rounded-2xl"
      style={{
        backgroundColor: '#FFFFFF',
        border: `1px solid ${tone.ring}`,
        boxShadow: '0 1px 2px rgba(17,17,16,0.04)',
        padding: '12px 14px',
        minHeight: '78px',
        justifyContent: 'space-between',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[13px] font-semibold"
          style={{ color: '#6B6A65', letterSpacing: '0.01em' }}
        >
          {label}
        </span>
        {icon && (
          <span
            className="flex items-center justify-center rounded-lg"
            style={{
              backgroundColor: tone.iconBg,
              color: tone.iconFg,
              width: '20px',
              height: '20px',
            }}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
      <span
        className="text-[24px] font-semibold leading-none tabular-nums"
        style={{ color: tone.fg, marginTop: '10px' }}
      >
        {value}
      </span>
    </div>
  );
}
