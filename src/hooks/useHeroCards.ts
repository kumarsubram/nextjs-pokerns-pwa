'use client';

import { useCallback } from 'react';
import { CurrentHand, Position } from '@/types/poker-v2';
import { SessionMetadata } from '@/types/poker-v2';

interface UseHeroCardsProps {
  // Session and hand state
  session: SessionMetadata | null;
  currentHand: CurrentHand | null;
  setCurrentHand: (hand: CurrentHand | null) => void;

  // Hero card states
  selectedCard1: string | null;
  setSelectedCard1: (card: string | null) => void;
  selectedCard2: string | null;
  setSelectedCard2: (card: string | null) => void;

  // Card selector states
  setShowCardSelector: (show: boolean) => void;
  selectingCard: 1 | 2;
  setSelectingCard: (card: 1 | 2) => void;

  // Inline card selection states
  inlineCardSelection: {
    show: boolean;
    position: Position | null;
    cardIndex: number;
    title: string;
  };
  setInlineCardSelection: (selection: {
    show: boolean;
    position: Position | null;
    cardIndex: number;
    title: string;
  }) => void;

  // Opponent cards state
  opponentCards: Record<Position, [string, string] | null>;
  setOpponentCards: (cards: Record<Position, [string, string] | null> | ((prev: Record<Position, [string, string] | null>) => Record<Position, [string, string] | null>)) => void;

  // Position selection states
  selectedPosition: Position | null;
  setSelectedPosition: (position: Position | null) => void;

  // Dialog states for card selection flow
  showAllFoldedDialog: boolean;
  pendingHandCompletion: { outcome: 'won' | 'lost' | 'folded', potWon?: number } | null;
  setShowAllFoldedDialog: (show: boolean) => void;
}

export function useHeroCards({
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
}: UseHeroCardsProps) {

  // Handle inline card selection (both hero and opponent cards)
  const handleInlineCardSelect = useCallback((card: string) => {
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
  }, [
    inlineCardSelection,
    session?.userSeat,
    opponentCards,
    currentHand,
    selectedCard1,
    selectedCard2,
    setOpponentCards,
    setInlineCardSelection,
    setSelectedCard1,
    setSelectedCard2,
    setCurrentHand
  ]);

  // Handle user card selection (both hero and opponent cards)
  const handleUserCardSelect = useCallback((card: string) => {
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
  }, [
    selectedPosition,
    session?.userSeat,
    opponentCards,
    selectingCard,
    currentHand,
    selectedCard1,
    selectedCard2,
    showAllFoldedDialog,
    pendingHandCompletion,
    setOpponentCards,
    setShowCardSelector,
    setSelectedPosition,
    setSelectedCard1,
    setSelectedCard2,
    setCurrentHand,
    setShowAllFoldedDialog
  ]);

  // Get card selector title for hero/opponent cards
  const getCardSelectorTitle = useCallback(() => {
    if (selectedPosition && selectedPosition !== session?.userSeat) {
      return `Select ${selectedPosition} Card ${selectingCard}`;
    } else {
      return `Select Card ${selectingCard}`;
    }
  }, [selectedPosition, session?.userSeat, selectingCard]);

  // Get all selected cards for card conflict detection
  const getAllSelectedCards = useCallback(() => {
    const cards: string[] = [];

    // Add hero cards
    if (selectedCard1) cards.push(selectedCard1);
    if (selectedCard2) cards.push(selectedCard2);

    // Add community cards
    if (currentHand?.communityCards.flop) {
      cards.push(...currentHand.communityCards.flop.filter(Boolean));
    }
    if (currentHand?.communityCards.turn) {
      cards.push(currentHand.communityCards.turn);
    }
    if (currentHand?.communityCards.river) {
      cards.push(currentHand.communityCards.river);
    }

    // Add opponent cards
    Object.values(opponentCards).forEach(opponentCardPair => {
      if (opponentCardPair) {
        cards.push(...opponentCardPair.filter(Boolean));
      }
    });

    return cards.filter(Boolean);
  }, [selectedCard1, selectedCard2, currentHand, opponentCards]);

  // Open card selector for hero cards
  const openHeroCardSelector = useCallback((cardNumber: 1 | 2) => {
    setSelectingCard(cardNumber);
    setShowCardSelector(true);
  }, [setSelectingCard, setShowCardSelector]);

  // Open inline card selector for hero cards
  const openInlineHeroCardSelector = useCallback((cardIndex: number, title: string) => {
    setInlineCardSelection({
      show: true,
      position: session?.userSeat || null,
      cardIndex,
      title
    });
  }, [setInlineCardSelection, session?.userSeat]);

  // Clear hero cards
  const clearHeroCards = useCallback(() => {
    setSelectedCard1(null);
    setSelectedCard2(null);
    if (currentHand) {
      setCurrentHand({
        ...currentHand,
        userCards: null
      });
    }
  }, [setSelectedCard1, setSelectedCard2, currentHand, setCurrentHand]);

  // Check if hero has both cards selected
  const hasBothHeroCards = !!(selectedCard1 && selectedCard2);

  // Check if hero has any cards selected
  const hasAnyHeroCards = !!(selectedCard1 || selectedCard2);

  return {
    // Handlers
    handleInlineCardSelect,
    handleUserCardSelect,

    // Helper functions
    getCardSelectorTitle,
    getAllSelectedCards,
    openHeroCardSelector,
    openInlineHeroCardSelector,
    clearHeroCards,

    // Computed values
    hasBothHeroCards,
    hasAnyHeroCards
  };
}