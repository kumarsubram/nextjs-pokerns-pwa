'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HandHistory } from '@/components/poker/HandHistory';
import { URLShareService } from '@/services/url-share.service';
import { StoredHand, Position } from '@/types/poker-v2';

function SharePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hand, setHand] = useState<StoredHand | null>(null);
  const [metadata, setMetadata] = useState<{
    sessionName: string;
    gameType: 'Tournament' | 'Cash Game';
    tableSeats: 6 | 9;
    userSeat: Position;
    username: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handData = searchParams.get('h');

    if (!handData) {
      setError('No hand data provided');
      setLoading(false);
      return;
    }

    try {
      const decompressed = URLShareService.decompressHandData(handData);
      if (decompressed) {
        setHand(decompressed.hand);
        setMetadata(decompressed.metadata);
      } else {
        setError('Invalid hand data');
      }
    } catch (err) {
      setError('Failed to load hand data');
      console.error('Error loading hand:', err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const handleCopyLink = async () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading shared hand...</p>
        </div>
      </div>
    );
  }

  if (error || !hand || !metadata) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Hand not found'}</p>
          <Button onClick={() => router.push('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="p-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                Shared by {metadata.username || 'Anonymous'}
              </h1>
              <p className="text-sm text-gray-600">
                {metadata.sessionName} • Hand #{hand.handNumber}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Game Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Game Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Type:</span> {metadata.gameType}
              </div>
              <div>
                <span className="text-gray-600">Table:</span> {metadata.tableSeats} handed
              </div>
              <div>
                <span className="text-gray-600">Hero Seat:</span> {metadata.userSeat}
              </div>
              {hand.result?.handOutcome && (
                <div>
                  <span className="text-gray-600">Outcome:</span>{' '}
                  <span className={
                    hand.result.handOutcome === 'won' ? 'text-green-600 font-medium' :
                    hand.result.handOutcome === 'lost' ? 'text-red-600 font-medium' :
                    'text-gray-600 font-medium'
                  }>
                    {hand.result.handOutcome.charAt(0).toUpperCase() + hand.result.handOutcome.slice(1)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hand Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hand #{hand.handNumber}</CardTitle>
          </CardHeader>
          <CardContent>
            <HandHistory
              completedHands={[hand]}
              userSeat={metadata.userSeat}
              className="space-y-3"
            />
          </CardContent>
        </Card>

        {/* Share Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Share2 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  This hand was shared via URL. The data is embedded in the link itself - no account or server storage needed!
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Anyone with this link can view the hand. Share it with friends or poker communities for discussion.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SharePageContent />
    </Suspense>
  );
}