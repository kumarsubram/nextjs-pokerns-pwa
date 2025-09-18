'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Eye, MessageCircle, Trash2, User, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HandHistory } from '@/components/poker/HandHistory';
import { SharedHandService } from '@/services/shared-hand.service';
import { SharedHand } from '@/types/poker-v2';

export default function SharedHandPage() {
  const router = useRouter();
  const params = useParams();
  const handId = params.id as string;

  const [sharedHand, setSharedHand] = useState<SharedHand | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');

  useEffect(() => {
    if (!handId) return;

    // Load shared hand
    const loadSharedHand = () => {
      const hand = SharedHandService.getSharedHand(handId);
      if (!hand) {
        router.push('/');
        return;
      }

      // Increment view count
      SharedHandService.incrementViews(handId);
      setSharedHand(hand);
      setLoading(false);
    };

    // Check if user has a username
    const username = SharedHandService.getCurrentUsername();
    if (username !== 'Anonymous') {
      setCurrentUser(username);
      setIsUsernameSet(true);
    }

    loadSharedHand();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      const updatedHand = SharedHandService.getSharedHand(handId);
      if (updatedHand) {
        setSharedHand(updatedHand);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [handId, router]);

  const handleSetUsername = () => {
    if (usernameInput.trim()) {
      SharedHandService.setUsername(usernameInput.trim());
      setCurrentUser(usernameInput.trim());
      setIsUsernameSet(true);
      setUsernameInput('');
    }
  };

  const handleAddComment = () => {
    if (commentText.trim() && sharedHand) {
      SharedHandService.addComment(handId, commentText);
      setCommentText('');
      // Reload hand to get updated comments
      const updatedHand = SharedHandService.getSharedHand(handId);
      if (updatedHand) {
        setSharedHand(updatedHand);
      }
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (SharedHandService.deleteComment(handId, commentId)) {
      // Reload hand to get updated comments
      const updatedHand = SharedHandService.getSharedHand(handId);
      if (updatedHand) {
        setSharedHand(updatedHand);
      }
    }
  };

  const handleUnshare = () => {
    if (window.confirm('Are you sure you want to unshare this hand? This will remove it from the shared list and delete all comments.')) {
      if (SharedHandService.unshareHand(handId)) {
        router.push('/shared');
      } else {
        alert('You can only unshare hands you shared');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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

  if (!sharedHand) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Hand not found</p>
          <Button onClick={() => router.push('/')} className="mt-4">
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
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="p-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Shared Hand by {sharedHand.username}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{sharedHand.sessionMetadata.sessionName}</span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {sharedHand.views} views
              </span>
            </div>
          </div>
          {/* Unshare button for owner */}
          {sharedHand.username === currentUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnshare}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Unshare
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Game Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Game Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Type:</span> {sharedHand.sessionMetadata.gameType}
              </div>
              <div>
                <span className="text-gray-600">Table:</span> {sharedHand.sessionMetadata.tableSeats} handed
              </div>
              <div>
                <span className="text-gray-600">Hero Seat:</span> {sharedHand.sessionMetadata.userSeat}
              </div>
              <div>
                <span className="text-gray-600">Shared:</span> {formatDate(sharedHand.sharedAt)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hand History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hand #{sharedHand.handData.handNumber}</CardTitle>
          </CardHeader>
          <CardContent>
            <HandHistory
              completedHands={[sharedHand.handData]}
              userSeat={sharedHand.sessionMetadata.userSeat}
              className="space-y-3"
            />
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Comments ({sharedHand.comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Username Setup */}
            {!isUsernameSet && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-gray-700 mb-2">Set your username to comment:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSetUsername()}
                    placeholder="Enter username"
                    className="flex-1 px-3 py-1.5 border rounded text-sm"
                    maxLength={20}
                  />
                  <Button
                    size="sm"
                    onClick={handleSetUsername}
                    disabled={!usernameInput.trim()}
                  >
                    Set Username
                  </Button>
                </div>
              </div>
            )}

            {/* Comment Input */}
            {isUsernameSet && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder={`Comment as ${currentUser}...`}
                  className="flex-1 px-3 py-2 border rounded"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                >
                  Post
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {sharedHand.comments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
              ) : (
                sharedHand.comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{comment.username}</p>
                          <p className="text-xs text-gray-500">{formatDate(comment.timestamp)}</p>
                        </div>
                      </div>
                      {comment.username === currentUser && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 hover:bg-red-100 rounded"
                          title="Delete comment"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 ml-10">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}