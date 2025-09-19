'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { POSITION_LABELS_6, POSITION_LABELS_9, Position, TableSeats, PlayerState } from '@/types/poker-v2';

interface SimplePokerTableProps {
  seats: TableSeats;
  userSeat?: Position;
  onSeatClick?: (position: Position) => void;
  highlightedPositions?: Position[];
  className?: string;
  showBlinkingSeats?: boolean;
  userCards?: [string, string] | null;
  onCardClick?: (cardIndex: 1 | 2) => void;
  showCardButtons?: boolean;
  communityCards?: {
    flop: [string, string, string] | null;
    turn: string | null;
    river: string | null;
  };
  onCommunityCardClick?: (cardType: 'flop', cardIndex: number) => void;
  showCommunityCards?: boolean;
  playerStates?: PlayerState[];
  nextToAct?: Position;
  currentBettingRound?: {
    actions: Array<{
      position: Position;
      action: string;
      amount?: number;
    }>;
    currentBet?: number;
  };
  currentBettingRoundName?: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  isBettingComplete?: boolean;
  showFlopSelectionPrompt?: boolean;
  showTurnSelectionPrompt?: boolean;
  showRiverSelectionPrompt?: boolean;
  potSize?: number;
}

export function SimplePokerTable({
  seats,
  userSeat,
  onSeatClick,
  highlightedPositions = [],
  className,
  showBlinkingSeats = false,
  userCards = null,
  onCardClick,
  showCardButtons = false,
  communityCards,
  onCommunityCardClick,
  showCommunityCards = false,
  playerStates = [],
  nextToAct,
  currentBettingRound,
  currentBettingRoundName,
  isBettingComplete = false,
  showFlopSelectionPrompt = false,
  showTurnSelectionPrompt = false,
  showRiverSelectionPrompt = false,
  potSize = 0
}: SimplePokerTableProps) {
  const positions = seats === 6 ? POSITION_LABELS_6 : POSITION_LABELS_9;

  // Helper function to get the last action for a position
  const getLastAction = (position: Position) => {
    if (!currentBettingRound || position === 'DEALER') return null;
    const actions = currentBettingRound.actions.filter(a => a.position === position);
    return actions.length > 0 ? actions[actions.length - 1] : null;
  };

  // Helper function to get card color
  const getCardColor = (card: string) => {
    if (!card || card === '?') return 'text-gray-800';
    const suit = card.slice(-1); // Get last character (suit)
    return suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-gray-800';
  };

  // Calculate seat positions properly around the rounded rectangle edges
  const getSeatPosition = (index: number) => {
    if (seats === 6) {
      // 6-handed: DEALER + 6 playing positions (clockwise from dealer)
      const positions6 = [
        { x: 50, y: 2 },    // DEALER - top center (black, non-playing)
        { x: 76, y: 2 },    // BTN - Position 1 - right and up from dealer
        { x: 99, y: 50 },   // SB - Position 2 - right row middle
        { x: 76, y: 93 },   // BB - Position 3 - right side lower
        { x: 50, y: 93 },   // UTG - Position 4 - bottom center
        { x: 23, y: 93 },    // LJ - Position 5 - left side lower
        { x: 1, y: 50 },    // CO - Position 6 - left side upper
      ];
      return { x: `${positions6[index].x}%`, y: `${positions6[index].y}%` };
    } else {
      // 9-handed: proper poker sequence around table (DEALER + 9 playing positions)
      const positions9 = [
        { x: 50, y: 3 },    // DEALER - top center (black, non-playing) - DON'T MOVE
        { x: 75, y: 3 },    // BTN - Position 1 - top right
        { x: 99, y: 25 },   // SB - Position 2 - right edge upper
        { x: 99, y: 65 },   // BB - Position 3 - right edge lower
        { x: 75, y: 96 },   // UTG - Position 4 - bottom right
        { x: 50, y: 96 },   // UTG+1 - Position 5 - bottom center
        { x: 25, y: 96 },   // UTG+2 - Position 6 - bottom left
        { x: 1, y: 65 },    // LJ - Position 7 - left edge lower
        { x: 1, y: 25 },    // HJ - Position 8 - left edge upper
        { x: 25, y: 3 },    // CO - Position 9 - top left
      ];
      return { x: `${positions9[index].x}%`, y: `${positions9[index].y}%` };
    }
  };

  return (
    <div className={cn("relative w-full max-w-sm mx-auto", className)}>
      {/* Table felt - realistic rounded rectangle poker table */}
      <div className="relative w-full h-40 bg-green-800 rounded-[2.5rem] shadow-2xl border-4 border-amber-900">
        <div className="absolute inset-3 bg-green-700 rounded-[2rem] border border-green-600">
          <div className="absolute inset-0 flex items-center justify-center -translate-y-2">
            {showCommunityCards ? (
              <div className="flex gap-1">
                {/* Flop Cards */}
                {[0, 1, 2].map((index) => {
                  const hasCard = communityCards?.flop?.[index];
                  const shouldBlink = isBettingComplete && !hasCard;
                  return (
                    <button
                      key={`flop-${index}`}
                      onClick={() => onCommunityCardClick?.('flop', index)}
                      disabled={!isBettingComplete}
                      className={cn(
                        "w-8 h-12 rounded border text-sm font-bold flex items-center justify-center",
                        hasCard
                          ? `bg-white border-gray-800 ${getCardColor(hasCard)}`
                          : isBettingComplete
                          ? "bg-gray-200 border-gray-400 text-gray-600 hover:bg-gray-300 cursor-pointer"
                          : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-50",
                        showFlopSelectionPrompt && !hasCard ? "animate-pulse bg-yellow-200 border-yellow-400" : "",
                        shouldBlink && "animate-pulse"
                      )}
                    >
                      {hasCard || "?"}
                    </button>
                  );
                })}
                {/* Turn Card */}
                <button
                  onClick={() => onCommunityCardClick?.('flop', 3)}
                  disabled={!isBettingComplete || (currentBettingRoundName === 'preflop')}
                  className={cn(
                    "w-8 h-12 rounded border text-sm font-bold flex items-center justify-center ml-1",
                    communityCards?.turn
                      ? `bg-white border-gray-800 ${getCardColor(communityCards.turn)}`
                      : isBettingComplete && currentBettingRoundName !== 'preflop'
                      ? "bg-gray-200 border-gray-400 text-gray-600 hover:bg-gray-300 cursor-pointer"
                      : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-50",
                    showTurnSelectionPrompt && "animate-pulse bg-yellow-200 border-yellow-400"
                  )}
                >
                  {communityCards?.turn || "?"}
                </button>
                {/* River Card */}
                <button
                  onClick={() => onCommunityCardClick?.('flop', 4)}
                  disabled={!isBettingComplete || (currentBettingRoundName === 'preflop' || currentBettingRoundName === 'flop')}
                  className={cn(
                    "w-8 h-12 rounded border text-sm font-bold flex items-center justify-center",
                    communityCards?.river
                      ? `bg-white border-gray-800 ${getCardColor(communityCards.river)}`
                      : isBettingComplete && currentBettingRoundName !== 'preflop' && currentBettingRoundName !== 'flop'
                      ? "bg-gray-200 border-gray-400 text-gray-600 hover:bg-gray-300 cursor-pointer"
                      : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-50",
                    showRiverSelectionPrompt && "animate-pulse bg-yellow-200 border-yellow-400"
                  )}
                >
                  {communityCards?.river || "?"}
                </button>
              </div>
            ) : showFlopSelectionPrompt ? (
              <span className="text-yellow-400 font-semibold text-xs text-center animate-pulse">
                Choose community cards<br />to proceed
              </span>
            ) : (
              <span className="text-green-500 font-semibold text-xs opacity-60">
                {seats === 6 ? '6' : '9'} HANDED
              </span>
            )}
          </div>
          {/* Pot Size Display - positioned right below community cards */}
          {potSize > 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-5">
              <div className="bg-black/50 text-white px-2 py-0.5 rounded text-xs font-bold">
                POT SIZE: {Math.floor(potSize)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seats */}
      {positions.map((position, index) => {
        const { x, y } = getSeatPosition(index);
        const isUserSeat = position === userSeat;
        const isHighlighted = highlightedPositions.includes(position);

        // Get player state for this position (DEALER never has player state)
        const playerState = position !== 'DEALER' ? playerStates.find(p => p.position === position) : null;
        const isNextToAct = position !== 'DEALER' && position === nextToAct;
        const lastAction = getLastAction(position);

        // Determine button color based on last action or player state
        let actionColor = '';
        // First check if player is folded from playerState
        if (playerState?.status === 'folded') {
          actionColor = 'bg-red-800 border-red-600 text-red-300 opacity-60';
        } else if (lastAction && position !== 'DEALER') {
          // Check if player needs to act again (due to raise) - if so, don't show previous action color
          const currentBet = currentBettingRound?.currentBet || 0;
          const needsToActAgain = playerState && (
            !playerState.hasActed ||
            (currentBet > 0 && playerState.currentBet < currentBet)
          );

          // Only show action color if player doesn't need to act again
          if (!needsToActAgain) {
            switch(lastAction.action) {
              case 'fold':
                actionColor = 'bg-red-800 border-red-600 text-red-300 opacity-60';
                break;
              case 'call':
                actionColor = 'bg-blue-700 border-blue-500 text-blue-100';
                break;
              case 'check':
                actionColor = 'bg-blue-600 border-blue-500 text-blue-200';
                break;
              case 'raise':
                actionColor = 'bg-green-700 border-green-500 text-green-100';
                break;
              case 'all-in':
                actionColor = 'bg-purple-700 border-purple-500 text-purple-100';
                break;
            }
          }
        }

        return (
          <div
            key={position}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: x, top: y }}
          >
            <div className="flex flex-col items-center">
              <button
                onClick={() => position !== 'DEALER' && playerState?.status !== 'folded' && onSeatClick?.(position)}
                disabled={!onSeatClick || position === 'DEALER' || playerState?.status === 'folded'}
                className={cn(
                  "relative w-12 h-12 rounded-full border-2 transition-all duration-300",
                  "flex flex-col items-center justify-center text-center",
                  "transform hover:scale-110 shadow-md",
                  // DEALER styling (never changes)
                  position === 'DEALER' && "bg-gray-900 border-gray-700 text-white cursor-default",
                  // Action-based styling takes priority
                  position !== 'DEALER' && actionColor && actionColor,
                  // Next to act styling (subtle blinking animation) - only if no action taken
                  position !== 'DEALER' && isNextToAct && !actionColor && "bg-green-600 border-green-400 text-white shadow-lg ring-2 ring-green-300 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]",
                  // User seat styling - only if no action taken
                  position !== 'DEALER' && isUserSeat && !actionColor && !isNextToAct && "bg-blue-600 border-blue-400 text-white shadow-lg ring-2 ring-blue-300",
                  // Other highlighted positions - only if no action taken
                  position !== 'DEALER' && !isUserSeat && !actionColor && !isNextToAct && isHighlighted && "bg-yellow-500 border-yellow-400 text-gray-900",
                  // Default active player styling - only if no action taken
                  position !== 'DEALER' && !isUserSeat && !actionColor && !isNextToAct && !isHighlighted && "bg-gray-700 border-gray-600 text-gray-300",
                  // Hover effects - only for active players
                  position !== 'DEALER' && onSeatClick && !isUserSeat && playerState?.status !== 'folded' && "hover:bg-gray-600 hover:border-gray-500 cursor-pointer",
                  position !== 'DEALER' && (!onSeatClick || playerState?.status === 'folded') && "cursor-default",
                  // Blinking for seat selection
                  showBlinkingSeats && !isUserSeat && position !== 'DEALER' && "animate-pulse"
                )}
              >
                <span className={cn(
                  "text-[10px] font-bold leading-tight",
                  position === 'DEALER' && "text-[9px]"
                )}>
                  {position}
                </span>
                {isUserSeat && position !== 'DEALER' && (
                  <span className="text-[8px] leading-none">YOU</span>
                )}
              </button>
            </div>
          </div>
        );
      })}

      {/* User Cards - Position adjusted based on seat */}
      {showCardButtons && userSeat && userSeat !== 'DEALER' && (
        (() => {
          const userIndex = positions.findIndex(pos => pos === userSeat);
          if (userIndex === -1) return null;
          const { x, y } = getSeatPosition(userIndex);

          return (
            <div
              className="absolute -translate-x-1/2"
              style={{ left: x, top: `${parseInt(y as string) - 15}%` }}
            >
              <div className="flex gap-1">
                {/* Card 1 */}
                <button
                  onClick={() => onCardClick?.(1)}
                  className={cn(
                    "w-8 h-12 rounded border-2 text-xs font-bold flex items-center justify-center",
                    userCards?.[0]
                      ? `bg-white border-gray-800 ${getCardColor(userCards[0])}`
                      : "bg-gray-200 border-gray-400 text-gray-600 hover:bg-gray-300"
                  )}
                >
                  {userCards?.[0] || "?"}
                </button>
                {/* Card 2 */}
                <button
                  onClick={() => onCardClick?.(2)}
                  className={cn(
                    "w-8 h-12 rounded border-2 text-xs font-bold flex items-center justify-center",
                    userCards?.[1]
                      ? `bg-white border-gray-800 ${getCardColor(userCards[1])}`
                      : "bg-gray-200 border-gray-400 text-gray-600 hover:bg-gray-300"
                  )}
                >
                  {userCards?.[1] || "?"}
                </button>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}