'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OpponentCardSelectorProps {
  seatNumber: number;
  opponentCards: (string | null)[];
  onCardSelect: (cardIndex: number, card: string) => void;
  onMucked: () => void;
  holeCards?: (string | null)[];
  communityCards?: (string | null)[];
  allOpponentCards?: Map<number, (string | null)[]>; // All other opponents' cards to prevent duplicates
}

export function OpponentCardSelector({
  seatNumber,
  opponentCards,
  onCardSelect,
  onMucked,
  holeCards = [null, null],
  communityCards = [null, null, null, null, null],
  allOpponentCards = new Map(),
}: OpponentCardSelectorProps) {
  const [selectedRanks, setSelectedRanks] = useState<{ [key: number]: string }>({});
  const [selectedSuits, setSelectedSuits] = useState<{ [key: number]: string }>({});

  const suits = [
    { symbol: '♠', name: 'spades', color: 'text-black' },
    { symbol: '♥', name: 'hearts', color: 'text-red-600' },
    { symbol: '♦', name: 'diamonds', color: 'text-red-600' },
    { symbol: '♣', name: 'clubs', color: 'text-black' },
  ];

  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // Get all cards that are already used (hero cards + community cards + other opponents' cards)
  const getUsedCards = (): Set<string> => {
    const usedCards = new Set<string>();
    
    // Add hero hole cards
    holeCards.forEach(card => {
      if (card) usedCards.add(card);
    });
    
    // Add community cards
    communityCards.forEach(card => {
      if (card) usedCards.add(card);
    });
    
    // Add all other opponents' cards
    allOpponentCards.forEach((cards, seat) => {
      if (seat !== seatNumber) {
        cards.forEach(card => {
          if (card) usedCards.add(card);
        });
      }
    });
    
    // Add current opponent's other card (but not current card being edited)
    opponentCards.forEach(card => {
      if (card) usedCards.add(card);
    });
    
    return usedCards;
  };

  // Check if a card combination is available for a specific opponent card slot
  const isCardAvailable = (cardIndex: number, rank: string, suit: string): boolean => {
    const cardToCheck = `${rank}${suit}`;
    const usedCards = getUsedCards();
    
    // Remove current card being edited from used cards
    if (opponentCards[cardIndex]) {
      usedCards.delete(opponentCards[cardIndex]!);
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
    <div className="space-y-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="text-center">
        <h4 className="text-md font-semibold text-gray-700 mb-2">
          Seat {seatNumber} Cards
        </h4>
        <div className="flex justify-center gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            className="text-xs px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
            onClick={onMucked}
          >
            Mucked
          </Button>
        </div>
      </div>

      {[0, 1].map((cardIndex) => (
        <div key={cardIndex} className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          {/* Card Display Row */}
          <div className="text-center">
            <span className="text-base font-semibold text-gray-800">
              S{seatNumber}{cardIndex + 1}: 
              <span className={`ml-2 text-lg font-bold ${
                opponentCards[cardIndex]
                  ? (opponentCards[cardIndex]?.includes('♥') || opponentCards[cardIndex]?.includes('♦') 
                     ? 'text-red-600' : 'text-black')
                  : 'text-gray-400'
              }`}>
                {opponentCards[cardIndex] || '?'}
              </span>
            </span>
          </div>
          
          {/* Controls Row */}
          <div className="flex items-center justify-center gap-2">
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
                        ? 'hover:bg-gray-50 border-2 animate-pulse border-gray-400'
                        : 'hover:bg-gray-50'
                    }`}
                    aria-label={`Select ${suit.name} suit for seat ${seatNumber} card ${cardIndex + 1}`}
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
              <SelectTrigger className="min-w-[4.5rem] w-18 min-h-[3rem] h-12 sm:w-12 sm:h-10 text-lg sm:text-base font-bold border border-gray-300 bg-white hover:bg-gray-50 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 flex items-center justify-center p-0 rounded-md shadow-sm" aria-label={`Select rank for seat ${seatNumber} card ${cardIndex + 1}`}>
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
        </div>
      ))}
    </div>
  );
}