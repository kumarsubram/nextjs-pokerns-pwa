// Simplified poker types for v2.0

export type GameType = 'Tournament' | 'Cash Game';
export type TableSeats = 6 | 9;
export type SessionStatus = 'active' | 'completed';

// Fixed position labels for tables (with dealer position) - proper poker sequence
export const POSITION_LABELS_9 = [
  'DEALER', // Fixed dealer position, black (non-playing)
  'BTN',    // Button - Position 1
  'SB',     // Small Blind - Position 2
  'BB',     // Big Blind - Position 3
  'UTG',    // Under the Gun - Position 4
  'UTG+1',  // Under the Gun + 1 - Position 5
  'UTG+2',  // Under the Gun + 2 - Position 6
  'LJ',     // Lojack - Position 7
  'HJ',     // Hijack - Position 8
  'CO'      // Cutoff - Position 9
] as const;

export const POSITION_LABELS_6 = [
  'DEALER', // Fixed dealer position, black (non-playing)
  'BTN',    // Button - Position 1
  'SB',     // Small Blind - Position 2
  'BB',     // Big Blind - Position 3
  'UTG',    // Under the Gun - Position 4
  'LJ',     // Lojack - Position 5
  'CO'      // Cutoff - Position 6
] as const;

export type Position9 = typeof POSITION_LABELS_9[number];
export type Position6 = typeof POSITION_LABELS_6[number];
export type Position = Position9 | Position6;

export interface SessionMetadata {
  sessionId: string;
  sessionName: string;
  sessionNumber: number;
  gameType: GameType;
  tableSeats: TableSeats;
  buyIn: number;
  userSeat?: Position;
  location?: string;
  startTime: string;
  endTime?: string;
  status: SessionStatus;
  totalHands: number;
  totalDuration?: string;
  result?: string;
  currentStack?: number;
}

export interface SessionConfig {
  sessionName?: string;
  gameType: GameType;
  tableSeats: TableSeats;
  buyIn: number;
  userSeat?: Position;
  location?: string;
}

export interface BettingAction {
  position: Position;
  action: 'fold' | 'check' | 'call' | 'raise' | 'all-in';
  amount?: number;
  timestamp: string;
}

export interface PlayerState {
  position: Position;
  status: 'active' | 'folded' | 'all-in';
  stack: number;
  currentBet: number;
  hasActed: boolean;
}

export interface BettingRound {
  actions: BettingAction[];
  pot: number;
  currentBet: number;
  isComplete: boolean;
  nextToAct?: Position;
}

export interface StoredHand {
  handNumber: number;
  timestamp: string;
  userCards: [string, string] | null;
  communityCards: {
    flop: [string, string, string] | null;
    turn: string | null;
    river: string | null;
  };
  bettingRounds: {
    preflop?: BettingRound;
    flop?: BettingRound;
    turn?: BettingRound;
    river?: BettingRound;
  };
  result: {
    winner?: Position;
    potWon?: number;
    stackAfter?: number;
    handOutcome?: 'won' | 'lost' | 'folded' | 'chopped';
  };
}

export interface CurrentHand {
  handNumber: number;
  userCards: [string, string] | null;
  communityCards: {
    flop: [string, string, string] | null;
    turn: string | null;
    river: string | null;
  };
  currentBettingRound: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  bettingRounds: {
    preflop: BettingRound;
    flop?: BettingRound;
    turn?: BettingRound;
    river?: BettingRound;
  };
  playerStates: PlayerState[];
  pot: number;
  smallBlind: number;
  bigBlind: number;
  nextToAct?: Position;
  canAdvanceToFlop: boolean;
  canAdvanceToTurn: boolean;
  canAdvanceToRiver: boolean;
}

// Card types
export const RANKS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
export const SUITS = ['♠', '♥', '♦', '♣'] as const;

export type Rank = typeof RANKS[number];
export type Suit = typeof SUITS[number];
export type Card = `${Rank}${Suit}`;