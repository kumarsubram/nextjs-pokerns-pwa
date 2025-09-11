'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Action, Session } from '@/types/poker';
import { cn } from '@/lib/utils';

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
  communityCards?: (string | null)[]; // Community cards if available
}

export function HandTracker({ 
  handNumber, 
  holeCards, 
  handResult, 
  handWinAmount, 
  handActions, 
  session,
  communityCards = [] 
}: HandTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format individual card with colored suits
  const formatCard = (card: string | null) => {
    if (!card) return null;
    const rank = card.charAt(0);
    const suit = card.charAt(1);
    const isRed = suit === '♥' || suit === '♦';
    
    return (
      <span className={cn(
        "font-mono font-semibold text-lg",
        isRed ? "text-red-600" : "text-gray-900"
      )}>
        {rank}{suit}
      </span>
    );
  };
  
  // Format hole cards for display
  const formatHoleCards = () => {
    const validCards = holeCards.filter(card => card !== null);
    if (validCards.length === 0) return null;
    
    return (
      <div className="flex items-center gap-1">
        {validCards.map((card, idx) => (
          <span key={idx} className="bg-white border border-gray-300 rounded px-2 py-1">
            {formatCard(card)}
          </span>
        ))}
      </div>
    );
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

  // Group actions by betting round
  const groupActionsByRound = () => {
    const rounds: { [key: string]: TrackedAction[] } = {
      preflop: [],
      flop: [],
      turn: [],
      river: []
    };
    
    handActions.forEach(action => {
      const round = action.bettingRound || 'preflop';
      if (rounds[round]) {
        rounds[round].push(action);
      }
    });
    
    return rounds;
  };
  
  // Format action text for display
  const formatActionText = (action: TrackedAction) => {
    let seatText = '';
    const isHero = action.seatNumber === session?.heroPosition;
    if (action.seatNumber) {
      seatText = `Seat ${action.seatNumber}`;
      if (isHero) {
        seatText += ' (You)';
      }
    }
    
    let actionText = '';
    switch (action.action) {
      case 'fold':
        actionText = 'Fold';
        break;
      case 'check':
        actionText = 'Check';
        break;
      case 'call':
        actionText = action.amount ? `Call $${action.amount}` : 'Call';
        break;
      case 'raise':
        actionText = action.amount ? `Raise $${action.amount}` : 'Raise';
        break;
      case 're-raise':
        actionText = action.amount ? `Re-raise $${action.amount}` : 'Re-raise';
        break;
      case 'bet':
        actionText = action.amount ? `Bet $${action.amount}` : 'Bet';
        break;
      case 'all-in':
        actionText = action.amount ? `All-in $${action.amount}` : 'All-in';
        break;
      default:
        actionText = action.action;
    }
    
    return { text: `${seatText}: ${actionText}`, isHero };
  };
  
  // Format community cards display
  const formatCommunityCards = (roundCards: (string | null)[]) => {
    return roundCards.filter(card => card !== null).map((card, idx) => (
      <span key={idx} className="bg-white border border-gray-300 rounded px-2 py-1 mx-0.5">
        {formatCard(card)}
      </span>
    ));
  };
  
  // Handle share functionality (placeholder for now)
  const handleShareText = () => {
    console.log('Share via text - to be implemented');
  };
  
  const handleShareTwitter = () => {
    console.log('Share on Twitter - to be implemented');
  };


  const holeCardsDisplay = formatHoleCards();
  const resultText = getResultText();
  const actionGroups = groupActionsByRound();

  return (
    <Card className="mb-3">
      <CardHeader 
        className="pb-3 cursor-pointer select-none hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-sm font-medium">
              Hand #{handNumber}
            </CardTitle>
            {holeCardsDisplay}
            {resultText && (
              <span className={cn(
                "text-xs px-2 py-1 rounded font-medium",
                handResult === 'won' && 'bg-green-100 text-green-800',
                handResult === 'lost' && 'bg-red-100 text-red-800',
                handResult === 'folded' && 'bg-gray-100 text-gray-800',
                handResult === 'chopped' && 'bg-orange-100 text-orange-800'
              )}>
                {resultText}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs font-medium border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                handleShareText();
              }}
              title="Share hand via text"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              Text
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs font-medium border-gray-200 hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                handleShareTwitter();
              }}
              title="Share on X"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-gray-500">{handActions.length} actions</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Preflop Actions */}
            {(actionGroups.preflop.length > 0 || session?.smallBlindPosition || session?.bigBlindPosition) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Preflop</h4>
                <div className="space-y-1 text-sm">
                  {session?.smallBlindPosition && (
                    <div className="text-blue-600">
                      Seat {session.smallBlindPosition}: Small blind $${session.smallBlind}
                    </div>
                  )}
                  {session?.bigBlindPosition && (
                    <div className="text-blue-600">
                      Seat {session.bigBlindPosition}: Big blind $${session.bigBlind}
                    </div>
                  )}
                  {actionGroups.preflop.map((action, idx) => {
                    const formatted = formatActionText(action);
                    return (
                      <div key={idx} className={cn(
                        formatted.isHero && "text-blue-800 font-semibold",
                        !formatted.isHero && action.action === 'fold' && "text-gray-500",
                        !formatted.isHero && action.action === 'all-in' && "text-purple-700 font-semibold",
                        !formatted.isHero && (action.action === 'raise' || action.action === 're-raise') && "text-orange-700 font-semibold",
                        !formatted.isHero && !['fold', 'all-in', 'raise', 're-raise'].includes(action.action) && "text-gray-800"
                      )}>
                        {formatted.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Flop Actions */}
            {actionGroups.flop.length > 0 && (
              <div>
                {communityCards && communityCards.length >= 3 && (
                  <div className="mb-2 flex items-center gap-1">
                    <span className="text-sm font-medium text-gray-600">Flop:</span>
                    {formatCommunityCards(communityCards.slice(0, 3))}
                  </div>
                )}
                <div className="space-y-1 text-sm">
                  {actionGroups.flop.map((action, idx) => {
                    const formatted = formatActionText(action);
                    return (
                      <div key={idx} className={cn(
                        formatted.isHero && "text-blue-800 font-semibold",
                        !formatted.isHero && action.action === 'fold' && "text-gray-500",
                        !formatted.isHero && action.action === 'all-in' && "text-purple-700 font-semibold",
                        !formatted.isHero && (action.action === 'raise' || action.action === 're-raise') && "text-orange-700 font-semibold",
                        !formatted.isHero && !['fold', 'all-in', 'raise', 're-raise'].includes(action.action) && "text-gray-800"
                      )}>
                        {formatted.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Turn Actions */}
            {actionGroups.turn.length > 0 && (
              <div>
                {communityCards && communityCards.length >= 4 && (
                  <div className="mb-2 flex items-center gap-1">
                    <span className="text-sm font-medium text-gray-600">Turn:</span>
                    {formatCommunityCards(communityCards.slice(0, 4))}
                  </div>
                )}
                <div className="space-y-1 text-sm">
                  {actionGroups.turn.map((action, idx) => {
                    const formatted = formatActionText(action);
                    return (
                      <div key={idx} className={cn(
                        formatted.isHero && "text-blue-800 font-semibold",
                        !formatted.isHero && action.action === 'fold' && "text-gray-500",
                        !formatted.isHero && action.action === 'all-in' && "text-purple-700 font-semibold",
                        !formatted.isHero && (action.action === 'raise' || action.action === 're-raise') && "text-orange-700 font-semibold",
                        !formatted.isHero && !['fold', 'all-in', 'raise', 're-raise'].includes(action.action) && "text-gray-800"
                      )}>
                        {formatted.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* River Actions */}
            {actionGroups.river.length > 0 && (
              <div>
                {communityCards && communityCards.length >= 5 && (
                  <div className="mb-2 flex items-center gap-1">
                    <span className="text-sm font-medium text-gray-600">River:</span>
                    {formatCommunityCards(communityCards.slice(0, 5))}
                  </div>
                )}
                <div className="space-y-1 text-sm">
                  {actionGroups.river.map((action, idx) => {
                    const formatted = formatActionText(action);
                    return (
                      <div key={idx} className={cn(
                        formatted.isHero && "text-blue-800 font-semibold",
                        !formatted.isHero && action.action === 'fold' && "text-gray-500",
                        !formatted.isHero && action.action === 'all-in' && "text-purple-700 font-semibold",
                        !formatted.isHero && (action.action === 'raise' || action.action === 're-raise') && "text-orange-700 font-semibold",
                        !formatted.isHero && !['fold', 'all-in', 'raise', 're-raise'].includes(action.action) && "text-gray-800"
                      )}>
                        {formatted.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {handActions.length === 0 && !session?.smallBlindPosition && !session?.bigBlindPosition && (
              <p className="text-sm text-gray-500 text-center py-2">No actions recorded</p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}