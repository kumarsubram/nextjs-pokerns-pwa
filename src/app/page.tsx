'use client';

import { useState } from 'react';
import { useSessions } from '@/hooks/useSessions';
import { SessionCard } from '@/components/session/SessionCard';
import { OnlineStatusIndicator } from '@/components/OnlineStatusIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Clock 
} from 'lucide-react';

export default function Home() {
  const { sessions, loading, createSession } = useSessions();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    name: '',
    type: 'cash' as 'cash' | 'tournament',
    buyIn: '',
    location: ''
  });

  const activeSessions = sessions.filter(s => !s.endTime);
  const totalHands = sessions.reduce((sum, s) => sum + s.totalHands, 0);
  
  // Calculate win/loss stats from hands (mock for now - will connect to real hand data later)
  const mockHandsWon = Math.floor(totalHands * 0.4); // 40% win rate as example
  const mockHandsLost = totalHands - mockHandsWon;

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

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-6">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {/* Start New Session */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setIsCreateDialogOpen(true)}>
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="bg-green-100 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Plus className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Start New Session</h3>
                  <p className="text-sm text-muted-foreground">Begin tracking a new poker session</p>
                </div>
              </CardContent>
            </Card>

            {/* Continue Active Session */}
            {activeSessions.length > 0 && (
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-green-200 bg-green-50/50">
                <CardContent className="flex items-center justify-center p-6">
                  <div className="text-center">
                    <div className="bg-green-100 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3 relative">
                      <Play className="h-6 w-6 text-green-600" />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Continue Session</h3>
                    <p className="text-sm text-muted-foreground">{activeSessions.length} active session{activeSessions.length > 1 ? 's' : ''}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* View Hand History */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <History className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Hand History</h3>
                  <p className="text-sm text-muted-foreground">Review your past hands</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeSessions.length} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hands</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHands}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all sessions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hands Won</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{mockHandsWon}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalHands > 0 ? Math.round((mockHandsWon / totalHands) * 100) : 0}% win rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hands Lost</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{mockHandsLost}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalHands > 0 ? Math.round((mockHandsLost / totalHands) * 100) : 0}% lost
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Sessions</h2>
            {sessions.length > 0 && (
              <Button variant="outline" size="sm">
                View All
              </Button>
            )}
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