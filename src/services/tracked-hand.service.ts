import { StoredHand, Position } from '@/types/poker-v2';

export interface TrackedHand extends StoredHand {
  trackedAt: string;
  sessionId: string;
  sessionName: string;
  userSeat: Position;
  tableSeats: 6 | 9;
  trackId?: string; // Unique ID for the tracked hand
}

export class TrackedHandService {
  private static readonly TRACKED_HANDS_KEY = 'trackedHands';

  /**
   * Get all tracked hands from localStorage
   */
  static getTrackedHands(): TrackedHand[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.TRACKED_HANDS_KEY);
      if (!stored) return [];

      const hands = JSON.parse(stored);
      return Array.isArray(hands) ? hands : [];
    } catch (error) {
      console.error('Failed to load tracked hands:', error);
      return [];
    }
  }

  /**
   * Track a new hand
   */
  static trackHand(
    hand: StoredHand,
    sessionId: string,
    sessionName: string,
    userSeat: Position,
    tableSeats: 6 | 9
  ): boolean {
    try {
      const trackedHands = this.getTrackedHands();

      // Check if this hand is already tracked
      const existingIndex = trackedHands.findIndex(
        h => h.sessionId === sessionId && h.handNumber === hand.handNumber
      );

      if (existingIndex >= 0) {
        // Already tracked, update it
        trackedHands[existingIndex] = {
          ...hand,
          trackedAt: new Date().toISOString(),
          sessionId,
          sessionName,
          userSeat: hand.userSeat || userSeat,
          tableSeats,
          trackId: trackedHands[existingIndex].trackId
        };
      } else {
        // Add new tracked hand
        const trackedHand: TrackedHand = {
          ...hand,
          trackedAt: new Date().toISOString(),
          sessionId,
          sessionName,
          userSeat: hand.userSeat || userSeat,
          tableSeats,
          trackId: `${sessionId}_hand_${hand.handNumber}_${Date.now()}`
        };
        trackedHands.unshift(trackedHand); // Add to beginning
      }

      // Save to localStorage
      localStorage.setItem(this.TRACKED_HANDS_KEY, JSON.stringify(trackedHands));
      return true;
    } catch (error) {
      console.error('Failed to track hand:', error);
      return false;
    }
  }

  /**
   * Remove a tracked hand
   */
  static removeTrackedHand(sessionId: string, handNumber: number): boolean {
    try {
      const trackedHands = this.getTrackedHands();
      const filtered = trackedHands.filter(
        h => !(h.sessionId === sessionId && h.handNumber === handNumber)
      );

      if (filtered.length === trackedHands.length) {
        return false; // Hand not found
      }

      localStorage.setItem(this.TRACKED_HANDS_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to remove tracked hand:', error);
      return false;
    }
  }

  /**
   * Remove a tracked hand by trackId
   */
  static removeTrackedHandById(trackId: string): boolean {
    try {
      const trackedHands = this.getTrackedHands();
      const filtered = trackedHands.filter(h => h.trackId !== trackId);

      if (filtered.length === trackedHands.length) {
        return false; // Hand not found
      }

      localStorage.setItem(this.TRACKED_HANDS_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to remove tracked hand:', error);
      return false;
    }
  }

  /**
   * Check if a hand is already tracked
   */
  static isHandTracked(sessionId: string, handNumber: number): boolean {
    const trackedHands = this.getTrackedHands();
    return trackedHands.some(
      h => h.sessionId === sessionId && h.handNumber === handNumber
    );
  }

  /**
   * Clear all tracked hands
   */
  static clearAllTrackedHands(): boolean {
    try {
      localStorage.removeItem(this.TRACKED_HANDS_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear tracked hands:', error);
      return false;
    }
  }

  /**
   * Get tracked hands count
   */
  static getTrackedHandsCount(): number {
    return this.getTrackedHands().length;
  }
}