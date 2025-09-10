// Core types that will work both offline and with future remote DB

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
  buyIn: number;
  startTime: Date;
  endTime?: Date;
  location?: string;
  notes?: string;
  totalHands: number;
  profit?: number;
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
  
  // Actions
  preflop: Action[];
  flop?: Action[];
  turn?: Action[];
  river?: Action[];
  
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
  action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';
  amount?: number;
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

// Sync queue for future remote sync
export interface SyncQueueItem {
  id: string;
  entityType: 'session' | 'hand' | 'user' | 'settings';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}