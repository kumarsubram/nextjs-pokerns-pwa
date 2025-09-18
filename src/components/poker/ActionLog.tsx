'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CurrentHand, Position } from '@/types/poker-v2';

interface ActionLogProps {
  currentHand: CurrentHand | null;
  userSeat: Position | undefined;
  className?: string;
}

export function ActionLog({ currentHand, userSeat, className }: ActionLogProps) {
  if (!currentHand) return null;

  // Helper function to get card color
  const getCardColor = (card: string) => {
    if (!card || card === '?') return 'text-gray-800';
    const suit = card.slice(-1); // Get last character (suit)
    return suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-gray-800';
  };

  // Helper function to format position display
  const formatPosition = (position: Position) => {
    if (position === userSeat) {
      return `Hero/${position}`;
    }
    return position;
  };

  // Helper function to format action display
  const formatAction = (action: string, amount?: number) => {
    switch (action) {
      case 'fold':
        return 'Fold';
      case 'check':
        return 'Check';
      case 'call':
        return `Call ${amount || ''}`;
      case 'raise':
        return `Raise to ${amount || ''}`;
      case 'all-in':
        return `All-In ${amount || ''}`;
      default:
        return action;
    }
  };

  // Collect all actions from all betting rounds
  const getAllActions = () => {
    const actions: Array<{
      round: string;
      position: Position;
      action: string;
      amount?: number;
      timestamp: string;
    }> = [];

    // Add preflop actions
    if (currentHand.bettingRounds.preflop?.actions) {
      currentHand.bettingRounds.preflop.actions.forEach(action => {
        actions.push({
          round: 'Preflop',
          ...action
        });
      });
    }

    // Add flop actions
    if (currentHand.bettingRounds.flop?.actions) {
      currentHand.bettingRounds.flop.actions.forEach(action => {
        actions.push({
          round: 'Flop',
          ...action
        });
      });
    }

    // Add turn actions
    if (currentHand.bettingRounds.turn?.actions) {
      currentHand.bettingRounds.turn.actions.forEach(action => {
        actions.push({
          round: 'Turn',
          ...action
        });
      });
    }

    // Add river actions
    if (currentHand.bettingRounds.river?.actions) {
      currentHand.bettingRounds.river.actions.forEach(action => {
        actions.push({
          round: 'River',
          ...action
        });
      });
    }

    return actions;
  };

  const allActions = getAllActions();
  const hasUserCards = currentHand.userCards && currentHand.userCards[0] && currentHand.userCards[1];

  return (
    <div className={cn("bg-white rounded-lg p-4 shadow-sm", className)}>
      <h3 className="text-md font-semibold mb-3">Hand #{currentHand.handNumber} Action Log</h3>

      {/* Current Hand Cards */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm font-medium mb-2">Hero Cards:</div>
        {hasUserCards ? (
          <div className="flex gap-2">
            <div className={cn(
              "w-8 h-12 rounded border-2 border-gray-800 bg-white text-xs font-bold flex items-center justify-center",
              getCardColor(currentHand.userCards![0])
            )}>
              {currentHand.userCards![0]}
            </div>
            <div className={cn(
              "w-8 h-12 rounded border-2 border-gray-800 bg-white text-xs font-bold flex items-center justify-center",
              getCardColor(currentHand.userCards![1])
            )}>
              {currentHand.userCards![1]}
            </div>
          </div>
        ) : (
          <div className="text-sm text-orange-600 font-medium">
            ⚠️ Select hole cards to complete hand tracking
          </div>
        )}
      </div>

      {/* Community Cards */}
      {(currentHand.communityCards.flop?.some(card => card) ||
        currentHand.communityCards.turn ||
        currentHand.communityCards.river) && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium mb-2">Community Cards:</div>
          <div className="flex gap-1">
            {/* Flop */}
            {currentHand.communityCards.flop?.map((card, index) => (
              card ? (
                <div key={`flop-${index}`} className={cn(
                  "w-6 h-9 rounded border border-gray-800 bg-white text-xs font-bold flex items-center justify-center",
                  getCardColor(card)
                )}>
                  {card}
                </div>
              ) : null
            ))}
            {/* Turn */}
            {currentHand.communityCards.turn && (
              <div className={cn(
                "w-6 h-9 rounded border border-gray-800 bg-white text-xs font-bold flex items-center justify-center ml-1",
                getCardColor(currentHand.communityCards.turn)
              )}>
                {currentHand.communityCards.turn}
              </div>
            )}
            {/* River */}
            {currentHand.communityCards.river && (
              <div className={cn(
                "w-6 h-9 rounded border border-gray-800 bg-white text-xs font-bold flex items-center justify-center",
                getCardColor(currentHand.communityCards.river)
              )}>
                {currentHand.communityCards.river}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Timeline */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {allActions.length === 0 ? (
          <div className="text-sm text-gray-500 italic">No actions yet...</div>
        ) : (
          allActions.map((action, index) => {
            const isNewRound = index === 0 || allActions[index - 1].round !== action.round;

            return (
              <div key={`${action.round}-${action.position}-${index}`}>
                {/* Round Header */}
                {isNewRound && (
                  <div className="text-sm font-bold text-blue-600 border-b border-blue-200 pb-1 mb-2">
                    {action.round} Betting
                  </div>
                )}

                {/* Action Entry */}
                <div className="text-sm flex items-center gap-2 py-1">
                  <span className={cn(
                    "font-medium",
                    action.position === userSeat ? "text-blue-600" : "text-gray-700"
                  )}>
                    {formatPosition(action.position)}:
                  </span>
                  <span className={cn(
                    action.action === 'fold' ? 'text-red-600' :
                    action.action === 'check' ? 'text-blue-600' :
                    action.action === 'call' ? 'text-blue-600' :
                    action.action === 'raise' ? 'text-green-600' :
                    action.action === 'all-in' ? 'text-purple-600' :
                    'text-gray-600'
                  )}>
                    {formatAction(action.action, action.amount)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pot Information */}
      {currentHand.pot > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-sm">
            <span className="font-medium">Current Pot:</span>
            <span className="ml-2 font-bold">{Math.floor(currentHand.pot)}</span>
          </div>
        </div>
      )}
    </div>
  );
}