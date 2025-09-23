'use client';

import { CurrentHand, Position, SessionMetadata } from '@/types/poker-v2';
import { getPreflopActionSequence, getPostflopActionSequence } from '@/utils/poker-logic';

interface HandInfoHeaderProps {
  currentHand: CurrentHand;
  session: SessionMetadata | null;
  userSeat?: Position;
  selectedPosition?: Position | null;
  showPositionActions: boolean;
  showCardSelector: boolean;
}

export function HandInfoHeader({
  currentHand,
  session,
  userSeat,
  selectedPosition,
  showPositionActions,
  showCardSelector
}: HandInfoHeaderProps) {
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm mb-3">
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Hand #{currentHand.handNumber} - <span className="text-blue-600 capitalize">{currentHand.currentBettingRound}</span>
          </h2>
          {currentHand.currentBettingRound !== 'showdown' && currentHand.nextToAct === userSeat && (
            <div className="text-xs italic text-right">
              <div className="text-blue-600 font-medium animate-pulse">Your turn to act</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}