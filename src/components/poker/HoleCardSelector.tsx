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
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-blue-600 mb-4">
          Select Hole Cards and Straddle Option to Begin
        </h3>
      </div>

      {[0, 1].map((cardIndex) => (
        <div key={cardIndex} className="flex items-center gap-3 justify-center">
          <span className="text-sm font-medium text-gray-700 w-8">
            {cardIndex === 0 ? 'HH1' : 'HH2'}
          </span>
          
          {/* Suit Selection */}
          <div className="flex gap-1">
            {suits.map((suit) => {
              const rank = selectedRanks[cardIndex];
              const isUnavailable = rank && !isCardAvailable(cardIndex, rank, suit.symbol);
              
              return (
                <Button
                  key={suit.name}
                  variant={selectedSuits[cardIndex] === suit.symbol ? "default" : "outline"}
                  size="sm"
                  disabled={isUnavailable || undefined}
                  className={`w-8 h-8 p-0 ${suit.color} ${
                    selectedSuits[cardIndex] === suit.symbol 
                      ? 'bg-blue-100 border-blue-500' 
                      : isUnavailable
                      ? 'opacity-30 cursor-not-allowed bg-gray-100'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSuitSelect(cardIndex, suit.symbol)}
                >
                  <span className={`text-sm ${isUnavailable ? 'text-gray-400' : suit.color}`}>
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
            <SelectTrigger className="w-16 h-8">
              <SelectValue placeholder="?" />
            </SelectTrigger>
            <SelectContent>
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
          
          {/* Show selected card */}
          {holeCards[cardIndex] && (
            <div className={`text-sm font-bold ml-2 ${
              holeCards[cardIndex]?.includes('♥') || holeCards[cardIndex]?.includes('♦')
                ? 'text-red-600' : 'text-black'
            }`}>
              {holeCards[cardIndex]}
            </div>
          )}
        </div>
      ))}

    </div>
  );
}