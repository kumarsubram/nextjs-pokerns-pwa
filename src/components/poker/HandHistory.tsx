'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { CurrentHand, StoredHand, Position } from '@/types/poker-v2';

interface HandHistoryProps {
  currentHand?: CurrentHand | null;
  completedHands: StoredHand[];
  userSeat?: Position;
  className?: string;
}

export function HandHistory({
  currentHand,
  completedHands = [],
  userSeat,
  className
}: HandHistoryProps) {
  const [expandedHands, setExpandedHands] = useState<Set<number>>(new Set());

  // Helper function to get card color
  const getCardColor = (card: string) => {
    if (!card || card === '?') return 'text-gray-800';
    const suit = card.slice(-1);
    return suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-gray-800';
  };

  // Helper function to format action concisely
  const formatActionConcise = (action: string, amount?: number) => {
    switch (action) {
      case 'fold': return 'F';
      case 'check': return 'X';
      case 'call': return amount ? `C:${amount}` : 'C';
      case 'raise': return amount ? `R:${amount}` : 'R';
      case 'all-in': return amount ? `A:${amount}` : 'A';
      default: return action;
    }
  };

  // Helper function to format position
  const formatPosition = (position: Position) => {
    if (position === userSeat) return `Hero`;
    return position;
  };

  // Toggle hand expansion
  const toggleHand = (handNumber: number) => {
    const newExpanded = new Set(expandedHands);
    if (newExpanded.has(handNumber)) {
      newExpanded.delete(handNumber);
    } else {
      newExpanded.add(handNumber);
    }
    setExpandedHands(newExpanded);
  };

  // Group actions for better display readability
  const groupActionsForDisplay = (actions: Array<{ position: Position; action: string; amount?: number }>, userSeat?: Position) => {
    const groups: Array<Array<{ position: Position; action: string; amount?: number }>> = [];
    let currentGroup: Array<{ position: Position; action: string; amount?: number }> = [];

    actions.forEach((action, index) => {
      const isSignificantAction = action.action === 'raise' || action.action === 'all-in' || action.position === userSeat;
      const isFirstAction = index === 0;
      const prevAction = index > 0 ? actions[index - 1] : null;
      const prevWasSignificant = prevAction && (prevAction.action === 'raise' || prevAction.action === 'all-in' || prevAction.position === userSeat);

      // Start a new group if:
      // 1. This is a significant action (raise, all-in, or hero action)
      // 2. Previous action was significant (so this starts on a new line)
      // 3. This is the first action
      if (isSignificantAction || prevWasSignificant || isFirstAction) {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
          currentGroup = [];
        }
      }

      currentGroup.push(action);

      // If this is significant, close the group so next action starts a new line
      if (isSignificantAction) {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
    });

    // Add remaining actions to final group
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  // Render action log for a hand
  const renderActionLog = (hand: CurrentHand | StoredHand) => {
    const actions: Array<{ round: string; position: Position; action: string; amount?: number }> = [];

    // Collect all actions
    ['preflop', 'flop', 'turn', 'river'].forEach(round => {
      const bettingRound = hand.bettingRounds[round as keyof typeof hand.bettingRounds];
      if (bettingRound?.actions) {
        bettingRound.actions.forEach(action => {
          actions.push({ round: round.charAt(0).toUpperCase() + round.slice(1), ...action });
        });
      }
    });

    // Group actions by round and format concisely
    const roundGroups: Record<string, Array<{ position: Position; action: string; amount?: number }>> = {};
    actions.forEach(action => {
      if (!roundGroups[action.round]) {
        roundGroups[action.round] = [];
      }
      roundGroups[action.round].push(action);
    });

    // Helper to get community cards for a specific round
    const getCommunityCardsForRound = (round: string) => {
      const cards: string[] = [];

      if (round === 'Preflop') {
        // No community cards for preflop
        return null;
      } else if (round === 'Flop') {
        if (hand.communityCards?.flop) {
          cards.push(...hand.communityCards.flop.filter(card => card));
        }
      } else if (round === 'Turn') {
        if (hand.communityCards?.flop) {
          cards.push(...hand.communityCards.flop.filter(card => card));
        }
        if (hand.communityCards?.turn) {
          cards.push(hand.communityCards.turn);
        }
      } else if (round === 'River') {
        if (hand.communityCards?.flop) {
          cards.push(...hand.communityCards.flop.filter(card => card));
        }
        if (hand.communityCards?.turn) {
          cards.push(hand.communityCards.turn);
        }
        if (hand.communityCards?.river) {
          cards.push(hand.communityCards.river);
        }
      }

      return cards.length > 0 ? cards : null;
    };

    return (
      <div className="space-y-3 p-3 bg-gray-50 rounded-md mt-2">
        {Object.entries(roundGroups).map(([round, roundActions]) => {
          // Group actions intelligently for better readability
          const actionGroups = groupActionsForDisplay(roundActions, userSeat);
          const communityCards = getCommunityCardsForRound(round);

          return (
            <div key={round}>
              <div className="text-xs font-semibold text-gray-600 mb-1">{round}:</div>

              {/* Show community cards for this round */}
              {communityCards && (
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">Board:</div>
                  <div className="flex gap-1">
                    {communityCards.map((card, i) => (
                      <span key={`${round}-${i}`} className={cn("text-xs font-bold", getCardColor(card))}>
                        {card}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Show actions for this round */}
              <div className="space-y-1">
                {actionGroups.map((group, groupIdx) => (
                  <div key={groupIdx} className="flex flex-wrap gap-2">
                    {group.map((action, idx) => (
                      <span key={idx} className="text-xs">
                        <span className={cn(
                          "font-medium",
                          action.position === userSeat ? "text-blue-600" : "text-gray-700"
                        )}>
                          {formatPosition(action.position)}
                        </span>
                        <span className={cn(
                          "ml-1",
                          action.action === 'fold' ? 'text-red-600' :
                          action.action === 'check' ? 'text-gray-600' :
                          action.action === 'call' ? 'text-blue-600' :
                          action.action === 'raise' ? 'text-green-600' :
                          action.action === 'all-in' ? 'text-purple-600' :
                          'text-gray-600'
                        )}>
                          {formatActionConcise(action.action, action.amount)}
                        </span>
                        {idx < group.length - 1 && <span className="text-gray-400 ml-1">•</span>}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Opponent Cards if available (shown at showdown) */}
        {'result' in hand && hand.result.opponentCards && Object.keys(hand.result.opponentCards).length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-600 mb-1">Showdown Cards:</div>
            <div className="space-y-1">
              {Object.entries(hand.result.opponentCards).map(([position, cards]) =>
                cards && (
                  <div key={position} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">{position}:</span>
                    <div className="flex gap-1">
                      <span className={cn("text-xs font-bold", getCardColor(cards[0]))}>
                        {cards[0]}
                      </span>
                      <span className={cn("text-xs font-bold", getCardColor(cards[1]))}>
                        {cards[1]}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render a single hand entry
  const renderHand = (hand: CurrentHand | StoredHand, isCurrent: boolean = false) => {
    const handNumber = hand.handNumber;
    const isExpanded = expandedHands.has(handNumber);
    const hasCards = hand.userCards && hand.userCards[0] && hand.userCards[1];
    const outcome = 'result' in hand ? hand.result.handOutcome : null;

    return (
      <div key={handNumber} className="border rounded-lg bg-white shadow-sm">
        <div
          className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
          onClick={() => toggleHand(handNumber)}
        >
          <div className="flex items-center gap-3">
            {/* Hand Number */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                Hand #{handNumber}
              </span>
              {isCurrent && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  Current
                </span>
              )}
            </div>

            {/* User Cards */}
            {hasCards ? (
              <div className="flex gap-1">
                <span className={cn("text-sm font-bold", getCardColor(hand.userCards![0]))}>
                  {hand.userCards![0]}
                </span>
                <span className={cn("text-sm font-bold", getCardColor(hand.userCards![1]))}>
                  {hand.userCards![1]}
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-500 italic">Cards not selected</span>
            )}

            {/* Outcome */}
            {outcome && (
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded",
                outcome === 'won' ? 'bg-green-100 text-green-700' :
                outcome === 'lost' ? 'bg-red-100 text-red-700' :
                outcome === 'folded' ? 'bg-gray-100 text-gray-700' :
                'bg-yellow-100 text-yellow-700'
              )}>
                {outcome === 'won' ? 'Won' :
                 outcome === 'lost' ? 'Lost' :
                 outcome === 'folded' ? 'Folded' :
                 'Chopped'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Share Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement text share
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="Share hand"
            >
              <MessageCircle className="h-4 w-4 text-gray-600" />
            </button>

            {/* Expand/Collapse Icon */}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </div>

        {/* Expandable Action Log */}
        {isExpanded && (
          <div className="border-t px-3 pb-3">
            {renderActionLog(hand)}

            {/* Pot Information */}
            {'result' in hand && hand.result.potWon !== undefined && (
              <div className="mt-2 text-xs text-gray-600">
                Pot won: <span className="font-semibold">{hand.result.potWon}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-lg font-semibold mb-3">Hand History</h3>

      {/* Current Hand */}
      {currentHand && renderHand(currentHand, true)}

      {/* Completed Hands */}
      {completedHands
        .sort((a, b) => b.handNumber - a.handNumber)
        .map(hand => renderHand(hand, false))}

      {/* Empty State */}
      {!currentHand && completedHands.length === 0 && (
        <div className="text-sm text-gray-500 italic p-4 text-center">
          No hands played yet
        </div>
      )}
    </div>
  );
}