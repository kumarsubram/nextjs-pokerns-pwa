'use client';

import { useState, useEffect } from 'react';
import { Session } from '@/types/poker';
import { PokerService } from '@/services/poker.service';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await PokerService.getSessions();
      setSessions(data);
      setError(null);
    } catch (err) {
      setError('Failed to load sessions');
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const createSession = async (sessionData: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newSession = await PokerService.createSession(sessionData);
      setSessions(prev => [newSession, ...prev]);
      return newSession;
    } catch (err) {
      console.error('Error creating session:', err);
      throw err;
    }
  };

  const updateSession = async (id: string, updates: Partial<Session>) => {
    try {
      await PokerService.updateSession(id, updates);
      setSessions(prev => prev.map(s => 
        s.id === id ? { ...s, ...updates } : s
      ));
    } catch (err) {
      console.error('Error updating session:', err);
      throw err;
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await PokerService.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error deleting session:', err);
      throw err;
    }
  };

  return {
    sessions,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    refresh: loadSessions
  };
}