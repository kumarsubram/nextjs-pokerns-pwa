'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { OnlineStatusIndicator } from '@/components/OnlineStatusIndicator';
import { Plus, Calendar, History, User, ArrowLeft, Home } from 'lucide-react';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showNavigation?: boolean;
  showNewSession?: boolean;
}

export function AppHeader({ 
  title = "Poker Notes", 
  showBackButton = false, 
  showNavigation = true,
  showNewSession = true 
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
          <nav className="hidden sm:flex items-center gap-1">
            <Button
              variant={isActive('/') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => router.push('/')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button
              variant={isActive('/sessions') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => router.push('/sessions')}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Sessions
            </Button>
            <Button
              variant={isActive('/history') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => router.push('/history')}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              History
            </Button>
            <Button
              variant={isActive('/account') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => router.push('/account')}
              className="flex items-center gap-2"
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
          {showNewSession && (
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => router.push('/create-session')}
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Session</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}