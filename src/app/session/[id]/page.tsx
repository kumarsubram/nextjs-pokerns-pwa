'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
  ValidationErrorDialog
} from '@/components/dialog';
import {
  HeroCards,
  SessionHeader,
  HandInfoHeader,
  HandSettingsPanel,
  NextToAct
} from '@/components/session';
import { useHandFlow } from '@/hooks/useHandFlow';
import { useBettingLogic } from '@/hooks/useBettingLogic';
import { useCommunityCards } from '@/hooks/useCommunityCards';
import { SessionService } from '@/services/session.service';
import { SessionMetadata, CurrentHand, Position, StoredHand } from '@/types/poker-v2';
import {
  isBettingRoundComplete,
  getPreflopActionSequence,
  getPostflopActionSequence
} from '@/utils/poker-logic';

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
  // Dialog state declarations
  const [showValidationError, setShowValidationError] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');
  const [pendingHandCompletion, setPendingHandCompletion] = useState<{ outcome: 'won' | 'lost' | 'folded', potWon?: number } | null>(null);
  const [showAllFoldedDialog, setShowAllFoldedDialog] = useState(false);

  // Initialize hand flow hook
  const { startNewHandWithPosition, startNewHand, completeHand } = useHandFlow({
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
    setAutoSelectingCommunityCards
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
  const handleInlineCardSelect = (card: string) => {
    const { position, cardIndex } = inlineCardSelection;

    // Check if we're selecting opponent cards
    if (position && position !== session?.userSeat) {
      // Opponent card selection
      const currentOpponentCards = opponentCards[position] || [null, null];
      const newOpponentCards = [...currentOpponentCards] as [string | null, string | null];
      newOpponentCards[cardIndex - 1] = card;

      setOpponentCards(prev => ({
        ...prev,
        [position]: newOpponentCards as [string, string] | null
      }));

      setInlineCardSelection({ show: false, position: null, cardIndex: 1, title: '' });
      return;
    }

    // Hero card selection
    if (cardIndex === 1) {
      setSelectedCard1(card);
      // Update current hand immediately for card 1
      if (currentHand) {
        setCurrentHand({
          ...currentHand,
          userCards: [card, selectedCard2] as [string, string] | null
        });
      }
    } else {
      setSelectedCard2(card);
      // Update current hand with both cards
      if (currentHand) {
        setCurrentHand({
          ...currentHand,
          userCards: [selectedCard1!, card] as [string, string]
        });
      }
    }

    setInlineCardSelection({ show: false, position: null, cardIndex: 1, title: '' });
  };

  const handleUserCardSelect = (card: string) => {
    // Check if we're selecting opponent cards
    if (selectedPosition && selectedPosition !== session?.userSeat) {
      // Opponent card selection
      const currentOpponentCards = opponentCards[selectedPosition] || [null, null];
      const newOpponentCards = [...currentOpponentCards] as [string | null, string | null];
      newOpponentCards[selectingCard - 1] = card;

      setOpponentCards(prev => ({
        ...prev,
        [selectedPosition]: newOpponentCards as [string, string] | null
      }));

      setShowCardSelector(false);
      setSelectedPosition(null);
      return;
    }

    // Hero card selection
    if (selectingCard === 1) {
      setSelectedCard1(card);
      // Update current hand immediately for card 1
      if (currentHand) {
        setCurrentHand({
          ...currentHand,
          userCards: [card, selectedCard2] as [string, string] | null
        });
      }
    } else {
      setSelectedCard2(card);
      // Update current hand with both cards
      if (currentHand) {
        setCurrentHand({
          ...currentHand,
          userCards: [selectedCard1!, card] as [string, string]
        });
      }

      // If we came from the All Folded dialog, return to it
      if (showAllFoldedDialog || pendingHandCompletion) {
        setShowCardSelector(false);
        // Return to the All Folded dialog to show the selected cards
        if (!showAllFoldedDialog) {
          setShowAllFoldedDialog(true);
        }
        return;
      }
    }

    // Reset states
    setShowCardSelector(false);
  };






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
              setShowSeatSelection(false);
              // Keep current seat and start new hand
              startNewHand();
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
            session={session}
            stack={stack}
            smallBlind={smallBlind}
            bigBlind={bigBlind}
            ante={ante}
            onStackChange={setStack}
            onSmallBlindChange={setSmallBlind}
            onBigBlindChange={setBigBlind}
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
            highlightedPositions={selectedPosition ? [selectedPosition] : []}
          />
        </div>
        )}

        {/* Hero Cards and Next to Act Section - Below table, above action buttons */}
        {!showSeatSelection && currentHand && (
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <HeroCards
                currentHand={currentHand}
                userSeat={session?.userSeat}
                onCardClick={(cardIndex) => {
                  setSelectingCard(cardIndex);
                  setShowCardSelector(true);
                }}
              />
            </div>
            <div className="flex-1">
              <NextToAct
                currentHand={currentHand}
                userSeat={session?.userSeat}
              />
            </div>
          </div>
        )}

        {/* User Card Selector */}
        {showCardSelector && (
          <CardSelector
            title={selectedPosition && selectedPosition !== session?.userSeat
              ? `Select ${selectedPosition} Card ${selectingCard}`
              : `Select Card ${selectingCard}`}
            selectedCards={[
              selectedCard1,
              selectedCard2,
              ...(currentHand?.communityCards.flop || []),
              currentHand?.communityCards.turn,
              currentHand?.communityCards.river,
              ...Object.values(opponentCards).flat()
            ].filter(Boolean) as string[]}
            onCardSelect={handleUserCardSelect}
            onCancel={() => {
              setShowCardSelector(false);
              setSelectedPosition(null);
            }}
          />
        )}


        {/* Position Action Selector */}
        {showPositionActions && selectedPosition && (
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <div className="mb-3 text-center">
              <h3 className="text-md font-semibold">
                {selectedPosition} Action
              </h3>
              {(() => {
                // Show auto-fold/check hint for selected position
                if (!currentHand?.nextToAct) return null;

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

                return (
                  <div className="text-amber-600 text-xs mt-1">
                    {skippedPositions.length === 1
                      ? `${skippedPositions[0]} will auto-${autoAction}`
                      : `${skippedPositions.join(', ')} will auto-${autoAction}`
                    }
                  </div>
                );
              })()}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Left Column: Fold + All-In */}
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  handleBettingAction(selectedPosition, 'fold');
                  setShowPositionActions(false);
                  setSelectedPosition(null);
                }}
              >
                Fold
              </Button>

              {(() => {
                const callAmount = getCallAmount(selectedPosition);
                const canCheckHere = canCheck(selectedPosition);

                if (canCheckHere) {
                  return (
                    <Button
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                      onClick={() => {
                        handleBettingAction(selectedPosition, 'check');
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
                        handleBettingAction(selectedPosition, 'call', currentBettingRound?.currentBet);
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

              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => {
                  setAmountModalAction('all-in');
                  setAmountModalPosition(selectedPosition);
                  setAmountModalValue(stack);
                  setShowAmountModal(true);
                  setShowPositionActions(false);
                }}
              >
                All-In
              </Button>

              {/* Right Column: Call/Check + Raise */}
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  setAmountModalAction('raise');
                  setAmountModalPosition(selectedPosition);
                  setAmountModalValue((currentBettingRound?.currentBet || 0) * 2);
                  setShowAmountModal(true);
                  setShowPositionActions(false);
                }}
              >
                Raise
              </Button>
            </div>
            <div className="mt-3 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPositionActions(false);
                  setSelectedPosition(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {currentHand && !showCommunitySelector && !showPositionActions &&
         !(showCardSelector && selectedPosition && selectedPosition !== session?.userSeat) &&
         !needsCommunityCards && (
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            {isBettingComplete ? (
              // Show advance button when betting round is complete
              (() => {
                const needsCommunityCards =
                  (currentHand.currentBettingRound === 'preflop' && (!currentHand.communityCards.flop || currentHand.communityCards.flop.length < 3 || currentHand.communityCards.flop.some(card => !card))) ||
                  (currentHand.currentBettingRound === 'flop' && !currentHand.communityCards.turn) ||
                  (currentHand.currentBettingRound === 'turn' && !currentHand.communityCards.river);


                return (
                  <div className="text-center">
                    <h3 className="text-md font-semibold mb-3">
                      {getAdvanceRoundMessage()}
                    </h3>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                      onClick={handleAdvanceToNextRound}
                      disabled={needsCommunityCards}
                    >
                      {getAdvanceRoundButtonText()}
                    </Button>
                  </div>
                );
              })()
            ) : (
              // Show betting actions when hero can act
              (() => {
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

                return shouldShowActions ? (
                  <>
                    <div className="mb-3 text-center">
                      <h3 className="text-md font-semibold">
                        {showPositionActions && selectedPosition
                          ? `${selectedPosition} Actions`
                          : <span className="text-blue-600">{`Hero Actions (${session.userSeat})`}</span>}
                      </h3>
                      {(() => {
                        // Show auto-fold/check hint for any selected position
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
                      })()}
                    </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Left Column: Fold + All-In */}
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

                  {/* Right Column: Call/Check + Raise */}
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
                  <div className="text-center py-4">
                    <p className="text-gray-600">Waiting for other players to act...</p>
                  </div>
                );
              })()
            )}
          </div>
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
          onValueChange={setAmountModalValue}
          onConfirm={() => {
            if (amountModalPosition) {
              const amount = Math.floor(amountModalValue);

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
          onSelectCards={() => setShowCardSelector(true)}
          getDialogClasses={getDialogClasses}
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