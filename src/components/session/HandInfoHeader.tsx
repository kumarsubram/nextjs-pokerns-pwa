'use client';

import { MousePointer2 } from 'lucide-react';
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
                    (() => {
                      const currentRound = currentHand.bettingRounds[currentHand.currentBettingRound as 'preflop' | 'flop' | 'turn' | 'river'];
                      const hasBet = currentRound?.currentBet && currentRound.currentBet > 0;
                      const autoAction = hasBet ? 'fold' : 'check';

                      // Get positions between nextToAct and selectedPosition
                      const fullActionSequence = currentHand.currentBettingRound === 'preflop'
                        ? getPreflopActionSequence(session?.tableSeats || 9)
                        : getPostflopActionSequence(session?.tableSeats || 9);

                      const activePlayers = currentHand.playerStates.filter(p => p.status === 'active');
                      const activePositions = activePlayers.map(p => p.position);
                      const actionSequence = fullActionSequence.filter(pos => activePositions.includes(pos));

                      const nextIndex = actionSequence.indexOf(currentHand.nextToAct);
                      const selectedIndex = actionSequence.indexOf(selectedPosition);

                      let skippedCount = 0;
                      if (nextIndex !== -1 && selectedIndex !== -1 && selectedIndex !== nextIndex) {
                        if (selectedIndex > nextIndex) {
                          skippedCount = selectedIndex - nextIndex - 1;
                        } else {
                          // Wraps around
                          skippedCount = (actionSequence.length - nextIndex - 1) + selectedIndex;
                        }
                      }

                      if (skippedCount > 0) {
                        // Get the actual positions that will be skipped
                        const skippedPositions: Position[] = [];
                        let currentIdx = (nextIndex + 1) % actionSequence.length;
                        while (currentIdx !== selectedIndex) {
                          skippedPositions.push(actionSequence[currentIdx]);
                          currentIdx = (currentIdx + 1) % actionSequence.length;
                        }

                        return (
                          <div className="text-amber-600 text-xs">
                            {skippedPositions.length === 1
                              ? `${skippedPositions[0]} will auto-${autoAction}`
                              : `${skippedPositions.join(', ')} will auto-${autoAction}`
                            }
                          </div>
                        );
                      }
                      return null;
                    })()
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