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
import { Plus, TrendingUp, Trophy, DollarSign, Activity } from 'lucide-react';

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
  const totalProfit = sessions.reduce((sum, s) => sum + (s.profit || 0), 0);
  const totalHands = sessions.reduce((sum, s) => sum + s.totalHands, 0);

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
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Poker Notes</h1>
            <OnlineStatusIndicator />
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Session
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
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSessions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hands</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHands}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profit/Loss</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalProfit >= 0 ? '+' : ''}${Math.abs(totalProfit)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No sessions yet. Start your first session to begin tracking!
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
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