'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HoleCardSelectorProps {
  holeCards: (string | null)[];
  onCardSelect: (cardIndex: number, card: string) => void;
  communityCards?: (string | null)[]; // To prevent duplicates with community cards
}

export function HoleCardSelector({
  holeCards,
  onCardSelect,
  communityCards = [null, null, null, null, null],
}: HoleCardSelectorProps) {
  const [selectedRanks, setSelectedRanks] = useState<{ [key: number]: string }>({});
  const [selectedSuits, setSelectedSuits] = useState<{ [key: number]: string }>({});

  const suits = [
    { symbol: '♠', name: 'spades', color: 'text-black' },
    { symbol: '♥', name: 'hearts', color: 'text-red-600' },
    { symbol: '♦', name: 'diamonds', color: 'text-red-600' },
    { symbol: '♣', name: 'clubs', color: 'text-black' },
  ];

  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // Get all cards that are already used (other hole card + community cards)
  const getUsedCards = (): Set<string> => {
    const usedCards = new Set<string>();
    
    // Add community cards
    communityCards.forEach(card => {
      if (card) usedCards.add(card);
    });
    
    // Add other hole cards (but not current card being edited)
    holeCards.forEach(card => {
      if (card) usedCards.add(card);
    });
    
    return usedCards;
  };

  // Check if a card combination is available for a specific hole card slot
  const isCardAvailable = (cardIndex: number, rank: string, suit: string): boolean => {
    const cardToCheck = `${rank}${suit}`;
    const usedCards = getUsedCards();
    
    // Remove current card being edited from used cards
    if (holeCards[cardIndex]) {
      usedCards.delete(holeCards[cardIndex]!);
    }
    
    return !usedCards.has(cardToCheck);
  };

  const handleSuitSelect = (cardIndex: number, suit: string) => {
    const rank = selectedRanks[cardIndex];
    
    // Check if this card combination is available
    if (rank && !isCardAvailable(cardIndex, rank, suit)) {
      return; // Don't allow selection of unavailable card
    }
    
    const newSuits = { ...selectedSuits, [cardIndex]: suit };
    setSelectedSuits(newSuits);
    
    if (rank) {
      const card = `${rank}${suit}`;
      onCardSelect(cardIndex, card);
    }
  };

  const handleRankSelect = (cardIndex: number, rank: string) => {
    const suit = selectedSuits[cardIndex];
    
    // Check if this card combination is available
    if (suit && !isCardAvailable(cardIndex, rank, suit)) {
      return; // Don't allow selection of unavailable card
    }
    
    const newRanks = { ...selectedRanks, [cardIndex]: rank };
    setSelectedRanks(newRanks);
    
    if (suit) {
      const card = `${rank}${suit}`;
      onCardSelect(cardIndex, card);
    }
  };



  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-base font-medium text-blue-600 mb-2">
          Select Hole Cards + Straddle Option to Begin
        </h3>
      </div>

      {[0, 1].map((cardIndex) => (
        <div key={cardIndex} className="flex items-center gap-2 justify-center">
          <span className="text-base font-semibold text-gray-800 w-12">
            HC{cardIndex + 1}:
          </span>
          
          {/* Suit Selection */}
          <div className="flex gap-2">
            {suits.map((suit) => {
              const rank = selectedRanks[cardIndex];
              const isUnavailable = rank && !isCardAvailable(cardIndex, rank, suit.symbol);
              
              return (
                <Button
                  key={suit.name}
                  variant={selectedSuits[cardIndex] === suit.symbol ? "default" : "outline"}
                  disabled={isUnavailable || undefined}
                  className={`w-12 h-12 sm:w-10 sm:h-10 p-0 ${suit.color} ${
                    selectedSuits[cardIndex] === suit.symbol 
                      ? 'bg-blue-100 border-blue-500' 
                      : isUnavailable
                      ? 'opacity-30 cursor-not-allowed bg-gray-100'
                      : !selectedSuits[cardIndex]
                      ? 'hover:bg-gray-50 border-2 animate-pulse border-blue-300'
                      : 'hover:bg-gray-50'
                  }`}
                  aria-label={`Select ${suit.name} suit for hole card ${cardIndex + 1}`}
                  onClick={() => handleSuitSelect(cardIndex, suit.symbol)}
                >
                  <span className={`text-lg sm:text-base ${isUnavailable ? 'text-gray-400' : suit.color}`}>
                    {suit.symbol}
                  </span>
                </Button>
              );
            })}
          </div>
          
          {/* Rank Selection */}
          <Select 
            value={selectedRanks[cardIndex] || ""} 
            onValueChange={(value) => handleRankSelect(cardIndex, value)}
          >
            <SelectTrigger className={`min-w-[4.5rem] w-18 min-h-[3rem] h-12 sm:w-12 sm:h-10 text-lg sm:text-base font-bold border bg-white hover:bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 flex items-center justify-center p-0 rounded-md shadow-sm ${
              !selectedRanks[cardIndex] 
                ? 'border-2 animate-pulse border-blue-300' 
                : 'border-gray-300'
            }`} aria-label={`Select rank for hole card ${cardIndex + 1}`}>
              <SelectValue placeholder="?" />
            </SelectTrigger>
            <SelectContent className="min-w-[3rem] w-auto">
              {ranks.map((rank) => {
                const suit = selectedSuits[cardIndex];
                const isUnavailable = suit && !isCardAvailable(cardIndex, rank, suit);
                
                return (
                  <SelectItem 
                    key={rank} 
                    value={rank}
                    disabled={isUnavailable || undefined}
                    className={isUnavailable ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    {rank}
                    {isUnavailable && <span className="text-xs text-gray-400 ml-1">(used)</span>}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      ))}

    </div>
  );
}