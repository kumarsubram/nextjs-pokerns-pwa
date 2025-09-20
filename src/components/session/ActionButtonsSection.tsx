'use client';

import { Button } from '@/components/ui/button';
import { CurrentHand, Position, SessionMetadata, BettingRound } from '@/types/poker-v2';
import { getPreflopActionSequence, getPostflopActionSequence } from '@/utils/poker-logic';

interface ActionButtonsSectionProps {
  currentHand: CurrentHand;
  session: SessionMetadata;
  stack: number;
  isBettingComplete: boolean;
  showPositionActions: boolean;
  selectedPosition: Position | null;
  setSelectedPosition: (position: Position | null) => void;
  setShowPositionActions: (show: boolean) => void;
  setFoldPosition: (position: Position | null) => void;
  setShowFoldConfirmation: (show: boolean) => void;
  setAmountModalAction: (action: 'raise' | 'all-in') => void;
  setAmountModalPosition: (position: Position | null) => void;
  setAmountModalValue: (value: number) => void;
  setShowAmountModal: (show: boolean) => void;

  // Functions from hooks
  needsCommunityCards: boolean | null;
  getAdvanceRoundMessage: () => string;
  getAdvanceRoundButtonText: () => string;
  handleAdvanceToNextRound: () => void;
  handleBettingAction: (position: Position, action: 'fold' | 'check' | 'call' | 'raise' | 'all-in', amount?: number) => void;
  getCurrentBettingRound: () => BettingRound | null | undefined;
  getCallAmount: (position: Position) => number;
  canCheck: (position: Position) => boolean;
  isCallAllIn: (position: Position) => boolean;
}

export function ActionButtonsSection({
  currentHand,
  session,
  stack,
  isBettingComplete,
  showPositionActions,
  selectedPosition,
  setSelectedPosition,
  setShowPositionActions,
  setFoldPosition,
  setShowFoldConfirmation,
  setAmountModalAction,
  setAmountModalPosition,
  setAmountModalValue,
  setShowAmountModal,
  needsCommunityCards,
  getAdvanceRoundMessage,
  getAdvanceRoundButtonText,
  handleAdvanceToNextRound,
  handleBettingAction,
  getCurrentBettingRound,
  getCallAmount,
  canCheck,
  isCallAllIn
}: ActionButtonsSectionProps) {
  if (!currentHand) return null;

  const currentBettingRound = getCurrentBettingRound();

  // Check if hero has already acted in current round
  const currentRound = currentHand.currentBettingRound === 'showdown'
    ? null
    : currentHand.bettingRounds[currentHand.currentBettingRound];
  const heroHasActed = currentRound?.actions.some((action) => action.position === session.userSeat);
  const isHerosTurn = currentHand.nextToAct === session.userSeat;

  // Show actions if:
  // 1. It's hero's turn OR
  // 2. Hero hasn't acted yet (so they can act when it becomes their turn)
  const shouldShowActions = isHerosTurn || !heroHasActed;

  // Render auto-action hint for position skipping
  const renderAutoActionHint = () => {
    const targetPosition = showPositionActions && selectedPosition ? selectedPosition : session.userSeat;
    if (!targetPosition || !currentHand?.nextToAct) return null;

    const currentRound = currentHand.bettingRounds[currentHand.currentBettingRound as 'preflop' | 'flop' | 'turn' | 'river'];
    const hasBet = currentRound?.currentBet && currentRound.currentBet > 0;
    const autoAction = hasBet ? 'fold' : 'check';

    // Get positions between nextToAct and targetPosition
    const fullActionSequence = currentHand.currentBettingRound === 'preflop'
      ? getPreflopActionSequence(session.tableSeats || 9)
      : getPostflopActionSequence(session.tableSeats || 9);
    const activePlayers = currentHand.playerStates.filter(p => p.status === 'active');
    const activePositions = activePlayers.map(p => p.position);
    const actionSequence = fullActionSequence.filter(pos => activePositions.includes(pos));

    const nextIndex = actionSequence.indexOf(currentHand.nextToAct);
    const targetIndex = actionSequence.indexOf(targetPosition);

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

    return (
      <div className="text-amber-600 text-xs mt-1">
        {skippedPositions.length === 1
          ? `${skippedPositions[0]} will auto-${autoAction}`
          : `${skippedPositions.join(', ')} will auto-${autoAction}`
        }
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
      {isBettingComplete ? (
        // Show betting round completion UI
        <div className="text-center">
          <h3 className="text-md font-semibold mb-3">
            {getAdvanceRoundMessage()}
          </h3>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
            onClick={handleAdvanceToNextRound}
            disabled={needsCommunityCards || false}
          >
            {getAdvanceRoundButtonText()}
          </Button>
        </div>
      ) : shouldShowActions ? (
        // Show betting actions when hero can act
        <>
          <div className="mb-3 text-center">
            <h3 className="text-md font-semibold">
              {showPositionActions && selectedPosition
                ? `${selectedPosition} Actions`
                : <span className="text-blue-600">{`Hero Actions (${session.userSeat})`}</span>}
            </h3>
            {renderAutoActionHint()}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Fold Button */}
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                const targetPosition = showPositionActions && selectedPosition ? selectedPosition : session.userSeat;
                if (targetPosition === session.userSeat) {
                  setFoldPosition(session.userSeat || null);
                  setShowFoldConfirmation(true);
                } else if (targetPosition) {
                  handleBettingAction(targetPosition, 'fold');
                }
                setShowPositionActions(false);
                setSelectedPosition(null);
              }}
            >
              Fold
            </Button>

            {/* Check/Call Button */}
            {(() => {
              const targetPosition = showPositionActions && selectedPosition ? selectedPosition : session.userSeat;
              const callAmount = targetPosition ? getCallAmount(targetPosition) : 0;
              const canCheckHere = targetPosition && canCheck(targetPosition);

              if (canCheckHere) {
                return (
                  <Button
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => {
                      if (targetPosition) handleBettingAction(targetPosition, 'check');
                      setShowPositionActions(false);
                      setSelectedPosition(null);
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
                      if (targetPosition) {
                        handleBettingAction(targetPosition, 'call', currentBettingRound?.currentBet);
                      }
                      setShowPositionActions(false);
                      setSelectedPosition(null);
                    }}
                  >
                    {selectedPosition && isCallAllIn(selectedPosition) ? `Call All-In ${callAmount}` : `Call ${callAmount}`}
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
            })()}

            {/* All-In Button */}
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                setAmountModalAction('all-in');
                setAmountModalPosition((showPositionActions && selectedPosition) ? selectedPosition : (session.userSeat || null));
                setAmountModalValue(stack);
                setShowAmountModal(true);
                setShowPositionActions(false);
              }}
            >
              All-In
            </Button>

            {/* Raise Button */}
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                setAmountModalAction('raise');
                setAmountModalPosition((showPositionActions && selectedPosition) ? selectedPosition : (session.userSeat || null));
                setAmountModalValue((currentBettingRound?.currentBet || 0) * 2);
                setShowAmountModal(true);
                setShowPositionActions(false);
              }}
            >
              Raise
            </Button>
          </div>
        </>
      ) : (
        // Waiting for other players
        <div className="text-center py-4">
          <p className="text-gray-600">Waiting for other players to act...</p>
        </div>
      )}
    </div>
  );
}