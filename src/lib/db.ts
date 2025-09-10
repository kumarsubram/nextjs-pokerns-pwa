import Dexie, { Table } from 'dexie';
import { User, Session, Hand, AppSettings, SyncQueueItem } from '@/types/poker';

export class PokerDatabase extends Dexie {
  // Tables
  users!: Table<User>;
  sessions!: Table<Session>;
  hands!: Table<Hand>;
  settings!: Table<AppSettings>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('PokerNotesDB');
    
    // Define schema - indexes for efficient queries
    this.version(1).stores({
      users: 'id, email, lastSyncedAt',
      sessions: 'id, userId, name, type, startTime, syncStatus, remoteId',
      hands: 'id, sessionId, userId, timestamp, heroPosition, result, syncStatus, remoteId',
      settings: 'id, userId',
      syncQueue: 'id, entityType, entityId, status, timestamp'
    });

    // Add hooks for automatic timestamps
    this.sessions.hook('creating', (primKey, obj) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
      obj.syncStatus = 'local';
      obj.totalHands = obj.totalHands || 0;
    });

    this.sessions.hook('updating', (modifications, primKey, obj) => {
      modifications.updatedAt = new Date();
      if (obj.syncStatus === 'synced') {
        modifications.syncStatus = 'pending';
      }
    });

    this.hands.hook('creating', (primKey, obj) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
      obj.syncStatus = 'local';
    });

    this.hands.hook('updating', (modifications, primKey, obj) => {
      modifications.updatedAt = new Date();
      if (obj.syncStatus === 'synced') {
        modifications.syncStatus = 'pending';
      }
    });
  }

  // Helper method to get or create default user (for offline mode)
  async getDefaultUser(): Promise<User> {
    let user = await this.users.toArray();
    if (user.length === 0) {
      const newUser: User = {
        id: 'local-user-' + Date.now(),
        name: 'Local User',
        createdAt: new Date()
      };
      await this.users.add(newUser);
      return newUser;
    }
    return user[0];
  }

  // Helper to clear all local data (useful for logout/reset)
  async clearAllData(): Promise<void> {
    await this.transaction('rw', this.sessions, this.hands, this.settings, this.syncQueue, async () => {
      await this.sessions.clear();
      await this.hands.clear();
      await this.settings.clear();
      await this.syncQueue.clear();
    });
  }

  // Helper to get unsync'd items count (for UI indicator)
  async getUnsyncedCount(): Promise<number> {
    const sessions = await this.sessions.where('syncStatus').equals('local').count();
    const hands = await this.hands.where('syncStatus').equals('local').count();
    return sessions + hands;
  }
}

// Create singleton instance
export const db = new PokerDatabase();

// Initialize database on first load
if (typeof window !== 'undefined') {
  db.open().catch(err => {
    console.error('Failed to open database:', err);
  });
}