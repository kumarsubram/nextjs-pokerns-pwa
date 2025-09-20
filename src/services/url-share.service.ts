import { StoredHand, SessionMetadata, Position } from '@/types/poker-v2';

export class URLShareService {
  // Compress hand data for URL sharing - minimal data, full actions
  static compressHandData(hand: StoredHand, sessionMetadata: Partial<SessionMetadata> & { username?: string }): string {
    const shareData = {
      h: hand.handNumber,
      u: hand.userCards,
      c: {
        f: hand.communityCards.flop,
        t: hand.communityCards.turn,
        r: hand.communityCards.river
      },
      b: hand.bettingRounds,
      o: hand.result?.handOutcome, // Just the outcome, not full result
      w: hand.result?.potWon, // Amount won/lost
      a: hand.result?.stackAfter, // Stack after hand
      s: sessionMetadata.tableSeats, // Just table seats for action sequence
      p: sessionMetadata.userSeat // Just user position
    };

    // Convert to JSON and compress using base64
    const jsonString = JSON.stringify(shareData);
    // Use encodeURIComponent to make it URL safe
    const compressed = btoa(encodeURIComponent(jsonString));

    return compressed;
  }

  // Decompress hand data from URL
  static decompressHandData(compressed: string): {
    hand: StoredHand;
    metadata: {
      tableSeats: 6 | 9;
      userSeat: Position;
    }
  } | null {
    try {
      const jsonString = decodeURIComponent(atob(compressed));
      const shareData = JSON.parse(jsonString);

      const hand: StoredHand = {
        handNumber: shareData.h,
        timestamp: new Date().toISOString(),
        userSeat: shareData.p,
        userCards: shareData.u,
        communityCards: {
          flop: shareData.c.f,
          turn: shareData.c.t,
          river: shareData.c.r
        },
        bettingRounds: shareData.b,
        result: {
          handOutcome: shareData.o,
          winner: shareData.o === 'won' ? shareData.p : undefined,
          potWon: shareData.w,
          stackAfter: shareData.a
        }
      };

      const metadata = {
        tableSeats: shareData.s,
        userSeat: shareData.p
      };

      return { hand, metadata };
    } catch (error) {
      console.error('Failed to decompress hand data:', error);
      return null;
    }
  }

  // Generate shareable URL with compressed data
  static generateShareableURL(hand: StoredHand, sessionMetadata: Partial<SessionMetadata> & { username?: string }): string {
    const compressed = this.compressHandData(hand, sessionMetadata);

    if (typeof window === 'undefined') return '';

    // Use a special route for URL-shared hands
    const baseUrl = window.location.origin;

    // With minimal metadata, URLs should be much shorter and include all actions
    return `${baseUrl}/share?h=${compressed}`;
  }

  // Check if URL is too long for sharing
  static isURLTooLong(hand: StoredHand, sessionMetadata: Partial<SessionMetadata> & { username?: string }): boolean {
    const compressed = this.compressHandData(hand, sessionMetadata);
    return compressed.length > 1500;
  }

  // Create simplified hand for shorter URL
  static createSimplifiedHand(hand: StoredHand): StoredHand {
    // Keep only essential data for display
    return {
      ...hand,
      bettingRounds: {
        preflop: {
          actions: hand.bettingRounds.preflop?.actions.slice(-3) || [], // Keep last 3 actions
          pot: hand.bettingRounds.preflop?.pot || 0,
          currentBet: hand.bettingRounds.preflop?.currentBet || 0,
          isComplete: true
        },
        flop: hand.bettingRounds.flop ? {
          actions: hand.bettingRounds.flop.actions.slice(-3) || [],
          pot: hand.bettingRounds.flop.pot || 0,
          currentBet: hand.bettingRounds.flop.currentBet || 0,
          isComplete: true
        } : undefined,
        turn: hand.bettingRounds.turn ? {
          actions: hand.bettingRounds.turn.actions.slice(-3) || [],
          pot: hand.bettingRounds.turn.pot || 0,
          currentBet: hand.bettingRounds.turn.currentBet || 0,
          isComplete: true
        } : undefined,
        river: hand.bettingRounds.river ? {
          actions: hand.bettingRounds.river.actions.slice(-3) || [],
          pot: hand.bettingRounds.river.pot || 0,
          currentBet: hand.bettingRounds.river.currentBet || 0,
          isComplete: true
        } : undefined
      }
    };
  }
}