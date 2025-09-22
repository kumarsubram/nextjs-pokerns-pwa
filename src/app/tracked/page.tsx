'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TrackedHandService, TrackedHand } from '@/services/tracked-hand.service';
import { cn } from '@/lib/utils';

export default function TrackedHandsList() {
  const router = useRouter();
  const [trackedHands, setTrackedHands] = useState<TrackedHand[]>([]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getCardColor = (card: string) => {
    if (!card || card === '?') return 'text-gray-800';
    const suit = card.slice(-1);
    return suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      {/* Page Title */}
      <div className="bg-white border-b px-4 py-4">
        <h1 className="text-xl font-bold">Tracked Hands</h1>
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
          <div className="space-y-3">
            <div className="mb-4 text-sm text-gray-600">
              {trackedHands.length} tracked {trackedHands.length === 1 ? 'hand' : 'hands'}
            </div>
            {trackedHands.map((hand) => (
              <Card
                key={hand.trackId}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/tracked/${hand.trackId}`)}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base">
                          Hand #{hand.handNumber}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">
                          {hand.sessionName}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          Tracked {formatDate(hand.trackedAt)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {hand.tableSeats} handed • Position: {hand.userSeat}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={(e) => handleRemoveTracked(hand.trackId, e)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Remove from tracked"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Cards and Result */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Hero Cards */}
                      {hand.userCards && hand.userCards[0] && hand.userCards[1] ? (
                        <div className="flex gap-1">
                          <span className={cn(
                            "text-sm font-bold px-2 py-1 bg-white border rounded",
                            getCardColor(hand.userCards[0])
                          )}>
                            {hand.userCards[0]}
                          </span>
                          <span className={cn(
                            "text-sm font-bold px-2 py-1 bg-white border rounded",
                            getCardColor(hand.userCards[1])
                          )}>
                            {hand.userCards[1]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic">No cards</span>
                      )}

                      {/* Community Cards */}
                      {hand.communityCards && (
                        <div className="flex gap-1">
                          {hand.communityCards.flop?.map((card, i) => card && (
                            <span key={`flop-${i}`} className={cn(
                              "text-xs font-semibold px-1.5 py-0.5 bg-gray-50 border rounded",
                              getCardColor(card)
                            )}>
                              {card}
                            </span>
                          ))}
                          {hand.communityCards.turn && (
                            <span className={cn(
                              "text-xs font-semibold px-1.5 py-0.5 bg-gray-50 border rounded",
                              getCardColor(hand.communityCards.turn)
                            )}>
                              {hand.communityCards.turn}
                            </span>
                          )}
                          {hand.communityCards.river && (
                            <span className={cn(
                              "text-xs font-semibold px-1.5 py-0.5 bg-gray-50 border rounded",
                              getCardColor(hand.communityCards.river)
                            )}>
                              {hand.communityCards.river}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Outcome */}
                    {hand.result && (
                      <span className={cn(
                        "text-sm font-medium px-3 py-1 rounded",
                        hand.result.handOutcome === 'won' ? 'bg-green-100 text-green-700' :
                        hand.result.handOutcome === 'lost' ? 'bg-red-100 text-red-700' :
                        hand.result.handOutcome === 'folded' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      )}>
                        {hand.result.handOutcome === 'won' ? `Won ${hand.result.potWon || 0}` :
                         hand.result.handOutcome === 'lost' ? `Lost ${hand.result.potWon || 0}` :
                         hand.result.handOutcome === 'folded' ? 'Folded' :
                         'Chopped'}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}