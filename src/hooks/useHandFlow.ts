'use client';

import { useCallback } from 'react';
import { SessionService } from '@/services/session.service';
import { SessionMetadata, CurrentHand, Position, StoredHand } from '@/types/poker-v2';
import { initializePlayerStates } from '@/utils/poker-logic';

interface UseHandFlowProps {
  session: SessionMetadata | null;
  currentHand: CurrentHand | null;
  setCurrentHand: (hand: CurrentHand | null) => void;
  stack: number;
  setStack: (stack: number | ((prev: number) => number)) => void;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  heroMoneyInvested: number;
  setHeroMoneyInvested: (amount: number) => void;
  setSelectedCard1: (card: string | null) => void;
  setSelectedCard2: (card: string | null) => void;
  setOpponentCards: (cards: Record<Position, [string, string] | null>) => void;
  setHandCount: (count: number | ((prev: number) => number)) => void;
  handCount: number;
  setCompletedHands: (hands: StoredHand[]) => void;
  setSession: (session: SessionMetadata) => void;
  setShowSeatSelection: (show: boolean) => void;
  // Dialog state setters
  setShowAllFoldedDialog: (show: boolean) => void;
  setShowOutcomeSelection: (show: boolean) => void;
  setShowFoldConfirmation: (show: boolean) => void;
  setShowValidationError: (show: boolean) => void;
  setShowCommunitySelector: (show: boolean) => void;
  setSelectingCommunityCard: (card: { type: 'flop'; index: number } | null) => void;
  setAutoSelectingCommunityCards: (auto: boolean) => void;
  // For validation error handling
  setValidationErrorMessage: (message: string) => void;
  setPendingHandCompletion: (completion: { outcome: 'won' | 'lost' | 'folded', potWon?: number } | null) => void;
  opponentCards: Record<Position, [string, string] | null>;
}

interface HandValidationResult {
  isValid: boolean;
  error?: string;
}

export function useHandFlow({
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
}: UseHandFlowProps) {

  // Validate required values before hand completion
  const validateHandRequirements = useCallback((): HandValidationResult => {
    if (stack < 0) {
      return { isValid: false, error: 'Stack cannot be negative' };
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
  }, [stack, smallBlind, bigBlind, heroMoneyInvested, currentHand]);

  // Calculate effective pot winnings based on side pots
  const calculateEffectivePotWinnings = useCallback((outcome: 'won' | 'lost' | 'folded', potWon?: number) => {
    if (outcome !== 'won' || !currentHand || !session) {
      return 0;
    }

    // If there are no side pots or everyone folded, hero wins the entire pot
    if (!currentHand.sidePots || currentHand.sidePots.length === 0) {
      return potWon || currentHand.pot;
    }

    // Calculate how much hero can actually win based on side pots
    let heroWinnings = 0;
    const heroPosition = session.userSeat;

    // Check each side pot to see if hero is eligible
    for (const sidePot of currentHand.sidePots) {
      if (sidePot.eligiblePlayers.includes(heroPosition!)) {
        // Hero is eligible for this pot
        heroWinnings += sidePot.amount;
      }
    }

    // For hero's tracking purposes, return the minimum of:
    // 1. What hero is eligible to win based on their investment
    // 2. The actual pot amount (in case everyone else folded)
    return Math.min(heroWinnings, potWon || currentHand.pot);
  }, [currentHand, session]);

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

    // Reset community selector states to prevent auto-trigger
    setShowCommunitySelector(false);
    setSelectingCommunityCard(null);
    setAutoSelectingCommunityCards(false);

    // Deduct blinds from hero's stack if on blind position
    if (userSeat === 'SB') {
      setStack(prev => prev - smallBlind);
    } else if (userSeat === 'BB') {
      setStack(prev => prev - bigBlind);
    }
  }, [
    smallBlind,
    bigBlind,
    ante,
    setCurrentHand,
    setSelectedCard1,
    setSelectedCard2,
    setHeroMoneyInvested,
    setShowCommunitySelector,
    setSelectingCommunityCard,
    setAutoSelectingCommunityCards,
    setStack
  ]);

  const startNewHand = useCallback(() => {
    if (!session || !session.userSeat) {
      return;
    }

    startNewHandWithPosition(session, session.userSeat);
  }, [session, startNewHandWithPosition]);

  // Complete the current hand
  const completeHand = useCallback((outcome: 'won' | 'lost' | 'folded', potWon?: number) => {
    if (!currentHand || !session) return;

    // Validate requirements before completing hand
    const validation = validateHandRequirements();
    if (!validation.isValid) {
      setValidationErrorMessage(validation.error || 'Validation error');
      setShowValidationError(true);
      // Store pending completion to retry after cards are selected
      setPendingHandCompletion({ outcome, potWon });
      return;
    }

    // Calculate effective winnings based on side pot logic
    const effectivePotWon = calculateEffectivePotWinnings(outcome, potWon);

    // Calculate new stack amount and profit/loss
    const stackBefore = stack;
    let newStackAmount: number;
    let profitOrLoss: number;

    if (outcome === 'won') {
      // Hero wins the pot (use effectivePotWon for side pot scenarios)
      const actualPotWon = potWon !== undefined ? potWon : (effectivePotWon || currentHand.pot);
      newStackAmount = stackBefore + actualPotWon;
      profitOrLoss = actualPotWon - heroMoneyInvested;
    } else if (outcome === 'lost') {
      // Loss: Stack stays at current amount (investment already lost)
      newStackAmount = stackBefore;
      profitOrLoss = -heroMoneyInvested;
    } else {
      // Folded: Stack stays at current amount
      newStackAmount = stackBefore;
      profitOrLoss = heroMoneyInvested > 0 ? -heroMoneyInvested : 0;
    }

    // Save hand to storage
    const handData: StoredHand = {
      handNumber: currentHand.handNumber,
      timestamp: new Date().toISOString(),
      userSeat: session.userSeat!,
      userCards: currentHand.userCards,
      communityCards: currentHand.communityCards,
      bettingRounds: currentHand.bettingRounds,
      result: {
        winner: outcome === 'won' ? session.userSeat : undefined,
        potWon: profitOrLoss,
        stackAfter: newStackAmount,
        handOutcome: outcome,
        opponentCards: Object.keys(opponentCards).length > 0 ? opponentCards : undefined
      }
    };

    SessionService.saveHandToSession(handData);

    // Clear current hand from storage since it's completed
    SessionService.clearCurrentHand(session.sessionId);


    setStack(newStackAmount);

    // Immediately update session metadata with new stack
    const updatedSession = { ...session, currentStack: newStackAmount };
    SessionService.updateSessionMetadata(updatedSession);
    setSession(updatedSession);

    // Reset and prepare for next hand
    const newHandCount = handCount + 1;
    setHandCount(newHandCount);

    // Load completed hands for history
    const hands = SessionService.getSessionHands(session.sessionId);
    setCompletedHands(hands);

    // Reset hero money invested for next hand
    setHeroMoneyInvested(0);

    // Reset other states
    setSelectedCard1(null);
    setSelectedCard2(null);
    setOpponentCards({} as Record<Position, [string, string] | null>);

    // Close any open dialogs and reset selectors
    setShowAllFoldedDialog(false);
    setShowOutcomeSelection(false);
    setShowFoldConfirmation(false);
    setShowValidationError(false);
    setShowCommunitySelector(false);
    setSelectingCommunityCard(null);
    setAutoSelectingCommunityCards(false);

    // Reset current hand first, then show seat selection for every hand
    setCurrentHand(null);
    setShowSeatSelection(true);

    // Scroll to top when showing seat selection
    window.scrollTo(0, 0);
  }, [
    currentHand,
    session,
    validateHandRequirements,
    calculateEffectivePotWinnings,
    heroMoneyInvested,
    handCount,
    stack,
    opponentCards,
    setStack,
    setSession,
    setHandCount,
    setCompletedHands,
    setHeroMoneyInvested,
    setSelectedCard1,
    setSelectedCard2,
    setOpponentCards,
    setShowAllFoldedDialog,
    setShowOutcomeSelection,
    setShowFoldConfirmation,
    setShowValidationError,
    setShowCommunitySelector,
    setSelectingCommunityCard,
    setAutoSelectingCommunityCards,
    setCurrentHand,
    setShowSeatSelection,
    setValidationErrorMessage,
    setPendingHandCompletion
  ]);

  return {
    startNewHandWithPosition,
    startNewHand,
    completeHand,
    validateHandRequirements,
    calculateEffectivePotWinnings
  };
}