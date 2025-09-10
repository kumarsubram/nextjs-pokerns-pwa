import { Hand } from '@/types/poker';

// Simple in-memory storage for hands (will be replaced with proper storage later)
const hands: Map<string, Hand[]> = new Map();

export const HandsService = {
  // Get all hands for a session
  getHandsForSession: async (sessionId: string): Promise<Hand[]> => {
    return hands.get(sessionId) || [];
  },

  // Add a new hand to a session
  addHand: async (sessionId: string, hand: Hand): Promise<void> => {
    const sessionHands = hands.get(sessionId) || [];
    sessionHands.push(hand);
    hands.set(sessionId, sessionHands);
  },

  // Update an existing hand
  updateHand: async (sessionId: string, handId: string, updates: Partial<Hand>): Promise<void> => {
    const sessionHands = hands.get(sessionId) || [];
    const handIndex = sessionHands.findIndex(h => h.id === handId);
    if (handIndex >= 0) {
      sessionHands[handIndex] = { ...sessionHands[handIndex], ...updates };
      hands.set(sessionId, sessionHands);
    }
  },

  // Delete a hand
  deleteHand: async (sessionId: string, handId: string): Promise<void> => {
    const sessionHands = hands.get(sessionId) || [];
    const filteredHands = sessionHands.filter(h => h.id !== handId);
    hands.set(sessionId, filteredHands);
  },

  // Get hand statistics for a session
  getSessionStats: async (sessionId: string) => {
    const sessionHands = hands.get(sessionId) || [];
    
    const totalHands = sessionHands.length;
    const won = sessionHands.filter(h => h.result === 'won').length;
    const lost = sessionHands.filter(h => h.result === 'lost').length;
    const folded = sessionHands.filter(h => h.result === 'folded').length;
    
    const totalPot = sessionHands.reduce((sum, h) => sum + h.potSize, 0);
    const totalWon = sessionHands
      .filter(h => h.result === 'won')
      .reduce((sum, h) => sum + (h.amountWon || 0), 0);

    return {
      totalHands,
      won,
      lost,
      folded,
      winRate: totalHands > 0 ? (won / totalHands) * 100 : 0,
      totalPot,
      totalWon,
      netResult: totalWon - totalPot // Simplified calculation
    };
  }
};