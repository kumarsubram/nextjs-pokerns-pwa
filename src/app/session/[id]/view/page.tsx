'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSessions } from '@/hooks/useSessions';
import { HandsService } from '@/services/hands.service';
import { Session, Hand } from '@/types/poker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, DollarSign, MapPin, Trophy, Clock, Users, Target } from 'lucide-react';
import { format } from 'date-fns';

export default function SessionViewPage() {
  const router = useRouter();
  const params = useParams();
  const { sessions } = useSessions();
  const [session, setSession] = useState<Session | null>(null);
  const [hands, setHands] = useState<Hand[]>([]);
  const [loading, setLoading] = useState(true);

  const sessionId = params.id as string;

  useEffect(() => {
    const loadSessionData = async () => {
      const foundSession = sessions.find(s => s.id === sessionId);
      if (foundSession) {
        setSession(foundSession);
        
        // Load hands for this session
        const sessionHands = await HandsService.getHandsForSession(sessionId);
        setHands(sessionHands);
      }
      setLoading(false);
    };

    loadSessionData();
  }, [sessions, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Loading session...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Session Not Found</h1>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isActive = !session.endTime;
  const duration = session.endTime 
    ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 / 60)
    : Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000 / 60);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format hand data for display
  const formatHandAction = (hand: Hand) => {
    const preflopAction = hand.heroActions.preflop;
    const flopAction = hand.heroActions.flop;
    const turnAction = hand.heroActions.turn;
    const riverAction = hand.heroActions.river;
    
    // Get the most significant action
    if (riverAction) return riverAction;
    if (turnAction) return turnAction;
    if (flopAction) return flopAction;
    return preflopAction;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="ml-2">Back</span>
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{session.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  session.type === 'tournament' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {session.type === 'tournament' ? <Trophy className="h-3 w-3 mr-1" /> : <DollarSign className="h-3 w-3 mr-1" />}
                  {session.type}
                </span>
                {isActive && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Active
                  </span>
                )}
              </div>
            </div>
            {isActive && (
              <Button
                onClick={() => router.push(`/session/${session.id}`)}
                className="bg-green-600 hover:bg-green-700"
              >
                Continue Session
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-6">
        {/* Session Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Started</p>
                  <p className="text-lg font-bold">{format(new Date(session.startTime), 'MMM d, yyyy')}</p>
                  <p className="text-sm text-gray-500">{format(new Date(session.startTime), 'h:mm a')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Duration</p>
                  <p className="text-lg font-bold">{formatDuration(duration)}</p>
                  <p className="text-sm text-gray-500">{isActive ? 'Ongoing' : 'Completed'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Hands Played</p>
                  <p className="text-lg font-bold">{session.totalHands}</p>
                  <p className="text-sm text-gray-500">Total hands</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Buy-in</p>
                  <p className="text-lg font-bold">${session.buyIn}</p>
                  <p className="text-sm text-gray-500">Initial stake</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-indigo-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Table Size</p>
                  <p className="text-lg font-bold">{session.seats} seats</p>
                  <p className="text-sm text-gray-500">Max players</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {session.profit !== undefined && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Profit/Loss</p>
                    <p className={`text-lg font-bold ${
                      session.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {session.profit >= 0 ? '+' : ''}${session.profit}
                    </p>
                    <p className="text-sm text-gray-500">Net result</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {session.location && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center">
                <MapPin className="h-6 w-6 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Location</p>
                  <p className="text-lg">{session.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hand History */}
        <Card>
          <CardHeader>
            <CardTitle>Hand History ({hands.length} hands)</CardTitle>
          </CardHeader>
          <CardContent>
            {hands.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hands recorded yet. Play some hands to see them here!
              </div>
            ) : (
              <div className="space-y-2">
                {hands.map((hand) => (
                  <div key={hand.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm font-medium w-12">#{hand.handNumber}</span>
                      <span className="text-sm text-gray-600">
                        {format(new Date(hand.timestamp), 'h:mm a')}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {hand.heroPosition}
                      </span>
                      {hand.holeCards.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">
                          {hand.holeCards.join(' ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 capitalize">
                        {formatHandAction(hand)}
                      </span>
                      <span className={`text-sm font-medium ${
                        hand.result === 'won' ? 'text-green-600' : 
                        hand.result === 'lost' ? 'text-red-600' : 
                        'text-gray-600'
                      }`}>
                        {hand.result === 'won' && hand.amountWon ? `+$${hand.amountWon}` : 
                         hand.result === 'lost' ? `-$${hand.potSize}` : 
                         hand.result === 'folded' ? 'folded' : 
                         hand.result}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {session.notes && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{session.notes}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}