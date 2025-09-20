'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { OnlineStatusIndicator } from '@/components/OnlineStatusIndicator';
import { Calendar, Share2, User, ArrowLeft, Home } from 'lucide-react';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showNavigation?: boolean;
}

export function AppHeader({ 
  title = "Poker Notes", 
  showBackButton = false, 
  showNavigation = true
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="p-2 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:ml-2 sm:inline">Back</span>
            </Button>
          ) : null}
          <h1 className="text-xl font-bold">{title}</h1>
          <div className="hidden sm:block">
            <OnlineStatusIndicator />
          </div>
        </div>

        {/* Desktop Navigation */}
        {showNavigation && (
          <nav className="hidden sm:flex items-center gap-2">
            <Button
              variant={isActive('/') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => router.push('/')}
              className={`flex items-center gap-2 ${isActive('/') ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button
              variant={isActive('/sessions') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => router.push('/sessions')}
              className={`flex items-center gap-2 ${isActive('/sessions') ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            >
              <Calendar className="h-4 w-4" />
              Sessions
            </Button>
            <Button
              variant={isActive('/tracked') || pathname.startsWith('/tracked/') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => router.push('/tracked')}
              className={`flex items-center gap-2 ${isActive('/tracked') || pathname.startsWith('/tracked/') ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            >
              <Share2 className="h-4 w-4" />
              Tracked
            </Button>
            <Button
              variant={isActive('/account') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => router.push('/account')}
              className={`flex items-center gap-2 ${isActive('/account') ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            >
              <User className="h-4 w-4" />
              Account
            </Button>
          </nav>
        )}
        
        <div className="flex items-center gap-2">
          <div className="block sm:hidden">
            <OnlineStatusIndicator />
          </div>
        </div>
      </div>
    </header>
  );
}