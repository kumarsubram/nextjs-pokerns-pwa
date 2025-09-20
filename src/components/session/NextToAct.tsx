'use client';

import { CurrentHand, Position } from '@/types/poker-v2';

interface NextToActProps {
  currentHand: CurrentHand | null;
  userSeat?: Position;
}

export function NextToAct({ currentHand, userSeat }: NextToActProps) {
  if (!currentHand || !currentHand.nextToAct || currentHand.currentBettingRound === 'showdown') {
    return null;
  }

  const nextToActDisplay = currentHand.nextToAct === userSeat ? 'Hero' : currentHand.nextToAct;

  return (
    <div className="bg-white rounded-lg px-3 py-2 shadow-sm mb-2 h-16 flex items-center justify-center">
      <div className="text-center">
        <div className="text-xs text-gray-500 mb-1">Next to Act</div>
        <div className={`text-sm font-medium ${
          currentHand.nextToAct === userSeat
            ? 'text-blue-600 animate-pulse'
            : 'text-green-600'
        }`}>
          {nextToActDisplay}
        </div>
      </div>
    </div>
  );
}