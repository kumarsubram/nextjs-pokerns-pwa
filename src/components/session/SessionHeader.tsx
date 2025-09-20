'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SessionMetadata } from '@/types/poker-v2';

interface SessionHeaderProps {
  session: SessionMetadata;
  onBack: () => void;
  onEndSession: () => void;
}

export function SessionHeader({ session, onBack, onEndSession }: SessionHeaderProps) {
  return (
    <div className="bg-white border-b px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-1 flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-semibold truncate">{session.sessionName}</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onEndSession}
          className="text-red-600 text-sm px-3 py-1.5 flex-shrink-0 font-medium"
        >
          End Session
        </Button>
      </div>
    </div>
  );
}