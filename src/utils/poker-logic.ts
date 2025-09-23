import {
  Position,
  TableSeats,
  PlayerState,
  BettingRound,
  BettingAction,
  CurrentHand,
  SidePot,
  POSITION_LABELS_6,
  POSITION_LABELS_9
} from '@/types/poker-v2';

/**
 * Get the action sequence for a given table size (excluding DEALER)
 */
export function getActionSequence(tableSeats: TableSeats): Position[] {
  const allPositions = tableSeats === 6 ? POSITION_LABELS_6 : POSITION_LABELS_9;
  // Remove DEALER as it's visual only, never acts
  return allPositions.filter(pos => pos !== 'DEALER');
}

/**
 * Get pre-flop action sequence (UTG acts first, BB acts last)
 */
export function getPreflopActionSequence(tableSeats: TableSeats): Position[] {
  if (tableSeats === 6) {
    // 6-handed preflop: UTG → LJ → CO → BTN → SB → BB
    return ['UTG', 'LJ', 'CO', 'BTN', 'SB', 'BB'];
  } else {
    // 9-handed preflop: UTG → UTG+1 → UTG+2 → LJ → HJ → CO → BTN → SB → BB
    return ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  }
}

/**
 * Get post-flop action sequence (SB acts first, BTN acts last among active players)
 */
export function getPostflopActionSequence(tableSeats: TableSeats): Position[] {
  if (tableSeats === 6) {
    // 6-handed postflop: SB → BB → UTG → LJ → CO → BTN
    return ['SB', 'BB', 'UTG', 'LJ', 'CO', 'BTN'];
  } else {
    // 9-handed postflop: SB → BB → UTG → UTG+1 → UTG+2 → LJ → HJ → CO → BTN
    return ['SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN'];
  }
}

/**
 * Initialize player states for a new hand
 */
export function initializePlayerStates(
  tableSeats: TableSeats,
  smallBlind: number,
  bigBlind: number
): PlayerState[] {
  const positions = getActionSequence(tableSeats);

  return positions.map(position => ({
    position,
    status: 'active' as const,
    stack: 1000, // Default stack - should come from session
    currentBet: position === 'SB' ? smallBlind : position === 'BB' ? bigBlind : 0,
    hasActed: false // All players need to act in preflop, even blinds
  }));
}

/**
 * Get the next player to act in current betting round
 */
export function getNextToAct(
  currentRound: 'preflop' | 'flop' | 'turn' | 'river',
  tableSeats: TableSeats,
  playerStates: PlayerState[],
  currentBettingRound: BettingRound
): Position | null {
  const actionSequence = currentRound === 'preflop'
    ? getPreflopActionSequence(tableSeats)
    : getPostflopActionSequence(tableSeats);

  const activePlayers = playerStates.filter(p => p.status === 'active');
  const activePositions = activePlayers.map(p => p.position);

  // Filter action sequence to only include active players
  const activeActionSequence = actionSequence.filter(pos => activePositions.includes(pos));

  // Find players who haven't acted yet or need to act due to raises
  const currentBet = currentBettingRound.currentBet;
  const needToAct = activePlayers.filter(player => {
    // Player needs to act if they haven't acted or their bet is less than current bet
    return !player.hasActed || player.currentBet < currentBet;
  });

  if (needToAct.length === 0) {
    return null; // Betting round is complete
  }

  // Find the next player in sequence who needs to act
  for (const position of activeActionSequence) {
    const player = needToAct.find(p => p.position === position);
    if (player) {
      return position;
    }
  }

  return null;
}

/**
 * Check if betting round is complete
 */
export function isBettingRoundComplete(
  playerStates: PlayerState[],
  bettingRound: BettingRound
): boolean {
  const activeAndAllInPlayers = playerStates.filter(p => p.status === 'active' || p.status === 'all-in');
  const currentBet = bettingRound.currentBet;

  // All active and all-in players must have acted and matched the current bet (or be all-in)
  return activeAndAllInPlayers.every(player =>
    player.hasActed && (player.currentBet === currentBet || player.status === 'all-in')
  );
}

/**
 * Process a betting action and update game state
 */
export function processBettingAction(
  hand: CurrentHand,
  action: Omit<BettingAction, 'timestamp'>
): CurrentHand {
  const updatedHand = { ...hand };
  const actionWithTimestamp: BettingAction = {
    ...action,
    timestamp: new Date().toISOString()
  };

  // Update current betting round (only for non-showdown rounds)
  const currentRound = updatedHand.currentBettingRound !== 'showdown'
    ? updatedHand.bettingRounds[updatedHand.currentBettingRound]
    : null;

  if (currentRound) {
    currentRound.actions.push(actionWithTimestamp);
  }

  // Update player state
  const playerIndex = updatedHand.playerStates.findIndex(p => p.position === action.position);
  if (playerIndex >= 0) {
    const player = updatedHand.playerStates[playerIndex];

    switch (action.action) {
      case 'fold':
        player.status = 'folded';
        player.hasActed = true;
        break;

      case 'check':
        player.hasActed = true;
        break;

      case 'call':
        if (currentRound) {
          const callAmount = currentRound.currentBet - player.currentBet;
          player.currentBet = currentRound.currentBet;
          player.stack -= callAmount;
          player.hasActed = true;
          updatedHand.pot += callAmount;

          // Check if calling an all-in with matching amount (likely also all-in)
          const otherAllInPlayer = updatedHand.playerStates.find(
            p => p.status === 'all-in' && p.currentBet === currentRound.currentBet
          );

          // If calling matches an all-in amount exactly, mark as all-in too
          if (otherAllInPlayer && player.currentBet === otherAllInPlayer.currentBet) {
            player.status = 'all-in';
            player.stack = 0;
          } else if (player.stack <= 0) {
            // Fallback: if stack calculation shows 0 or negative
            player.stack = 0;
            player.status = 'all-in';
          }
        }
        break;

      case 'raise':
        if (action.amount && currentRound) {
          const raiseAmount = action.amount - player.currentBet;
          player.currentBet = action.amount;
          player.stack -= raiseAmount;
          player.hasActed = true;
          currentRound.currentBet = action.amount;
          updatedHand.pot += raiseAmount;

          // If player has 0 stack after raising, mark as all-in
          if (player.stack <= 0) {
            player.stack = 0;
            player.status = 'all-in';
          }

          // Reset hasActed for other players due to raise (only if still active)
          updatedHand.playerStates.forEach(p => {
            if (p.position !== action.position && p.status === 'active') {
              p.hasActed = false;
            }
          });
        }
        break;

      case 'all-in':
        if (action.amount && currentRound) {
          const allInAmount = action.amount - player.currentBet;
          player.currentBet = action.amount;
          player.stack = Math.max(0, player.stack - allInAmount);
          player.status = 'all-in';
          player.hasActed = true;
          updatedHand.pot += allInAmount;

          // If all-in is a raise (higher than current bet), update bet and reset other players
          if (action.amount > currentRound.currentBet) {
            currentRound.currentBet = action.amount;
            // Reset hasActed for other players due to raise
            updatedHand.playerStates.forEach(p => {
              if (p.position !== action.position && p.status === 'active') {
                p.hasActed = false;
              }
            });
          }

          // Calculate side pots whenever a player goes all-in
          const hasAllInPlayers = updatedHand.playerStates.some(p => p.status === 'all-in');
          if (hasAllInPlayers) {
            updatedHand.sidePots = calculateSidePots(updatedHand.playerStates);
          }
        }
        break;
    }
  }

  // Check if betting round is complete
  if (currentRound) {
    currentRound.isComplete = isBettingRoundComplete(updatedHand.playerStates, currentRound);

    if (currentRound.isComplete) {
    // Update advancement flags
    if (updatedHand.currentBettingRound === 'preflop') {
      updatedHand.canAdvanceToFlop = true;
    } else if (updatedHand.currentBettingRound === 'flop') {
      updatedHand.canAdvanceToTurn = true;
    } else if (updatedHand.currentBettingRound === 'turn') {
      updatedHand.canAdvanceToRiver = true;
    }
    }
  }

  // Never auto-set nextToAct - let user control manually
  updatedHand.nextToAct = undefined;

  // Always recalculate side pots at the end if there are all-in players
  const hasAllInPlayers = updatedHand.playerStates.some(p => p.status === 'all-in');
  if (hasAllInPlayers) {
    updatedHand.sidePots = calculateSidePots(updatedHand.playerStates);
  }

  return updatedHand;
}

/**
 * Advance to next betting round
 */
export function advanceToNextRound(
  hand: CurrentHand
): CurrentHand {
  const updatedHand = { ...hand };

  // Reset player states for new round
  updatedHand.playerStates.forEach(player => {
    if (player.status === 'active') {
      player.hasActed = false;
      player.currentBet = 0;
    }
  });

  // Advance to next round
  if (updatedHand.currentBettingRound === 'preflop') {
    updatedHand.currentBettingRound = 'flop';
    updatedHand.bettingRounds.flop = {
      actions: [],
      pot: updatedHand.pot,
      currentBet: 0,
      isComplete: false
    };
    updatedHand.canAdvanceToFlop = false;
  } else if (updatedHand.currentBettingRound === 'flop') {
    updatedHand.currentBettingRound = 'turn';
    updatedHand.bettingRounds.turn = {
      actions: [],
      pot: updatedHand.pot,
      currentBet: 0,
      isComplete: false
    };
    updatedHand.canAdvanceToTurn = false;
  } else if (updatedHand.currentBettingRound === 'turn') {
    updatedHand.currentBettingRound = 'river';
    updatedHand.bettingRounds.river = {
      actions: [],
      pot: updatedHand.pot,
      currentBet: 0,
      isComplete: false
    };
    updatedHand.canAdvanceToRiver = false;
  }

  // Never auto-set nextToAct - let user control manually
  updatedHand.nextToAct = undefined;

  return updatedHand;
}

/**
 * Calculate side pots when there are all-in players
 * Simple and clean: just creates pots based on all-in amounts
 */
export function calculateSidePots(playerStates: PlayerState[]): SidePot[] {
  // Only consider players still in the hand (active or all-in), not folded players
  const activePlayers = playerStates.filter(p => p.status === 'active' || p.status === 'all-in');
  const contributors = activePlayers.filter(p => p.currentBet > 0);

  if (contributors.length === 0) {
    return [];
  }

  // If no one is all-in, no side pots (just main pot)
  const hasAllIn = contributors.some(p => p.status === 'all-in');
  if (!hasAllIn) {
    return [];
  }

  // Get unique bet amounts from all-in players
  const allInPlayers = contributors.filter(p => p.status === 'all-in');
  const uniqueAllInAmounts = [...new Set(allInPlayers.map(p => p.currentBet))].sort((a, b) => a - b);

  // If only ONE unique all-in amount and everyone still in matched it, no side pots
  if (uniqueAllInAmounts.length === 1) {
    const allInAmount = uniqueAllInAmounts[0];
    const everyoneMatchedOrExceeded = contributors.every(p => p.currentBet >= allInAmount);
    if (everyoneMatchedOrExceeded) {
      return []; // No side pots, just main pot
    }
  }

  // Sort by bet amount (ascending) to build pots from smallest to largest
  const sorted = [...contributors]
    .filter(p => p.status === 'active' || p.status === 'all-in')
    .sort((a, b) => a.currentBet - b.currentBet);

  const sidePots: SidePot[] = [];
  let processed = 0;

  for (let i = 0; i < sorted.length; i++) {
    const player = sorted[i];
    const contribution = player.currentBet - processed;

    if (contribution > 0) {
      // Everyone at this level or higher can win this pot
      const eligible = sorted.slice(i).map(p => p.position);

      // Count everyone who put in at least this much (including folded players)
      const contributorCount = contributors.filter(p => p.currentBet >= player.currentBet).length;

      sidePots.push({
        amount: contribution * contributorCount,
        eligiblePlayers: eligible,
        maxContribution: player.currentBet
      });

      processed = player.currentBet;
    }
  }

  return sidePots;
}
