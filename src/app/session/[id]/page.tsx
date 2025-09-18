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
  // Hero money tracking
  const [heroMoneyInvested, setHeroMoneyInvested] = useState<number>(0);
  // Showdown outcome
  const [showOutcomeSelection, setShowOutcomeSelection] = useState(false);
  // Opponent cards logging
  const [opponentCards, setOpponentCards] = useState<{[position: string]: [string, string] | null}>({});
  // Inline card selection state
  const [inlineCardSelection, setInlineCardSelection] = useState<{
    show: boolean;
    position: Position | null;
    cardIndex: 1 | 2;
    title: string;
  }>({
    show: false,
    position: null,
    cardIndex: 1,
    title: ''
  });
  // Seat selection for new hands
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [handCount, setHandCount] = useState(0);
  const [completedHands, setCompletedHands] = useState<StoredHand[]>([]);

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

  // Save stack changes to session metadata
  useEffect(() => {
    if (session) {
      const updatedSession = { ...session, currentStack: stack };
      SessionService.updateSessionMetadata(updatedSession);
    }
  }, [stack, session]);

  // Function to start new hand with explicit session data
  const startNewHandWithPosition = useCallback((sessionData: SessionMetadata, userSeat: Position) => {

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
    if (!session || !session.userSeat) {
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
      const currentRound = updatedHand.bettingRounds.preflop;
      if (currentRound) {
        currentRound.isComplete = true;
        updatedHand.canAdvanceToFlop = true;
        // Clear nextToAct since round is complete
        updatedHand.nextToAct = undefined;

        // Auto-fold any remaining active players who haven't acted (like SB)
        updatedHand.playerStates.forEach(playerState => {
          if (playerState.status === 'active' && !playerState.hasActed && playerState.position !== 'BB') {
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
        const fullActionSequence = updatedHand.currentBettingRound === 'preflop'
          ? getPreflopActionSequence(session.tableSeats)
          : getPostflopActionSequence(session.tableSeats);

        const activePlayers = updatedHand.playerStates.filter(p => p.status === 'active');
        const activePositions = activePlayers.map(p => p.position);
        const actionSequence = fullActionSequence.filter(pos => activePositions.includes(pos));
        const currentBet = currentRound.currentBet;

        // Find the next active player who needs to act
        let nextPlayer: Position | null = null;

        // For new betting rounds (flop/turn/river), start from beginning of sequence
        // For continued rounds (raises), start from position after current actor
        const isNewRound = currentBet === 0 && activePlayers.every(p => !p.hasActed || p.currentBet === 0);

        let searchSequence: Position[];
        if (isNewRound) {
          // New betting round: start from the beginning of active action sequence
          searchSequence = actionSequence;
        } else {
          // Continued round: start from position after current actor
          const currentActorIndex = actionSequence.indexOf(position);
          searchSequence = [
            ...actionSequence.slice(currentActorIndex + 1),
            ...actionSequence.slice(0, currentActorIndex + 1)
          ];
        }

        for (const pos of searchSequence) {
          const player = activePlayers.find(p => p.position === pos);
          if (player && (!player.hasActed || player.currentBet < currentBet)) {
            nextPlayer = pos;
            break;
          }
        }

        updatedHand.nextToAct = nextPlayer || undefined;

        // Check if round is complete: all active players have acted AND matched current bet (or are all-in)
        const allActivePlayersHaveActedAndMatched = activePlayers.every(player => {
          // Player must have acted in this round
          const hasActedThisRound = player.hasActed;
          // Player must match current bet or be all-in
          const matchesBetOrAllIn = player.currentBet === currentBet || player.status === 'all-in';

          return hasActedThisRound && matchesBetOrAllIn;
        });


        if (allActivePlayersHaveActedAndMatched || activePlayers.length <= 1) {
          currentRound.isComplete = true;
          updatedHand.nextToAct = undefined;
        }
      }
    }

    // Check if hand ends (all others folded) BEFORE setting state
    // Include both 'active' and 'all-in' players as they can still win the hand
    const activePlayers = updatedHand.playerStates.filter(p => p.status === 'active' || p.status === 'all-in');
    if (activePlayers.length === 1) {
      if (activePlayers[0].position === session.userSeat) {
        // Hero wins - complete hand immediately
        completeHand('won', updatedHand.pot || 0);
        return; // Exit early, don't set currentHand
      } else {
        // Hero lost (already folded)
        completeHand('lost', 0);
        return; // Exit early, don't set currentHand
      }
    }

    setCurrentHand(updatedHand);
  };

  // Add state for validation error dialog
  const [showValidationError, setShowValidationError] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');

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
        return { isValid: false, error: 'Please select your hole cards before completing the hand since you invested money.' };
      }
    }

    return { isValid: true };
  };

  // Complete the current hand
  // Calculate total investment for a specific player across all betting rounds
  const calculatePlayerTotalInvestment = (position: Position): number => {
    if (!currentHand) return 0;

    let totalInvestment = 0;
    const bettingRounds = ['preflop', 'flop', 'turn', 'river'] as const;

    for (const roundName of bettingRounds) {
      const round = currentHand.bettingRounds[roundName];
      if (round && round.actions) {
        // Sum all betting actions for this player in this round
        for (const action of round.actions) {
          if (action.position === position && action.amount) {
            totalInvestment += action.amount;
          }
        }
      }
    }

    return totalInvestment;
  };

  // Calculate effective pot winnings based on side pot logic
  const calculateEffectivePotWinnings = (outcome: 'won' | 'lost' | 'folded', potWon?: number) => {
    if (outcome !== 'won' || !currentHand || !potWon) {
      return 0;
    }

    // Calculate hero's maximum possible winnings based on their investment
    // In poker, you can only win what you put in from each opponent, plus your own investment back
    const heroInvestment = heroMoneyInvested;

    // Get all active player states to calculate their investments
    const activePlayers = currentHand.playerStates.filter(p => p.status === 'active');

    // Calculate total investment from all opponents
    let totalOpponentInvestment = 0;
    for (const player of activePlayers) {
      if (player.position !== session?.userSeat) {
        // Calculate opponent's total investment across all rounds
        const opponentInvestment = calculatePlayerTotalInvestment(player.position);
        // Each opponent contributed at most min(heroInvestment, theirInvestment) to hero's potential winnings
        const effectiveContribution = Math.min(heroInvestment, opponentInvestment);
        totalOpponentInvestment += effectiveContribution;
      }
    }

    // Hero's maximum winnings = their own investment back + what they can win from opponents
    const maxPossibleWinnings = heroInvestment + totalOpponentInvestment;

    // Actual winnings is the minimum of stated pot winnings and calculated maximum
    const effectiveWinnings = Math.min(potWon, maxPossibleWinnings);

    if (effectiveWinnings !== potWon) {
      console.log(`Side pot applied: Limited winnings from $${potWon} to $${effectiveWinnings} (hero invested $${heroInvestment})`);
    }

    return effectiveWinnings;
  };

  const completeHand = (outcome: 'won' | 'lost' | 'folded', potWon?: number) => {
    if (!currentHand || !session) return;

    // Validate requirements before completing hand
    const validation = validateHandRequirements();
    if (!validation.isValid) {
      setValidationErrorMessage(validation.error || 'Validation error');
      setShowValidationError(true);
      return;
    }

    // Calculate effective winnings based on side pot logic
    const effectivePotWon = calculateEffectivePotWinnings(outcome, potWon);

    // Save hand to storage
    const handData: StoredHand = {
      handNumber: currentHand.handNumber,
      timestamp: new Date().toISOString(),
      userCards: currentHand.userCards,
      communityCards: currentHand.communityCards,
      bettingRounds: currentHand.bettingRounds,
      result: {
        winner: outcome === 'won' ? session.userSeat : undefined,
        potWon: outcome === 'won' ? effectivePotWon : undefined,
        stackAfter: stack + (outcome === 'won' ? effectivePotWon : 0) - heroMoneyInvested,
        handOutcome: outcome,
        opponentCards: Object.keys(opponentCards).length > 0 ? opponentCards : undefined
      }
    };

    SessionService.saveHandToSession(handData);

    // Clear current hand from storage since it's completed
    SessionService.clearCurrentHand(session.sessionId);

    // Update stack to the calculated stackAfter value
    const newStackAmount = stack + (outcome === 'won' ? effectivePotWon : 0) - heroMoneyInvested;
    setStack(newStackAmount);

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

      // Reset states properly
      setCurrentHand(null);
      setHeroMoneyInvested(0);
      setSelectedPosition(null);
      setShowPositionActions(false);
      setShowFoldConfirmation(false);
      setFoldPosition(null);

      // Always show seat selection for next hand
      setShowSeatSelection(true);
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

    // Hero folded - complete hand immediately with loss
    const outcome = heroMoneyInvested > 0 ? 'lost' : 'folded';
    completeHand(outcome, 0);

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
    const fullActionSequence = hand.currentBettingRound === 'preflop'
      ? getPreflopActionSequence(session?.tableSeats || 9)
      : getPostflopActionSequence(session?.tableSeats || 9);

    // Filter to only include active players
    const activePlayers = updatedHand.playerStates.filter(p => p.status === 'active');
    const activePositions = activePlayers.map(p => p.position);
    const actionSequence = fullActionSequence.filter(pos => activePositions.includes(pos));

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


    // Fold the identified positions
    for (const position of positionsToFold) {
      const playerState = updatedHand.playerStates.find(p => p.position === position);
      const currentRoundData = updatedHand.currentBettingRound !== 'showdown'
        ? updatedHand.bettingRounds[updatedHand.currentBettingRound]
        : null;

      // Auto-fold/check players who we're skipping past
      const currentBet = currentRoundData?.currentBet || 0;
      const isPostFlop = updatedHand.currentBettingRound !== 'preflop';

      // In post-flop with no betting (currentBet = 0), auto-check instead of auto-fold
      const shouldAutoCheck = playerState &&
        playerState.status === 'active' &&
        currentRoundData &&
        position !== targetPosition &&
        isPostFlop &&
        currentBet === 0 &&
        !playerState.hasActed;

      // Auto-fold players who haven't matched a bet > 0
      const shouldAutoFold = playerState &&
        playerState.status === 'active' &&
        currentRoundData &&
        position !== targetPosition &&
        (
          // Player hasn't matched the current bet when there is a bet to match
          (currentBet > 0 && playerState.currentBet < currentBet)
        );

      if (shouldAutoFold) {
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
      } else if (shouldAutoCheck) {
        playerState.hasActed = true; // Mark as acted since we're checking for them

        // Add check action to betting round
        if (updatedHand.currentBettingRound !== 'showdown') {
          const currentRound = updatedHand.bettingRounds[updatedHand.currentBettingRound];
          if (currentRound) {
            currentRound.actions.push({
              position,
              action: 'check',
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

    // Check if we're going to showdown (river betting complete)
    if (currentHand.currentBettingRound === 'river') {
      // Count active players (including hero if still active or all-in)
      const activePlayers = currentHand.playerStates.filter(p => p.status === 'active' || p.status === 'all-in');
      const heroStillActive = activePlayers.some(p => p.position === session.userSeat);

      // True showdown: 2+ players reach the end
      if (activePlayers.length >= 2) {
        // Show outcome selection for true showdown (dialog will handle hero card validation)
        setShowOutcomeSelection(true);
        return;
      } else {
        // Not a showdown - only 1 player left, hand ends automatically
        // If hero is the last player, they win. Otherwise they folded and lost.
        if (heroStillActive) {
          // Hero wins by everyone else folding
          completeHand('won', currentHand.pot || 0);
        } else {
          // Hero folded earlier and someone else won
          completeHand('lost', 0);
        }
        return;
      }
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
    const requiredCallAmount = currentBet - alreadyBet;

    // For hero position, limit call amount by remaining stack
    if (position === session?.userSeat) {
      const remainingStack = stack - heroMoneyInvested;
      const maxCallAmount = Math.min(requiredCallAmount, remainingStack);
      return Math.max(0, maxCallAmount);
    }

    return Math.max(0, requiredCallAmount);
  };

  // Check if a call would be an all-in for the hero
  const isCallAllIn = (position: Position) => {
    if (position !== session?.userSeat || !currentHand) return false;
    const currentRound = getCurrentBettingRound();
    if (!currentRound) return false;

    const currentBet = currentRound.currentBet || 0;
    const playerState = currentHand.playerStates.find(p => p.position === position);
    const alreadyBet = playerState?.currentBet || 0;
    const requiredCallAmount = currentBet - alreadyBet;
    const remainingStack = stack - heroMoneyInvested;

    return requiredCallAmount > 0 && remainingStack <= requiredCallAmount;
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


  // Check if hand is already over (only 1 or 0 active+all-in players remain)
  const activePlayers = currentHand?.playerStates.filter(p => p.status === 'active' || p.status === 'all-in') || [];
  const handIsOver = activePlayers.length <= 1;

  // Show flop selection prompt when preflop betting is complete, hand is not over, and not all flop cards are selected
  const showFlopSelectionPrompt = isBettingComplete &&
    !handIsOver &&
    currentHand?.currentBettingRound === 'preflop' &&
    (!currentHand?.communityCards.flop || currentHand.communityCards.flop.length < 3 || currentHand.communityCards.flop.some(card => !card));

  // Show turn selection prompt when flop betting is complete, hand is not over, and no turn card is selected
  const showTurnSelectionPrompt = isBettingComplete &&
    !handIsOver &&
    currentHand?.currentBettingRound === 'flop' &&
    !currentHand?.communityCards.turn;

  // Show river selection prompt when turn betting is complete, hand is not over, and no river card is selected
  const showRiverSelectionPrompt = isBettingComplete &&
    !handIsOver &&
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
              if (position !== 'DEALER') {
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
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setStack(0);
                    } else {
                      const numValue = parseInt(value, 10);
                      if (!isNaN(numValue) && numValue >= 0) {
                        setStack(numValue);
                      }
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-2 py-1 text-base border rounded text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 text-center">SB</label>
                <input
                  type="number"
                  value={smallBlind}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setSmallBlind(0);
                    } else {
                      const numValue = parseInt(value, 10);
                      if (!isNaN(numValue) && numValue >= 0) {
                        setSmallBlind(numValue);
                      }
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-2 py-1 text-base border rounded text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 text-center">BB</label>
                <input
                  type="number"
                  value={bigBlind}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setBigBlind(0);
                    } else {
                      const numValue = parseInt(value, 10);
                      if (!isNaN(numValue) && numValue >= 0) {
                        setBigBlind(numValue);
                      }
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-2 py-1 text-base border rounded text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 text-center">Ante</label>
                <input
                  type="number"
                  value={ante}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setAnte(0);
                    } else {
                      const numValue = parseInt(value, 10);
                      if (!isNaN(numValue) && numValue >= 0) {
                        setAnte(numValue);
                      }
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-2 py-1 text-base border rounded text-center"
                />
              </div>
            </div>
          </div>
        )}

        {/* Table Display */}
        {!showSeatSelection && (
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
            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-red-600 hover:bg-red-700 text-white flex-1 min-w-[80px]"
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
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1 min-w-[80px]"
                    onClick={() => {
                      handleBettingAction(selectedPosition, 'call', currentBettingRound?.currentBet);
                      setShowPositionActions(false);
                      setSelectedPosition(null);
                    }}
                  >
                    {selectedPosition && isCallAllIn(selectedPosition) ? `Call All-In ${callAmount}` : `Call ${callAmount}`}
                  </Button>
                ) : null;
              })()}
              <Button
                className="bg-green-600 hover:bg-green-700 text-white flex-1 min-w-[80px]"
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
                  className="bg-orange-600 hover:bg-orange-700 text-white flex-1 min-w-[80px]"
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
                className="bg-purple-600 hover:bg-purple-700 text-white flex-1 min-w-[80px]"
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
        {currentHand && !showCommunitySelector && !showPositionActions &&
         !(showCardSelector && selectedPosition && selectedPosition !== session?.userSeat) && (
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
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white flex-1 min-w-[80px]"
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
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-1 min-w-[80px]"
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
                    ) : null;
                  })()}
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white flex-1 min-w-[80px]"
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
                    className="bg-purple-600 hover:bg-purple-700 text-white flex-1 min-w-[80px]"
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
                      className="bg-orange-600 hover:bg-orange-700 text-white flex-1 min-w-[80px]"
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
          <DialogContent className={getDialogClasses("sm:max-w-[425px] max-w-[95vw] w-full mx-4")}>
            <DialogHeader>
              <DialogTitle className="text-lg">
                {amountModalAction === 'raise' ? 'Raise Amount' : 'All-In Amount'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                Enter the total amount to {amountModalAction === 'raise' ? 'raise to' : 'go all-in with'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <input
                  type="number"
                  value={amountModalValue}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setAmountModalError(null); // Clear error on input change
                    if (inputValue === '') {
                      setAmountModalValue(0);
                    } else {
                      const numValue = parseInt(inputValue, 10);
                      if (!isNaN(numValue) && numValue >= 0) {
                        if (amountModalAction === 'all-in') {
                          setAmountModalValue(Math.min(numValue, stack));
                        } else {
                          // Allow any value for raise input, validation will happen on submit
                          setAmountModalValue(numValue);
                        }
                      }
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-3 text-base border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                {amountModalError && (
                  <div className="text-xs text-red-600 mt-1">
                    {amountModalError}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 h-11"
                  variant="outline"
                  onClick={() => {
                    setShowAmountModal(false);
                    setAmountModalPosition(null);
                    setAmountModalError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    if (amountModalPosition) {
                      const minRaise = (currentBettingRound?.currentBet || 0) * 2;
                      const amount = Math.floor(amountModalValue);

                      // Validate minimum raise amount
                      if (amountModalAction === 'raise' && amount < minRaise) {
                        setAmountModalError(`Minimum raise is $${minRaise}`);
                        return;
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
                >
                  Confirm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Unified Fold Confirmation and Card Selection Dialog */}
        <Dialog open={showFoldConfirmation} onOpenChange={setShowFoldConfirmation}>
          <DialogContent className={getDialogClasses("sm:max-w-[500px] max-w-[95vw] w-full")}>
            <DialogHeader>
              <DialogTitle>Confirm Fold</DialogTitle>
              <DialogDescription>
                {heroMoneyInvested > 0
                  ? `You have invested ${heroMoneyInvested} chips. Folding will result in a loss. The hand will end.`
                  : 'Folding will end the hand. Are you sure?'
                }
              </DialogDescription>
            </DialogHeader>

            {/* Card Selection Section - Only show if user invested money */}
            {heroMoneyInvested > 0 && (
              <div className="mt-4 border-t pt-4">
                <div className="grid gap-4 max-h-60 overflow-y-auto">
                  {/* Hero Cards Section - Only show if not already selected */}
                  {(!currentHand?.userCards || !currentHand.userCards[0] || !currentHand.userCards[1]) && (
                    <div className="border-2 border-blue-200 rounded-lg p-3 bg-blue-50">
                      <div className="font-medium mb-2 text-sm text-blue-800">Your Hole Cards (Required)</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setInlineCardSelection({
                              show: true,
                              position: session?.userSeat || null,
                              cardIndex: 1,
                              title: 'Select Card 1'
                            });
                          }}
                          className="text-xs border-blue-300 hover:bg-blue-100"
                        >
                          {currentHand?.userCards?.[0] || 'Card 1'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setInlineCardSelection({
                              show: true,
                              position: session?.userSeat || null,
                              cardIndex: 2,
                              title: 'Select Card 2'
                            });
                          }}
                          className="text-xs border-blue-300 hover:bg-blue-100"
                        >
                          {currentHand?.userCards?.[1] || 'Card 2'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Optional Cards Section Header */}
                  {currentHand?.userCards?.[0] && currentHand?.userCards?.[1] && (
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Optional: Add any cards revealed
                    </div>
                  )}

                  {/* Opponent Cards Section */}
                  {currentHand?.playerStates &&
                    currentHand.playerStates.filter(p => p.status === 'active' && p.position !== session?.userSeat)
                    .length > 0 && (
                    <div className="border rounded-lg p-3">
                      <div className="font-medium mb-2 text-sm text-gray-700">Opponent Cards</div>
                      <div className="grid gap-2">
                        {currentHand?.playerStates &&
                          currentHand.playerStates.filter(p => p.status === 'active' && p.position !== session?.userSeat)
                          .map(player => (
                            <div key={player.position} className="border rounded p-2 bg-gray-50">
                              <div className="font-medium mb-1 text-xs">{player.position}</div>
                              <div className="grid grid-cols-2 gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setInlineCardSelection({
                                      show: true,
                                      position: player.position,
                                      cardIndex: 1,
                                      title: `Select ${player.position} Card 1`
                                    });
                                  }}
                                  className="text-xs h-8"
                                >
                                  {opponentCards[player.position]?.[0] || 'Card 1'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setInlineCardSelection({
                                      show: true,
                                      position: player.position,
                                      cardIndex: 2,
                                      title: `Select ${player.position} Card 2`
                                    });
                                  }}
                                  className="text-xs h-8"
                                >
                                  {opponentCards[player.position]?.[1] || 'Card 2'}
                                </Button>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inline Card Selector */}
            {inlineCardSelection.show && (
              <div className="mt-4 border-t pt-4">
                <CardSelector
                  title={inlineCardSelection.title}
                  selectedCards={[
                    selectedCard1,
                    selectedCard2,
                    ...(currentHand?.communityCards.flop || []),
                    currentHand?.communityCards.turn,
                    currentHand?.communityCards.river,
                    ...Object.values(opponentCards).flat()
                  ].filter(Boolean) as string[]}
                  onCardSelect={handleInlineCardSelect}
                  onCancel={() => setInlineCardSelection({ show: false, position: null, cardIndex: 1, title: '' })}
                />
              </div>
            )}

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
                disabled={heroMoneyInvested > 0 && (!currentHand?.userCards || !currentHand.userCards[0] || !currentHand.userCards[1])}
              >
                Confirm Fold
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Unified Showdown Dialog */}
        <Dialog open={showOutcomeSelection} onOpenChange={setShowOutcomeSelection}>
          <DialogContent className={getDialogClasses("sm:max-w-[500px] max-w-[95vw] w-full")}>
            <DialogHeader>
              <DialogTitle>Showdown</DialogTitle>
              <DialogDescription>
                Add any cards that were revealed at showdown, then select the outcome
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 mt-4 max-h-80 overflow-y-auto">
              <div className="text-center text-sm font-medium text-gray-700 mb-2">
                Pot Size: {currentHand?.pot || 0}
              </div>

              {/* Hero Cards Section - Only show if not already selected */}
              {(!currentHand?.userCards || !currentHand.userCards[0] || !currentHand.userCards[1]) && (
                <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="font-medium mb-3 text-blue-800">
                    Your Hole Cards (Required for showdown)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInlineCardSelection({
                          show: true,
                          position: session?.userSeat || null,
                          cardIndex: 1,
                          title: 'Select Your Card 1'
                        });
                      }}
                      className="text-xs border-blue-300 hover:bg-blue-100"
                    >
                      {currentHand?.userCards?.[0] || 'Card 1'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInlineCardSelection({
                          show: true,
                          position: session?.userSeat || null,
                          cardIndex: 2,
                          title: 'Select Your Card 2'
                        });
                      }}
                      className="text-xs border-blue-300 hover:bg-blue-100"
                    >
                      {currentHand?.userCards?.[1] || 'Card 2'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Opponent Cards Section - Show all active opponents */}
              {currentHand?.playerStates &&
                currentHand.playerStates.filter(p => p.status === 'active' && p.position !== session?.userSeat)
                .length > 0 && (
                <div className="border rounded-lg p-4">
                  <div className="font-medium mb-3 text-gray-700">
                    Opponent Cards (Optional - add any cards that were shown)
                  </div>
                  <div className="grid gap-3">
                    {currentHand?.playerStates &&
                      currentHand.playerStates.filter(p => p.status === 'active' && p.position !== session?.userSeat)
                      .map(player => (
                        <div key={player.position} className="border rounded p-3 bg-gray-50">
                          <div className="font-medium mb-2 text-sm">{player.position}</div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setInlineCardSelection({
                                  show: true,
                                  position: player.position,
                                  cardIndex: 1,
                                  title: `Select ${player.position} Card 1`
                                });
                              }}
                              className="text-xs"
                            >
                              {opponentCards[player.position]?.[0] || 'Card 1'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setInlineCardSelection({
                                  show: true,
                                  position: player.position,
                                  cardIndex: 2,
                                  title: `Select ${player.position} Card 2`
                                });
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
                </div>
              )}
            </div>

            {/* Inline Card Selector for Showdown Dialog */}
            {inlineCardSelection.show && (
              <div className="mt-4 border-t pt-4">
                <CardSelector
                  title={inlineCardSelection.title}
                  selectedCards={[
                    selectedCard1,
                    selectedCard2,
                    ...(currentHand?.communityCards.flop || []),
                    currentHand?.communityCards.turn,
                    currentHand?.communityCards.river,
                    ...Object.values(opponentCards).flat()
                  ].filter(Boolean) as string[]}
                  onCardSelect={handleInlineCardSelect}
                  onCancel={() => setInlineCardSelection({ show: false, position: null, cardIndex: 1, title: '' })}
                />
              </div>
            )}

            {/* Outcome Selection */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  setShowOutcomeSelection(false);
                  completeHand('won', currentHand?.pot || 0);
                }}
                disabled={!currentHand?.userCards || !currentHand.userCards[0] || !currentHand.userCards[1]}
              >
                I Won
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  setShowOutcomeSelection(false);
                  completeHand('lost', 0);
                }}
                disabled={!currentHand?.userCards || !currentHand.userCards[0] || !currentHand.userCards[1]}
              >
                I Lost
              </Button>
            </div>
          </DialogContent>
        </Dialog>


        {/* Validation Error Dialog */}
        <Dialog open={showValidationError} onOpenChange={setShowValidationError}>
          <DialogContent className={getDialogClasses("sm:max-w-[425px] max-w-[350px]")}>
            <DialogHeader>
              <DialogTitle>Action Required</DialogTitle>
              <DialogDescription>
                {validationErrorMessage}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => setShowValidationError(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                OK
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