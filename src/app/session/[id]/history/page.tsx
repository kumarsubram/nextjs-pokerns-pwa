'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Users, Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HandHistory } from '@/components/poker/HandHistory';
import { SessionService } from '@/services/session.service';
import { SessionMetadata, StoredHand } from '@/types/poker-v2';

export default function SessionHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionMetadata | null>(null);
  const [hands, setHands] = useState<StoredHand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const loadSessionHistory = () => {
      try {
        // Load session metadata
        const sessionMetadata = SessionService.getSessionMetadata(sessionId);
        if (!sessionMetadata) {
          router.push('/sessions');
          return;
        }

        setSession(sessionMetadata);

        // Load completed hands
        const sessionHands = SessionService.getSessionHands(sessionId);
        setHands(sessionHands);
      } catch (error) {
        console.error('Failed to load session history:', error);
        router.push('/sessions');
      } finally {
        setLoading(false);
      }
    };

    loadSessionHistory();
  }, [sessionId, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return 'Unknown';
    return duration;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
          <p className="text-gray-600">Loading session history...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Session not found</p>
          <Button
            onClick={() => router.push('/sessions')}
            className="mt-4"
          >
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/sessions')}
            className="p-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{session.sessionName}</h1>
            <p className="text-sm text-gray-600">Session History</p>
          </div>
        </div>
      </div>

      {/* Session Summary */}
      <div className="p-4 max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Session Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Session Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-blue-600">{session.totalHands}</div>
                <div className="text-xs md:text-sm text-gray-600">Total Hands</div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-green-600">${session.buyIn}</div>
                <div className="text-xs md:text-sm text-gray-600">Buy-in</div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-purple-600">{formatDuration(session.totalDuration)}</div>
                <div className="text-xs md:text-sm text-gray-600">Duration</div>
              </div>
              <div className="text-center">
                <div className={`text-lg md:text-2xl font-bold ${
                  session.result?.startsWith('+') ? 'text-green-600' :
                  session.result?.startsWith('-') ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {session.result || '$0'}
                </div>
                <div className="text-xs md:text-sm text-gray-600">Net Result</div>
              </div>
            </div>

            {/* Session Details */}
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                <span>{formatDate(session.startTime)} at {formatTime(session.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                <Users className="h-3 w-3 md:h-4 md:w-4" />
                <span>{session.tableSeats} handed {session.gameType.toLowerCase()}</span>
              </div>
              {session.location && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{session.location}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hand History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Hand by Hand History</CardTitle>
            <p className="text-sm text-gray-600">
              Click on any hand to expand and view detailed action log
            </p>
          </CardHeader>
          <CardContent>
            {hands.length > 0 ? (
              <HandHistory
                currentHand={null}
                completedHands={hands}
                userSeat={session.userSeat}
                className="space-y-3"
              />
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <Clock className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-600">No hands found in this session</p>
                <p className="text-sm text-gray-500 mt-1">
                  This might be because the session was created but no hands were played.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}