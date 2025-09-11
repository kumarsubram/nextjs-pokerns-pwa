// Core types that will work both offline and with future remote DB

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR' | 'BRL' | 'MXN';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  INR: '₹',
  BRL: 'R$',
  MXN: '$'
};

export interface User {
  id: string;
  email?: string;
  name?: string;
  createdAt: Date;
  lastSyncedAt?: Date;
}

export interface Session {
  id: string;
  userId?: string; // Optional for now, required when auth is added
  name: string;
  type: 'tournament' | 'cash';
  currency: Currency;
  buyIn: number;
  seats: 2 | 4 | 6 | 8 | 9 | 10;
  startTime: Date;
  endTime?: Date;
  location?: string;
  notes?: string;
  totalHands: number;
  profit?: number;
  // Blind structure
  smallBlind: number;
  bigBlind: number;
  ante?: number; // Optional ante
  // Table setup
  bigBlindPosition?: number; // Seat number (0-indexed)
  smallBlindPosition?: number; // Seat number (0-indexed)
  heroPosition?: number; // Seat number (0-indexed)
  buttonPosition?: number; // Seat number (0-indexed) - rotates each hand
  dealerPosition?: number; // Seat number (0-indexed) - fixed position
  // Sync metadata
  createdAt: Date;
  updatedAt: Date;
  syncStatus?: 'local' | 'synced' | 'pending';
  remoteId?: string; // ID in remote database when synced
}

export interface Hand {
  id: string;
  sessionId: string;
  userId?: string; // Optional for now
  handNumber: number;
  timestamp: Date;
  
  // Positions
  heroPosition: Position;
  villainPositions: VillainPosition[];
  
  // Cards
  holeCards: string[]; // e.g., ['As', 'Kh']
  board: {
    flop?: string[];
    turn?: string;
    river?: string;
  };
  
  // Actions - detailed for each stage
  preflop: Action[];
  flop?: Action[];
  turn?: Action[];
  river?: Action[];
  
  // Hero's primary action for each stage (for statistics)
  heroActions: {
    preflop: 'raise' | 'call' | 'fold' | 'check' | 'bet' | 'all-in' | 'straddle';
    flop?: 'raise' | 'call' | 'fold' | 'check' | 'bet' | 'all-in';
    turn?: 'raise' | 'call' | 'fold' | 'check' | 'bet' | 'all-in';
    river?: 'raise' | 'call' | 'fold' | 'check' | 'bet' | 'all-in';
  };
  
  // Hand progression tracking
  stagesReached: {
    preflop: boolean;
    flop: boolean;
    turn: boolean;
    river: boolean;
    showdown: boolean;
  };
  foldedAt?: 'preflop' | 'flop' | 'turn' | 'river';
  
  // Result
  potSize: number;
  result: 'won' | 'lost' | 'folded' | 'chopped';
  amountWon?: number;
  showdown?: boolean;
  
  // Notes
  notes?: string;
  
  // Sync metadata
  createdAt: Date;
  updatedAt: Date;
  syncStatus?: 'local' | 'synced' | 'pending';
  remoteId?: string;
}

export type Position = 'UTG' | 'UTG+1' | 'UTG+2' | 'MP' | 'MP+1' | 'CO' | 'BTN' | 'SB' | 'BB';

export interface VillainPosition {
  position: Position;
  playerId?: string;
  notes?: string;
}

export interface Action {
  player: 'hero' | Position;
  action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 're-raise' | 'all-in' | 'straddle';
  amount?: number; // Bet/raise amount
  raiseAmount?: number; // Amount raised on top of previous bet
  totalPot?: number; // Pot size after this action
  isStraddle?: boolean; // True if this is a straddle bet
}

// Settings stored locally
export interface AppSettings {
  id: string;
  userId?: string;
  defaultBuyIn?: number;
  defaultGameType?: 'tournament' | 'cash';
  theme?: 'light' | 'dark' | 'system';
  autoSync?: boolean;
  lastBackupDate?: Date;
}

// Action statistics for tracking performance by stage
export interface StageActionStats {
  stage: 'preflop' | 'flop' | 'turn' | 'river';
  totalHands: number;
  actions: {
    raise: number;
    call: number;
    fold: number;
    check: number;
    bet: number;
    allIn: number;
    straddle: number;
  };
  percentages: {
    raise: number;
    call: number;
    fold: number;
    check: number;
    bet: number;
    allIn: number;
    straddle: number;
  };
}

export interface HandProgressionStats {
  totalHands: number;
  stageStats: {
    preflop: StageActionStats;
    flop: StageActionStats;
    turn: StageActionStats;
    river: StageActionStats;
  };
  reachPercentages: {
    preflop: number; // Always 100%
    flop: number;
    turn: number;
    river: number;
    showdown: number;
  };
}

// Sync queue for future remote sync
export interface SyncQueueItem {
  id: string;
  entityType: 'session' | 'hand' | 'user' | 'settings';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: Date;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}