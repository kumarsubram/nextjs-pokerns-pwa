'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionService } from '@/services/session.service';
import { SessionMetadata } from '@/types/poker-v2';
import { HeroSection } from '@/components/home/HeroSection';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  Play,
  Clock,
  TrendingUp,
  Users
} from 'lucide-react';

export default function Home() {
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [activeSession, setActiveSession] = useState<SessionMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load sessions from localStorage
    const loadSessions = () => {
      const allSessions = SessionService.getSessionList();
      setSessions(allSessions);

      const current = SessionService.getCurrentSession();
      setActiveSession(current);

      setLoading(false);
    };

    loadSessions();
  }, []);

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalHands = sessions.reduce((sum, s) => sum + s.totalHands, 0);

  return (
    <>
      <HeroSection />

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-2">
        {/* Quick Actions */}
        <div className="mb-10">
          <div className={`${
            activeSession
              ? 'grid gap-3 mb-6 sm:grid-cols-1 lg:grid-cols-2 lg:max-w-2xl lg:mx-auto'
              : 'flex justify-center mb-6'
          }`}>
            {/* Start New Session */}
            <div
              className={`bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-4 cursor-pointer hover:from-emerald-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg ${
                !activeSession ? 'inline-flex' : ''
              }`}
              onClick={() => router.push('/create-session')}
            >
              <div className="flex items-center text-white">
                <div className="bg-white/20 rounded-lg p-2 mr-3">
                  <Plus className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Start Session</h3>
                </div>
              </div>
            </div>

            {/* Continue Active Session */}
            {activeSession && (
              <div
                className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 cursor-pointer hover:from-orange-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg relative"
                onClick={() => router.push(`/session/${activeSession.sessionId}`)}
              >
                <div className="flex items-center text-white">
                  <div className="bg-white/20 rounded-lg p-2 mr-3 relative">
                    <Play className="h-8 w-8 text-white" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Continue Session</h3>
                    <p className="text-sm opacity-90">
                      {activeSession.sessionName}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Session Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="text-2xl font-bold">{sessions.length}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Total Sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                  <span className="text-2xl font-bold">{totalHands}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Hands Played</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-2xl font-bold">{activeSession ? 1 : 0}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Active</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                  <span className="text-2xl font-bold">{completedSessions.length}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sessions */}
          {completedSessions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Recent Sessions</h2>
              {completedSessions.slice(0, 5).map((session) => (
                <Card key={session.sessionId} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{session.sessionName}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {session.gameType} • {session.tableSeats} Handed • {session.userSeat}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {session.totalHands} hands • {session.totalDuration}
                        </p>
                      </div>
                      {session.result && (
                        <div className={`text-lg font-bold ${
                          session.result.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {session.result}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && sessions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No sessions yet. Start your first session to begin tracking!</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}