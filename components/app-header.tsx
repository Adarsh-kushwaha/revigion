import type { ReactNode } from 'react';

interface AppHeaderProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export function AppHeader({ left, center, right }: AppHeaderProps) {
  return (
    <header
      className="flex items-center px-4 flex-shrink-0"
      style={{
        height: '56px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid rgba(17,17,16,0.10)',
        boxShadow: '0 1px 0 rgba(17,17,16,0.06)',
      }}
    >
      <div className="flex items-center">{left}</div>
      {center ? (
        <div className="flex-1 flex items-center justify-center px-2 min-w-0">
          {center}
        </div>
      ) : (
        <div className="flex-1" />
      )}
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}
