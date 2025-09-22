'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HandHistory } from '@/components/poker/HandHistory';
import { TrackedHandService, TrackedHand } from '@/services/tracked-hand.service';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TrackedHandDetail() {
  const params = useParams();
  const router = useRouter();
  const trackId = params?.id as string;
  const [trackedHand, setTrackedHand] = useState<TrackedHand | null>(null);

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
      {/* Page Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/tracked')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="ml-2">Back</span>
          </Button>
          <h1 className="text-xl font-bold">Hand #{trackedHand.handNumber}</h1>
        </div>
      </div>

      <main className="container max-w-4xl mx-auto px-4 py-6">
        {/* Hand Info Header */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-lg font-semibold mb-1">
                  {trackedHand.sessionName}
                </h2>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Hand #{trackedHand.handNumber}</div>
                  <div>{trackedHand.tableSeats} handed • Position: {trackedHand.userSeat}</div>
                  <div className="text-xs text-gray-500">
                    Tracked on {formatDate(trackedHand.trackedAt)}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/tracked')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Tracked
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hand Details using HandHistory Component */}
        <div className="bg-white rounded-lg shadow-sm">
          <HandHistory
            completedHands={[trackedHand]}
            userSeat={trackedHand.userSeat}
            defaultExpanded={true}
            hideShareButtons={true}
          />
        </div>

        {/* Navigation Options */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push(`/session/${trackedHand.sessionId}`)}
              >
                View Full Session
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  TrackedHandService.removeTrackedHand(trackedHand.sessionId, trackedHand.handNumber);
                  router.push('/tracked');
                }}
              >
                Remove from Tracked
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}