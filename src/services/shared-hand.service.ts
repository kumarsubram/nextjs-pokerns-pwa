import { SharedHand, StoredHand, SessionMetadata, Comment } from '@/types/poker-v2';

const SHARED_HANDS_KEY = 'sharedHands';
const USER_KEY = 'currentUser';

export class SharedHandService {
  // Get current username (for now from localStorage, later from auth)
  static getCurrentUsername(): string {
    if (typeof window === 'undefined') return 'Anonymous';
    return localStorage.getItem(USER_KEY) || 'Anonymous';
  }

  // Set username
  static setUsername(username: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, username);
  }

  // Generate unique hand ID
  static generateHandId(sessionId: string, handNumber: number): string {
    const username = this.getCurrentUsername();
    // Replace spaces and special chars for URL safety, handle null/undefined values
    const safeUsername = (username || 'anonymous').replace(/[^a-zA-Z0-9]/g, '_');
    const safeSessionId = (sessionId || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
    return `${safeUsername}_${safeSessionId}_${handNumber}`;
  }

  // Share a hand
  static shareHand(
    hand: StoredHand,
    sessionId: string,
    sessionMetadata: SessionMetadata
  ): string {
    if (typeof window === 'undefined') return '';

    const handId = this.generateHandId(sessionId, hand.handNumber);

    const sharedHand: SharedHand = {
      id: handId,
      username: this.getCurrentUsername(),
      sessionId,
      handData: hand,
      sessionMetadata: {
        sessionName: sessionMetadata.sessionName,
        gameType: sessionMetadata.gameType,
        tableSeats: sessionMetadata.tableSeats,
        userSeat: sessionMetadata.userSeat!
      },
      sharedAt: new Date().toISOString(),
      views: 0,
      comments: []
    };

    // Get existing shared hands
    const sharedHands = this.getAllSharedHands();

    // Add or update this hand
    const existingIndex = sharedHands.findIndex(h => h.id === handId);
    if (existingIndex >= 0) {
      // Update existing (preserve comments and views)
      sharedHands[existingIndex] = {
        ...sharedHand,
        views: sharedHands[existingIndex].views,
        comments: sharedHands[existingIndex].comments
      };
    } else {
      sharedHands.push(sharedHand);
    }

    // Save back to localStorage
    localStorage.setItem(SHARED_HANDS_KEY, JSON.stringify(sharedHands));

    return handId;
  }

  // Get all shared hands
  static getAllSharedHands(): SharedHand[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(SHARED_HANDS_KEY);
    if (!stored) return [];

    try {
      return JSON.parse(stored) as SharedHand[];
    } catch {
      return [];
    }
  }

  // Get a specific shared hand
  static getSharedHand(handId: string): SharedHand | null {
    const hands = this.getAllSharedHands();
    return hands.find(h => h.id === handId) || null;
  }

  // Increment view count
  static incrementViews(handId: string): void {
    const hands = this.getAllSharedHands();
    const hand = hands.find(h => h.id === handId);
    if (hand) {
      hand.views++;
      localStorage.setItem(SHARED_HANDS_KEY, JSON.stringify(hands));
    }
  }

  // Add comment to a hand
  static addComment(handId: string, text: string): void {
    if (!text.trim()) return;

    const hands = this.getAllSharedHands();
    const hand = hands.find(h => h.id === handId);

    if (hand) {
      const comment: Comment = {
        id: Date.now().toString(),
        username: this.getCurrentUsername(),
        text: text.trim(),
        timestamp: new Date().toISOString()
      };

      hand.comments.push(comment);
      localStorage.setItem(SHARED_HANDS_KEY, JSON.stringify(hands));
    }
  }

  // Delete a comment (only by author)
  static deleteComment(handId: string, commentId: string): boolean {
    const hands = this.getAllSharedHands();
    const hand = hands.find(h => h.id === handId);

    if (hand) {
      const commentIndex = hand.comments.findIndex(c => c.id === commentId);
      if (commentIndex >= 0) {
        const comment = hand.comments[commentIndex];
        // Only allow deletion by author
        if (comment.username === this.getCurrentUsername()) {
          hand.comments.splice(commentIndex, 1);
          localStorage.setItem(SHARED_HANDS_KEY, JSON.stringify(hands));
          return true;
        }
      }
    }
    return false;
  }

  // Unshare a hand (only by owner)
  static unshareHand(handId: string): boolean {
    const hands = this.getAllSharedHands();
    const handIndex = hands.findIndex(h => h.id === handId);

    if (handIndex >= 0) {
      const hand = hands[handIndex];
      // Only allow unshare by owner
      if (hand.username === this.getCurrentUsername()) {
        hands.splice(handIndex, 1);
        localStorage.setItem(SHARED_HANDS_KEY, JSON.stringify(hands));
        return true;
      }
    }
    return false;
  }

  // Check if a hand is shared
  static isHandShared(sessionId: string, handNumber: number): boolean {
    const handId = this.generateHandId(sessionId, handNumber);
    const hands = this.getAllSharedHands();
    return hands.some(h => h.id === handId);
  }

  // Get share URL for a hand
  static getShareUrl(handId: string): string {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/${handId}`;
  }

  // Delete all shared hands from a specific session
  static deleteHandsBySession(sessionId: string): void {
    const hands = this.getAllSharedHands();
    const filteredHands = hands.filter(hand => hand.sessionId !== sessionId);

    if (typeof window !== 'undefined') {
      localStorage.setItem(SHARED_HANDS_KEY, JSON.stringify(filteredHands));
    }
  }

  // Delete all shared hands (used when deleting all sessions)
  static deleteAllSharedHands(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SHARED_HANDS_KEY);
    }
  }
}