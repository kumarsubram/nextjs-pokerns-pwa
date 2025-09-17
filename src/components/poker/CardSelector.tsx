'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RANKS, SUITS } from '@/types/poker-v2';

interface CardSelectorProps {
  title: string;
  selectedCards: string[];
  onCardSelect: (card: string) => void;
  onCancel: () => void;
}

export function CardSelector({ title, selectedCards, onCardSelect, onCancel }: CardSelectorProps) {
  const [selectedRank, setSelectedRank] = useState<string | null>(null);

  const handleRankSelect = (rank: string) => {
    setSelectedRank(rank);
  };

  const handleSuitSelect = (suit: string) => {
    const card = `${selectedRank}${suit}`;
    onCardSelect(card);

    // Reset states after selection
    setSelectedRank(null);
  };

  // Helper function to get card color
  const getCardColor = (suit: string) => {
    return suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
      <h3 className="text-md font-semibold mb-3 text-center">
        {title}
      </h3>

      {/* Suit Selection Container - Only shows when rank is selected */}
      {selectedRank && (
        <div className="mb-4">
          <div className="grid grid-cols-4 gap-2">
            {SUITS.map((suit, index) => {
              const card = `${selectedRank}${suit}`;
              const isSelected = selectedCards.includes(card);
              return (
                <button
                  key={`${selectedRank}-${suit}`}
                  onClick={() => !isSelected && handleSuitSelect(suit)}
                  disabled={isSelected}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className={`card-slide-in
                    p-3 text-xl font-bold rounded border-2 transition-all flex items-center justify-center
                    ${isSelected
                      ? 'bg-gray-200 border-gray-400 opacity-50 cursor-not-allowed'
                      : 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                    }
                    ${getCardColor(suit)}
                  `}
                >
                  {selectedRank}{suit}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rank Selection - Always visible */}
      <div>
        <div className="grid grid-cols-7 gap-2">
          {RANKS.map(rank => (
            <button
              key={rank}
              onClick={() => handleRankSelect(rank)}
              className={`
                p-3 text-base font-bold rounded border-2 transition-all min-h-[44px] flex items-center justify-center
                ${rank === selectedRank
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                }
              `}
            >
              {rank}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}