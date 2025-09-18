import { format } from 'date-fns';
import {
  SessionMetadata,
  SessionConfig,
  StoredHand,
  CurrentHand
} from '@/types/poker-v2';
import { SharedHandService } from './shared-hand.service';

const STORAGE_KEYS = {
  LAST_SESSION_NUMBER: 'lastSessionNumber',
  ACTIVE_SESSION: 'activeSession',
  SESSION_META_PREFIX: 'session_',
  SESSION_HANDS_PREFIX: 'session_',
  CURRENT_HAND_PREFIX: 'current_hand_',
  DATA_VERSION: 'dataVersion'
};

// Data version - only increment when you want to force data cleanup for all users
// Current: 2 (used for shared hand cleanup migration)
const CURRENT_DATA_VERSION = 2;

export class SessionService {
  // Data migration and cleanup - only runs when data version is explicitly changed
  static checkAndMigrateData(): void {
    if (typeof window === 'undefined') return;

    const storedVersion = localStorage.getItem(STORAGE_KEYS.DATA_VERSION);
    const currentVersion = CURRENT_DATA_VERSION.toString();

    // Only migrate if no version is stored (first time) or version is lower than current
    const storedVersionNum = storedVersion ? parseInt(storedVersion, 10) : 0;

    if (storedVersionNum < CURRENT_DATA_VERSION) {
      console.log(`Data migration required: v${storedVersionNum} → v${CURRENT_DATA_VERSION}`);

      // Clear all existing data for breaking changes
      this.deleteAllSessions();

      // Set new version
      localStorage.setItem(STORAGE_KEYS.DATA_VERSION, currentVersion);

      console.log(`Data migrated to version ${currentVersion}`);
    }
  }

  // Session lifecycle
  static createNewSession(config: SessionConfig): SessionMetadata {
    const sessionNumber = this.getNextSessionNumber();
    const now = new Date();
    const sessionId = `ps${sessionNumber}_${format(now, 'yyyy_MM_dd_HHmm')}`;

    const sessionName = config.sessionName || this.generateSessionName(sessionNumber);

    const metadata: SessionMetadata = {
      sessionId,
      sessionName,
      sessionNumber,
      gameType: config.gameType,
      tableSeats: config.tableSeats,
      buyIn: config.buyIn,
      userSeat: config.userSeat,
      location: config.location,
      startTime: now.toISOString(),
      status: 'active',
      totalHands: 0,
      currentStack: config.buyIn
    };

    // Save metadata
    this.saveSessionMetadata(metadata);

    // Set as active session
    this.setActiveSession(sessionId);

    // Initialize empty hands array
    localStorage.setItem(`${STORAGE_KEYS.SESSION_HANDS_PREFIX}${sessionId}_hands`, JSON.stringify([]));

    return metadata;
  }

  static getCurrentSession(): SessionMetadata | null {
    const activeSessionId = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (!activeSessionId) return null;

    return this.getSessionMetadata(activeSessionId);
  }

  static endCurrentSession(): void {
    const session = this.getCurrentSession();
    if (!session) return;

    const now = new Date();
    const startTime = new Date(session.startTime);
    const duration = now.getTime() - startTime.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    session.endTime = now.toISOString();
    session.status = 'completed';
    session.totalDuration = `${hours}h ${minutes}m`;

    // Calculate result
    if (session.currentStack !== undefined) {
      const profit = session.currentStack - session.buyIn;
      if (session.gameType === 'Cash Game') {
        const bbProfit = profit; // Assuming buy-in is in BB for cash games
        session.result = bbProfit >= 0 ? `+${bbProfit} BB` : `${bbProfit} BB`;
      } else {
        session.result = profit >= 0 ? `+$${profit}` : `-$${Math.abs(profit)}`;
      }
    }

    this.saveSessionMetadata(session);
    this.clearCurrentHand(session.sessionId); // Clear any saved current hand
    this.clearActiveSession();
  }

  static deleteSession(sessionId: string): void {
    localStorage.removeItem(`${STORAGE_KEYS.SESSION_META_PREFIX}${sessionId}_meta`);
    localStorage.removeItem(`${STORAGE_KEYS.SESSION_HANDS_PREFIX}${sessionId}_hands`);
    this.clearCurrentHand(sessionId); // Clear any saved current hand

    // Clear active session if it's the one being deleted
    const activeSession = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (activeSession === sessionId) {
      this.clearActiveSession();
    }

    // Delete any shared hands from this session
    SharedHandService.deleteHandsBySession(sessionId);
  }

  // Hand management
  static saveHandToSession(handData: Omit<StoredHand, 'handNumber' | 'timestamp'>): void {
    const session = this.getCurrentSession();
    if (!session) return;

    const hands = this.getSessionHands(session.sessionId);
    const newHand: StoredHand = {
      ...handData,
      handNumber: hands.length + 1,
      timestamp: new Date().toISOString()
    };

    hands.push(newHand);
    localStorage.setItem(
      `${STORAGE_KEYS.SESSION_HANDS_PREFIX}${session.sessionId}_hands`,
      JSON.stringify(hands)
    );

    // Update session metadata
    session.totalHands = hands.length;
    if (newHand.result.stackAfter !== undefined) {
      session.currentStack = newHand.result.stackAfter;
    }
    this.saveSessionMetadata(session);
  }

  static getSessionHands(sessionId: string): StoredHand[] {
    const handsJson = localStorage.getItem(`${STORAGE_KEYS.SESSION_HANDS_PREFIX}${sessionId}_hands`);
    return handsJson ? JSON.parse(handsJson) : [];
  }

  static getCurrentHandNumber(): number {
    const session = this.getCurrentSession();
    if (!session) return 1;

    const hands = this.getSessionHands(session.sessionId);
    return hands.length + 1;
  }

  // Session queries
  static getSessionList(): SessionMetadata[] {
    // Check for data migration on app usage
    this.checkAndMigrateData();

    const sessions: SessionMetadata[] = [];
    const keys = Object.keys(localStorage);

    for (const key of keys) {
      if (key.startsWith(STORAGE_KEYS.SESSION_META_PREFIX) && key.endsWith('_meta')) {
        const sessionJson = localStorage.getItem(key);
        if (sessionJson) {
          sessions.push(JSON.parse(sessionJson));
        }
      }
    }

    // Sort by start time, newest first
    return sessions.sort((a, b) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  static getSessionStats(sessionId: string) {
    const metadata = this.getSessionMetadata(sessionId);
    const hands = this.getSessionHands(sessionId);

    if (!metadata) return null;

    const wonHands = hands.filter(h => h.result.handOutcome === 'won').length;
    const totalPots = hands.reduce((sum, h) => sum + (h.result.potWon || 0), 0);

    return {
      ...metadata,
      wonHands,
      totalPots,
      avgPot: hands.length > 0 ? totalPots / hands.length : 0
    };
  }

  static exportSession(sessionId: string) {
    const metadata = this.getSessionMetadata(sessionId);
    const hands = this.getSessionHands(sessionId);

    return {
      metadata,
      hands,
      exportDate: new Date().toISOString()
    };
  }

  // Storage utilities
  static getNextSessionNumber(): number {
    const lastNumber = localStorage.getItem(STORAGE_KEYS.LAST_SESSION_NUMBER);
    const nextNumber = lastNumber ? parseInt(lastNumber) + 1 : 1;
    localStorage.setItem(STORAGE_KEYS.LAST_SESSION_NUMBER, nextNumber.toString());
    return nextNumber;
  }

  static setActiveSession(sessionId: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, sessionId);
  }

  static clearActiveSession(): void {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  }

  static hasActiveSession(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
  }

  static updateSessionMetadata(metadata: SessionMetadata): void {
    this.saveSessionMetadata(metadata);
  }

  // Current hand management
  static saveCurrentHand(sessionId: string, currentHand: CurrentHand | null): void {
    if (currentHand) {
      localStorage.setItem(
        `${STORAGE_KEYS.CURRENT_HAND_PREFIX}${sessionId}`,
        JSON.stringify(currentHand)
      );
    } else {
      localStorage.removeItem(`${STORAGE_KEYS.CURRENT_HAND_PREFIX}${sessionId}`);
    }
  }

  static getCurrentHand(sessionId: string): CurrentHand | null {
    const handJson = localStorage.getItem(`${STORAGE_KEYS.CURRENT_HAND_PREFIX}${sessionId}`);
    return handJson ? JSON.parse(handJson) : null;
  }

  static clearCurrentHand(sessionId: string): void {
    localStorage.removeItem(`${STORAGE_KEYS.CURRENT_HAND_PREFIX}${sessionId}`);
  }

  // Private helpers
  private static generateSessionName(sessionNumber: number): string {
    const now = new Date();
    const dateStr = format(now, "d MMM yy h:mma").toLowerCase();
    return `PS${sessionNumber} - ${dateStr}`;
  }

  static getSessionMetadata(sessionId: string): SessionMetadata | null {
    const metaJson = localStorage.getItem(`${STORAGE_KEYS.SESSION_META_PREFIX}${sessionId}_meta`);
    return metaJson ? JSON.parse(metaJson) : null;
  }

  private static saveSessionMetadata(metadata: SessionMetadata): void {
    localStorage.setItem(
      `${STORAGE_KEYS.SESSION_META_PREFIX}${metadata.sessionId}_meta`,
      JSON.stringify(metadata)
    );
  }

  // Delete all sessions and related data
  static deleteAllSessions(): void {
    if (typeof window === 'undefined') return;

    // Get all localStorage keys
    const keys = Object.keys(localStorage);

    // Filter for session-related keys
    const sessionKeys = keys.filter(key =>
      key.startsWith(STORAGE_KEYS.SESSION_META_PREFIX) ||
      key.startsWith(STORAGE_KEYS.SESSION_HANDS_PREFIX) ||
      key.startsWith(STORAGE_KEYS.CURRENT_HAND_PREFIX)
    );

    // Delete all session-related data
    sessionKeys.forEach(key => localStorage.removeItem(key));

    // Clear active session
    this.clearActiveSession();

    // Reset session counter
    localStorage.removeItem(STORAGE_KEYS.LAST_SESSION_NUMBER);

    // Delete all shared hands since all sessions are being deleted
    SharedHandService.deleteAllSharedHands();
  }
}