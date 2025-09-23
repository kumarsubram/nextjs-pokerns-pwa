'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeleteAllTrackedDialog } from '@/components/dialog/DeleteAllTrackedDialog';
import { TrackedHandService, TrackedHand } from '@/services/tracked-hand.service';
import { cn } from '@/lib/utils';

export default function TrackedHandsList() {
  const router = useRouter();
  const [trackedHands, setTrackedHands] = useState<TrackedHand[]>([]);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  useEffect(() => {
    loadTrackedHands();
  }, []);

  const loadTrackedHands = () => {
    const hands = TrackedHandService.getTrackedHands();
    setTrackedHands(hands);
  };

  const handleRemoveTracked = (trackId: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!trackId) return;

    const removed = TrackedHandService.removeTrackedHandById(trackId);
    if (removed) {
      loadTrackedHands();
    }
  };

  const handleDeleteAll = () => {
    setDeleteAllDialogOpen(true);
  };

  const confirmDeleteAll = () => {
    TrackedHandService.clearAllTrackedHands();
    setTrackedHands([]);
  };


  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      {/* Page Title */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Tracked Hands</h1>
          {trackedHands.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAll}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              Untrack All
            </Button>
          )}
        </div>
      </div>

      {/* Hands List */}
      <div className="p-4 max-w-4xl mx-auto">
        {trackedHands.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="flex justify-center mb-4">
                <Share2 className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2 text-lg">No tracked hands yet</p>
              <p className="text-sm text-gray-400">
                Track hands from your sessions to view them offline later
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {trackedHands.length} tracked {trackedHands.length === 1 ? 'hand' : 'hands'}
              </div>
              <div className="text-xs text-gray-400 italic">
                Click any hand to see details
              </div>
            </div>
            {trackedHands.map((hand) => (
              <div
                key={hand.trackId}
                className="bg-white border rounded-lg p-3"
              >
                {/* Top Row: Session Name + Untrack Button */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-gray-900 truncate flex-1 mr-2">
                    {hand.sessionName}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTracked(hand.trackId, e);
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 h-7 px-2 text-xs flex-shrink-0"
                  >
                    Untrack
                  </Button>
                </div>

                {/* Bottom Row: Cards + Result + Amount */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => router.push(`/tracked/${hand.trackId}`)}
                >
                  {/* Hero Cards - Left */}
                  <div className="flex gap-1.5">
                    {hand.userCards && hand.userCards[0] && hand.userCards[1] ? (
                      <>
                        <div className={cn(
                          "w-10 h-14 rounded-lg border-2 text-sm font-bold flex items-center justify-center shadow-md",
                          hand.userCards[0].includes('♥') || hand.userCards[0].includes('♦')
                            ? 'bg-white border-gray-800 text-red-600'
                            : 'bg-white border-gray-800 text-gray-800'
                        )}>
                          {hand.userCards[0]}
                        </div>
                        <div className={cn(
                          "w-10 h-14 rounded-lg border-2 text-sm font-bold flex items-center justify-center shadow-md",
                          hand.userCards[1].includes('♥') || hand.userCards[1].includes('♦')
                            ? 'bg-white border-gray-800 text-red-600'
                            : 'bg-white border-gray-800 text-gray-800'
                        )}>
                          {hand.userCards[1]}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No cards</span>
                    )}
                  </div>

                  {/* Result + Amount - Right */}
                  {hand.result && (
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-base font-semibold",
                        hand.result.handOutcome === 'won' ? 'text-green-600' :
                        hand.result.handOutcome === 'lost' ? 'text-red-600' :
                        hand.result.handOutcome === 'folded' ? 'text-gray-600' :
                        'text-yellow-600'
                      )}>
                        {hand.result.handOutcome === 'won' ? 'Won' :
                         hand.result.handOutcome === 'lost' ? 'Lost' :
                         hand.result.handOutcome === 'folded' ? 'Fold' :
                         'Chop'}
                      </span>
                      {hand.result.potWon !== undefined && hand.result.potWon > 0 && (
                        <span className={cn(
                          "text-lg font-bold",
                          hand.result.handOutcome === 'won' ? 'text-green-700' :
                          hand.result.handOutcome === 'lost' ? 'text-red-700' :
                          'text-gray-900'
                        )}>
                          {hand.result.potWon}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete All Dialog */}
      <DeleteAllTrackedDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
        onConfirm={confirmDeleteAll}
        count={trackedHands.length}
      />
    </div>
  );
}