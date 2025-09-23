'use client';

import { useCallback } from 'react';
import {
  SessionMetadata,
  CurrentHand,
  Position,
  BettingAction
} from '@/types/poker-v2';
import {
  processBettingAction,
  advanceToNextRound,
  getNextToAct,
  getPreflopActionSequence,
  getPostflopActionSequence,
  calculateSidePots
} from '@/utils/poker-logic';

interface UseBettingLogicProps {
  session: SessionMetadata | null;
  currentHand: CurrentHand | null;
  setCurrentHand: (hand: CurrentHand | null) => void;
  stack: number;
  setStack: (stack: number | ((prev: number) => number)) => void;
  heroMoneyInvested: number;
  setHeroMoneyInvested: (amount: number | ((prev: number) => number)) => void;
  completeHand: (outcome: 'won' | 'lost' | 'folded', potWon?: number) => void;
  // Dialog setters
  setShowAllFoldedDialog: (show: boolean) => void;
  setShowOutcomeSelection: (show: boolean) => void;
  setFoldPosition: (position: Position | null) => void;
  setShowFoldConfirmation: (show: boolean) => void;
  setSelectedPosition: (position: Position | null) => void;
  setShowPositionActions: (show: boolean) => void;
}

export function useBettingLogic({
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
}: UseBettingLogicProps) {

  // Auto-fold players between nextToAct and target position (when user skips positions)
  const autoFoldPlayersBetween = useCallback((hand: CurrentHand, nextToAct: Position, targetPosition: Position): CurrentHand => {
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
  }, [session?.tableSeats]);

  // Handle betting actions for any position
  const handleBettingAction = useCallback((position: Position, action: 'fold' | 'check' | 'call' | 'raise' | 'all-in', amount?: number) => {
    if (!currentHand || !session) return;

    // If hero is folding, show confirmation
    if (action === 'fold' && position === session.userSeat) {
      setFoldPosition(position);
      setShowFoldConfirmation(true);
      return;
    }

    // Clear selected position after action
    setSelectedPosition(null);
    setShowPositionActions(false);

    let updatedHand = { ...currentHand };

    // If there are skipped positions, auto-fold/check them
    if (currentHand.nextToAct && currentHand.nextToAct !== position) {
      updatedHand = autoFoldPlayersBetween(updatedHand, currentHand.nextToAct, position);
    }

    // Track hero's money investment and reduce stack
    if (position === session.userSeat && amount) {
      const currentBet = updatedHand.playerStates.find(p => p.position === position)?.currentBet || 0;
      const additionalInvestment = amount - currentBet;
      setHeroMoneyInvested(prev => prev + additionalInvestment);
      // Reduce stack by the additional investment
      setStack(prev => prev - additionalInvestment);
    }

    const bettingAction: Omit<BettingAction, 'timestamp'> = {
      position,
      action,
      amount
    };

    updatedHand = processBettingAction(updatedHand, bettingAction);

    // Simple refund logic: when someone goes all-in for less than hero's bet
    if (action === 'all-in' && session) {
      const allInPlayer = updatedHand.playerStates.find(p => p.position === position);
      const heroState = updatedHand.playerStates.find(p => p.position === session.userSeat);

      // Check if hero has bet more than the all-in amount
      if (allInPlayer && heroState && heroState.currentBet > allInPlayer.currentBet) {
        const refund = heroState.currentBet - allInPlayer.currentBet;

        // Only process refund if it's just hero vs this all-in player
        const activePlayers = updatedHand.playerStates.filter(p =>
          p.status === 'active' || p.status === 'all-in'
        );

        if (activePlayers.length === 2) {
          // Give hero back the excess
          setStack(prev => prev + refund);
          setHeroMoneyInvested(prev => prev - refund);

          // Adjust hero's bet to match the all-in
          heroState.currentBet = allInPlayer.currentBet;
          updatedHand.pot -= refund;

          // Update current bet for the round
          const currentRound = updatedHand.bettingRounds[updatedHand.currentBettingRound as 'preflop' | 'flop' | 'turn' | 'river'];
          if (currentRound) {
            currentRound.currentBet = allInPlayer.currentBet;
          }
        }
      }

      // Recalculate side pots
      updatedHand.sidePots = calculateSidePots(updatedHand.playerStates);
    }

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
        // Show "All Folded" dialog instead of directly completing
        setCurrentHand(updatedHand);
        setShowAllFoldedDialog(true);
        return;
      } else {
        // Hero lost (already folded)
        completeHand('lost', 0);
        return; // Exit early, don't set currentHand
      }
    }

    setCurrentHand(updatedHand);
  }, [
    currentHand,
    session,
    setFoldPosition,
    setShowFoldConfirmation,
    setSelectedPosition,
    setShowPositionActions,
    setHeroMoneyInvested,
    setStack,
    autoFoldPlayersBetween,
    setCurrentHand,
    setShowAllFoldedDialog,
    completeHand
  ]);

  // Handle confirmed hero fold
  const handleConfirmedHeroFold = useCallback(() => {
    if (!currentHand || !session || !currentHand) return;

    const foldPosition = session.userSeat;
    if (!foldPosition) return;

    // If Hero hasn't invested any money, don't track the hand - just start a new one
    if (heroMoneyInvested === 0) {
      // This will be handled by the parent component's fold confirmation logic
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
  }, [currentHand, session, heroMoneyInvested, setCurrentHand, completeHand]);

  // Handle advancing to next betting round
  const handleAdvanceToNextRound = useCallback(() => {
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
  }, [currentHand, session, setShowOutcomeSelection, completeHand, setCurrentHand]);

  // Get current betting round info
  const getCurrentBettingRound = useCallback(() => {
    if (!currentHand) return null;
    const round = currentHand.currentBettingRound;
    if (round === 'showdown') return null;

    // Type-safe access to betting rounds
    if (round === 'preflop') return currentHand.bettingRounds.preflop;
    if (round === 'flop') return currentHand.bettingRounds.flop;
    if (round === 'turn') return currentHand.bettingRounds.turn;
    if (round === 'river') return currentHand.bettingRounds.river;

    return null;
  }, [currentHand]);

  // Calculate the amount a player needs to add to call (considering blinds already posted)
  const getCallAmount = useCallback((position: Position) => {
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
  }, [currentHand, getCurrentBettingRound, session?.userSeat, stack, heroMoneyInvested]);

  // Check if a call would be an all-in for the hero
  const isCallAllIn = useCallback((position: Position) => {
    if (position !== session?.userSeat || !currentHand) return false;
    const currentRound = getCurrentBettingRound();
    if (!currentRound) return false;

    const currentBet = currentRound.currentBet || 0;
    const playerState = currentHand.playerStates.find(p => p.position === position);
    const alreadyBet = playerState?.currentBet || 0;
    const requiredCallAmount = currentBet - alreadyBet;
    const remainingStack = stack - heroMoneyInvested;

    return requiredCallAmount > 0 && remainingStack <= requiredCallAmount;
  }, [session?.userSeat, currentHand, getCurrentBettingRound, stack, heroMoneyInvested]);

  // Check if a player can check (already matches current bet)
  const canCheck = useCallback((position: Position) => {
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
  }, [currentHand, getCurrentBettingRound]);

  return {
    handleBettingAction,
    handleConfirmedHeroFold,
    handleAdvanceToNextRound,
    getCurrentBettingRound,
    getCallAmount,
    isCallAllIn,
    canCheck,
    autoFoldPlayersBetween
  };
}