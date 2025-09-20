'use client';

import { MousePointer2 } from 'lucide-react';
import { CurrentHand, Position } from '@/types/poker-v2';

interface HandInfoHeaderProps {
  currentHand: CurrentHand;
  userSeat?: Position;
  selectedPosition?: Position | null;
  showPositionActions: boolean;
  showCardSelector: boolean;
}

export function HandInfoHeader({
  currentHand,
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
          {currentHand.currentBettingRound !== 'showdown' && (
            <div className="text-xs italic text-right">
              {currentHand.nextToAct === userSeat ? (
                <div className="text-blue-600 font-medium animate-pulse">Your turn to act</div>
              ) : (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 justify-end text-gray-600">
                    <MousePointer2 className="h-3 w-3" />
                    <span>Tap any seat to record action</span>
                  </div>
                  {selectedPosition && selectedPosition !== userSeat && currentHand.nextToAct && !showPositionActions && !showCardSelector && (
                    <div className="text-amber-600">
                      {selectedPosition} selected
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}