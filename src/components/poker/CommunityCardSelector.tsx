'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

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

  const getCardName = (index: number) => {
    if (index === 0) return 'Flop Card 1';
    if (index === 1) return 'Flop Card 2';
    if (index === 2) return 'Flop Card 3';
    if (index === 3) return 'Turn Card';
    if (index === 4) return 'River Card';
    return `Card ${index + 1}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-orange-600 mb-2">
          Select {currentBettingRound === 'flop' ? 'Flop Cards' : 
                  currentBettingRound === 'turn' ? 'Turn Card' : 'River Card'}
        </h3>
      </div>

      {getCardsToShow().map((cardIndex) => (
        <div key={cardIndex} className="flex items-center gap-3 justify-center">
          <span className="text-sm font-medium text-gray-700 w-8">
            {cardIndex === 0 ? 'CC1' :
             cardIndex === 1 ? 'CC2' :
             cardIndex === 2 ? 'CC3' :
             cardIndex === 3 ? 'Turn' :
             cardIndex === 4 ? 'River' : `CC${cardIndex + 1}`}
          </span>
          
          {/* Suit Selection */}
          <div className="flex gap-1">
            {suits.map((suit) => (
              <Button
                key={suit.name}
                variant={selectedSuits[cardIndex] === suit.symbol ? "default" : "outline"}
                size="sm"
                className={`w-8 h-8 p-0 ${suit.color} ${
                  selectedSuits[cardIndex] === suit.symbol 
                    ? 'bg-blue-100 border-blue-500' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSuitSelect(cardIndex, suit.symbol)}
              >
                <span className={`text-sm ${suit.color}`}>{suit.symbol}</span>
              </Button>
            ))}
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
              {ranks.map((rank) => (
                <SelectItem key={rank} value={rank}>{rank}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Show selected card */}
          {communityCards[cardIndex] && (
            <div className={`text-sm font-bold ml-2 ${
              communityCards[cardIndex]?.includes('♥') || communityCards[cardIndex]?.includes('♦')
                ? 'text-red-600' : 'text-black'
            }`}>
              {communityCards[cardIndex]}
            </div>
          )}
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