'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Action, Session } from '@/types/poker';

// Extended action interface for tracking
interface TrackedAction extends Action {
  seatNumber?: number;
  bettingRound?: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  timestamp?: Date;
}

interface HandTrackerProps {
  handNumber: number;
  holeCards: (string | null)[];
  handResult: 'won' | 'lost' | 'folded' | 'chopped' | null;
  handWinAmount: number;
  handActions: TrackedAction[];
  currentBettingRound?: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'; // Optional for completed hands
  session: Session; // Session object to get blind amounts and positions
}

export function HandTracker({ 
  handNumber, 
  holeCards, 
  handResult, 
  handWinAmount, 
  handActions, 
  session 
}: HandTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format hole cards for display - show both short and long format
  const formatHoleCards = () => {
    const validCards = holeCards.filter(card => card !== null);
    if (validCards.length === 0) return { short: null, long: null };
    
    // Short format: A♠ K♥
    const shortFormat = validCards.join(' ');
    
    // Long format: Ace of Spades, King of Hearts
    const longFormat = validCards.map(card => {
      if (!card) return '';
      const rank = card.charAt(0);
      const suit = card.charAt(1);
      
      const rankNames: { [key: string]: string } = {
        'A': 'Ace', 'K': 'King', 'Q': 'Queen', 'J': 'Jack',
        'T': 'Ten', '9': 'Nine', '8': 'Eight', '7': 'Seven',
        '6': 'Six', '5': 'Five', '4': 'Four', '3': 'Three', '2': 'Two'
      };
      
      const suitNames: { [key: string]: string } = {
        '♠': 'Spades', '♥': 'Hearts', '♦': 'Diamonds', '♣': 'Clubs'
      };
      
      return `${rankNames[rank] || rank} of ${suitNames[suit] || suit}`;
    }).join(', ');
    
    return { short: shortFormat, long: longFormat };
  };

  // Get result text with amount
  const getResultText = () => {
    if (!handResult) return null;
    
    switch (handResult) {
      case 'won':
        return `Won +$${handWinAmount}`;
      case 'lost':
        return 'Lost';
      case 'folded':
        return 'Folded';
      case 'chopped':
        return 'Chopped';
      default:
        return handResult;
    }
  };

  // Group actions by betting round for better display
  const groupActionsByRound = () => {
    const rounds: { [key: string]: TrackedAction[] } = {
      preflop: [],
      flop: [],
      turn: [],
      river: []
    };
    
    // Group actions by their betting round
    handActions.forEach(action => {
      const round = action.bettingRound || 'preflop';
      rounds[round].push(action);
    });
    
    return rounds;
  };

  // Convert seat numbers to positions
  const getPositionName = (seatNumber: number) => {
    if (!session) return `Seat ${seatNumber}`;
    
    const dealerSeat = session.buttonPosition || 0;
    const totalSeats = session.seats;
    
    // Calculate position from dealer
    const positionsFromDealer = (seatNumber - dealerSeat + totalSeats) % totalSeats;
    
    if (seatNumber === session.smallBlindPosition) return 'SB';
    if (seatNumber === session.bigBlindPosition) return 'BB';
    
    // Position mapping based on table size
    const positionMap: { [seats: number]: { [pos: number]: string } } = {
      9: { 1: 'UTG', 2: 'UTG+1', 3: 'MP', 4: 'MP+1', 5: 'CO', 6: 'BTN', 7: 'SB', 8: 'BB' },
      6: { 1: 'UTG', 2: 'MP', 3: 'CO', 4: 'BTN', 5: 'SB', 0: 'BB' },
    };
    
    return positionMap[totalSeats]?.[positionsFromDealer] || `Seat ${seatNumber}`;
  };

  const formatActionText = (action: TrackedAction) => {
    let playerName = '';
    let actionText = '';
    
    // Determine player name
    if (action.player === 'hero') {
      playerName = `Seat ${session?.heroPosition} (Me)`;
    } else if (action.seatNumber !== undefined) {
      const positionName = getPositionName(action.seatNumber);
      playerName = `Seat ${action.seatNumber} ${positionName !== `Seat ${action.seatNumber}` ? `(${positionName})` : ''}`;
    } else {
      playerName = `${action.player}`;
    }
    
    // Format the action with amount
    switch (action.action) {
      case 'fold':
        actionText = 'folded';
        break;
      case 'call':
        actionText = action.amount ? `called $${action.amount}` : 'called';
        break;
      case 'raise':
        actionText = action.amount ? `raised to $${action.amount}` : 'raised';
        break;
      case 're-raise':
        actionText = action.amount ? `re-raised to $${action.amount}` : 're-raised';
        break;
      case 'bet':
        actionText = action.amount ? `bet $${action.amount}` : 'bet';
        break;
      case 'check':
        actionText = 'checked';
        break;
      case 'all-in':
        actionText = action.amount ? `went all-in for $${action.amount}` : 'went all-in';
        break;
      case 'straddle':
        actionText = action.amount ? `straddled $${action.amount}` : 'straddled';
        break;
      default:
        actionText = action.action;
    }
    
    return `${playerName} ${actionText}`;
  };

  const holeCardsFormatted = formatHoleCards();
  const resultText = getResultText();
  const actionGroups = groupActionsByRound();

  return (
    <Card className="mb-3">
      <CardHeader 
        className="pb-3 cursor-pointer select-none hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-sm font-medium">
              Hand {handNumber}
            </CardTitle>
            {holeCardsFormatted.short && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">
                {holeCardsFormatted.short}
              </span>
            )}
            {resultText && (
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                handResult === 'won' ? 'bg-green-100 text-green-800' :
                handResult === 'lost' ? 'bg-red-100 text-red-800' :
                handResult === 'folded' ? 'bg-gray-100 text-gray-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {resultText}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">{handActions.length} actions</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Blinds and Preflop Actions */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preflop</h4>
              <div className="space-y-1 text-sm">
                <div className="text-blue-600 font-medium">
                  Seat {session?.smallBlindPosition} posts SB ${session?.smallBlind}
                </div>
                <div className="text-blue-600 font-medium">
                  Seat {session?.bigBlindPosition} posts BB ${session?.bigBlind}
                </div>
                {actionGroups.preflop.map((action, index) => (
                  <div key={index} className="text-gray-800">
                    {formatActionText(action)}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Other rounds if they have actions */}
            {['flop', 'turn', 'river'].map(round => (
              actionGroups[round].length > 0 && (
                <div key={round}>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">{round}</h4>
                  <div className="space-y-1 text-sm">
                    {actionGroups[round].map((action, index) => (
                      <div key={index} className="text-gray-800">
                        {formatActionText(action)}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
            
            {handActions.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">No actions yet</p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}