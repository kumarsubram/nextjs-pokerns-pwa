'use client';

import { CurrentHand, Position } from '@/types/poker-v2';

interface HeroCardsProps {
  currentHand: CurrentHand | null;
  userSeat?: Position;
  onCardClick: (cardIndex: 1 | 2) => void;
}

export function HeroCards({ currentHand, userSeat, onCardClick }: HeroCardsProps) {
  if (!currentHand || !userSeat || userSeat === 'DEALER') {
    return null;
  }

  return (
    <div className="bg-white rounded-lg px-4 py-2 shadow-sm mb-2 h-16 flex items-center">
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col">
          <div className="text-xs text-gray-500 leading-tight">Your</div>
          <div className="text-xs text-gray-500 leading-tight">Cards</div>
        </div>
        <div className="flex gap-2">
          {/* Card 1 */}
          <button
            onClick={() => onCardClick(1)}
            className={`w-11 h-11 rounded border text-sm font-bold flex items-center justify-center transition-all hover:scale-105 ${
              currentHand.userCards?.[0]
                ? `bg-white border-gray-700 ${
                    currentHand.userCards[0].includes('♥') || currentHand.userCards[0].includes('♦')
                      ? 'text-red-600'
                      : 'text-gray-800'
                  }`
                : 'bg-gray-100 border-gray-400 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {currentHand.userCards?.[0] || '?'}
          </button>
          {/* Card 2 */}
          <button
            onClick={() => onCardClick(2)}
            className={`w-11 h-11 rounded border text-sm font-bold flex items-center justify-center transition-all hover:scale-105 ${
              currentHand.userCards?.[1]
                ? `bg-white border-gray-700 ${
                    currentHand.userCards[1].includes('♥') || currentHand.userCards[1].includes('♦')
                      ? 'text-red-600'
                      : 'text-gray-800'
                  }`
                : 'bg-gray-100 border-gray-400 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {currentHand.userCards?.[1] || '?'}
          </button>
        </div>
      </div>
    </div>
  );
}