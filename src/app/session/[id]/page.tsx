'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SimplePokerTable } from '@/components/poker/SimplePokerTable';
import { CardSelector } from '@/components/poker/CardSelector';
import { SeatSelector } from '@/components/poker/SeatSelector';
import { HandHistory } from '@/components/poker/HandHistory';
import { SessionService } from '@/services/session.service';
import { SessionMetadata, CurrentHand, Position, BettingAction, StoredHand } from '@/types/poker-v2';
import {
  initializePlayerStates,
  processBettingAction,
  advanceToNextRound,
  isBettingRoundComplete,
  getNextToAct,
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
  // Opponent cards logging
  const [showOpponentCardsDialog, setShowOpponentCardsDialog] = useState(false);
  const [opponentCards, setOpponentCards] = useState<{[position: string]: [string, string] | null}>({});
  // Seat selection for new hands
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [handCount, setHandCount] = useState(0);
  const [completedHands, setCompletedHands] = useState<StoredHand[]>([]);

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

  // Save stack changes to session metadata
  useEffect(() => {
    if (session) {
      const updatedSession = { ...session, currentStack: stack };
      SessionService.updateSessionMetadata(updatedSession);
    }
  }, [stack, session]);

  // Function to start new hand with explicit session data
  const startNewHandWithPosition = useCallback((sessionData: SessionMetadata, userSeat: Position) => {
    console.log('startNewHandWithPosition called, session:', sessionData.sessionId, 'userSeat:', userSeat);

    const handNumber = SessionService.getCurrentHandNumber();

    // Initialize player states with proper blinds and poker logic
    const playerStates = initializePlayerStates(
      sessionData.tableSeats,
      smallBlind,
      bigBlind
    );

    // Calculate hero's initial investment (if on blinds)
    let initialHeroInvestment = 0;
    if (userSeat === 'SB') {
      initialHeroInvestment = smallBlind;
    } else if (userSeat === 'BB') {
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
          pot: smallBlind + bigBlind + (ante * sessionData.tableSeats), // Initial pot from blinds and antes
          currentBet: bigBlind, // BB is current bet to match
          isComplete: false
        }
      },
      playerStates,
      pot: smallBlind + bigBlind + (ante * sessionData.tableSeats),
      smallBlind,
      bigBlind,
      nextToAct: 'UTG', // First to act preflop
      canAdvanceToFlop: false,
      canAdvanceToTurn: false,
      canAdvanceToRiver: false
    };

    setCurrentHand(newHand);
    setSelectedCard1(null);
    setSelectedCard2(null);
    setHeroMoneyInvested(initialHeroInvestment);

    // Deduct blinds from hero's stack if on blind position
    if (userSeat === 'SB') {
      setStack(prev => prev - smallBlind);
    } else if (userSeat === 'BB') {
      setStack(prev => prev - bigBlind);
    }
  }, [smallBlind, bigBlind, ante]);

  const startNewHand = useCallback(() => {
    console.log('startNewHand called, session:', session?.sessionId, 'userSeat:', session?.userSeat);
    if (!session || !session.userSeat) {
      console.log('startNewHand: Missing session or userSeat');
      return;
    }

    startNewHandWithPosition(session, session.userSeat);
  }, [session, startNewHandWithPosition]);


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

    // Auto-fold players between current next-to-act and target position (when user skips positions)
    if (currentHand.nextToAct && currentHand.nextToAct !== position) {
      console.log(`Auto-folding between ${currentHand.nextToAct} and ${position}`);
      updatedHand = autoFoldPlayersBetween(updatedHand, currentHand.nextToAct, position);
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

    // Special case: When BB checks in preflop, the round should be complete
    if (updatedHand.currentBettingRound === 'preflop' &&
        position === 'BB' &&
        action === 'check') {
      console.log('BB checked in preflop, marking round as complete');
      const currentRound = updatedHand.bettingRounds.preflop;
      if (currentRound) {
        currentRound.isComplete = true;
        updatedHand.canAdvanceToFlop = true;
        // Clear nextToAct since round is complete
        updatedHand.nextToAct = undefined;

        // Auto-fold any remaining active players who haven't acted (like SB)
        updatedHand.playerStates.forEach(playerState => {
          if (playerState.status === 'active' && !playerState.hasActed && playerState.position !== 'BB') {
            console.log(`Auto-folding ${playerState.position} since BB checked in preflop`);
            playerState.status = 'folded';
            playerState.hasActed = true;

            // Add fold action to betting round
            currentRound.actions.push({
              position: playerState.position,
              action: 'fold',
              timestamp: new Date().toISOString()
            });
          }
        });
      }
    }

    // Update nextToAct based on current betting round and player states
    if (updatedHand.currentBettingRound !== 'showdown') {
      const currentRound = updatedHand.bettingRounds[updatedHand.currentBettingRound];
      if (currentRound) {
        // Manual nextToAct calculation to handle auto-folded players correctly
        const actionSequence = updatedHand.currentBettingRound === 'preflop'
          ? getPreflopActionSequence(session.tableSeats)
          : getPostflopActionSequence(session.tableSeats);

        const activePlayers = updatedHand.playerStates.filter(p => p.status === 'active');
        const currentBet = currentRound.currentBet;

        // Find the next active player who needs to act
        let nextPlayer: Position | null = null;
        for (const pos of actionSequence) {
          const player = activePlayers.find(p => p.position === pos);
          if (player && (!player.hasActed || player.currentBet < currentBet)) {
            nextPlayer = pos;
            break;
          }
        }

        updatedHand.nextToAct = nextPlayer || undefined;
        console.log(`After action: nextToAct = ${nextPlayer}, activePlayers = ${activePlayers.map(p => `${p.position}(acted:${p.hasActed},bet:${p.currentBet})`).join(', ')}, currentBet = ${currentBet}`);

        // Check if round is complete after setting nextToAct
        const allActivePlayersHaveActedAndMatched = activePlayers.every(player =>
          player.hasActed && (player.currentBet === currentBet || player.status === 'all-in')
        );

        if (allActivePlayersHaveActedAndMatched || activePlayers.length <= 1) {
          console.log('Marking round as complete');
          currentRound.isComplete = true;
          updatedHand.nextToAct = undefined;
        }
      }
    }

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

  // Validate required values before hand completion
  const validateHandRequirements = (): { isValid: boolean; error?: string } => {
    if (stack <= 0) {
      return { isValid: false, error: 'Stack must be greater than 0' };
    }
    if (smallBlind <= 0) {
      return { isValid: false, error: 'Small Blind must be greater than 0' };
    }
    if (bigBlind <= 0) {
      return { isValid: false, error: 'Big Blind must be greater than 0' };
    }
    if (bigBlind <= smallBlind) {
      return { isValid: false, error: 'Big Blind must be greater than Small Blind' };
    }

    // Only require Hero cards if Hero invested money
    if (heroMoneyInvested > 0) {
      if (!currentHand?.userCards || !currentHand.userCards[0] || !currentHand.userCards[1]) {
        return { isValid: false, error: 'Hero cards must be selected when money is invested' };
      }
    }

    return { isValid: true };
  };

  // Complete the current hand
  const completeHand = (outcome: 'won' | 'lost' | 'folded', potWon?: number) => {
    if (!currentHand || !session) return;

    // Validate requirements before completing hand
    const validation = validateHandRequirements();
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

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
        handOutcome: outcome,
        opponentCards: Object.keys(opponentCards).length > 0 ? opponentCards : undefined
      }
    };

    SessionService.saveHandToSession(handData);

    // Clear current hand from storage since it's completed
    SessionService.clearCurrentHand(session.sessionId);

    // Update stack
    if (outcome === 'won') {
      setStack(prev => prev + (potWon || 0));
    }
    // Note: Stack is already reduced when betting/posting blinds, so no need to deduct again

    // Reset and prepare for next hand
    const newHandCount = handCount + 1;
    setHandCount(newHandCount);

    // Load completed hands for history
    const hands = SessionService.getSessionHands(session.sessionId);
    setCompletedHands(hands);

    // Always show seat selection for every hand
    setCurrentHand(null);
    setShowSeatSelection(true);
  };

  // Handle confirmed hero fold
  const handleConfirmedHeroFold = () => {
    if (!currentHand || !session || !foldPosition) return;

    // If Hero hasn't invested any money, don't track the hand - just start a new one
    if (heroMoneyInvested === 0) {
      // Clear current hand from storage since it's not being tracked
      SessionService.clearCurrentHand(session.sessionId);

      // Reset and prepare for next hand
      const newHandCount = handCount + 1;
      setHandCount(newHandCount);

      // Always show seat selection for every hand
      setCurrentHand(null);
      setShowSeatSelection(true);

      setShowFoldConfirmation(false);
      setFoldPosition(null);
      return;
    }

    let updatedHand = { ...currentHand };

    const bettingAction: Omit<BettingAction, 'timestamp'> = {
      position: foldPosition,
      action: 'fold'
    };

    updatedHand = processBettingAction(updatedHand, bettingAction);

    // Update nextToAct
    if (updatedHand.currentBettingRound !== 'showdown') {
      const currentRound = updatedHand.bettingRounds[updatedHand.currentBettingRound];
      if (currentRound) {
        const nextPlayer = getNextToAct(
          updatedHand.currentBettingRound,
          session.tableSeats,
          updatedHand.playerStates,
          currentRound
        );
        updatedHand.nextToAct = nextPlayer || undefined;
      }
    }

    setCurrentHand(updatedHand);

    // Check if there are remaining active players who might show cards
    const activePlayers = updatedHand.playerStates.filter(p => p.status === 'active' && p.position !== session.userSeat);

    if (activePlayers.length > 0) {
      // Ask if opponents showed cards before completing the hand
      setShowOpponentCardsDialog(true);
    } else {
      // No active players left, complete hand immediately
      const outcome = heroMoneyInvested > 0 ? 'lost' : 'folded';
      completeHand(outcome, 0);
    }

    setShowFoldConfirmation(false);
    setFoldPosition(null);
  };


  // Auto-fold players between nextToAct and target position (when user skips positions)
  //
  // Scenarios this handles:
  // 1. Simple call: UTG calls when UTG+1 was next -> auto-fold UTG+1 if they haven't matched current bet
  // 2. Raise scenario: UTG raises to 40, UTG+1 calls 40, UTG+2 raises to 80, then Hero calls 80
  //    -> auto-fold anyone between UTG+2 and Hero who hasn't matched the 80 bet
  // 3. Multiple raises: Similar logic applies, always check against current bet amount
  // 4. Protection: Never auto-fold the target position (the player who's actually acting)
  const autoFoldPlayersBetween = (hand: CurrentHand, nextToAct: Position, targetPosition: Position): CurrentHand => {
    const updatedHand = { ...hand };
    const actionSequence = hand.currentBettingRound === 'preflop'
      ? getPreflopActionSequence(session?.tableSeats || 9)
      : getPostflopActionSequence(session?.tableSeats || 9);

    const nextIndex = actionSequence.indexOf(nextToAct);
    const targetIndex = actionSequence.indexOf(targetPosition);

    if (nextIndex === -1 || targetIndex === -1 || nextIndex === targetIndex) {
      return updatedHand;
    }

    // Find positions to fold between nextToAct and target (not including target)
    const positionsToFold: Position[] = [];
    let currentIndex = nextIndex;

    while (currentIndex !== targetIndex) {
      const position = actionSequence[currentIndex] as Position;
      if (position !== targetPosition) {
        positionsToFold.push(position);
      }
      currentIndex = (currentIndex + 1) % actionSequence.length;

      // Safety check to prevent infinite loop
      if (positionsToFold.length >= actionSequence.length) break;
    }

    console.log(`Positions to fold: ${positionsToFold.join(', ')}`);

    // Fold the identified positions
    for (const position of positionsToFold) {
      const playerState = updatedHand.playerStates.find(p => p.position === position);
      const currentRoundData = updatedHand.currentBettingRound !== 'showdown'
        ? updatedHand.bettingRounds[updatedHand.currentBettingRound]
        : null;
      console.log(`Checking ${position}: status=${playerState?.status}, hasActed=${playerState?.hasActed}, currentBet=${playerState?.currentBet}, roundCurrentBet=${currentRoundData?.currentBet}`);

      // Auto-fold players who we're skipping past
      // This includes players who haven't acted yet OR haven't matched the current bet
      const shouldAutoFold = playerState &&
        playerState.status === 'active' &&
        currentRoundData &&
        position !== targetPosition && // Never auto-fold the target position (the player who's acting)
        (
          // Player hasn't matched the current bet (regardless of hasActed flag)
          // This covers both: players who haven't acted, and players who acted but didn't match a subsequent raise
          playerState.currentBet < currentRoundData.currentBet
        );

      if (shouldAutoFold) {
        console.log(`Auto-folding ${position}`);
        playerState.status = 'folded';
        playerState.hasActed = true; // Mark as acted since we're folding them

        // Add fold action to betting round
        if (updatedHand.currentBettingRound !== 'showdown') {
          const currentRound = updatedHand.bettingRounds[updatedHand.currentBettingRound];
          if (currentRound) {
            currentRound.actions.push({
              position,
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
      // Validate Hero cards are selected for showdown
      if (!currentHand.userCards || !currentHand.userCards[0] || !currentHand.userCards[1]) {
        alert('Hero cards must be selected before showdown');
        return;
      }

      // Show outcome selection for showdown
      setShowOutcomeSelection(true);
      return;
    }

    const updatedHand = advanceToNextRound(currentHand);

    // Set nextToAct for the new betting round
    if (updatedHand.currentBettingRound !== 'showdown') {
      const currentRound = updatedHand.bettingRounds[updatedHand.currentBettingRound];
      if (currentRound) {
        const nextPlayer = getNextToAct(
          updatedHand.currentBettingRound,
          session.tableSeats,
          updatedHand.playerStates,
          currentRound
        );
        updatedHand.nextToAct = nextPlayer || undefined;
      }
    }

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

  // Calculate the amount a player needs to add to call (considering blinds already posted)
  const getCallAmount = (position: Position) => {
    if (!currentHand) return 0;
    const playerState = currentHand.playerStates.find(p => p.position === position);
    const currentRound = getCurrentBettingRound();
    if (!playerState || !currentRound) return 0;

    const currentBet = currentRound.currentBet || 0;
    const alreadyBet = playerState.currentBet || 0;
    const callAmount = currentBet - alreadyBet;

    return Math.max(0, callAmount);
  };

  // Check if a player can check (already matches current bet)
  const canCheck = (position: Position) => {
    if (!currentHand) return false;
    const playerState = currentHand.playerStates.find(p => p.position === position);
    const currentRound = getCurrentBettingRound();
    if (!playerState || !currentRound) return false;

    const currentBet = currentRound.currentBet || 0;
    const alreadyBet = playerState.currentBet || 0;
    const bigBlindAmount = currentHand.bigBlind || 0;

    // Special preflop logic
    if (currentHand.currentBettingRound === 'preflop') {
      // Only BB can check in preflop, and only if no one raised above the big blind
      if (position === 'BB') {
        const canBBCheck = currentBet === bigBlindAmount && alreadyBet === bigBlindAmount;
        console.log('BB canCheck debug:', {
          position,
          currentBet,
          alreadyBet,
          bigBlindAmount,
          canBBCheck
        });
        return canBBCheck;
      } else {
        // No one else can check in preflop (must call, raise, or fold)
        return false;
      }
    }

    // Post-flop: Can check if already matching the current bet
    return alreadyBet >= currentBet;
  };

  const currentBettingRound = getCurrentBettingRound();
  const isBettingComplete = currentBettingRound ? (currentBettingRound.isComplete || isBettingRoundComplete(currentHand?.playerStates || [], currentBettingRound)) : false;

  // Debug logging
  if (currentBettingRound) {
    console.log('Betting round status:', {
      round: currentHand?.currentBettingRound,
      isComplete: currentBettingRound.isComplete,
      standardComplete: isBettingRoundComplete(currentHand?.playerStates || [], currentBettingRound),
      finalIsBettingComplete: isBettingComplete
    });
  }

  // Show flop selection prompt when preflop betting is complete and no flop cards are selected
  const showFlopSelectionPrompt = isBettingComplete &&
    currentHand?.currentBettingRound === 'preflop' &&
    (!currentHand?.communityCards.flop || currentHand.communityCards.flop.every(card => !card));

  // Show turn selection prompt when flop betting is complete and no turn card is selected
  const showTurnSelectionPrompt = isBettingComplete &&
    currentHand?.currentBettingRound === 'flop' &&
    !currentHand?.communityCards.turn;

  // Show river selection prompt when turn betting is complete and no river card is selected
  const showRiverSelectionPrompt = isBettingComplete &&
    currentHand?.currentBettingRound === 'turn' &&
    !currentHand?.communityCards.river;

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
              console.log('Seat selected:', position);
              if (position !== 'DEALER') {
                console.log('Starting new hand with position:', position);
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
                  onFocus={(e) => e.target.select()}
                  className="w-full px-2 py-1 text-base border rounded text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 text-center">SB</label>
                <input
                  type="number"
                  value={smallBlind}
                  onChange={(e) => setSmallBlind(parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-2 py-1 text-base border rounded text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 text-center">BB</label>
                <input
                  type="number"
                  value={bigBlind}
                  onChange={(e) => setBigBlind(parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-2 py-1 text-base border rounded text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 text-center">Ante</label>
                <input
                  type="number"
                  value={ante}
                  onChange={(e) => setAnte(parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-2 py-1 text-base border rounded text-center"
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
            showTurnSelectionPrompt={showTurnSelectionPrompt}
            showRiverSelectionPrompt={showRiverSelectionPrompt}
            potSize={currentHand?.pot || 0}
          />
        </div>

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
              {(() => {
                const callAmount = getCallAmount(selectedPosition);
                return callAmount > 0 ? (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      handleBettingAction(selectedPosition, 'call', currentBettingRound?.currentBet);
                      setShowPositionActions(false);
                      setSelectedPosition(null);
                    }}
                  >
                    Call {callAmount}
                  </Button>
                ) : null;
              })()}
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
              {canCheck(selectedPosition) && (
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
              (() => {
                const needsCommunityCards =
                  (currentHand.currentBettingRound === 'preflop' && (!currentHand.communityCards.flop || currentHand.communityCards.flop.every(card => !card))) ||
                  (currentHand.currentBettingRound === 'flop' && !currentHand.communityCards.turn) ||
                  (currentHand.currentBettingRound === 'turn' && !currentHand.communityCards.river);


                return (
                  <div className="text-center">
                    <h3 className="text-md font-semibold mb-3">
                      {needsCommunityCards
                        ? `Select community cards to continue`
                        : 'Betting Round Complete'
                      }
                    </h3>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                      onClick={handleAdvanceToNextRound}
                      disabled={needsCommunityCards}
                    >
                      Proceed
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
                    <h3 className="text-md font-semibold mb-3 text-center">
                      {showPositionActions && selectedPosition
                        ? `${selectedPosition} Actions`
                        : `Hero Actions (${session.userSeat})`}
                    </h3>
                <div className="grid grid-cols-2 gap-3">
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
                    return callAmount > 0 ? (
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
                        Call {callAmount}
                      </Button>
                    ) : null;
                  })()}
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
                  {(() => {
                    const targetPosition = showPositionActions && selectedPosition ? selectedPosition : session.userSeat;
                    return targetPosition && canCheck(targetPosition);
                  })() && (
                    <Button
                      className="bg-orange-600 hover:bg-orange-700 text-white col-span-2"
                      onClick={() => {
                        const targetPosition = showPositionActions && selectedPosition ? selectedPosition : session.userSeat;
                        if (targetPosition) handleBettingAction(targetPosition, 'check');
                        setShowPositionActions(false);
                        setSelectedPosition(null);
                      }}
                    >
                      Check
                    </Button>
                  )}
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
                      // Allow any value for raise input, validation will happen on submit
                      setAmountModalValue(value);
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2 text-base border rounded-md"
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
                      const minRaise = (currentBettingRound?.currentBet || 0) * 2;
                      const amount = Math.floor(amountModalValue);

                      // Validate minimum raise amount
                      if (amountModalAction === 'raise' && amount < minRaise) {
                        alert(`Minimum raise is ${minRaise}`);
                        return;
                      }

                      handleBettingAction(
                        amountModalPosition,
                        amountModalAction,
                        amount
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
                Did you win or lose at showdown? (You can add opponent cards after)
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 mt-4">
              <div className="text-center text-sm text-gray-600 mb-2">
                Pot Size: {currentHand?.pot || 0}
              </div>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  setShowOutcomeSelection(false);
                  // Show opponent cards dialog for showdown
                  const activePlayers = currentHand?.playerStates.filter(p => p.status === 'active' && p.position !== session?.userSeat);
                  if (activePlayers && activePlayers.length > 0) {
                    setShowOpponentCardsDialog(true);
                    // Pre-set the outcome so we can complete later
                    setAmountModalValue(currentHand?.pot || 0);
                    setAmountModalAction('raise'); // Using as a flag for 'won'
                  } else {
                    completeHand('won', currentHand?.pot || 0);
                  }
                }}
              >
                I Won
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  setShowOutcomeSelection(false);
                  // Show opponent cards dialog for showdown
                  const activePlayers = currentHand?.playerStates.filter(p => p.status === 'active' && p.position !== session?.userSeat);
                  if (activePlayers && activePlayers.length > 0) {
                    setShowOpponentCardsDialog(true);
                    // Pre-set the outcome so we can complete later
                    setAmountModalValue(0);
                    setAmountModalAction('all-in'); // Using as a flag for 'lost'
                  } else {
                    completeHand('lost', 0);
                  }
                }}
              >
                I Lost
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Opponent Cards Dialog */}
        <Dialog open={showOpponentCardsDialog} onOpenChange={setShowOpponentCardsDialog}>
          <DialogContent className="sm:max-w-[500px] max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Opponent Cards</DialogTitle>
              <DialogDescription>
                Did any opponents show their cards? (Optional - you can skip this)
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 mt-4 max-h-60 overflow-y-auto">
              {currentHand?.playerStates
                .filter(p => p.status === 'active' && p.position !== session?.userSeat)
                .map(player => (
                  <div key={player.position} className="border rounded p-3">
                    <div className="font-medium mb-2">{player.position}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPosition(player.position);
                          setSelectingCard(1);
                          setShowCardSelector(true);
                        }}
                        className="text-xs"
                      >
                        {opponentCards[player.position]?.[0] || 'Card 1'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPosition(player.position);
                          setSelectingCard(2);
                          setShowCardSelector(true);
                        }}
                        className="text-xs"
                      >
                        {opponentCards[player.position]?.[1] || 'Card 2'}
                      </Button>
                    </div>
                  </div>
                ))
              }
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  // Complete hand without opponent cards
                  if (amountModalAction === 'raise') {
                    completeHand('won', amountModalValue);
                  } else {
                    completeHand('lost', 0);
                  }
                  setShowOpponentCardsDialog(false);
                  setOpponentCards({});
                }}
              >
                Skip
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  // Complete hand with opponent cards
                  if (amountModalAction === 'raise') {
                    completeHand('won', amountModalValue);
                  } else {
                    completeHand('lost', 0);
                  }
                  setShowOpponentCardsDialog(false);
                  setOpponentCards({});
                }}
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hand History */}
        {!showSeatSelection && (
          <HandHistory
            currentHand={currentHand}
            completedHands={completedHands}
            userSeat={session.userSeat}
            className="mt-4"
          />
        )}
      </div>

    </div>
  );
}