'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Calendar, User, History } from 'lucide-react';

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/',
      active: pathname === '/',
    },
    {
      icon: Calendar,
      label: 'Sessions',
      path: '/sessions',
      active: pathname === '/sessions',
    },
    {
      icon: History,
      label: 'History',
      path: '/history',
      active: pathname === '/history',
    },
    {
      icon: User,
      label: 'Account',
      path: '/account',
      active: pathname === '/account',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 sm:hidden">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                item.active
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
              }`}
            >
              <Icon className={`h-5 w-5 ${item.active ? 'text-emerald-600' : 'text-gray-600'}`} />
              <span className={`text-xs font-medium ${item.active ? 'text-emerald-600' : 'text-gray-600'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}