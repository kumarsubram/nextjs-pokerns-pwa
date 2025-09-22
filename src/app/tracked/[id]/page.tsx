'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HandHistory } from '@/components/poker/HandHistory';
import { HandReplay } from '@/components/poker/HandReplay';
import { TrackedHandService, TrackedHand } from '@/services/tracked-hand.service';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TrackedHandDetail() {
  const params = useParams();
  const router = useRouter();
  const trackId = params?.id as string;
  const [trackedHand, setTrackedHand] = useState<TrackedHand | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  useEffect(() => {
    if (!trackId) {
      router.push('/tracked');
      return;
    }

    // Load the specific tracked hand
    const hands = TrackedHandService.getTrackedHands();
    const hand = hands.find(h => h.trackId === trackId);

    if (!hand) {
      // Try to find by sessionId_handNumber format for backward compatibility
      const [sessionId, , handNumberStr] = trackId.split('_');
      const handNumber = parseInt(handNumberStr);
      const foundHand = hands.find(h => h.sessionId === sessionId && h.handNumber === handNumber);

      if (foundHand) {
        setTrackedHand(foundHand);
      } else {
        router.push('/tracked');
      }
    } else {
      setTrackedHand(hand);
    }
  }, [trackId, router]);

  if (!trackedHand) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
        <div className="bg-white border-b px-4 py-4">
          <h1 className="text-xl font-bold">Loading...</h1>
        </div>
        <div className="p-4">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">Loading hand details...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      <main className="container max-w-4xl mx-auto px-4 pt-2 pb-6">
        {/* Hand Info Header */}
        <Card className="mb-4">
          <CardContent className="p-0">
            {/* Top Row - Navigation Buttons - Always in same row */}
            <div className="flex flex-row gap-2 px-3">
              <Button
                variant="outline"
                onClick={() => router.push('/tracked')}
                className="flex items-center justify-center gap-2 text-sm px-4 py-3 h-12 flex-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>

              {!showReplay && (
                <Button
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 text-sm px-4 py-3 h-12 flex-1"
                  onClick={() => setShowReplay(true)}
                >
                  <Play className="h-4 w-4" />
                  <span>Replay</span>
                </Button>
              )}

              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400 flex items-center justify-center gap-2 text-sm px-4 py-3 h-12 flex-1"
                onClick={() => {
                  TrackedHandService.removeTrackedHand(trackedHand.sessionId, trackedHand.handNumber);
                  router.push('/tracked');
                }}
              >
                <span>Remove</span>
              </Button>
            </div>

            {/* Session Details Dropdown */}
            <div className={`flex items-center justify-between px-3 mt-2 ${showSessionDetails ? '' : 'pb-0'}`}>
              <span className="text-base font-medium text-gray-700">Session Details</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSessionDetails(!showSessionDetails)}
                className="h-7 w-7 p-0 rounded-full"
              >
                {showSessionDetails ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>

            {showSessionDetails && (
              <div className="px-3 space-y-1">
                <div className="text-sm text-gray-600">
                  <span className="font-bold">Session Name:</span> {trackedHand.sessionName}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-bold">Game Type:</span> {trackedHand.tableSeats} handed
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-bold">Position:</span> {trackedHand.userSeat}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-bold">Tracked Time:</span> {formatDate(trackedHand.trackedAt)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conditional Content: Show either Hand History or Replay */}
        {showReplay ? (
          <HandReplay
            trackedHand={trackedHand}
            onClose={() => setShowReplay(false)}
          />
        ) : (
          <>
            {/* Hand Details using HandHistory Component */}
            <div className="bg-white rounded-lg shadow-sm">
              <HandHistory
                completedHands={[trackedHand]}
                userSeat={trackedHand.userSeat}
                defaultExpanded={true}
                hideShareButtons={false}
                showCustomShareInTracked={true}
              />
            </div>

            {/* Navigation Options */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="text-center">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto text-base h-14"
                    onClick={() => router.push(`/session/${trackedHand.sessionId}/history`)}
                  >
                    View Full Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}