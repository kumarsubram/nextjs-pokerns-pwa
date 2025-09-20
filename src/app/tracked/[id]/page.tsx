'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HandHistory } from '@/components/poker/HandHistory';
import { SharedHandService } from '@/services/shared-hand.service';
import { SharedHand } from '@/types/poker-v2';

export default function TrackedHandPage() {
  const router = useRouter();
  const params = useParams();
  const handId = params.id as string;

  const [trackedHand, setTrackedHand] = useState<SharedHand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!handId) return;

    // Load tracked hand
    const loadTrackedHand = () => {
      const hand = SharedHandService.getSharedHand(handId);
      if (!hand) {
        router.push('/tracked');
        return;
      }

      // Increment view count
      SharedHandService.incrementViews(handId);
      setTrackedHand(hand);
      setLoading(false);
    };

    loadTrackedHand();
  }, [handId, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading hand...</div>
      </div>
    );
  }

  if (!trackedHand) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Hand not found</div>
          <Button onClick={() => router.push('/tracked')}>
            Back to Tracked Hands
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
            onClick={() => router.push('/tracked')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Tracked Hand by {trackedHand.username}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{trackedHand.sessionMetadata.sessionName}</span>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {trackedHand.views} views
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Hand Metadata */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Game Type</div>
                <span className="font-medium">{trackedHand.sessionMetadata.gameType}</span>
              </div>
              <div>
                <div className="text-gray-500">Table Size</div>
                <span className="font-medium">{trackedHand.sessionMetadata.tableSeats}-handed</span>
              </div>
              <div>
                <div className="text-gray-500">Hero Position</div>
                <span className="font-medium">{trackedHand.sessionMetadata.userSeat}</span>
              </div>
              <div>
                <div className="text-gray-500">Tracked</div>
                <span className="font-medium">{formatDate(trackedHand.sharedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hand Details */}
        <HandHistory
          completedHands={[trackedHand.handData]}
          userSeat={trackedHand.sessionMetadata.userSeat}
          className="space-y-3"
          defaultExpanded={true}
          hideShareButtons={true}
        />
      </div>
    </div>
  );
}