'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimplePokerTable } from '@/components/poker/SimplePokerTable';
import { CardSelector } from '@/components/poker/CardSelector';
import { SessionService } from '@/services/session.service';
import { SessionMetadata, CurrentHand, Position, BettingAction } from '@/types/poker-v2';
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
          pot: smallBlind + bigBlind, // Initial pot from blinds
          currentBet: bigBlind, // BB is current bet to match
          isComplete: false
        }
      },
      playerStates,
      pot: smallBlind + bigBlind,
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
    // Don't auto-show card selector - let user click on card buttons
  }, [session, smallBlind, bigBlind]);

  // Auto-start Hand 1 when session loads
  useEffect(() => {
    if (session && !currentHand) {
      startNewHand();
      // Initialize stack from session
      setStack(session.currentStack || session.buyIn || 1000);
    }
  }, [session, currentHand, startNewHand]);

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

    let updatedHand = { ...currentHand };

    // Auto-fold everyone who should have folded before this position (unless the action is fold)
    if (action !== 'fold') {
      updatedHand = autoFoldPlayersBeforePosition(updatedHand, position);
    }

    const bettingAction: Omit<BettingAction, 'timestamp'> = {
      position,
      action,
      amount
    };

    updatedHand = processBettingAction(updatedHand, bettingAction);
    setCurrentHand(updatedHand);
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
        {/* Hand Info - Top */}
        {currentHand && (
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
                  const raiseAmount = (currentBettingRound?.currentBet || 0) * 2; // 2x current bet
                  handleBettingAction(selectedPosition, 'raise', raiseAmount);
                  setShowPositionActions(false);
                  setSelectedPosition(null);
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
                  handleBettingAction(selectedPosition, 'all-in', stack);
                  setShowPositionActions(false);
                  setSelectedPosition(null);
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
                    onClick={() => handleBettingAction(session.userSeat, 'fold')}
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
                      const raiseAmount = (currentBettingRound?.currentBet || 0) * 2; // 2x current bet
                      handleBettingAction(session.userSeat, 'raise', raiseAmount);
                    }}
                  >
                    Raise
                  </Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => handleBettingAction(session.userSeat, 'all-in', stack)}
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
      </div>

    </div>
  );
}