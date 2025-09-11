'use client';

import { useState, useEffect } from 'react';
import { User, Crown, DollarSign, ChevronDown, Spade } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PlayerAction {
  action: 'fold' | 'call' | 'raise' | 'check' | 'bet' | 'all-in';
  amount?: number;
}

interface PokerTableProps {
  seats: 2 | 4 | 6 | 8 | 9 | 10;
  onSeatSelect?: (seatIndex: number) => void;
  onBlindsSelect?: (smallBlind: number, bigBlind: number) => void;
  onCommunityCardSelect?: (cardIndex: number, card: string) => void;
  selectedSeat?: number;
  smallBlindSeat?: number;
  bigBlindSeat?: number;
  buttonSeat?: number;
  dealerSeat?: number;
  showSeatSelection?: boolean;
  showBlindSelection?: boolean;
  allowHeroAsBlind?: boolean;
  showPositions?: boolean;
  showCommunityCards?: boolean;
  communityCards?: (string | null)[];
  playerActions?: Map<number, PlayerAction>; // Track actions for each seat
  currentActionSeat?: number; // Highlight current action seat
  foldedSeats?: Set<number>; // Track folded players
  smallBlindAmount?: number; // Amount for small blind
  bigBlindAmount?: number; // Amount for big blind
  potSize?: number; // Current pot size to display
  currency?: string; // Currency symbol
  heroHoleCards?: (string | null)[]; // Hero's hole cards to display
}

export function PokerTable({
  seats,
  onSeatSelect,
  onBlindsSelect,
  onCommunityCardSelect,
  selectedSeat,
  smallBlindSeat,
  bigBlindSeat,
  buttonSeat,
  dealerSeat = 0,
  showSeatSelection = true,
  showBlindSelection = true,
  allowHeroAsBlind = false,
  showPositions = false,
  showCommunityCards = false,
  communityCards = [null, null, null, null, null],
  playerActions,
  currentActionSeat,
  foldedSeats = new Set(),
  smallBlindAmount,
  bigBlindAmount,
  potSize,
  currency = '$',
  heroHoleCards = [null, null],
}: PokerTableProps) {
  const [tempSmallBlind, setTempSmallBlind] = useState<number | null>(null);
  const [tempBigBlind, setTempBigBlind] = useState<number | null>(null);

  // Card options for dropdown
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const cardOptions = suits.flatMap(suit => 
    ranks.map(rank => `${rank}${suit}`)
  );

  // Auto-select big blind when small blind is selected
  useEffect(() => {
    if (tempSmallBlind !== null && tempBigBlind === null && showBlindSelection) {
      const nextSeat = (tempSmallBlind + 1) % seats;
      setTempBigBlind(nextSeat);
      if (onBlindsSelect) {
        onBlindsSelect(tempSmallBlind, nextSeat);
      }
    }
  }, [tempSmallBlind, tempBigBlind, seats, showBlindSelection, onBlindsSelect]);

  // Get poker position abbreviation based on button position
  const getPositionAbbreviation = (seatIndex: number): string => {
    if (!buttonSeat && buttonSeat !== 0) return '';
    
    const buttonPos = buttonSeat;
    const positionsFromButton = (seatIndex - buttonPos + seats) % seats;
    
    // Positions relative to button (clockwise)
    switch (seats) {
      case 2:
        return positionsFromButton === 0 ? 'BTN' : 'BB';
      case 4:
        const pos4 = ['BTN', 'SB', 'BB', 'CO'][positionsFromButton];
        return pos4;
      case 6:
        const pos6 = ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'][positionsFromButton];
        return pos6;
      case 8:
        const pos8 = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'MP+1', 'CO'][positionsFromButton];
        return pos8;
      case 9:
        const pos9 = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'MP+1', 'MP+2', 'CO'][positionsFromButton];
        return pos9;
      case 10:
        const pos10 = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'MP+2', 'CO'][positionsFromButton];
        return pos10;
      default:
        return '';
    }
  };

  // Calculate seat positions around the table
  const getSeatPosition = (seatIndex: number): { x: number; y: number } => {
    const totalSeats = seats + 1; // Include dealer seat
    const angle = (seatIndex * 2 * Math.PI) / totalSeats - Math.PI / 2; // Start from top
    const radiusX = 45; // Horizontal radius percentage  
    const radiusY = 35; // Vertical radius percentage
    
    return {
      x: 50 + radiusX * Math.cos(angle), // Center at 50%
      y: 50 + radiusY * Math.sin(angle),
    };
  };

  const handleSeatClick = (seatIndex: number) => {
    // Prevent clicking on dealer seat
    if (seatIndex === dealerSeat) {
      return;
    }
    
    if (showBlindSelection && (!smallBlindSeat || !bigBlindSeat)) {
      // Handle blind selection first
      if (!tempSmallBlind) {
        setTempSmallBlind(seatIndex);
        // Big blind will be auto-selected via useEffect
      }
    } else if (showSeatSelection) {
      // Handle hero seat selection (can be any seat including blinds if allowed)
      onSeatSelect?.(seatIndex);
    }
  };

  const getSeatLabel = (seatIndex: number): { main: string; action?: string; blind?: string } => {
    // Base label
    let mainLabel = '';
    let blindAmount = '';
    
    if (seatIndex === selectedSeat) {
      mainLabel = 'YOU';
    } else if (seatIndex === dealerSeat) {
      mainLabel = 'D';
    } else if (seatIndex === smallBlindSeat || seatIndex === tempSmallBlind) {
      mainLabel = 'SB';
      if (smallBlindAmount) {
        blindAmount = `$${smallBlindAmount}`;
      }
    } else if (seatIndex === bigBlindSeat || seatIndex === tempBigBlind) {
      mainLabel = 'BB';
      if (bigBlindAmount) {
        blindAmount = `$${bigBlindAmount}`;
      }
    } else if (showPositions && (buttonSeat || buttonSeat === 0)) {
      const position = getPositionAbbreviation(seatIndex);
      if (position) mainLabel = position;
    }
    
    // Default to seat number if no special label
    if (!mainLabel) {
      mainLabel = seatIndex === 0 ? 'D' : `${seatIndex}`;
    }
    
    // Check for player action
    const action = playerActions?.get(seatIndex);
    if (action) {
      const actionLabel = 
        action.action === 'fold' ? 'F' :
        action.action === 'call' ? 'C' :
        action.action === 'raise' ? 'R' :
        action.action === 'check' ? 'X' :
        action.action === 'bet' ? 'B' :
        action.action === 'all-in' ? 'AI' : '';
      
      const amountStr = action.amount ? ` $${action.amount}` : '';
      return { main: mainLabel, action: `${actionLabel}${amountStr}`, blind: blindAmount };
    }
    
    return { main: mainLabel, blind: blindAmount };
  };

  const getSeatColor = (seatIndex: number): string => {
    // Folded seats are grayed out
    if (foldedSeats.has(seatIndex)) {
      return 'bg-gray-200 text-gray-400 border-2 border-gray-300 opacity-50';
    }
    
    // Current action seat has a pulsing effect
    if (seatIndex === currentActionSeat) {
      return 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg animate-pulse';
    }
    
    if (seatIndex === selectedSeat) return 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg';
    if (seatIndex === dealerSeat) return 'bg-gradient-to-br from-gray-800 to-black text-white border-2 border-gray-600 shadow-lg';
    // Only show colors after small blind is selected
    if ((tempSmallBlind !== null || smallBlindSeat !== undefined) && seatIndex === buttonSeat) return 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white border-4 border-yellow-300 shadow-xl ring-4 ring-yellow-200';
    if (seatIndex === smallBlindSeat || seatIndex === tempSmallBlind) return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white';
    if (seatIndex === bigBlindSeat || seatIndex === tempBigBlind) return 'bg-gradient-to-br from-orange-500 to-orange-600 text-white';
    return 'bg-white border-2 border-gray-300 text-gray-700 hover:border-emerald-500 hover:text-emerald-600';
  };

  const getInstructionText = (): string => {
    if (showBlindSelection && !smallBlindSeat && !bigBlindSeat) {
      if (!tempSmallBlind) return 'Select Small Blind position';
      if (!tempBigBlind) return 'Select Big Blind position';
    }
    // Remove seat selection instruction text
    return '';
  };

  const getSubInstructionText = (): string => {
    if (showBlindSelection && !smallBlindSeat && !bigBlindSeat) {
      if (!tempSmallBlind) return 'Click on any seat to set as Small Blind';
      if (!tempBigBlind) return 'Big Blind will auto-select next seat';
    }
    // Remove seat selection sub-instruction text
    return '';
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Instructions - only show for seat selection, not blind selection */}
      {showSeatSelection && getInstructionText() && (
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">{getInstructionText()}</p>
          <p className="text-sm text-gray-600">
            {getSubInstructionText()}
          </p>
        </div>
      )}

      {/* Poker Table */}
      <div className="relative w-80 h-60 mx-auto">
        {/* Table Surface */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-800 to-green-900 rounded-full shadow-2xl border-8 border-amber-600">
          {/* Table felt pattern */}
          <div className="absolute inset-2 bg-gradient-to-br from-green-700 to-green-800 rounded-full opacity-50"></div>
          
          {/* Community Cards */}
          {showCommunityCards ? (
            <div className="absolute inset-1/4 flex flex-col items-center justify-center">
              <div className="flex gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, cardIndex) => (
                  <DropdownMenu key={cardIndex}>
                    <DropdownMenuTrigger asChild>
                      <button className={`w-8 h-12 rounded border-2 text-xs font-bold transition-all duration-200 hover:scale-105 ${
                        communityCards[cardIndex] 
                          ? 'bg-white border-gray-300 text-gray-800 shadow-md' 
                          : 'bg-gray-100 border-dashed border-gray-400 text-gray-500 hover:bg-gray-200'
                      }`}>
                        {communityCards[cardIndex] ? (
                          <div className={`text-center ${
                            communityCards[cardIndex]?.includes('♥') || communityCards[cardIndex]?.includes('♦') 
                              ? 'text-red-600' 
                              : 'text-black'
                          }`}>
                            {communityCards[cardIndex]}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="text-[8px]">?</div>
                            <ChevronDown className="h-2 w-2" />
                          </div>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-32 max-h-48 overflow-y-auto">
                      <DropdownMenuItem 
                        onClick={() => onCommunityCardSelect?.(cardIndex, '')}
                        className="text-gray-500"
                      >
                        Clear Card
                      </DropdownMenuItem>
                      {cardOptions.map((card) => (
                        <DropdownMenuItem
                          key={card}
                          onClick={() => onCommunityCardSelect?.(cardIndex, card)}
                          className={`text-sm ${
                            card.includes('♥') || card.includes('♦') ? 'text-red-600' : 'text-black'
                          }`}
                        >
                          {card}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
              </div>
              {/* Pot Size Display */}
              {potSize !== undefined && potSize > 0 && (
                <div className="bg-gray-800/90 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  Pot: {currency}{potSize}
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-1/3 bg-gradient-to-br from-green-600 to-green-700 rounded-full border border-green-500 opacity-30"></div>
          )}
        </div>

        {/* Seat Positions */}
        {Array.from({ length: seats + 1 }).map((_, seatIndex) => {
          const position = getSeatPosition(seatIndex);
          const isBlindSeat = seatIndex === smallBlindSeat || seatIndex === bigBlindSeat;
          const isSelectedSeat = seatIndex === selectedSeat;
          const isDisabled = seatIndex === dealerSeat || (showSeatSelection && !allowHeroAsBlind && isBlindSeat && !isSelectedSeat);
          
          return (
            <button
              key={seatIndex}
              onClick={() => handleSeatClick(seatIndex)}
              className={`absolute w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 transform hover:scale-110 ${getSeatColor(seatIndex)} ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              disabled={isDisabled}
            >
              <div className="flex flex-col items-center justify-center">
                {(() => {
                  const label = getSeatLabel(seatIndex);
                  return (
                    <>
                      {seatIndex === dealerSeat ? (
                        <Spade className="h-3 w-3" />
                      ) : (tempSmallBlind !== null || smallBlindSeat !== undefined) && seatIndex === buttonSeat ? (
                        <Crown className="h-3 w-3" />
                      ) : seatIndex === selectedSeat ? (
                        <User className="h-3 w-3" />
                      ) : (seatIndex === smallBlindSeat || seatIndex === tempSmallBlind || seatIndex === bigBlindSeat || seatIndex === tempBigBlind) ? (
                        <DollarSign className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3 text-gray-400" />
                      )}
                      <span className="text-[9px] leading-none">{label.main}</span>
                      {label.blind && !label.action && (
                        <span className="text-[7px] leading-none text-gray-300 mt-0.5">{label.blind}</span>
                      )}
                      {label.action && (
                        <span className="text-[8px] leading-none font-semibold mt-0.5">{label.action}</span>
                      )}
                    </>
                  );
                })()}
              </div>
            </button>
          );
        })}

        {/* Hero Hole Cards - Display above hero's position if hole cards exist */}
        {selectedSeat !== undefined && heroHoleCards && (heroHoleCards[0] || heroHoleCards[1]) && (
          (() => {
            const heroPosition = getSeatPosition(selectedSeat);
            // Calculate position above hero seat
            const cardDisplayY = heroPosition.y - 8; // 8% higher than hero seat
            
            return (
              <div
                className="absolute flex gap-1"
                style={{
                  left: `${heroPosition.x}%`,
                  top: `${cardDisplayY}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {heroHoleCards.map((card, index) => (
                  <div
                    key={index}
                    className={`w-6 h-8 rounded border-2 text-[10px] font-bold flex items-center justify-center shadow-md ${
                      card 
                        ? 'bg-white border-gray-300 text-gray-800' 
                        : 'bg-gray-100 border-dashed border-gray-400 text-gray-500'
                    }`}
                  >
                    {card ? (
                      <div className={`text-center ${
                        card.includes('♥') || card.includes('♦') 
                          ? 'text-red-600' 
                          : 'text-black'
                      }`}>
                        {card}
                      </div>
                    ) : (
                      '?'
                    )}
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}