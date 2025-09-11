'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Card, CardContent } from '@/components/ui/card'; // Unused imports

interface CommunityCardSelectorProps {
  currentBettingRound: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  communityCards: (string | null)[];
  onCardSelect: (cardIndex: number, card: string) => void;
  onComplete: () => void;
  holeCards?: (string | null)[]; // To prevent duplicates with hole cards
}

export function CommunityCardSelector({
  currentBettingRound,
  communityCards,
  onCardSelect,
  onComplete,
  holeCards = [null, null],
}: CommunityCardSelectorProps) {
  const [selectedRanks, setSelectedRanks] = useState<{ [key: number]: string }>({});
  const [selectedSuits, setSelectedSuits] = useState<{ [key: number]: string }>({});

  const suits = [
    { symbol: '♠', name: 'spades', color: 'text-black' },
    { symbol: '♥', name: 'hearts', color: 'text-red-600' },
    { symbol: '♦', name: 'diamonds', color: 'text-red-600' },
    { symbol: '♣', name: 'clubs', color: 'text-black' },
  ];

  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // Get all cards that are already used (hole cards + other community cards)
  const getUsedCards = (): Set<string> => {
    const usedCards = new Set<string>();
    
    // Add hole cards
    holeCards.forEach(card => {
      if (card) usedCards.add(card);
    });
    
    // Add other community cards (but not current card being edited)
    communityCards.forEach(card => {
      if (card) usedCards.add(card);
    });
    
    return usedCards;
  };

  // Check if a card combination is available for a specific community card slot
  const isCardAvailable = (cardIndex: number, rank: string, suit: string): boolean => {
    const cardToCheck = `${rank}${suit}`;
    const usedCards = getUsedCards();
    
    // Remove current card being edited from used cards
    if (communityCards[cardIndex]) {
      usedCards.delete(communityCards[cardIndex]!);
    }
    
    return !usedCards.has(cardToCheck);
  };

  const getCardsToShow = () => {
    if (currentBettingRound === 'flop') return [0, 1, 2];
    if (currentBettingRound === 'turn') return [3];
    if (currentBettingRound === 'river') return [4];
    return [];
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

  const isComplete = () => {
    const cardsToShow = getCardsToShow();
    return cardsToShow.every(index => communityCards[index] !== null);
  };

  // const getCardName = (index: number) => {
  //   if (index === 0) return 'Flop Card 1';
  //   if (index === 1) return 'Flop Card 2';
  //   if (index === 2) return 'Flop Card 3';
  //   if (index === 3) return 'Turn Card';
  //   if (index === 4) return 'River Card';
  //   return `Card ${index + 1}`;
  // }; // Keeping for potential future use

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-orange-600 mb-2">
          Select {currentBettingRound === 'flop' ? 'Flop Cards' : 
                  currentBettingRound === 'turn' ? 'Turn Card' : 'River Card'}
        </h3>
      </div>

      {getCardsToShow().map((cardIndex) => (
        <div key={cardIndex} className="flex items-center gap-2 justify-center">
          <span className="text-base font-semibold text-gray-800 w-12">
            {cardIndex === 0 ? 'CC1' :
             cardIndex === 1 ? 'CC2' :
             cardIndex === 2 ? 'CC3' :
             cardIndex === 3 ? 'Turn' :
             cardIndex === 4 ? 'River' : `CC${cardIndex + 1}`}:
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
                      ? 'hover:bg-gray-50 border-2 animate-pulse border-orange-300'
                      : 'hover:bg-gray-50'
                  }`}
                  aria-label={`Select ${suit.name} suit for community card ${cardIndex + 1}`}
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
            <SelectTrigger className={`min-w-[4.5rem] w-18 min-h-[3rem] h-12 sm:w-12 sm:h-10 text-lg sm:text-base font-bold border bg-white hover:bg-gray-50 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 flex items-center justify-center p-0 rounded-md shadow-sm ${
              !selectedRanks[cardIndex] 
                ? 'border-2 animate-pulse border-orange-300' 
                : 'border-gray-300'
            }`} aria-label={`Select rank for community card ${cardIndex + 1}`}>
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

      {isComplete() && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={onComplete}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
          >
            Continue to {currentBettingRound === 'flop' ? 'Flop Betting' : 
                        currentBettingRound === 'turn' ? 'Turn Betting' : 'River Betting'}
          </Button>
        </div>
      )}
    </div>
  );
}