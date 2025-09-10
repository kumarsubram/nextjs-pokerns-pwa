'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSessions } from '@/hooks/useSessions';
import { Session } from '@/types/poker';
import { PokerTable } from '@/components/poker/PokerTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Play, Pause, StopCircle, Clock, Users, DollarSign, Calendar } from 'lucide-react';

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const { sessions, updateSession } = useSessions();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const sessionId = params.id as string;

  useEffect(() => {
    if (sessions.length > 0 && sessionId) {
      const foundSession = sessions.find(s => s.id === sessionId);
      setSession(foundSession || null);
      setLoading(false);
    }
  }, [sessions, sessionId]);

  const handleEndSession = async () => {
    if (!session) return;
    
    const confirmed = confirm(`Are you sure you want to end "${session.name}"?`);
    if (confirmed) {
      await updateSession(session.id, { endTime: new Date() });
      router.push('/');
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Session not found</h2>
          <p className="text-muted-foreground mb-4">The session you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const isActive = !session.endTime;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="p-2 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:ml-2 sm:inline">Back</span>
              </Button>
              <h1 className="text-lg sm:text-xl font-bold truncate">{session.name}</h1>
              <div className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isActive ? 'ACTIVE' : 'ENDED'}
              </div>
            </div>
            
            {isActive && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndSession}
                className="shrink-0"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                End Session
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-6">
        {/* Session Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-lg font-bold">{formatDuration(session.startTime, session.endTime)}</div>
              <div className="text-sm text-gray-600">Duration</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-lg font-bold">{session.seats}</div>
              <div className="text-sm text-gray-600">Seats</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
              <div className="text-lg font-bold">${session.buyIn}</div>
              <div className="text-sm text-gray-600">Buy-in</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Play className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-lg font-bold">{session.totalHands}</div>
              <div className="text-sm text-gray-600">Hands</div>
            </CardContent>
          </Card>
        </div>

        {/* Table Layout */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Table Layout</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            <PokerTable
              seats={session.seats}
              showBlindSelection={false}
              showSeatSelection={false}
              smallBlindSeat={session.smallBlindPosition}
              bigBlindSeat={session.bigBlindPosition}
              selectedSeat={session.heroPosition}
              buttonSeat={session.buttonPosition || 0}
              dealerSeat={session.dealerPosition || 0}
              allowHeroAsBlind={true}
              showPositions={true}
              showCommunityCards={isActive}
              onCommunityCardSelect={(cardIndex, card) => {
                console.log(`Selected card ${card} for position ${cardIndex}`);
                // TODO: Handle community card selection
              }}
            />
            
            {/* Position Info */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto">
              {session.heroPosition !== undefined && (
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600">Your Seat</div>
                  <div className="text-lg font-bold text-emerald-600">#{session.heroPosition + 1}</div>
                </div>
              )}
              {session.smallBlindPosition !== undefined && (
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600">Small Blind</div>
                  <div className="text-lg font-bold text-blue-600">#{session.smallBlindPosition + 1}</div>
                </div>
              )}
              {session.bigBlindPosition !== undefined && (
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600">Big Blind</div>
                  <div className="text-lg font-bold text-orange-600">#{session.bigBlindPosition + 1}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Game Type</label>
                <div className="text-lg capitalize">{session.type}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Started</label>
                <div className="text-lg">{new Date(session.startTime).toLocaleString()}</div>
              </div>
              {session.location && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  <div className="text-lg">{session.location}</div>
                </div>
              )}
              {session.endTime && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Ended</label>
                  <div className="text-lg">{new Date(session.endTime).toLocaleString()}</div>
                </div>
              )}
            </div>
            
            {session.notes && (
              <div>
                <label className="text-sm font-medium text-gray-600">Notes</label>
                <div className="text-lg">{session.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hand Tracking Section - Placeholder for future implementation */}
        {isActive && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Hand Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Play className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Ready to track hands</h3>
                <p className="text-sm">Hand tracking interface will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}