'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

const baseTabs = [
  { href: '/', label: 'ホーム', icon: '📊' },
  { href: '/questions', label: '問題', icon: '📋' },
  { href: '/exercise', label: '演習', icon: '✏️' },
  { href: '/triage', label: '精査', icon: '🤖', adminOnly: true },
  { href: '/account', label: 'アカウント', icon: '👤' },
] as const;

export default function NavBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);
  const tabs = baseTabs.filter((t) => !('adminOnly' in t && t.adminOnly) || isAdmin);

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 z-50">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive =
            tab.href === '/'
              ? pathname === '/'
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                isActive
                  ? 'text-indigo-600 font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
