'use client';

import { useState, useEffect } from 'react';
import { X, MousePointer2, Info } from 'lucide-react';
import { Position } from '@/types/poker-v2';

interface ActionHintsProps {
  userSeat?: Position;
  nextToAct?: Position;
  visible?: boolean;
  sessionId: string;
  handNumber: number;
}

export function ActionHints({ userSeat, nextToAct, visible = true, sessionId, handNumber }: ActionHintsProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Storage key is specific to each session
  const STORAGE_KEY = `hideActionHints_${sessionId}`;

  useEffect(() => {
    // Always show hints for Hand #1 of a new session
    if (handNumber === 1) {
      setIsDismissed(false);
      // Clear any previous dismissal for this session
      localStorage.removeItem(STORAGE_KEY);
    } else {
      // For subsequent hands, check if user dismissed it
      const hidden = localStorage.getItem(STORAGE_KEY);
      if (hidden === 'true') {
        setIsDismissed(true);
      }
    }
  }, [handNumber, sessionId, STORAGE_KEY]);

  const handleDismiss = () => {
    setIsDismissed(true);
    // Save dismissal for this specific session
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleRestore = () => {
    setIsDismissed(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!visible) return null;

  if (isDismissed) {
    return (
      <div className="mb-3">
        <button
          onClick={handleRestore}
          className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1.5 font-medium"
        >
          <Info className="h-4 w-4" />
          <span>Show action hints</span>
        </button>
      </div>
    );
  }

  const isUserTurn = nextToAct === userSeat;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
      <div className="space-y-2">
        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <MousePointer2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              Tap any seat on the table to choose an action for that seat
            </p>
          </div>

          {!isUserTurn && userSeat && (
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                If a seat is after your position in the action order, you must record your action first
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="w-full bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
        >
          <X className="h-4 w-4" />
          <span>Dismiss hints</span>
        </button>
      </div>
    </div>
  );
}