'use client';

import { useCallback, useEffect, useRef } from 'react';
import { CurrentHand } from '@/types/poker-v2';

interface UseCommunityCardsProps {
  currentHand: CurrentHand | null;
  setCurrentHand: (hand: CurrentHand | null) => void;
  isBettingComplete: boolean;
  showSeatSelection: boolean;
  // Community card selector states
  showCommunitySelector: boolean;
  setShowCommunitySelector: (show: boolean) => void;
  selectingCommunityCard: { type: 'flop'; index: number } | null;
  setSelectingCommunityCard: (card: { type: 'flop'; index: number } | null) => void;
  autoSelectingCommunityCards: boolean;
  setAutoSelectingCommunityCards: (auto: boolean) => void;
}

export function useCommunityCards({
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
}: UseCommunityCardsProps) {

  // Stable currentHand for HandHistory - freeze during community card selection to prevent blink
  const stableCurrentHandRef = useRef<CurrentHand | null>(null);

  // Update stable hand when we have a current hand and are NOT in community card selection mode
  useEffect(() => {
    if (currentHand && !showCommunitySelector) {
      stableCurrentHandRef.current = { ...currentHand };
    }
  }, [currentHand, showCommunitySelector]);

  // Use the stable version during community card selection, current version otherwise
  const handHistoryCurrentHand = showCommunitySelector ? stableCurrentHandRef.current : currentHand;

  // Compute if community cards are needed for auto-trigger
  const needsCommunityCards = currentHand && isBettingComplete && (
    (currentHand.currentBettingRound === 'preflop' && (!currentHand.communityCards.flop || currentHand.communityCards.flop.length < 3 || currentHand.communityCards.flop.some(card => !card))) ||
    (currentHand.currentBettingRound === 'flop' && !currentHand.communityCards.turn) ||
    (currentHand.currentBettingRound === 'turn' && !currentHand.communityCards.river)
  );

  // Show flop selection prompt when preflop betting is complete, hand is not over, and not all flop cards are selected
  const showFlopSelectionPrompt = isBettingComplete &&
    currentHand?.currentBettingRound === 'preflop' &&
    (!currentHand?.communityCards.flop || currentHand.communityCards.flop.length < 3 || currentHand.communityCards.flop.some(card => !card));

  // Show turn selection prompt when flop betting is complete, hand is not over, and no turn card is selected
  const showTurnSelectionPrompt = isBettingComplete &&
    currentHand?.currentBettingRound === 'flop' &&
    !currentHand?.communityCards.turn;

  // Show river selection prompt when turn betting is complete, hand is not over, and no river card is selected
  const showRiverSelectionPrompt = isBettingComplete &&
    currentHand?.currentBettingRound === 'turn' &&
    !currentHand?.communityCards.river;

  // Handle community card click
  const handleCommunityCardClick = useCallback((cardType: 'flop', cardIndex: number) => {
    // Only allow community card selection when betting round is complete
    if (!isBettingComplete || !currentHand) {
      return; // Don't allow community card selection during active betting
    }

    // Validate which cards can be selected based on current betting round
    const currentRound = currentHand.currentBettingRound;

    if (currentRound === 'preflop') {
      // After preflop, only flop cards (0, 1, 2) can be selected
      if (cardIndex > 2) {
        return; // Prevent turn and river selection after preflop
      }
    } else if (currentRound === 'flop') {
      // After flop, only turn card (3) can be selected (and flop cards if not set)
      if (cardIndex === 4) {
        return; // Prevent river selection after flop
      }
    } else if (currentRound === 'turn') {
      // After turn, only river card (4) can be selected (and previous cards if not set)
      // All cards are allowed at this point
    }

    setSelectingCommunityCard({ type: cardType, index: cardIndex });
    setShowCommunitySelector(true);
  }, [isBettingComplete, currentHand, setSelectingCommunityCard, setShowCommunitySelector]);

  // Handle community card selection
  const handleCommunityCardSelect = useCallback((card: string) => {
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

    // Auto-progress to next card if in guided mode
    if (autoSelectingCommunityCards && currentHand.currentBettingRound === 'preflop' && index < 2) {
      // Continue to next flop card immediately without closing selector
      setSelectingCommunityCard({ type: 'flop', index: index + 1 });
      // Keep showCommunitySelector true - don't close and reopen
    } else {
      // Close selector only when we're done with auto-progression
      setShowCommunitySelector(false);
      setSelectingCommunityCard(null);
      if (autoSelectingCommunityCards) {
        setAutoSelectingCommunityCards(false);
      }
    }
  }, [
    selectingCommunityCard,
    currentHand,
    autoSelectingCommunityCards,
    setCurrentHand,
    setSelectingCommunityCard,
    setShowCommunitySelector,
    setAutoSelectingCommunityCards
  ]);

  // Get next card to select for auto-trigger
  const getNextCardToSelect = useCallback(() => {
    if (!currentHand) return null;

    if (currentHand.currentBettingRound === 'preflop') {
      // Find first empty flop card
      const flopCards = currentHand.communityCards.flop || [null, null, null];
      for (let i = 0; i < 3; i++) {
        if (!flopCards[i]) return { type: 'flop' as const, index: i };
      }
    } else if (currentHand.currentBettingRound === 'flop') {
      return { type: 'flop' as const, index: 3 }; // Turn card
    } else if (currentHand.currentBettingRound === 'turn') {
      return { type: 'flop' as const, index: 4 }; // River card
    }
    return null;
  }, [currentHand]);

  // Auto-trigger community card selection when betting round completes
  useEffect(() => {
    if (!currentHand || !isBettingComplete || showCommunitySelector) return;

    // Don't auto-trigger if this is a brand new hand with no actions yet
    const currentRound = currentHand.bettingRounds[currentHand.currentBettingRound as 'preflop' | 'flop' | 'turn' | 'river'];
    const hasActions = currentRound && currentRound.actions && currentRound.actions.length > 0;
    if (!hasActions) return;

    // Additional safety check: Don't auto-trigger if we're showing seat selection
    if (showSeatSelection) return;

    if (needsCommunityCards) {
      // Auto-trigger the first card selection
      const nextCard = getNextCardToSelect();
      if (nextCard) {
        // Show card selector immediately
        setSelectingCommunityCard(nextCard);
        setShowCommunitySelector(true);
        setAutoSelectingCommunityCards(true);
      }
    } else {
      setAutoSelectingCommunityCards(false);
    }
  }, [
    currentHand,
    isBettingComplete,
    showCommunitySelector,
    needsCommunityCards,
    showSeatSelection,
    getNextCardToSelect,
    setSelectingCommunityCard,
    setShowCommunitySelector,
    setAutoSelectingCommunityCards
  ]);

  // Get community card selector title
  const getCommunityCardSelectorTitle = useCallback(() => {
    if (!selectingCommunityCard || !currentHand) return 'Select Community Card';

    const { index } = selectingCommunityCard;
    if (currentHand.currentBettingRound === 'preflop') {
      if (index === 0) return 'Select First Flop Card';
      if (index === 1) return 'Select Second Flop Card';
      if (index === 2) return 'Select Third Flop Card';
    } else if (currentHand.currentBettingRound === 'flop') {
      return 'Select Turn Card';
    } else if (currentHand.currentBettingRound === 'turn') {
      return 'Select River Card';
    }
    return 'Select Community Card';
  }, [selectingCommunityCard, currentHand]);

  // Get advance round message based on current round
  const getAdvanceRoundMessage = useCallback(() => {
    if (!currentHand) return 'Betting Round Complete';

    const currentRound = currentHand.currentBettingRound;
    const needsCards = needsCommunityCards;

    if (needsCards) {
      if (currentRound === 'preflop') {
        return 'Select Flop Community Cards to continue';
      } else if (currentRound === 'flop') {
        return 'Select Turn Card to continue';
      } else if (currentRound === 'turn') {
        return 'Select River Card to continue';
      }
      return 'Select community cards to continue';
    } else {
      // Show specific message based on current round
      if (currentRound === 'preflop') {
        return 'Flop cards selected';
      } else if (currentRound === 'flop') {
        return 'Turn card selected';
      } else if (currentRound === 'turn') {
        return 'River card selected';
      } else if (currentRound === 'river') {
        return 'All cards dealt';
      } else {
        return 'Betting Round Complete';
      }
    }
  }, [currentHand, needsCommunityCards]);

  // Get advance round button text
  const getAdvanceRoundButtonText = useCallback(() => {
    if (!currentHand) return 'Proceed';

    const needsCards = needsCommunityCards;
    if (needsCards) return 'Proceed';

    const currentRound = currentHand.currentBettingRound;
    if (currentRound === 'preflop') return 'Proceed to Flop Betting';
    if (currentRound === 'flop') return 'Proceed to Turn Betting';
    if (currentRound === 'turn') return 'Proceed to River Betting';
    if (currentRound === 'river') return 'Proceed to Showdown';
    return 'Proceed';
  }, [currentHand, needsCommunityCards]);

  return {
    // States and computed values
    needsCommunityCards,
    showFlopSelectionPrompt,
    showTurnSelectionPrompt,
    showRiverSelectionPrompt,
    handHistoryCurrentHand,

    // Handlers
    handleCommunityCardClick,
    handleCommunityCardSelect,

    // Helper functions
    getCommunityCardSelectorTitle,
    getAdvanceRoundMessage,
    getAdvanceRoundButtonText
  };
}