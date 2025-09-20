'use client';

import { Button } from '@/components/ui/button';
import { CurrentHand, Position, SessionMetadata, BettingAction } from '@/types/poker-v2';
import { getPreflopActionSequence, getPostflopActionSequence } from '@/utils/poker-logic';

interface ActionButtonsProps {
  currentHand: CurrentHand;
  session: SessionMetadata;
  isBettingComplete: boolean;
  needsCommunityCards: boolean;
  showPositionActions: boolean;
  selectedPosition: Position | null;
  currentBettingRound: { currentBet?: number; actions: Array<BettingAction> } | undefined;
  onFold: (position: Position) => void;
  onCheck: (position: Position) => void;
  onCall: (position: Position, amount?: number) => void;
  onRaise: () => void;
  onAllIn: () => void;
  onAdvanceToNextRound: () => void;
  getCallAmount: (position: Position) => number;
  canCheck: (position: Position) => boolean;
  isCallAllIn: (position: Position) => boolean;
}

export function ActionButtons({
  currentHand,
  session,
  isBettingComplete,
  needsCommunityCards,
  showPositionActions,
  selectedPosition,
  currentBettingRound,
  onFold,
  onCheck,
  onCall,
  onRaise,
  onAllIn,
  onAdvanceToNextRound,
  getCallAmount,
  canCheck,
  isCallAllIn
}: ActionButtonsProps) {
  if (!currentHand) return null;

  // Check if hero has already acted in current round
  const currentRound = currentHand.currentBettingRound === 'showdown'
    ? null
    : currentHand.bettingRounds[currentHand.currentBettingRound];
  const heroHasActed = currentRound?.actions.some((action) => action.position === session.userSeat);
  const isHerosTurn = currentHand.nextToAct === session.userSeat;
  const shouldShowActions = isHerosTurn || !heroHasActed;

  const targetPosition = showPositionActions && selectedPosition ? selectedPosition : session.userSeat;

  const renderAutoActionHint = () => {
    if (!targetPosition || !currentHand?.nextToAct) return null;

    const currentRound = currentHand.bettingRounds[currentHand.currentBettingRound as 'preflop' | 'flop' | 'turn' | 'river'];
    const hasBet = currentRound?.currentBet && currentRound.currentBet > 0;
    const autoAction = hasBet ? 'fold' : 'check';

    const fullActionSequence = currentHand.currentBettingRound === 'preflop'
      ? getPreflopActionSequence(session.tableSeats || 9)
      : getPostflopActionSequence(session.tableSeats || 9);
    const activePlayers = currentHand.playerStates.filter(p => p.status === 'active');
    const activePositions = activePlayers.map(p => p.position);
    const actionSequence = fullActionSequence.filter(pos => activePositions.includes(pos));

    const nextIndex = actionSequence.indexOf(currentHand.nextToAct);
    const targetIndex = actionSequence.indexOf(targetPosition);

    if (nextIndex === -1 || targetIndex === -1 || nextIndex === targetIndex) return null;

    const skippedPositions: Position[] = [];
    if (targetIndex > nextIndex) {
      for (let i = nextIndex; i < targetIndex; i++) {
        skippedPositions.push(actionSequence[i]);
      }
    } else {
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
        <div className="text-center">
          {needsCommunityCards ? (
            <h3 className="text-md font-semibold mb-3">
              {(() => {
                const currentRound = currentHand.currentBettingRound;
                if (currentRound === 'preflop') return 'Select Flop Community Cards to continue';
                if (currentRound === 'flop') return 'Select Turn Card to continue';
                if (currentRound === 'turn') return 'Select River Card to continue';
                return 'Select community cards to continue';
              })()}
            </h3>
          ) : (
            <h3 className="text-md font-semibold mb-3">
              {(() => {
                const currentRound = currentHand.currentBettingRound;
                if (currentRound === 'preflop') return 'Flop cards selected';
                if (currentRound === 'flop') return 'Turn card selected';
                if (currentRound === 'turn') return 'River card selected';
                if (currentRound === 'river') return 'All cards dealt';
                return 'Betting Round Complete';
              })()}
            </h3>
          )}
          <Button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
            onClick={onAdvanceToNextRound}
            disabled={needsCommunityCards}
          >
            {needsCommunityCards ? 'Proceed' : (() => {
              const currentRound = currentHand.currentBettingRound;
              if (currentRound === 'preflop') return 'Proceed to Flop Betting';
              if (currentRound === 'flop') return 'Proceed to Turn Betting';
              if (currentRound === 'turn') return 'Proceed to River Betting';
              if (currentRound === 'river') return 'Proceed to Showdown';
              return 'Proceed';
            })()}
          </Button>
        </div>
      ) : shouldShowActions ? (
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
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => targetPosition && onFold(targetPosition)}
            >
              Fold
            </Button>

            {(() => {
              const callAmount = targetPosition ? getCallAmount(targetPosition) : 0;
              const canCheckHere = targetPosition && canCheck(targetPosition);

              if (canCheckHere) {
                return (
                  <Button
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => targetPosition && onCheck(targetPosition)}
                  >
                    Check
                  </Button>
                );
              } else if (callAmount > 0) {
                return (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => targetPosition && onCall(targetPosition, currentBettingRound?.currentBet)}
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

            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={onAllIn}
            >
              All-In
            </Button>

            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={onRaise}
            >
              Raise
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-600">Waiting for other players to act...</p>
        </div>
      )}
    </div>
  );
}