'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { CurrentHand, Position, BettingRound, SessionMetadata } from '@/types/poker-v2';
import {
  getPreflopActionSequence,
  getPostflopActionSequence
} from '@/utils/poker-logic';

interface PositionActionSelectorProps {
  // Core data
  currentHand: CurrentHand | null;
  session: SessionMetadata;
  selectedPosition: Position | null;
  currentBettingRound: BettingRound | null | undefined;
  stack: number;

  // Visibility control
  visible: boolean;

  // Hook functions
  handleBettingAction: (position: Position, action: 'fold' | 'check' | 'call' | 'raise' | 'all-in', amount?: number) => void;
  getCallAmount: (position: Position) => number;
  canCheck: (position: Position) => boolean;
  isCallAllIn: (position: Position) => boolean;
  handleStraddleClick?: (position: Position) => void;

  // State setters
  onClose: () => void;
  onOpenAmountModal: (action: 'raise' | 'all-in', position: Position, value: number) => void;
}

export function PositionActionSelector({
  currentHand,
  session,
  selectedPosition,
  currentBettingRound,
  stack,
  visible,
  handleBettingAction,
  getCallAmount,
  canCheck,
  isCallAllIn,
  handleStraddleClick,
  onClose,
  onOpenAmountModal
}: PositionActionSelectorProps) {
  if (!visible || !selectedPosition || !currentHand) return null;

  // Calculate auto-fold/check hint
  const getAutoActionHint = () => {
    if (!currentHand?.nextToAct) return null;

    // Don't show auto-fold hint for straddle positions
    const isStraddlePosition =
      session.gameType === 'Cash Game' &&
      currentHand.currentBettingRound === 'preflop' &&
      (selectedPosition === 'UTG' || selectedPosition === 'BTN') &&
      (!currentBettingRound?.actions || currentBettingRound.actions.length === 0);

    if (isStraddlePosition) return null;

    const currentRound = currentHand.bettingRounds[currentHand.currentBettingRound as 'preflop' | 'flop' | 'turn' | 'river'];
    const hasBet = currentRound?.currentBet && currentRound.currentBet > 0;
    const autoAction = hasBet ? 'fold' : 'check';

    // Get positions between nextToAct and selectedPosition
    const fullActionSequence = currentHand.currentBettingRound === 'preflop'
      ? getPreflopActionSequence(session.tableSeats || 9)
      : getPostflopActionSequence(session.tableSeats || 9);
    const activePlayers = currentHand.playerStates.filter(p => p.status === 'active');
    const activePositions = activePlayers.map(p => p.position);
    const actionSequence = fullActionSequence.filter(pos => activePositions.includes(pos));

    const nextIndex = actionSequence.indexOf(currentHand.nextToAct);
    const targetIndex = actionSequence.indexOf(selectedPosition);

    if (nextIndex === -1 || targetIndex === -1 || nextIndex === targetIndex) return null;

    // Get the actual positions that will be skipped
    const skippedPositions: Position[] = [];

    if (targetIndex > nextIndex) {
      // Forward direction - include nextToAct position
      for (let i = nextIndex; i < targetIndex; i++) {
        skippedPositions.push(actionSequence[i]);
      }
    } else {
      // Wraps around - include nextToAct position
      for (let i = nextIndex; i < actionSequence.length; i++) {
        skippedPositions.push(actionSequence[i]);
      }
      for (let i = 0; i < targetIndex; i++) {
        skippedPositions.push(actionSequence[i]);
      }
    }

    if (skippedPositions.length === 0) return null;

    return {
      skippedPositions,
      autoAction,
      message: skippedPositions.length === 1
        ? `${skippedPositions[0]} will auto-${autoAction}`
        : `${skippedPositions.join(', ')} will auto-${autoAction}`
    };
  };

  // Generate call/check button
  const getCallCheckButton = () => {
    const callAmount = getCallAmount(selectedPosition);
    const canCheckHere = canCheck(selectedPosition);

    if (canCheckHere) {
      return (
        <Button
          className="bg-orange-600 hover:bg-orange-700 text-white"
          onClick={() => {
            handleBettingAction(selectedPosition, 'check');
            onClose();
          }}
        >
          Check
        </Button>
      );
    } else if (callAmount > 0) {
      return (
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => {
            handleBettingAction(selectedPosition, 'call', currentBettingRound?.currentBet);
            onClose();
          }}
        >
          {isCallAllIn(selectedPosition) ? `Call All-In ${callAmount}` : `Call ${callAmount}`}
        </Button>
      );
    } else {
      return (
        <Button
          className="bg-gray-400 text-white cursor-not-allowed"
          disabled
        >
          No Action
        </Button>
      );
    }
  };

  const autoHint = getAutoActionHint();

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
      <div className="mb-3 text-center">
        <h3 className="text-md font-semibold">
          {selectedPosition} Action
        </h3>
        {autoHint && (
          <div className="text-amber-600 text-xs mt-1">
            {autoHint.message}
          </div>
        )}
      </div>

      {/* Check if straddle is available */}
      {(() => {
        const canStraddle =
          session.gameType === 'Cash Game' &&
          currentHand.currentBettingRound === 'preflop' &&
          (selectedPosition === 'UTG' || selectedPosition === 'BTN') &&
          (!currentBettingRound?.actions || currentBettingRound.actions.length === 0);

        // Special case: BTN can ONLY straddle when clicked before hero acts
        const isBtnStraddleOnly =
          selectedPosition === 'BTN' &&
          canStraddle &&
          selectedPosition !== session.userSeat;

        // If BTN straddle only, show only the straddle button
        if (isBtnStraddleOnly) {
          return (
            <div>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                onClick={() => {
                  if (handleStraddleClick && selectedPosition) {
                    handleStraddleClick(selectedPosition);
                  }
                  onClose();
                }}
              >
                Straddle (BTN)
              </Button>
            </div>
          );
        }

        return (
          <div className={canStraddle ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-3"}>
            {/* Left Column: Fold + All-In */}
            <Button
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={() => {
            handleBettingAction(selectedPosition, 'fold');
            onClose();
          }}
        >
          Fold
        </Button>

        {getCallCheckButton()}

        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => {
            onOpenAmountModal('all-in', selectedPosition, stack);
            onClose();
          }}
        >
          All-In
        </Button>

        {/* Right Column: Raise */}
        <Button
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => {
            onOpenAmountModal('raise', selectedPosition, (currentBettingRound?.currentBet || 0) * 2);
            onClose();
          }}
        >
          Raise
        </Button>

        {/* Straddle Button - only for UTG/BTN in preflop before any actions */}
        {canStraddle && !isBtnStraddleOnly && (
          <Button
            className="bg-orange-600 hover:bg-orange-700 text-white col-span-2"
            onClick={() => {
              if (handleStraddleClick && selectedPosition) {
                handleStraddleClick(selectedPosition);
              }
              onClose();
            }}
          >
            Straddle
          </Button>
        )}
      </div>
        );
      })()}

      <div className="mt-3 text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}