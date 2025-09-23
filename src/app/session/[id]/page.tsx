'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SimplePokerTable } from '@/components/poker/SimplePokerTable';
import { CardSelector } from '@/components/poker/CardSelector';
import { SeatSelector } from '@/components/poker/SeatSelector';
import { HandHistory } from '@/components/poker/HandHistory';
import {
  AllFoldedDialog,
  ShowdownDialog,
  AmountModal,
  ConfirmFoldDialog,
  HeroMustActFirstDialog,
  AutoActionConfirmDialog,
  ValidationErrorDialog,
  EndHandDialog
} from '@/components/dialog';
import { StraddleModal } from '@/components/dialog/StraddleModal';
import {
  HeroCards,
  SessionHeader,
  HandInfoHeader,
  HandSettingsPanel,
  NextToAct,
  ActionButtonsSection,
  PositionActionSelector
} from '@/components/session';
import { useHandFlow } from '@/hooks/useHandFlow';
import { useBettingLogic } from '@/hooks/useBettingLogic';
import { useCommunityCards } from '@/hooks/useCommunityCards';
import { useHeroCards } from '@/hooks/useHeroCards';
import { SessionService } from '@/services/session.service';
import { SessionMetadata, CurrentHand, Position, StoredHand, TableSeats } from '@/types/poker-v2';
import {
  isBettingRoundComplete,
  getPreflopActionSequence,
  getPostflopActionSequence
} from '@/utils/poker-logic';

// Helper function to get the next seat position in the rotation
function getNextSeatPosition(currentSeat: Position, tableSeats: TableSeats): Position {
  const positions = tableSeats === 6
    ? ['BTN', 'SB', 'BB', 'UTG', 'LJ', 'CO'] as Position[]
    : ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO'] as Position[];

  const currentIndex = positions.indexOf(currentSeat);
  if (currentIndex === -1) return currentSeat; // fallback

  // Move to next position (wrap around)
  const nextIndex = (currentIndex + 1) % positions.length;
  return positions[nextIndex];
}

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionMetadata | null>(null);
  const [currentHand, setCurrentHand] = useState<CurrentHand | null>(null);
  const [selectedCard1, setSelectedCard1] = useState<string | null>(null);
  const [selectedCard2, setSelectedCard2] = useState<string | null>(null);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [selectingCard, setSelectingCard] = useState<1 | 2>(1);
  const [showCommunitySelector, setShowCommunitySelector] = useState(false);
  const [selectingCommunityCard, setSelectingCommunityCard] = useState<{ type: 'flop'; index: number } | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [showPositionActions, setShowPositionActions] = useState(false);
  // Hand settings
  const [stack, setStack] = useState<number>(1000);
  const [smallBlind, setSmallBlind] = useState<number>(2);
  const [bigBlind, setBigBlind] = useState<number>(5);
  const [ante, setAnte] = useState<number>(0);
  // Raise/All-in modal
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [amountModalAction, setAmountModalAction] = useState<'raise' | 'all-in'>('raise');
  const [amountModalPosition, setAmountModalPosition] = useState<Position | null>(null);
  const [amountModalValue, setAmountModalValue] = useState<number>(0);
  const [amountModalError, setAmountModalError] = useState<string | null>(null);
  // Hero fold confirmation
  const [showFoldConfirmation, setShowFoldConfirmation] = useState(false);
  const [foldPosition, setFoldPosition] = useState<Position | null>(null);
  // Auto-action confirmation
  const [showAutoActionConfirmation, setShowAutoActionConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ position: Position; action: 'fold' | 'check' | 'call' | 'raise' | 'all-in'; amount?: number } | null>(null);
  const [affectedSeats, setAffectedSeats] = useState<Position[]>([]);
  // Hero must act first dialog
  const [showHeroMustActFirst, setShowHeroMustActFirst] = useState(false);
  // Hero money tracking
  const [heroMoneyInvested, setHeroMoneyInvested] = useState<number>(0);
  // Showdown outcome
  const [showOutcomeSelection, setShowOutcomeSelection] = useState(false);
  // Opponent cards logging
  const [opponentCards, setOpponentCards] = useState<Record<Position, [string, string] | null>>({} as Record<Position, [string, string] | null>);
  // Inline card selection state
  const [inlineCardSelection, setInlineCardSelection] = useState<{
    show: boolean;
    position: Position | null;
    cardIndex: number;
    title: string;
  }>({
    show: false,
    position: null,
    cardIndex: 1,
    title: ''
  });
  // Auto community card selection state
  const [autoSelectingCommunityCards, setAutoSelectingCommunityCards] = useState(false);
  // Seat selection for new hands
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [handCount, setHandCount] = useState(0);
  const [completedHands, setCompletedHands] = useState<StoredHand[]>([]);
  const [suggestedNextSeat, setSuggestedNextSeat] = useState<Position | null>(null);
  // Dialog state declarations
  const [showValidationError, setShowValidationError] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');
  const [pendingHandCompletion, setPendingHandCompletion] = useState<{ outcome: 'won' | 'lost' | 'folded', potWon?: number } | null>(null);
  const [showAllFoldedDialog, setShowAllFoldedDialog] = useState(false);
  // End hand dialog
  const [showEndHandDialog, setShowEndHandDialog] = useState(false);
  // Straddle modal state
  const [showStraddleModal, setShowStraddleModal] = useState(false);
  const [straddleModalPosition, setStraddleModalPosition] = useState<Position | null>(null);
  const [straddleModalValue, setStraddleModalValue] = useState(0);
  const [straddleModalError, setStraddleModalError] = useState<string | null>(null);

  // Calculate suggested next seat when showing seat selection
  useEffect(() => {
    if (showSeatSelection && session && session.userSeat && handCount > 0) {
      setSuggestedNextSeat(getNextSeatPosition(session.userSeat, session.tableSeats));
    }
  }, [showSeatSelection, session, handCount]);

  // Initialize hand flow hook
  const { startNewHandWithPosition, completeHand } = useHandFlow({
    session,
    currentHand,
    setCurrentHand,
    stack,
    setStack,
    smallBlind,
    bigBlind,
    ante,
    heroMoneyInvested,
    setHeroMoneyInvested,
    setSelectedCard1,
    setSelectedCard2,
    setOpponentCards,
    setHandCount,
    handCount,
    setCompletedHands,
    setSession,
    setShowSeatSelection,
    setShowAllFoldedDialog,
    setShowOutcomeSelection,
    setShowFoldConfirmation,
    setShowValidationError,
    setShowCommunitySelector,
    setSelectingCommunityCard,
    setAutoSelectingCommunityCards,
    setValidationErrorMessage,
    setPendingHandCompletion,
    opponentCards
  });

  // Initialize betting logic hook
  const {
    handleBettingAction,
    handleConfirmedHeroFold,
    handleAdvanceToNextRound,
    getCurrentBettingRound,
    getCallAmount,
    isCallAllIn,
    canCheck
  } = useBettingLogic({
    session,
    currentHand,
    setCurrentHand,
    stack,
    setStack,
    heroMoneyInvested,
    setHeroMoneyInvested,
    completeHand,
    setShowAllFoldedDialog,
    setShowOutcomeSelection,
    setFoldPosition,
    setShowFoldConfirmation,
    setSelectedPosition,
    setShowPositionActions
  });

  // Calculate betting state
  const currentBettingRound = getCurrentBettingRound();
  const isBettingComplete = currentBettingRound ? (currentBettingRound.isComplete || isBettingRoundComplete(currentHand?.playerStates || [], currentBettingRound)) : false;

  // Initialize community cards hook
  const {
    needsCommunityCards,
    showFlopSelectionPrompt,
    showTurnSelectionPrompt,
    showRiverSelectionPrompt,
    handHistoryCurrentHand,
    handleCommunityCardClick,
    handleCommunityCardSelect,
    getCommunityCardSelectorTitle,
    getAdvanceRoundMessage,
    getAdvanceRoundButtonText
  } = useCommunityCards({
    currentHand,
    setCurrentHand,
    isBettingComplete,
    showSeatSelection,
    showCommunitySelector,
    setShowCommunitySelector,
    selectingCommunityCard,
    setSelectingCommunityCard,
    autoSelectingCommunityCards,
    setAutoSelectingCommunityCards,
    handleAdvanceToNextRound
  });

  // Initialize hero cards hook
  const {
    handleInlineCardSelect,
    handleUserCardSelect,
    getCardSelectorTitle,
    getAllSelectedCards,
    openHeroCardSelector
  } = useHeroCards({
    session,
    currentHand,
    setCurrentHand,
    selectedCard1,
    setSelectedCard1,
    selectedCard2,
    setSelectedCard2,
    setShowCardSelector,
    selectingCard,
    setSelectingCard,
    inlineCardSelection,
    setInlineCardSelection,
    opponentCards,
    setOpponentCards,
    selectedPosition,
    setSelectedPosition,
    showAllFoldedDialog,
    pendingHandCompletion,
    setShowAllFoldedDialog
  });

  // Simplified dialog classes - no complex mobile keyboard detection
  const getDialogClasses = (baseClasses: string) => {
    return baseClasses;
  };

  useEffect(() => {
    // Load session and restore current hand if exists
    const loadSession = () => {
      const metadata = SessionService.getCurrentSession();
      if (!metadata || metadata.sessionId !== sessionId) {
        // Try to load from session list
        const sessions = SessionService.getSessionList();
        const found = sessions.find(s => s.sessionId === sessionId);
        if (found) {
          setSession(found);
          // Set as active if not completed
          if (found.status === 'active') {
            SessionService.setActiveSession(found.sessionId);
          }
          // Load completed hands
          const hands = SessionService.getSessionHands(found.sessionId);
          setCompletedHands(hands);

          // Restore current hand state if it exists
          const savedHand = SessionService.getCurrentHand(found.sessionId);
          if (savedHand) {
            setCurrentHand(savedHand);
            // Restore related state from the saved hand
            if (savedHand.userCards) {
              setSelectedCard1(savedHand.userCards[0]);
              setSelectedCard2(savedHand.userCards[1]);
            }
            // Restore stack from session metadata
            if (found.currentStack) {
              setStack(found.currentStack);
            }
            // Restore blinds from saved hand
            setSmallBlind(savedHand.smallBlind);
            setBigBlind(savedHand.bigBlind);
            setHandCount(savedHand.handNumber);

            // Calculate hero money invested from betting rounds
            let invested = 0;
            Object.values(savedHand.bettingRounds).forEach(round => {
              if (round?.actions) {
                round.actions.forEach(action => {
                  if (action.position === found.userSeat && action.amount) {
                    invested += action.amount;
                  }
                });
              }
            });
            setHeroMoneyInvested(invested);
          }
        } else {
          router.push('/');
        }
      } else {
        setSession(metadata);
        // Load completed hands
        const hands = SessionService.getSessionHands(metadata.sessionId);
        setCompletedHands(hands);

        // Restore current hand state if it exists
        const savedHand = SessionService.getCurrentHand(metadata.sessionId);
        if (savedHand) {
          setCurrentHand(savedHand);
          // Restore related state from the saved hand
          if (savedHand.userCards) {
            setSelectedCard1(savedHand.userCards[0]);
            setSelectedCard2(savedHand.userCards[1]);
          }
          // Restore stack from session metadata
          if (metadata.currentStack) {
            setStack(metadata.currentStack);
          }
          // Restore blinds from saved hand
          setSmallBlind(savedHand.smallBlind);
          setBigBlind(savedHand.bigBlind);
          setHandCount(savedHand.handNumber);

          // Calculate hero money invested from betting rounds
          let invested = 0;
          Object.values(savedHand.bettingRounds).forEach(round => {
            if (round?.actions) {
              round.actions.forEach(action => {
                if (action.position === metadata.userSeat && action.amount) {
                  invested += action.amount;
                }
              });
            }
          });
          setHeroMoneyInvested(invested);
        }
      }
    };

    loadSession();
  }, [sessionId, router]);

  // Save current hand state whenever it changes
  useEffect(() => {
    if (session && currentHand) {
      SessionService.saveCurrentHand(session.sessionId, currentHand);
    }
  }, [currentHand, session]);

  // Save stack changes to session metadata using ref to avoid infinite loop
  const prevStackRef = useRef(stack);
  useEffect(() => {
    if (session && stack !== prevStackRef.current && stack !== session.currentStack) {
      const updatedSession = { ...session, currentStack: stack };
      SessionService.updateSessionMetadata(updatedSession);
      setSession(updatedSession);
      prevStackRef.current = stack;
    }
  }, [stack, session]);



  // Auto-start Hand 1 when session loads
  useEffect(() => {
    if (session && !currentHand) {
      // Check if we have a saved current hand (already handled in load session)
      const savedHand = SessionService.getCurrentHand(session.sessionId);
      if (!savedHand) {
        // Only show seat selection if there's no current hand saved
        // Initialize stack from session
        setStack(session.currentStack || session.buyIn || 1000);

        // Show seat selection for Hand #1
        setShowSeatSelection(true);

        // Scroll to top when showing seat selection
        window.scrollTo(0, 0);
        const handNumber = SessionService.getCurrentHandNumber();
        setHandCount(handNumber - 1); // Set to current hand number - 1 since it will be incremented
      }
    }
  }, [session, currentHand]);

  // Update pot when ante changes during active hand (only in preflop)
  useEffect(() => {
    if (currentHand && session && currentHand.currentBettingRound === 'preflop') {
      const basePot = smallBlind + bigBlind + (ante * session.tableSeats);
      // Only update if pot needs recalculation (ante changed)
      if (currentHand.bettingRounds.preflop && currentHand.bettingRounds.preflop.pot !== basePot) {
        setCurrentHand(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            pot: basePot,
            bettingRounds: {
              ...prev.bettingRounds,
              preflop: {
                ...prev.bettingRounds.preflop,
                pot: basePot
              }
            }
          };
        });
      }
    }
  }, [ante, currentHand, session, smallBlind, bigBlind]);

  // Inline card selection handler






  // Handle confirmed auto-action
  const handleConfirmedAutoAction = () => {
    if (!pendingAction || !currentHand || !session) return;

    setShowAutoActionConfirmation(false);

    // Execute the pending action via the betting logic hook
    const { position, action, amount } = pendingAction;
    setPendingAction(null);
    setAffectedSeats([]);

    handleBettingAction(position, action, amount);
  };

  // Execute betting action without confirmation checks (removed - duplicate logic)

  // Handle confirmed hero fold with session-specific logic
  const handleConfirmedHeroFoldWrapper = () => {
    if (!currentHand || !session || !foldPosition) return;

    // If Hero hasn't invested any money, don't track the hand - just start a new one
    if (heroMoneyInvested === 0) {
      // Clear current hand from storage since it's not being tracked
      SessionService.clearCurrentHand(session.sessionId);

      // Reset states properly
      setCurrentHand(null);
      setHeroMoneyInvested(0);
      setSelectedPosition(null);
      setShowPositionActions(false);
      setShowFoldConfirmation(false);
      setFoldPosition(null);

      // Always show seat selection for next hand
      setShowSeatSelection(true);

      // Scroll to top when showing seat selection
      window.scrollTo(0, 0);
      return;
    }

    // Use the hook's fold logic for invested money cases
    handleConfirmedHeroFold();

    // Reset dialog states
    setShowFoldConfirmation(false);
    setFoldPosition(null);
  };

  const handleStraddleClick = (position: Position) => {
    const minStraddle = bigBlind * 2;
    setStraddleModalPosition(position);
    setStraddleModalValue(minStraddle);
    setStraddleModalError(null);
    setShowStraddleModal(true);
  };

  const handleStraddleConfirm = () => {
    if (straddleModalPosition && session) {
      const minStraddle = bigBlind * 2;
      const amount = Math.floor(straddleModalValue);

      if (amount < minStraddle) {
        setStraddleModalError(`Straddle must be at least ${minStraddle}`);
        return;
      }

      // If hero is straddling, deduct from stack and update investment
      if (straddleModalPosition === session.userSeat) {
        setStack(prev => prev - amount);
        setHeroMoneyInvested(prev => prev + amount);
      }

      handleBettingAction(straddleModalPosition, 'straddle', amount);
      setShowStraddleModal(false);
      setStraddleModalPosition(null);
      setStraddleModalError(null);
      setSelectedPosition(null);
    }
  };

  const endSession = () => {
    SessionService.endCurrentSession();
    router.push('/');
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <SessionHeader
        session={session}
        onBack={() => router.push('/')}
        onEndSession={endSession}
      />

      {/* Main Content */}
      <div className="p-2 max-w-lg mx-auto">
        {/* Seat Selection View */}
        {showSeatSelection && session && !currentHand && (
          <SeatSelector
            tableSeats={session.tableSeats}
            currentSeat={session.userSeat}
            suggestedSeat={suggestedNextSeat || (session.userSeat ? getNextSeatPosition(session.userSeat, session.tableSeats) : undefined)}
            onSeatSelect={(position) => {
              if (position !== 'DEALER') {
                // Prevent seat selection during active hands
                if (currentHand) {
                  console.warn('Cannot change seat during active hand');
                  return;
                }

                setShowSeatSelection(false);
                // Update session with new seat
                const updatedSession = { ...session, userSeat: position };
                setSession(updatedSession);
                SessionService.updateSessionMetadata(updatedSession);

                // Start new hand directly with the updated session
                startNewHandWithPosition(updatedSession, position);
              }
            }}
            onKeepCurrentSeat={() => {
              const nextSeat = suggestedNextSeat || (session.userSeat ? getNextSeatPosition(session.userSeat, session.tableSeats) : session.userSeat);
              if (nextSeat) {
                setShowSeatSelection(false);
                // Update session with suggested next seat
                const updatedSession = { ...session, userSeat: nextSeat };
                setSession(updatedSession);
                SessionService.updateSessionMetadata(updatedSession);
                // Start new hand with the suggested seat
                startNewHandWithPosition(updatedSession, nextSeat);
              }
            }}
            title={`Hand #${SessionService.getCurrentHandNumber()} - Select your Seat`}
            showKeepCurrentButton={handCount > 0 && session.userSeat !== undefined}
          />
        )}
        {/* Hand Info Header */}
        {currentHand && !showSeatSelection && (
          <HandInfoHeader
            currentHand={currentHand}
            session={session}
            userSeat={session?.userSeat}
            selectedPosition={selectedPosition}
            showPositionActions={showPositionActions}
            showCardSelector={showCardSelector}
          />
        )}

        {/* Hand Settings Panel */}
        {currentHand && !showSeatSelection && session && (
          <HandSettingsPanel
            stack={stack}
            smallBlind={smallBlind}
            bigBlind={bigBlind}
            ante={ante}
            heroMoneyInvested={heroMoneyInvested}
            onStackChange={setStack}
            onSmallBlindChange={(value) => {
              setSmallBlind(value);
              // Update current hand's blind values if hand is in progress
              if (currentHand && currentHand.currentBettingRound === 'preflop') {
                // Update SB player's current bet
                const updatedPlayerStates = currentHand.playerStates.map(player => {
                  if (player.position === 'SB') {
                    return { ...player, currentBet: value };
                  }
                  return player;
                });

                // Update hero money invested if hero is SB and hasn't acted yet
                if (session.userSeat === 'SB') {
                  const currentRound = currentHand.bettingRounds.preflop;
                  const heroHasActed = currentRound?.actions.some(action => action.position === 'SB');
                  if (!heroHasActed) {
                    setHeroMoneyInvested(value);
                  }
                }

                setCurrentHand({
                  ...currentHand,
                  smallBlind: value,
                  playerStates: updatedPlayerStates,
                  // Also update pot calculation for preflop
                  pot: value + bigBlind + (ante * session.tableSeats),
                  bettingRounds: {
                    ...currentHand.bettingRounds,
                    preflop: {
                      ...currentHand.bettingRounds.preflop,
                      pot: value + bigBlind + (ante * session.tableSeats)
                    }
                  }
                });
              }
            }}
            onBigBlindChange={(value) => {
              setBigBlind(value);
              // Update current hand's blind values if hand is in progress
              if (currentHand && currentHand.currentBettingRound === 'preflop') {
                // Update BB player's current bet
                const updatedPlayerStates = currentHand.playerStates.map(player => {
                  if (player.position === 'BB') {
                    return { ...player, currentBet: value };
                  }
                  return player;
                });

                // Update hero money invested if hero is BB and hasn't acted yet
                if (session.userSeat === 'BB') {
                  const currentRound = currentHand.bettingRounds.preflop;
                  const heroHasActed = currentRound?.actions.some(action => action.position === 'BB');
                  if (!heroHasActed) {
                    setHeroMoneyInvested(value);
                  }
                }

                setCurrentHand({
                  ...currentHand,
                  bigBlind: value,
                  playerStates: updatedPlayerStates,
                  // Also update pot calculation for preflop
                  pot: smallBlind + value + (ante * session.tableSeats),
                  bettingRounds: {
                    ...currentHand.bettingRounds,
                    preflop: {
                      ...currentHand.bettingRounds.preflop,
                      pot: smallBlind + value + (ante * session.tableSeats),
                      currentBet: value // BB is the current bet to match
                    }
                  }
                });
              }
            }}
            onAnteChange={setAnte}
          />
        )}

        {/* Table Display */}
        {!showSeatSelection && (
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <SimplePokerTable
            seats={session.tableSeats}
            userSeat={session.userSeat}
            onSeatClick={(position) => {
              if (position !== 'DEALER') {
                // Check if user is trying to act after hero when hero hasn't acted yet
                if (position !== session?.userSeat && currentHand?.nextToAct && session?.userSeat) {
                  const fullActionSequence = currentHand.currentBettingRound === 'preflop'
                    ? getPreflopActionSequence(session.tableSeats || 9)
                    : getPostflopActionSequence(session.tableSeats || 9);

                  const activePlayers = currentHand.playerStates.filter(p => p.status === 'active');
                  const activePositions = activePlayers.map(p => p.position);
                  const actionSequence = fullActionSequence.filter(pos => activePositions.includes(pos));

                  const nextToActIndex = actionSequence.indexOf(currentHand.nextToAct);
                  const heroIndex = actionSequence.indexOf(session.userSeat);
                  const clickedIndex = actionSequence.indexOf(position);

                  // If next-to-act is before hero and clicked position is after hero
                  const isNextBeforeHero = nextToActIndex < heroIndex;
                  const isClickedAfterHero = clickedIndex > heroIndex;

                  if (isNextBeforeHero && isClickedAfterHero) {
                    // Check if hero has already acted in this round
                    const currentRound = currentHand.bettingRounds[currentHand.currentBettingRound as 'preflop' | 'flop' | 'turn' | 'river'];
                    const heroHasActed = currentRound?.actions.some(action => action.position === session.userSeat);

                    if (!heroHasActed) {
                      setShowHeroMustActFirst(true);
                      return;
                    }
                  }
                }

                if (position === session?.userSeat) {
                  // Clear states when clicking hero's seat to show default "Hero Actions" display
                  setSelectedPosition(null);
                  setShowPositionActions(false);
                } else if (position === selectedPosition) {
                  // Clicking the same position again deselects it
                  setSelectedPosition(null);
                  setShowPositionActions(false);
                } else {
                  setSelectedPosition(position);
                  setShowPositionActions(true);
                }
              }
            }}
            communityCards={currentHand?.communityCards}
            onCommunityCardClick={handleCommunityCardClick}
            showCommunityCards={!!currentHand}
            playerStates={currentHand?.playerStates || []}
            nextToAct={currentHand?.nextToAct}
            currentBettingRound={currentBettingRound || undefined}
            currentBettingRoundName={currentHand?.currentBettingRound}
            isBettingComplete={isBettingComplete}
            showFlopSelectionPrompt={showFlopSelectionPrompt}
            showTurnSelectionPrompt={showTurnSelectionPrompt}
            showRiverSelectionPrompt={showRiverSelectionPrompt}
            potSize={currentHand?.pot || 0}
            sidePots={currentHand?.sidePots || []}
            highlightedPositions={selectedPosition ? [selectedPosition] : []}
          />
        </div>
        )}

        {/* Hero Cards, Next to Act, and End Hand Section - Below table, above action buttons */}
        {!showSeatSelection && currentHand && (
          <div className="flex gap-2 mb-2 items-stretch">
            <div className="flex-grow">
              <HeroCards
                currentHand={currentHand}
                userSeat={session?.userSeat}
                onCardClick={(cardIndex) => {
                  openHeroCardSelector(cardIndex);
                }}
              />
            </div>
            <div className="w-24">
              <NextToAct
                currentHand={currentHand}
                userSeat={session?.userSeat}
              />
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setShowEndHandDialog(true)}
                className="bg-white hover:bg-gray-50 text-red-600 border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              >
                End Hand
              </button>
            </div>
          </div>
        )}

        {/* User Card Selector */}
        {showCardSelector && (
          <CardSelector
            title={getCardSelectorTitle()}
            selectedCards={getAllSelectedCards()}
            onCardSelect={handleUserCardSelect}
            onCancel={() => {
              setShowCardSelector(false);
              setSelectedPosition(null);
            }}
          />
        )}


        {/* Position Action Selector */}
        <PositionActionSelector
          currentHand={currentHand}
          session={session}
          selectedPosition={selectedPosition}
          currentBettingRound={currentBettingRound}
          stack={stack}
          visible={showPositionActions && selectedPosition !== null}
          handleBettingAction={handleBettingAction}
          getCallAmount={getCallAmount}
          canCheck={canCheck}
          isCallAllIn={isCallAllIn}
          onClose={() => {
            setShowPositionActions(false);
            setSelectedPosition(null);
          }}
          onOpenAmountModal={(action: 'raise' | 'all-in', position: Position, value: number) => {
            setAmountModalAction(action);
            setAmountModalPosition(position);
            setAmountModalValue(value);
            setShowAmountModal(true);
          }}
        />

        {/* Action Buttons Section */}
        {currentHand && !showCommunitySelector && !showPositionActions &&
         !(showCardSelector && selectedPosition && selectedPosition !== session?.userSeat) && (
          <ActionButtonsSection
            currentHand={currentHand}
            session={session}
            stack={stack}
            isBettingComplete={isBettingComplete}
            showPositionActions={showPositionActions}
            selectedPosition={selectedPosition}
            setSelectedPosition={setSelectedPosition}
            setShowPositionActions={setShowPositionActions}
            setFoldPosition={setFoldPosition}
            setShowFoldConfirmation={setShowFoldConfirmation}
            setAmountModalAction={setAmountModalAction}
            setAmountModalPosition={setAmountModalPosition}
            setAmountModalValue={setAmountModalValue}
            setShowAmountModal={setShowAmountModal}
            handleStraddleClick={handleStraddleClick}
            needsCommunityCards={needsCommunityCards}
            getAdvanceRoundMessage={getAdvanceRoundMessage}
            getAdvanceRoundButtonText={getAdvanceRoundButtonText}
            handleAdvanceToNextRound={handleAdvanceToNextRound}
            handleBettingAction={handleBettingAction}
            getCurrentBettingRound={getCurrentBettingRound}
            getCallAmount={getCallAmount}
            canCheck={canCheck}
            isCallAllIn={isCallAllIn}
          />
        )}

        <AmountModal
          open={showAmountModal}
          onOpenChange={setShowAmountModal}
          action={amountModalAction}
          position={amountModalPosition}
          value={amountModalValue}
          error={amountModalError}
          stack={stack}
          currentBet={currentBettingRound?.currentBet || 0}
          heroPosition={session?.userSeat}
          onValueChange={setAmountModalValue}
          onConfirm={() => {
            if (amountModalPosition) {
              let amount = Math.floor(amountModalValue);

              // For hero all-in, the value represents actual stack amount to bet ALL of it
              if (amountModalAction === 'all-in' && amountModalPosition === session?.userSeat) {
                const actualStack = amount; // User's actual stack (e.g., 485)
                const additionalBet = actualStack; // Betting ALL of it

                // Set stack to 0 (going all-in)
                setStack(0);

                // Update hero money invested
                setHeroMoneyInvested(prev => prev + additionalBet);

                // Calculate total bet for handleBettingAction
                const playerState = currentHand?.playerStates.find(p => p.position === amountModalPosition);
                const currentBet = playerState?.currentBet || 0;
                amount = currentBet + additionalBet; // Total bet amount
              }

              handleBettingAction(
                amountModalPosition,
                amountModalAction,
                amount
              );
              setShowAmountModal(false);
              setAmountModalPosition(null);
              setAmountModalError(null);
              setSelectedPosition(null);
            }
          }}
          onCancel={() => {
            setShowAmountModal(false);
            setAmountModalPosition(null);
            setAmountModalError(null);
          }}
          getDialogClasses={getDialogClasses}
        />

        <StraddleModal
          open={showStraddleModal}
          onOpenChange={setShowStraddleModal}
          position={straddleModalPosition}
          value={straddleModalValue}
          error={straddleModalError}
          bigBlind={bigBlind}
          heroPosition={session?.userSeat}
          onValueChange={setStraddleModalValue}
          onConfirm={handleStraddleConfirm}
          onCancel={() => {
            setShowStraddleModal(false);
            setStraddleModalPosition(null);
            setStraddleModalError(null);
          }}
          getDialogClasses={getDialogClasses}
        />

        <ConfirmFoldDialog
          open={showFoldConfirmation}
          onOpenChange={setShowFoldConfirmation}
          position={foldPosition}
          heroMoneyInvested={heroMoneyInvested}
          currentHand={currentHand}
          userSeat={session?.userSeat}
          inlineCardSelection={inlineCardSelection}
          onSetInlineCardSelection={setInlineCardSelection}
          selectedCard1={selectedCard1}
          selectedCard2={selectedCard2}
          opponentCards={opponentCards}
          onInlineCardSelect={handleInlineCardSelect}
          onConfirmFold={handleConfirmedHeroFoldWrapper}
          onCancel={() => {
            setShowFoldConfirmation(false);
            setFoldPosition(null);
          }}
          getDialogClasses={getDialogClasses}
        />

        <ShowdownDialog
          open={showOutcomeSelection}
          onOpenChange={setShowOutcomeSelection}
          currentHand={currentHand}
          userSeat={session?.userSeat}
          heroMoneyInvested={heroMoneyInvested}
          inlineCardSelection={inlineCardSelection}
          onSetInlineCardSelection={setInlineCardSelection}
          selectedCard1={selectedCard1}
          selectedCard2={selectedCard2}
          opponentCards={opponentCards}
          onInlineCardSelect={handleInlineCardSelect}
          onCompleteHandWon={() => completeHand('won', currentHand?.pot || 0)}
          onCompleteHandLost={() => completeHand('lost', 0)}
          getDialogClasses={getDialogClasses}
        />


        <HeroMustActFirstDialog
          open={showHeroMustActFirst}
          onOpenChange={setShowHeroMustActFirst}
          onContinue={() => setShowHeroMustActFirst(false)}
          getDialogClasses={getDialogClasses}
        />

        <AutoActionConfirmDialog
          open={showAutoActionConfirmation}
          onOpenChange={setShowAutoActionConfirmation}
          affectedSeats={affectedSeats}
          currentBet={currentHand?.bettingRounds[currentHand.currentBettingRound as 'preflop' | 'flop' | 'turn' | 'river']?.currentBet || 0}
          onConfirm={handleConfirmedAutoAction}
          onCancel={() => {
            setShowAutoActionConfirmation(false);
            setPendingAction(null);
            setAffectedSeats([]);
          }}
          getDialogClasses={getDialogClasses}
        />

        <AllFoldedDialog
          open={showAllFoldedDialog}
          onOpenChange={(open) => {
            if (!open) {
              // If dialog is being closed, check if user has selected cards
              const hasUserCards = currentHand?.userCards && currentHand.userCards[0] && currentHand.userCards[1];
              if (hasUserCards) {
                // Complete hand normally if cards are selected
                completeHand('won', currentHand?.pot || 0);
              } else {
                // Discard hand and move to next hand if no cards selected
                if (session && session.userSeat) {
                  startNewHandWithPosition(session, session.userSeat);
                }
              }
            }
            setShowAllFoldedDialog(open);
          }}
          currentHand={currentHand}
          userSeat={session?.userSeat}
          heroMoneyInvested={heroMoneyInvested}
          inlineCardSelection={inlineCardSelection}
          onSetInlineCardSelection={setInlineCardSelection}
          selectedCard1={selectedCard1}
          selectedCard2={selectedCard2}
          opponentCards={opponentCards}
          onInlineCardSelect={handleInlineCardSelect}
          onCompleteHand={() => completeHand('won', currentHand?.pot || 0)}
          getDialogClasses={getDialogClasses}
        />

        {/* Validation Error Dialog */}
        <ValidationErrorDialog
          open={showValidationError}
          onOpenChange={setShowValidationError}
          message={validationErrorMessage}
          onSelectCards={() => openHeroCardSelector(1)}
          getDialogClasses={getDialogClasses}
        />

        {/* End Hand Dialog */}
        <EndHandDialog
          open={showEndHandDialog}
          onOpenChange={setShowEndHandDialog}
          onConfirm={() => {
            // Reset all hand-related state without tracking
            setCurrentHand(null);
            setSelectedCard1(null);
            setSelectedCard2(null);
            setShowCardSelector(false);
            setSelectingCard(1);
            setShowCommunitySelector(false);
            setSelectingCommunityCard(null);
            setSelectedPosition(null);
            setShowPositionActions(false);
            setShowAmountModal(false);
            setAmountModalError(null);
            setShowFoldConfirmation(false);
            setFoldPosition(null);
            setShowAutoActionConfirmation(false);
            setPendingAction(null);
            setAffectedSeats([]);
            setShowHeroMustActFirst(false);
            setHeroMoneyInvested(0);
            setShowOutcomeSelection(false);
            setOpponentCards({} as Record<Position, [string, string] | null>);
            setInlineCardSelection({
              show: false,
              position: null,
              cardIndex: 1,
              title: ''
            });
            setAutoSelectingCommunityCards(false);
            setShowValidationError(false);
            setValidationErrorMessage('');
            setPendingHandCompletion(null);
            setShowAllFoldedDialog(false);

            // Show seat selection instead of starting new hand immediately
            setShowSeatSelection(true);
          }}
        />

        {/* Community Card Selector Space - Reserve space to prevent layout shift */}
        {!showSeatSelection && (needsCommunityCards || showCommunitySelector) && (
          <div className={`mt-4 transition-opacity duration-300 ease-in-out ${showCommunitySelector ? 'opacity-100' : 'opacity-0'}`} style={{ minHeight: '200px' }}>
            {showCommunitySelector && selectingCommunityCard && (
              <CardSelector
                title={getCommunityCardSelectorTitle()}
                selectedCards={[
                  selectedCard1,
                  selectedCard2,
                  ...(currentHand?.communityCards.flop || []),
                  currentHand?.communityCards.turn,
                  currentHand?.communityCards.river,
                  ...Object.values(opponentCards).flat()
                ].filter(Boolean) as string[]}
                onCardSelect={handleCommunityCardSelect}
                onCancel={() => {
                  setShowCommunitySelector(false);
                  setSelectingCommunityCard(null);
                  if (autoSelectingCommunityCards) {
                    setAutoSelectingCommunityCards(false);
                  }
                }}
              />
            )}
          </div>
        )}

        {/* Hand History */}
        {!showSeatSelection && (
          <div className="mt-4 min-h-[200px]">
            <HandHistory
              currentHand={handHistoryCurrentHand}
              completedHands={completedHands}
              userSeat={session.userSeat}
              defaultExpanded={false}
            />
          </div>
        )}
      </div>

    </div>
  );
}