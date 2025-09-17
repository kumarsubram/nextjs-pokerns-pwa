'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { POSITION_LABELS_6, POSITION_LABELS_9, Position, TableSeats } from '@/types/poker-v2';

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
  showCardButtons = false
}: SimplePokerTableProps) {
  const positions = seats === 6 ? POSITION_LABELS_6 : POSITION_LABELS_9;

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
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-green-500 font-semibold text-xs opacity-60">
              {seats === 6 ? '6' : '9'} HANDED
            </span>
          </div>
        </div>
      </div>

      {/* Seats */}
      {positions.map((position, index) => {
        const { x, y } = getSeatPosition(index);
        const isUserSeat = position === userSeat;
        const isHighlighted = highlightedPositions.includes(position);

        return (
          <div
            key={position}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: x, top: y }}
          >
            <button
              onClick={() => position !== 'DEALER' && onSeatClick?.(position)}
              disabled={!onSeatClick || position === 'DEALER'}
              className={cn(
                "relative w-12 h-12 rounded-full border-2 transition-all duration-300",
                "flex flex-col items-center justify-center text-center",
                "transform hover:scale-110 shadow-md",
                position === 'DEALER' && "bg-gray-900 border-gray-700 text-white cursor-default",
                position !== 'DEALER' && isUserSeat && "bg-blue-600 border-blue-400 text-white shadow-lg ring-2 ring-blue-300",
                position !== 'DEALER' && !isUserSeat && isHighlighted && "bg-yellow-500 border-yellow-400 text-gray-900",
                position !== 'DEALER' && !isUserSeat && !isHighlighted && "bg-gray-700 border-gray-600 text-gray-300",
                position !== 'DEALER' && onSeatClick && !isUserSeat && "hover:bg-gray-600 hover:border-gray-500 cursor-pointer",
                position !== 'DEALER' && !onSeatClick && "cursor-default",
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
        );
      })}

      {/* User Cards - Show above user seat */}
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