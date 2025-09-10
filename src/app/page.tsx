'use client';

import { useState, useEffect } from 'react';
import { useSessions } from '@/hooks/useSessions';
import { PokerService } from '@/services/poker.service';
import { HandProgressionStats } from '@/types/poker';
import { SessionCard } from '@/components/session/SessionCard';
import { OnlineStatusIndicator } from '@/components/OnlineStatusIndicator';
import { HeroSection } from '@/components/home/HeroSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Trophy, 
  Play, 
  History, 
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
  const { sessions, loading, createSession } = useSessions();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [progressionStats, setProgressionStats] = useState<HandProgressionStats | null>(null);
  const [newSession, setNewSession] = useState({
    name: '',
    type: 'cash' as 'cash' | 'tournament',
    buyIn: '',
    location: ''
  });

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

  const handleCreateSession = async () => {
    if (!newSession.name || !newSession.buyIn) return;
    
    await createSession({
      name: newSession.name,
      type: newSession.type,
      buyIn: parseFloat(newSession.buyIn),
      location: newSession.location || undefined,
      startTime: new Date(),
      totalHands: 0
    });
    
    setIsCreateDialogOpen(false);
    setNewSession({ name: '', type: 'cash', buyIn: '', location: '' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Poker Notes</h1>
            <div className="hidden sm:block">
              <OnlineStatusIndicator />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="block sm:hidden">
              <OnlineStatusIndicator />
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">New Session</span>
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="name">Session Name</Label>
                  <Input
                    id="name"
                    placeholder="Friday Night Game"
                    value={newSession.name}
                    onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Game Type</Label>
                  <Select 
                    value={newSession.type} 
                    onValueChange={(value: 'cash' | 'tournament') => 
                      setNewSession({ ...newSession, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash Game</SelectItem>
                      <SelectItem value="tournament">Tournament</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="buyin">Buy-in ($)</Label>
                  <Input
                    id="buyin"
                    type="number"
                    placeholder="100"
                    value={newSession.buyIn}
                    onChange={(e) => setNewSession({ ...newSession, buyIn: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="Home Game"
                    value={newSession.location}
                    onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                  />
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleCreateSession}
                  disabled={!newSession.name || !newSession.buyIn}
                >
                  Start Session
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </header>

      <HeroSection />

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-2">
        {/* Quick Actions */}
        <div className="mb-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Get started</h2>
          </div>
          {/* Conditional grid layout based on active sessions */}
          <div className={`grid gap-3 mb-6 ${
            activeSessions.length > 0 
              ? 'sm:grid-cols-1 lg:grid-cols-3' // 3 buttons when active sessions exist
              : 'sm:grid-cols-1 lg:grid-cols-2 max-w-2xl mx-auto' // 2 centered buttons for first-time users
          }`}>
            {/* Start New Session */}
            <div 
              className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-4 cursor-pointer hover:from-emerald-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <div className="flex items-center text-white">
                <div className="bg-white/20 rounded-lg p-2 mr-3">
                  <Plus className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Start Session</h3>
                  <p className="text-white/90 text-sm">Begin new game</p>
                </div>
              </div>
            </div>

            {/* Continue Active Session - Only show when active sessions exist */}
            {activeSessions.length > 0 && (
              <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 cursor-pointer hover:from-orange-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg relative">
                <div className="flex items-center text-white">
                  <div className="bg-white/20 rounded-lg p-2 mr-3 relative">
                    <Play className="h-8 w-8 text-white" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Continue</h3>
                    <p className="text-white/90 text-sm">{activeSessions.length} active</p>
                  </div>
                </div>
              </div>
            )}

            {/* View Hand History */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg">
              <div className="flex items-center text-white">
                <div className="bg-white/20 rounded-lg p-2 mr-3">
                  <History className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">History</h3>
                  <p className="text-white/90 text-sm">Review hands</p>
                </div>
              </div>
            </div>
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
                  onClick={() => setIsCreateDialogOpen(true)}
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
                  onView={(s) => console.log('View session:', s)}
                  onEdit={(s) => console.log('Edit session:', s)}
                  onDelete={(s) => console.log('Delete session:', s)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}