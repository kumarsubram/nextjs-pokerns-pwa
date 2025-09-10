import { db } from '@/lib/db';
import { Session, Hand, HandProgressionStats, StageActionStats } from '@/types/poker';

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

  // Hand progression statistics
  static async getHandProgressionStats(): Promise<HandProgressionStats> {
    const allHands = await db.hands.toArray();
    
    if (allHands.length === 0) {
      return this.getEmptyProgressionStats();
    }

    const totalHands = allHands.length;
    
    // Calculate stage reach percentages
    const reachPercentages = {
      preflop: 100, // Always 100%
      flop: Math.round((allHands.filter(h => h.stagesReached?.flop).length / totalHands) * 100),
      turn: Math.round((allHands.filter(h => h.stagesReached?.turn).length / totalHands) * 100),
      river: Math.round((allHands.filter(h => h.stagesReached?.river).length / totalHands) * 100),
      showdown: Math.round((allHands.filter(h => h.stagesReached?.showdown).length / totalHands) * 100),
    };

    // Calculate action statistics for each stage
    const stageStats = {
      preflop: this.calculateStageActionStats('preflop', allHands),
      flop: this.calculateStageActionStats('flop', allHands.filter(h => h.stagesReached?.flop)),
      turn: this.calculateStageActionStats('turn', allHands.filter(h => h.stagesReached?.turn)),
      river: this.calculateStageActionStats('river', allHands.filter(h => h.stagesReached?.river)),
    };

    return {
      totalHands,
      stageStats,
      reachPercentages,
    };
  }

  private static calculateStageActionStats(stage: 'preflop' | 'flop' | 'turn' | 'river', hands: Hand[]): StageActionStats {
    const stageHands = hands.length;
    
    if (stageHands === 0) {
      return {
        stage,
        totalHands: 0,
        actions: { raise: 0, call: 0, fold: 0, check: 0, bet: 0, allIn: 0 },
        percentages: { raise: 0, call: 0, fold: 0, check: 0, bet: 0, allIn: 0 },
      };
    }

    const actions = {
      raise: 0,
      call: 0,
      fold: 0,
      check: 0,
      bet: 0,
      allIn: 0,
    };

    // Count actions (for now using mock data, will be real when hands have heroActions)
    hands.forEach(hand => {
      if (hand.heroActions) {
        const action = hand.heroActions[stage];
        if (action) {
          if (action === 'all-in') actions.allIn++;
          else actions[action as keyof typeof actions]++;
        }
      } else {
        // Mock distribution for demonstration
        const mockAction = this.getMockActionForStage(stage);
        actions[mockAction]++;
      }
    });

    const percentages = {
      raise: Math.round((actions.raise / stageHands) * 100),
      call: Math.round((actions.call / stageHands) * 100),
      fold: Math.round((actions.fold / stageHands) * 100),
      check: Math.round((actions.check / stageHands) * 100),
      bet: Math.round((actions.bet / stageHands) * 100),
      allIn: Math.round((actions.allIn / stageHands) * 100),
    };

    return {
      stage,
      totalHands: stageHands,
      actions,
      percentages,
    };
  }

  private static getMockActionForStage(stage: string): keyof StageActionStats['actions'] {
    // Mock realistic distributions
    const distributions = {
      preflop: ['fold', 'call', 'raise', 'fold', 'call', 'fold', 'raise', 'call'],
      flop: ['check', 'bet', 'fold', 'call', 'check', 'bet', 'fold'],
      turn: ['check', 'bet', 'call', 'fold', 'check', 'bet'],
      river: ['check', 'bet', 'call', 'fold', 'check'],
    };
    
    const options = distributions[stage as keyof typeof distributions] || ['check', 'bet', 'fold'];
    return options[Math.floor(Math.random() * options.length)] as keyof StageActionStats['actions'];
  }

  private static getEmptyProgressionStats(): HandProgressionStats {
    const emptyStageStats: StageActionStats = {
      stage: 'preflop',
      totalHands: 0,
      actions: { raise: 0, call: 0, fold: 0, check: 0, bet: 0, allIn: 0 },
      percentages: { raise: 0, call: 0, fold: 0, check: 0, bet: 0, allIn: 0 },
    };

    return {
      totalHands: 0,
      stageStats: {
        preflop: { ...emptyStageStats, stage: 'preflop' },
        flop: { ...emptyStageStats, stage: 'flop' },
        turn: { ...emptyStageStats, stage: 'turn' },
        river: { ...emptyStageStats, stage: 'river' },
      },
      reachPercentages: {
        preflop: 0,
        flop: 0,
        turn: 0,
        river: 0,
        showdown: 0,
      },
    };
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