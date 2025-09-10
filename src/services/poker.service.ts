import { db } from '@/lib/db';
import { Session, Hand } from '@/types/poker';

// Service layer that will handle both local and remote operations in the future
export class PokerService {
  // Session operations
  static async createSession(sessionData: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session> {
    const user = await db.getDefaultUser();
    const session: Session = {
      ...sessionData,
      id: 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'local'
    };
    
    await db.sessions.add(session);
    
    // Future: Queue for sync if online
    // await this.queueForSync('session', session.id, 'create', session);
    
    return session;
  }

  static async updateSession(id: string, updates: Partial<Session>): Promise<void> {
    await db.sessions.update(id, updates);
    
    // Future: Queue for sync if online
    // await this.queueForSync('session', id, 'update', updates);
  }

  static async deleteSession(id: string): Promise<void> {
    // Delete all hands in the session first
    await db.hands.where('sessionId').equals(id).delete();
    await db.sessions.delete(id);
    
    // Future: Queue for sync if online
    // await this.queueForSync('session', id, 'delete', null);
  }

  static async getSessions(): Promise<Session[]> {
    return await db.sessions.orderBy('startTime').reverse().toArray();
  }

  static async getSession(id: string): Promise<Session | undefined> {
    return await db.sessions.get(id);
  }

  static async getActiveSessions(): Promise<Session[]> {
    return await db.sessions
      .filter(session => !session.endTime)
      .toArray();
  }

  // Hand operations
  static async createHand(handData: Omit<Hand, 'id' | 'createdAt' | 'updatedAt'>): Promise<Hand> {
    const user = await db.getDefaultUser();
    const hand: Hand = {
      ...handData,
      id: 'hand-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'local'
    };
    
    await db.hands.add(hand);
    
    // Update session hand count
    const session = await db.sessions.get(handData.sessionId);
    if (session) {
      await db.sessions.update(handData.sessionId, {
        totalHands: (session.totalHands || 0) + 1
      });
    }
    
    // Future: Queue for sync if online
    // await this.queueForSync('hand', hand.id, 'create', hand);
    
    return hand;
  }

  static async updateHand(id: string, updates: Partial<Hand>): Promise<void> {
    await db.hands.update(id, updates);
    
    // Future: Queue for sync if online
    // await this.queueForSync('hand', id, 'update', updates);
  }

  static async deleteHand(id: string): Promise<void> {
    const hand = await db.hands.get(id);
    if (hand) {
      await db.hands.delete(id);
      
      // Update session hand count
      const session = await db.sessions.get(hand.sessionId);
      if (session) {
        await db.sessions.update(hand.sessionId, {
          totalHands: Math.max(0, (session.totalHands || 0) - 1)
        });
      }
      
      // Future: Queue for sync if online
      // await this.queueForSync('hand', id, 'delete', null);
    }
  }

  static async getHandsBySession(sessionId: string): Promise<Hand[]> {
    return await db.hands
      .where('sessionId')
      .equals(sessionId)
      .reverse()
      .sortBy('timestamp');
  }

  static async getRecentHands(limit: number = 10): Promise<Hand[]> {
    return await db.hands
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  // Stats operations
  static async getSessionStats(sessionId: string) {
    const hands = await this.getHandsBySession(sessionId);
    
    const stats = {
      totalHands: hands.length,
      handsWon: hands.filter(h => h.result === 'won').length,
      handsLost: hands.filter(h => h.result === 'lost').length,
      handsFolded: hands.filter(h => h.result === 'folded').length,
      totalWinnings: hands.reduce((sum, h) => sum + (h.amountWon || 0), 0),
      showdownsWon: hands.filter(h => h.showdown && h.result === 'won').length,
      totalShowdowns: hands.filter(h => h.showdown).length,
    };
    
    return stats;
  }

  // Future sync methods (placeholder)
  private static async queueForSync(entityType: string, entityId: string, operation: string, data: any) {
    // Will be implemented when adding remote sync
    // Check if online, queue operation, attempt sync
  }

  static async syncWithRemote() {
    // Will be implemented when adding remote sync
    // Process sync queue, handle conflicts, update sync status
  }
}