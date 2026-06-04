'use client';

import { usePathname } from 'next/navigation';
import { BottomTab } from '@/components/bottom-tab';

const NAV_HIDDEN_PREFIXES = ['/login', '/auth'];

export function LayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const showNav = !NAV_HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  return (
    <>
      <div style={{ paddingBottom: showNav ? 'calc(60px + env(safe-area-inset-bottom))' : 0 }}>
        {children}
      </div>
      {showNav && <BottomTab />}
    </>
  );
}
