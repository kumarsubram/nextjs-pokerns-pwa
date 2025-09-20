'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, MessageCircle, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SharedHandService } from '@/services/shared-hand.service';
import { SharedHand } from '@/types/poker-v2';
import { cn } from '@/lib/utils';

export default function TrackedHandsList() {
  const router = useRouter();
  const [trackedHands, setTrackedHands] = useState<SharedHand[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'discussed'>('recent');

  useEffect(() => {
    loadTrackedHands();
    // Poll for updates
    const interval = setInterval(loadTrackedHands, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadTrackedHands = () => {
    const hands = SharedHandService.getAllSharedHands();
    setTrackedHands(hands);
  };

  const getSortedHands = () => {
    const sorted = [...trackedHands];
    switch (sortBy) {
      case 'recent':
        return sorted.sort((a, b) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime());
      case 'popular':
        return sorted.sort((a, b) => b.views - a.views);
      case 'discussed':
        return sorted.sort((a, b) => b.comments.length - a.comments.length);
      default:
        return sorted;
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


  const sortedHands = getSortedHands();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="p-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Tracked Hands</h1>
        </div>
      </div>

      {/* Sort Tabs */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex gap-1">
          <button
            onClick={() => setSortBy('recent')}
            className={cn(
              "px-3 py-1.5 rounded text-sm font-medium transition-colors",
              sortBy === 'recent'
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Calendar className="h-3 w-3 inline mr-1" />
            Recent
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={cn(
              "px-3 py-1.5 rounded text-sm font-medium transition-colors",
              sortBy === 'popular'
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <TrendingUp className="h-3 w-3 inline mr-1" />
            Popular
          </button>
          <button
            onClick={() => setSortBy('discussed')}
            className={cn(
              "px-3 py-1.5 rounded text-sm font-medium transition-colors",
              sortBy === 'discussed'
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <MessageCircle className="h-3 w-3 inline mr-1" />
            Discussed
          </button>
        </div>
      </div>

      {/* Hands List */}
      <div className="p-4 max-w-4xl mx-auto">
        {sortedHands.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 mb-2">No tracked hands yet</p>
              <p className="text-sm text-gray-400">Track hands for personal analysis!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedHands.map((hand) => (
              <Card
                key={hand.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/tracked/${hand.id}`)}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{hand.username}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{formatDate(hand.sharedAt)}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {hand.sessionMetadata.sessionName} • Hand #{hand.handData.handNumber}
                      </div>
                    </div>
                    {hand.handData.result?.potWon !== undefined && hand.handData.result?.handOutcome && (
                      <span className={`font-medium text-sm ${
                        hand.handData.result.handOutcome === 'won'
                          ? 'text-green-600'
                          : hand.handData.result.handOutcome === 'lost'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                        {hand.handData.result.handOutcome === 'won'
                          ? `Won ${hand.handData.result.potWon}`
                          : hand.handData.result.handOutcome === 'lost'
                          ? `Lost ${hand.handData.result.potWon}`
                          : 'Folded'
                        }
                      </span>
                    )}
                  </div>

                  {/* Cards and Details */}
                  <div className="flex items-center gap-4 mb-2">
                    {/* Hero Cards */}
                    {hand.handData.userCards && (
                      <div className="flex gap-1">
                        <span className={cn(
                          "text-sm font-bold",
                          hand.handData.userCards[0]?.includes('♥') || hand.handData.userCards[0]?.includes('♦')
                            ? "text-red-600"
                            : "text-gray-800"
                        )}>
                          {hand.handData.userCards[0]}
                        </span>
                        <span className={cn(
                          "text-sm font-bold",
                          hand.handData.userCards[1]?.includes('♥') || hand.handData.userCards[1]?.includes('♦')
                            ? "text-red-600"
                            : "text-gray-800"
                        )}>
                          {hand.handData.userCards[1]}
                        </span>
                      </div>
                    )}

                    {/* Game Info */}
                    <div className="text-xs text-gray-600">
                      {hand.sessionMetadata.gameType} • {hand.sessionMetadata.tableSeats} handed • {hand.sessionMetadata.userSeat}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {hand.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {hand.comments.length} comments
                    </span>
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