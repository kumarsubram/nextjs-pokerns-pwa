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
      <main className="container max-w-4xl mx-auto px-4 py-6">
        {/* Hand Info Header */}
        <Card className="mb-4">
          <CardContent className="p-4">
            {/* Top Row - Navigation Buttons */}
            <div className="flex justify-between items-center mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/tracked')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Tracked
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400"
                onClick={() => {
                  TrackedHandService.removeTrackedHand(trackedHand.sessionId, trackedHand.handNumber);
                  router.push('/tracked');
                }}
              >
                Remove from Tracked
              </Button>
            </div>

            {/* Session Details */}
            <div className="space-y-2">
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
      </main>
    </div>
  );
}