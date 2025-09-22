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
  // New props for auto-advance logic
  handleAdvanceToNextRound: () => void;
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
  setAutoSelectingCommunityCards,
  handleAdvanceToNextRound
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

  // Handle community card click - allows editing based on current round and betting status
  const handleCommunityCardClick = useCallback((cardType: 'flop', cardIndex: number) => {
    if (!currentHand) return;

    const currentRound = currentHand.currentBettingRound;

    // Determine which cards are editable based on current round and betting completion
    let canEditCard = false;

    if (currentRound === 'preflop') {
      // During preflop: can only select/edit flop cards (0, 1, 2) WHEN betting is complete
      canEditCard = cardIndex <= 2 && isBettingComplete;
    } else if (currentRound === 'flop') {
      // During flop: can edit previously selected flop cards (0, 1, 2) OR select turn (3) when betting complete
      if (cardIndex <= 2) {
        // Can always edit previously selected flop cards during flop round
        canEditCard = true;
      } else if (cardIndex === 3) {
        // Can only select turn card when flop betting is complete
        canEditCard = isBettingComplete;
      }
    } else if (currentRound === 'turn') {
      // During turn: can edit flop (0, 1, 2) and turn (3) cards OR select river (4) when betting complete
      if (cardIndex <= 3) {
        // Can always edit previously selected flop/turn cards during turn round
        canEditCard = true;
      } else if (cardIndex === 4) {
        // Can only select river card when turn betting is complete
        canEditCard = isBettingComplete;
      }
    } else if (currentRound === 'river') {
      // During river: can edit all previously selected cards (0, 1, 2, 3, 4)
      canEditCard = cardIndex <= 4;
    }

    if (!canEditCard) {
      return; // Prevent editing cards not yet accessible in current round
    }

    setSelectingCommunityCard({ type: cardType, index: cardIndex });
    setShowCommunitySelector(true);
  }, [currentHand, isBettingComplete, setSelectingCommunityCard, setShowCommunitySelector]);

  // Check if all required cards are selected for current round
  const areRequiredCardsComplete = useCallback((hand: CurrentHand) => {
    const currentRound = hand.currentBettingRound;

    if (currentRound === 'preflop') {
      // Need all 3 flop cards
      const flopCards = hand.communityCards.flop;
      return flopCards && flopCards.length === 3 && flopCards.every(card => card && card !== '');
    } else if (currentRound === 'flop') {
      // Need turn card (flop already required to reach this point)
      return !!hand.communityCards.turn;
    } else if (currentRound === 'turn') {
      // Need river card (flop and turn already required)
      return !!hand.communityCards.river;
    }
    return true; // River and beyond don't need more cards
  }, []);

  // Handle community card selection with auto-advance logic
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

    // Auto-progress to next card if in guided initial selection mode
    if (autoSelectingCommunityCards && currentHand.currentBettingRound === 'preflop' && index < 2) {
      // Continue to next flop card immediately without closing selector
      setSelectingCommunityCard({ type: 'flop', index: index + 1 });
      // Keep showCommunitySelector true - don't close and reopen
    } else {
      // Close selector
      setShowCommunitySelector(false);
      setSelectingCommunityCard(null);

      // Check if we should auto-advance to next betting round
      const shouldAutoAdvance = (
        autoSelectingCommunityCards || // Initial card selection
        isBettingComplete // Editing cards after betting complete
      ) && areRequiredCardsComplete(updatedHand);

      if (shouldAutoAdvance) {
        // Auto-advance to next betting round
        setTimeout(() => {
          handleAdvanceToNextRound();
        }, 100); // Small delay to ensure state updates
      }

      if (autoSelectingCommunityCards) {
        setAutoSelectingCommunityCards(false);
      }
    }
  }, [
    selectingCommunityCard,
    currentHand,
    autoSelectingCommunityCards,
    isBettingComplete,
    setCurrentHand,
    setSelectingCommunityCard,
    setShowCommunitySelector,
    setAutoSelectingCommunityCards,
    areRequiredCardsComplete,
    handleAdvanceToNextRound
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

  // Get community card selector title based on which card is being selected
  const getCommunityCardSelectorTitle = useCallback(() => {
    if (!selectingCommunityCard || !currentHand) return 'Select Community Card';

    const { index } = selectingCommunityCard;

    // Title based on which card position is being selected, not current round
    if (index === 0) return 'Select First Flop Card';
    if (index === 1) return 'Select Second Flop Card';
    if (index === 2) return 'Select Third Flop Card';
    if (index === 3) return 'Select Turn Card';
    if (index === 4) return 'Select River Card';

    return 'Select Community Card';
  }, [selectingCommunityCard, currentHand]);

  // Get advance round message based on current round - updated for auto-advance
  const getAdvanceRoundMessage = useCallback(() => {
    if (!currentHand) return 'Betting Round Complete';

    const currentRound = currentHand.currentBettingRound;
    const needsCards = needsCommunityCards;

    if (needsCards) {
      if (currentRound === 'preflop') {
        return 'Select Flop Community Cards (auto-advances)';
      } else if (currentRound === 'flop') {
        return 'Select Turn Card (auto-advances)';
      } else if (currentRound === 'turn') {
        return 'Select River Card (auto-advances)';
      }
      return 'Select community cards (auto-advances)';
    } else {
      // Show specific message based on current round
      if (currentRound === 'preflop') {
        return 'Flop cards ready - advancing to betting';
      } else if (currentRound === 'flop') {
        return 'Turn card ready - advancing to betting';
      } else if (currentRound === 'turn') {
        return 'River card ready - advancing to betting';
      } else if (currentRound === 'river') {
        return 'All cards dealt';
      } else {
        return 'Betting Round Complete';
      }
    }
  }, [currentHand, needsCommunityCards]);

  // Get advance round button text - only shown when manual advance needed
  const getAdvanceRoundButtonText = useCallback(() => {
    if (!currentHand) return 'Proceed';

    const needsCards = needsCommunityCards;
    // Don't show button text when auto-advance is available
    if (needsCards) return null; // No button needed - auto-advances

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
    getAdvanceRoundButtonText,
    areRequiredCardsComplete
  };
}