'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SimplePokerTable } from '@/components/poker/SimplePokerTable';
import { CardSelector } from '@/components/poker/CardSelector';
import { SeatSelector } from '@/components/poker/SeatSelector';
import { SessionService } from '@/services/session.service';
import { SessionMetadata, CurrentHand, Position, BettingAction, StoredHand } from '@/types/poker-v2';
import {
  initializePlayerStates,
  processBettingAction,
  advanceToNextRound,
  isBettingRoundComplete
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
  const [smallBlind, setSmallBlind] = useState<number>(10);
  const [bigBlind, setBigBlind] = useState<number>(20);
  const [ante, setAnte] = useState<number>(0);
  // Raise/All-in modal
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [amountModalAction, setAmountModalAction] = useState<'raise' | 'all-in'>('raise');
  const [amountModalPosition, setAmountModalPosition] = useState<Position | null>(null);
  const [amountModalValue, setAmountModalValue] = useState<number>(0);
  // Hero fold confirmation
  const [showFoldConfirmation, setShowFoldConfirmation] = useState(false);
  const [foldPosition, setFoldPosition] = useState<Position | null>(null);
  // Hero money tracking
  const [heroMoneyInvested, setHeroMoneyInvested] = useState<number>(0);
  // Showdown outcome
  const [showOutcomeSelection, setShowOutcomeSelection] = useState(false);
  // Seat selection for new hands
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [handCount, setHandCount] = useState(0);

  useEffect(() => {
    // Load session
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
        } else {
          router.push('/');
        }
      } else {
        setSession(metadata);
      }
    };

    loadSession();
  }, [sessionId, router]);

  const startNewHand = useCallback(() => {
    if (!session) return;

    const handNumber = SessionService.getCurrentHandNumber();

    // Initialize player states with proper blinds and poker logic
    const playerStates = initializePlayerStates(
      session.tableSeats,
      smallBlind,
      bigBlind
    );

    // Calculate hero's initial investment (if on blinds)
    let initialHeroInvestment = 0;
    if (session.userSeat === 'SB') {
      initialHeroInvestment = smallBlind;
    } else if (session.userSeat === 'BB') {
      initialHeroInvestment = bigBlind;
    }

    const newHand: CurrentHand = {
      handNumber,
      userCards: null,
      communityCards: {
        flop: null,
        turn: null,
        river: null
      },
      currentBettingRound: 'preflop',
      bettingRounds: {
        preflop: {
          actions: [],
          pot: smallBlind + bigBlind + (ante * session.tableSeats), // Initial pot from blinds and antes
          currentBet: bigBlind, // BB is current bet to match
          isComplete: false
        }
      },
      playerStates,
      pot: smallBlind + bigBlind + (ante * session.tableSeats),
      smallBlind,
      bigBlind,
      nextToAct: undefined, // Don't auto-highlight anyone
      canAdvanceToFlop: false,
      canAdvanceToTurn: false,
      canAdvanceToRiver: false
    };

    setCurrentHand(newHand);
    setSelectedCard1(null);
    setSelectedCard2(null);
    setHeroMoneyInvested(initialHeroInvestment);

    // Deduct blinds from hero's stack if on blind position
    if (session.userSeat === 'SB') {
      setStack(prev => prev - smallBlind);
    } else if (session.userSeat === 'BB') {
      setStack(prev => prev - bigBlind);
    }
    // Don't auto-show card selector - let user click on card buttons
  }, [session, smallBlind, bigBlind, ante]);

  // Auto-start Hand 1 when session loads
  useEffect(() => {
    if (session && !currentHand) {
      startNewHand();
      // Initialize stack from session
      setStack(session.currentStack || session.buyIn || 1000);
    }
  }, [session, currentHand, startNewHand]);

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

  const handleUserCardSelect = (card: string) => {
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
    }

    // Reset states
    setShowCardSelector(false);
  };

  const handleCommunityCardClick = (cardType: 'flop', cardIndex: number) => {
    // Only allow community card selection when betting round is complete
    if (!isBettingComplete) {
      return; // Don't allow community card selection during active betting
    }
    setSelectingCommunityCard({ type: cardType, index: cardIndex });
    setShowCommunitySelector(true);
  };

  const handleCommunityCardSelect = (card: string) => {
    if (!selectingCommunityCard || !currentHand) return;

    const { type, index } = selectingCommunityCard;
    const updatedHand = { ...currentHand };

    if (type === 'flop') {
      if (index < 3) {
        // Flop cards
        const newFlop = updatedHand.communityCards.flop ? [...updatedHand.communityCards.flop] : [null, null, null];
        newFlop[index] = card;
        updatedHand.communityCards.flop = newFlop as [string, string, string];
      } else if (index === 3) {
        // Turn card
        updatedHand.communityCards.turn = card;
      } else if (index === 4) {
        // River card
        updatedHand.communityCards.river = card;
      }
    }

    setCurrentHand(updatedHand);
    setShowCommunitySelector(false);
    setSelectingCommunityCard(null);
  };

  // Handle betting actions for any position
  const handleBettingAction = (position: Position, action: 'fold' | 'check' | 'call' | 'raise' | 'all-in', amount?: number) => {
    if (!currentHand || !session) return;

    // If hero is folding, show confirmation
    if (action === 'fold' && position === session.userSeat) {
      setFoldPosition(position);
      setShowFoldConfirmation(true);
      return;
    }

    let updatedHand = { ...currentHand };

    // Auto-fold everyone who should have folded before this position (unless the action is fold)
    if (action !== 'fold') {
      updatedHand = autoFoldPlayersBeforePosition(updatedHand, position);
    }

    // Track hero's money investment
    if (position === session.userSeat && amount) {
      const currentBet = updatedHand.playerStates.find(p => p.position === position)?.currentBet || 0;
      const additionalInvestment = amount - currentBet;
      setHeroMoneyInvested(prev => prev + additionalInvestment);
    }

    const bettingAction: Omit<BettingAction, 'timestamp'> = {
      position,
      action,
      amount
    };

    updatedHand = processBettingAction(updatedHand, bettingAction);
    setCurrentHand(updatedHand);

    // Check if hand ends (all others folded)
    const activePlayers = updatedHand.playerStates.filter(p => p.status === 'active');
    if (activePlayers.length === 1) {
      if (activePlayers[0].position === session.userSeat) {
        // Hero wins
        completeHand('won', updatedHand.pot);
      } else {
        // Hero lost (already folded)
        completeHand('lost', 0);
      }
    }
  };

  // Complete the current hand
  const completeHand = (outcome: 'won' | 'lost' | 'folded', potWon?: number) => {
    if (!currentHand || !session) return;

    // Save hand to storage
    const handData: StoredHand = {
      handNumber: currentHand.handNumber,
      timestamp: new Date().toISOString(),
      userCards: currentHand.userCards,
      communityCards: currentHand.communityCards,
      bettingRounds: currentHand.bettingRounds,
      result: {
        winner: outcome === 'won' ? session.userSeat : undefined,
        potWon: outcome === 'won' ? potWon : undefined,
        stackAfter: stack + (outcome === 'won' ? (potWon || 0) : 0) - heroMoneyInvested,
        handOutcome: outcome
      }
    };

    SessionService.saveHandToSession(handData);

    // Update stack
    if (outcome === 'won') {
      setStack(prev => prev + (potWon || 0));
    }
    // Note: Stack is already reduced when betting/posting blinds, so no need to deduct again

    // Reset and prepare for next hand
    const newHandCount = handCount + 1;
    setHandCount(newHandCount);

    // After first hand, show seat selection
    if (newHandCount > 1) {
      setShowSeatSelection(true);
    } else {
      startNewHand();
    }
  };

  // Handle confirmed hero fold
  const handleConfirmedHeroFold = () => {
    if (!currentHand || !session || !foldPosition) return;

    let updatedHand = { ...currentHand };

    const bettingAction: Omit<BettingAction, 'timestamp'> = {
      position: foldPosition,
      action: 'fold'
    };

    updatedHand = processBettingAction(updatedHand, bettingAction);
    setCurrentHand(updatedHand);

    // Determine outcome based on money invested
    const outcome = heroMoneyInvested > 0 ? 'lost' : 'folded';
    completeHand(outcome, 0);

    setShowFoldConfirmation(false);
    setFoldPosition(null);
  };

  // Auto-fold all players who should have acted before the given position
  const autoFoldPlayersBeforePosition = (hand: CurrentHand, targetPosition: Position): CurrentHand => {
    const updatedHand = { ...hand };
    const actionSequence = hand.currentBettingRound === 'preflop'
      ? ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB']
      : ['SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN'];

    const targetIndex = actionSequence.indexOf(targetPosition);
    if (targetIndex === -1) return updatedHand;

    // Fold all players before target position who haven't acted yet
    for (let i = 0; i < targetIndex; i++) {
      const position = actionSequence[i];
      const playerState = updatedHand.playerStates.find(p => p.position === position);

      if (playerState && playerState.status === 'active' && !playerState.hasActed) {
        playerState.status = 'folded';
        playerState.hasActed = true;

        // Add fold action to betting round (only for non-showdown rounds)
        if (updatedHand.currentBettingRound !== 'showdown') {
          const currentRound = updatedHand.bettingRounds[updatedHand.currentBettingRound];
          if (currentRound) {
            currentRound.actions.push({
              position: position as Position,
              action: 'fold',
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }

    return updatedHand;
  };

  // Handle advancing to next betting round
  const handleAdvanceToNextRound = () => {
    if (!currentHand || !session) return;

    // Check if we're going to showdown
    if (currentHand.currentBettingRound === 'river') {
      // Show outcome selection for showdown
      setShowOutcomeSelection(true);
      return;
    }

    const updatedHand = advanceToNextRound(currentHand);
    setCurrentHand(updatedHand);
  };

  // Get current betting round info
  const getCurrentBettingRound = () => {
    if (!currentHand) return null;
    const round = currentHand.currentBettingRound;
    if (round === 'showdown') return null;

    // Type-safe access to betting rounds
    if (round === 'preflop') return currentHand.bettingRounds.preflop;
    if (round === 'flop') return currentHand.bettingRounds.flop;
    if (round === 'turn') return currentHand.bettingRounds.turn;
    if (round === 'river') return currentHand.bettingRounds.river;

    return null;
  };

  const currentBettingRound = getCurrentBettingRound();
  const isBettingComplete = currentBettingRound ? isBettingRoundComplete(currentHand?.playerStates || [], currentBettingRound) : false;

  // Show flop selection prompt when preflop betting is complete and no flop cards are selected
  const showFlopSelectionPrompt = isBettingComplete &&
    currentHand?.currentBettingRound === 'preflop' &&
    (!currentHand?.communityCards.flop || currentHand.communityCards.flop.every(card => !card));

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
      <div className="bg-white border-b px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="p-1 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-base font-semibold truncate">{session.sessionName}</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={endSession}
            className="text-red-600 text-sm px-3 py-1.5 flex-shrink-0 font-medium"
          >
            End Session
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-2 max-w-lg mx-auto">
        {/* Seat Selection View */}
        {showSeatSelection && session && (
          <SeatSelector
            tableSeats={session.tableSeats}
            currentSeat={session.userSeat}
            onSeatSelect={(position) => {
              if (position !== 'DEALER') {
                // Update session with new seat
                const updatedSession = { ...session, userSeat: position };
                setSession(updatedSession);
                SessionService.updateSessionMetadata(updatedSession);
                // Start new hand with selected seat
                startNewHand();
              }
            }}
            onKeepCurrentSeat={() => {
              // Keep current seat and start new hand
              startNewHand();
            }}
            title={`Hand #${handCount + 1} - Select Your Seat`}
            showKeepCurrentButton={true}
          />
        )}
        {/* Hand Info - Top */}
        {currentHand && !showSeatSelection && (
          <div className="bg-white rounded-lg p-3 shadow-sm mb-3">
            <div className="text-center mb-2">
              <h2 className="text-lg font-semibold">Hand #{currentHand.handNumber} - <span className="text-blue-600 capitalize">{currentHand.currentBettingRound}</span></h2>
            </div>

            {/* Stack and Blinds */}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1 text-center">Stack</label>
                <input
                  type="number"
                  value={stack}
                  onChange={(e) => setStack(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border rounded text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 text-center">SB</label>
                <input
                  type="number"
                  value={smallBlind}
                  onChange={(e) => setSmallBlind(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border rounded text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 text-center">BB</label>
                <input
                  type="number"
                  value={bigBlind}
                  onChange={(e) => setBigBlind(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border rounded text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 text-center">Ante</label>
                <input
                  type="number"
                  value={ante}
                  onChange={(e) => setAnte(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border rounded text-center"
                />
              </div>
            </div>
          </div>
        )}

        {/* Table Display */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <SimplePokerTable
            seats={session.tableSeats}
            userSeat={session.userSeat}
            userCards={currentHand?.userCards || null}
            onCardClick={(cardIndex) => {
              setSelectingCard(cardIndex);
              setShowCardSelector(true);
            }}
            onSeatClick={(position) => {
              if (position !== 'DEALER') {
                setSelectedPosition(position);
                setShowPositionActions(true);
              }
            }}
            showCardButtons={!!currentHand}
            communityCards={currentHand?.communityCards}
            onCommunityCardClick={handleCommunityCardClick}
            showCommunityCards={!!currentHand}
            playerStates={currentHand?.playerStates || []}
            nextToAct={currentHand?.nextToAct}
            currentBettingRound={currentBettingRound || undefined}
            isBettingComplete={isBettingComplete}
            showFlopSelectionPrompt={showFlopSelectionPrompt}
            potSize={currentHand?.pot || 0}
          />
        </div>

        {/* User Card Selector */}
        {showCardSelector && (
          <CardSelector
            title={`Select Card ${selectingCard}`}
            selectedCards={[selectedCard1, selectedCard2].filter(Boolean) as string[]}
            onCardSelect={handleUserCardSelect}
            onCancel={() => setShowCardSelector(false)}
          />
        )}

        {/* Community Card Selector */}
        {showCommunitySelector && selectingCommunityCard && (
          <CardSelector
            title={`Select Community Card`}
            selectedCards={[
              ...(currentHand?.communityCards.flop || []),
              currentHand?.communityCards.turn,
              currentHand?.communityCards.river
            ].filter(Boolean) as string[]}
            onCardSelect={handleCommunityCardSelect}
            onCancel={() => {
              setShowCommunitySelector(false);
              setSelectingCommunityCard(null);
            }}
          />
        )}

        {/* Position Action Selector */}
        {showPositionActions && selectedPosition && (
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <h3 className="text-md font-semibold mb-3 text-center">
              {selectedPosition} Action
            </h3>
            <div className="grid grid-cols-2 gap-3">
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
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  handleBettingAction(selectedPosition, 'call', currentBettingRound?.currentBet);
                  setShowPositionActions(false);
                  setSelectedPosition(null);
                }}
              >
                Call {currentBettingRound?.currentBet ? `${currentBettingRound.currentBet}` : ''}
              </Button>
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
              {/* Show Check if:
                   1. Current bet is 0 (no one has bet yet) OR
                   2. BB in preflop when current bet equals big blind OR
                   3. Post-flop rounds when current bet is 0 (everyone can check initially)
              */}
              {((!currentBettingRound?.currentBet || currentBettingRound.currentBet === 0) ||
               (selectedPosition === 'BB' && currentHand?.currentBettingRound === 'preflop' && currentBettingRound?.currentBet === bigBlind) ||
               (currentHand?.currentBettingRound !== 'preflop' && currentBettingRound?.currentBet === 0)) && (
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
              )}
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
        {currentHand && !showCardSelector && !showCommunitySelector && !showPositionActions && (
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            {isBettingComplete ? (
              // Show advance button when betting round is complete
              <div className="text-center">
                <h3 className="text-md font-semibold mb-3">Betting Round Complete</h3>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                  onClick={handleAdvanceToNextRound}
                >
                  Proceed to {
                    currentHand.currentBettingRound === 'preflop' ? 'Flop' :
                    currentHand.currentBettingRound === 'flop' ? 'Turn' :
                    currentHand.currentBettingRound === 'turn' ? 'River' : 'Showdown'
                  }
                </Button>
              </div>
            ) : (
              // Show betting actions
              <>
                <h3 className="text-md font-semibold mb-3 text-center">
                  {session.userSeat} Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      setFoldPosition(session.userSeat);
                      setShowFoldConfirmation(true);
                    }}
                  >
                    Fold
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleBettingAction(session.userSeat, 'call', currentBettingRound?.currentBet)}
                  >
                    Call {currentBettingRound?.currentBet ? `${currentBettingRound.currentBet}` : ''}
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      setAmountModalAction('raise');
                      setAmountModalPosition(session.userSeat);
                      setAmountModalValue((currentBettingRound?.currentBet || 0) * 2);
                      setShowAmountModal(true);
                    }}
                  >
                    Raise
                  </Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => {
                      setAmountModalAction('all-in');
                      setAmountModalPosition(session.userSeat);
                      setAmountModalValue(stack);
                      setShowAmountModal(true);
                    }}
                  >
                    All-In
                  </Button>
                  {/* Show Check if:
                       1. Current bet is 0 (no one has bet yet) OR
                       2. BB in preflop when current bet equals big blind OR
                       3. Post-flop rounds when current bet is 0 (everyone can check initially)
                  */}
                  {((!currentBettingRound?.currentBet || currentBettingRound.currentBet === 0) ||
                   (session.userSeat === 'BB' && currentHand?.currentBettingRound === 'preflop' && currentBettingRound?.currentBet === bigBlind) ||
                   (currentHand?.currentBettingRound !== 'preflop' && currentBettingRound?.currentBet === 0)) && (
                    <Button
                      className="bg-orange-600 hover:bg-orange-700 text-white col-span-2"
                      onClick={() => handleBettingAction(session.userSeat, 'check')}
                    >
                      Check
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Amount Input Modal for Raise/All-In */}
        <Dialog open={showAmountModal} onOpenChange={setShowAmountModal}>
          <DialogContent className="sm:max-w-[425px] max-w-[350px]">
            <DialogHeader>
              <DialogTitle>
                {amountModalAction === 'raise' ? 'Raise Amount' : 'All-In Amount'}
              </DialogTitle>
              <DialogDescription>
                Enter the total amount to {amountModalAction === 'raise' ? 'raise to' : 'go all-in with'} (no decimals)
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Amount</label>
                <input
                  type="number"
                  value={amountModalValue}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (amountModalAction === 'all-in') {
                      setAmountModalValue(Math.min(value, stack));
                    } else {
                      setAmountModalValue(Math.max(value, (currentBettingRound?.currentBet || 0) * 2));
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                  min={(currentBettingRound?.currentBet || 0) * 2}
                  max={amountModalAction === 'all-in' ? stack : undefined}
                  step="1"
                />
                <div className="text-xs text-gray-500">
                  {amountModalAction === 'raise' && (
                    <>Min: ${(currentBettingRound?.currentBet || 0) * 2}</>
                  )}
                  {amountModalAction === 'all-in' && (
                    <>Max: ${stack}</>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => {
                    setShowAmountModal(false);
                    setAmountModalPosition(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    if (amountModalPosition) {
                      handleBettingAction(
                        amountModalPosition,
                        amountModalAction,
                        Math.floor(amountModalValue)
                      );
                      setShowAmountModal(false);
                      setAmountModalPosition(null);
                      setSelectedPosition(null);
                    }
                  }}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Fold Confirmation Dialog */}
        <Dialog open={showFoldConfirmation} onOpenChange={setShowFoldConfirmation}>
          <DialogContent className="sm:max-w-[425px] max-w-[350px]">
            <DialogHeader>
              <DialogTitle>Confirm Fold</DialogTitle>
              <DialogDescription>
                {heroMoneyInvested > 0
                  ? `You have invested ${heroMoneyInvested} chips. Folding will result in a loss. The hand will end.`
                  : 'Folding will end the hand. Are you sure?'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => {
                  setShowFoldConfirmation(false);
                  setFoldPosition(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleConfirmedHeroFold}
              >
                Confirm Fold
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Showdown Outcome Selection */}
        <Dialog open={showOutcomeSelection} onOpenChange={setShowOutcomeSelection}>
          <DialogContent className="sm:max-w-[425px] max-w-[350px]">
            <DialogHeader>
              <DialogTitle>Showdown Result</DialogTitle>
              <DialogDescription>
                Did you win or lose at showdown?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 mt-4">
              <div className="text-center text-sm text-gray-600 mb-2">
                Pot Size: {currentHand?.pot || 0}
              </div>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  completeHand('won', currentHand?.pot || 0);
                  setShowOutcomeSelection(false);
                }}
              >
                I Won
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  completeHand('lost', 0);
                  setShowOutcomeSelection(false);
                }}
              >
                I Lost
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

    </div>
  );
}