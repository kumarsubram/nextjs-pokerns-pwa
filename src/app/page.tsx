'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessions } from '@/hooks/useSessions';
import { PokerService } from '@/services/poker.service';
import { HandProgressionStats } from '@/types/poker';
import { SessionCard } from '@/components/session/SessionCard';
import { HeroSection } from '@/components/home/HeroSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Trophy, 
  Play, 
  Target, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Users,
  Zap,
  BarChart3,
  Layers
} from 'lucide-react';

export default function Home() {
  const { sessions, loading } = useSessions();
  const [progressionStats, setProgressionStats] = useState<HandProgressionStats | null>(null);
  const router = useRouter();

  const activeSessions = sessions.filter(s => !s.endTime);
  const totalHands = sessions.reduce((sum, s) => sum + s.totalHands, 0);
  
  // Calculate win/loss stats from hands (mock for now - will connect to real hand data later)
  const mockHandsWon = Math.floor(totalHands * 0.35); // 35% win rate
  const mockHandsLost = Math.floor(totalHands * 0.45); // 45% lost

  // Load progression stats
  useEffect(() => {
    const loadProgressionStats = async () => {
      try {
        const stats = await PokerService.getHandProgressionStats();
        setProgressionStats(stats);
      } catch (error) {
        console.error('Error loading progression stats:', error);
      }
    };

    loadProgressionStats();
  }, [sessions]); // Reload when sessions change

  return (
    <>
      <HeroSection />

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-2">
        {/* Quick Actions */}
        <div className="mb-10">
          {/* Conditional grid layout based on active sessions */}
          <div className={`${
            activeSessions.length > 0 
              ? 'grid gap-3 mb-6 sm:grid-cols-1 lg:grid-cols-3' // 3 buttons when active sessions exist
              : 'flex justify-center mb-6' // Single centered button for first-time users
          }`}>
            {/* Start New Session */}
            <div 
              className={`bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-4 cursor-pointer hover:from-emerald-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg ${
                activeSessions.length === 0 ? 'inline-flex' : ''
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

            {/* Continue Active Session - Only show when active sessions exist */}
            {activeSessions.length > 0 && (
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 cursor-pointer hover:from-orange-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg relative"
                onClick={() => {
                  // Navigate to the most recent active session
                  const mostRecentSession = activeSessions.sort((a, b) => 
                    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                  )[0];
                  
                  console.log('Continue session:', mostRecentSession);
                  router.push(`/session/${mostRecentSession.id}`);
                }}
              >
                <div className="flex items-center text-white">
                  <div className="bg-white/20 rounded-lg p-2 mr-3 relative">
                    <Play className="h-8 w-8 text-white" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Continue Session</h3>
                    <p className="text-white/90 text-sm">{activeSessions.length} active</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Performance Overview */}
        <div className="mb-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your performance</h2>
            <p className="text-gray-600">Key metrics from all your poker sessions</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Sessions */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="flex items-center p-4">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <Trophy className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-gray-900">{sessions.length}</div>
                <p className="text-sm text-gray-600">Sessions</p>
                <p className="text-xs text-yellow-600 font-medium">{activeSessions.length} active</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Total Hands */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="flex items-center p-4">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-gray-900">{totalHands}</div>
                <p className="text-sm text-gray-600">Total Hands</p>
                <p className="text-xs text-blue-600 font-medium">All sessions</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Hands Won */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="flex items-center p-4">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-green-600">{mockHandsWon}</div>
                <p className="text-sm text-gray-600">Hands Won</p>
                <p className="text-xs text-green-600 font-medium">
                  {totalHands > 0 ? Math.round((mockHandsWon / totalHands) * 100) : 0}% win rate
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Hands Lost */}
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="flex items-center p-4">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-red-600">{mockHandsLost}</div>
                <p className="text-sm text-gray-600">Hands Lost</p>
                <p className="text-xs text-red-600 font-medium">
                  {totalHands > 0 ? Math.round((mockHandsLost / totalHands) * 100) : 0}% lost
                </p>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Hand Progression Stats */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Hand progression</h2>
            <p className="text-gray-600">Action breakdown for each stage of your poker hands</p>
          </div>
          
          {progressionStats && progressionStats.totalHands > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Preflop */}
              <Card className="bg-gray-50 border-l-4 border-l-gray-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">Preflop</h3>
                      <p className="text-sm text-gray-600">{progressionStats.stageStats.preflop.totalHands} hands</p>
                    </div>
                    <Users className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Fold</span>
                      <span className="font-medium">{progressionStats.stageStats.preflop.percentages.fold}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600">Call</span>
                      <span className="font-medium">{progressionStats.stageStats.preflop.percentages.call}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Raise</span>
                      <span className="font-medium">{progressionStats.stageStats.preflop.percentages.raise}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Flop */}
              <Card className="bg-blue-50 border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-blue-800">Flop</h3>
                      <p className="text-sm text-blue-600">{progressionStats.stageStats.flop.totalHands} hands ({progressionStats.reachPercentages.flop}%)</p>
                    </div>
                    <Layers className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Fold</span>
                      <span className="font-medium">{progressionStats.stageStats.flop.percentages.fold}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Check</span>
                      <span className="font-medium">{progressionStats.stageStats.flop.percentages.check}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Bet</span>
                      <span className="font-medium">{progressionStats.stageStats.flop.percentages.bet}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Turn */}
              <Card className="bg-orange-50 border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-orange-800">Turn</h3>
                      <p className="text-sm text-orange-600">{progressionStats.stageStats.turn.totalHands} hands ({progressionStats.reachPercentages.turn}%)</p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Fold</span>
                      <span className="font-medium">{progressionStats.stageStats.turn.percentages.fold}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Check</span>
                      <span className="font-medium">{progressionStats.stageStats.turn.percentages.check}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Bet</span>
                      <span className="font-medium">{progressionStats.stageStats.turn.percentages.bet}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* River */}
              <Card className="bg-purple-50 border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-purple-800">River</h3>
                      <p className="text-sm text-purple-600">{progressionStats.stageStats.river.totalHands} hands ({progressionStats.reachPercentages.river}%)</p>
                    </div>
                    <Zap className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Fold</span>
                      <span className="font-medium">{progressionStats.stageStats.river.percentages.fold}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Check</span>
                      <span className="font-medium">{progressionStats.stageStats.river.percentages.check}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Bet</span>
                      <span className="font-medium">{progressionStats.stageStats.river.percentages.bet}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="bg-muted rounded-full p-3 w-12 h-12 flex items-center justify-center mb-3">
                  <BarChart3 className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No hand data yet</h3>
                <p className="text-muted-foreground text-center text-sm">
                  Start tracking hands to see detailed progression statistics
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sessions List */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Recent sessions</h2>
            <p className="text-gray-600">Your latest poker sessions and progress</p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                <p className="text-muted-foreground">Loading sessions...</p>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="bg-muted rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                  <Trophy className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Ready to start tracking?</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Create your first poker session and start recording your hands and progress.
                </p>
                <Button 
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => router.push('/create-session')}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Start Your First Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {sessions.slice(0, 6).map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onView={(s) => router.push(`/session/${s.id}/view`)}
                  onDelete={(s) => console.log('Delete session:', s)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}