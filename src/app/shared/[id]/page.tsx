'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Eye, MessageCircle, Trash2, User, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [attemptedComment, setAttemptedComment] = useState('');

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
      setShowUsernameDialog(false);

      // If there was an attempted comment, post it now
      if (attemptedComment.trim()) {
        SharedHandService.addComment(handId, attemptedComment);
        setAttemptedComment('');
        setCommentText('');
        // Reload hand to get updated comments
        const updatedHand = SharedHandService.getSharedHand(handId);
        if (updatedHand) {
          setSharedHand(updatedHand);
        }
      }

      setUsernameInput('');
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !sharedHand) return;

    // If username not set, show dialog first
    if (!isUsernameSet) {
      setAttemptedComment(commentText);
      setShowUsernameDialog(true);
      return;
    }

    SharedHandService.addComment(handId, commentText);
    setCommentText('');
    // Reload hand to get updated comments
    const updatedHand = SharedHandService.getSharedHand(handId);
    if (updatedHand) {
      setSharedHand(updatedHand);
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
        {/* Game Info - Minimal Design */}
        <div className="bg-gray-50 rounded-lg p-2 mb-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs">
            <div className="text-center">
              <span className="text-gray-500 block">{sharedHand.sessionMetadata.gameType}</span>
            </div>
            <div className="text-center">
              <span className="text-gray-500 block">{sharedHand.sessionMetadata.tableSeats}-handed</span>
            </div>
            <div className="text-center">
              <span className="text-gray-500 block">Hero: {sharedHand.sessionMetadata.userSeat}</span>
            </div>
            <div className="text-center col-span-2 sm:col-span-1">
              <span className="text-gray-500 block text-xs">{formatDate(sharedHand.sharedAt)}</span>
            </div>
          </div>
        </div>

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
              defaultExpanded={true}
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
            {/* Comment Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder={isUsernameSet ? `Comment as ${currentUser}...` : "Add a comment..."}
                className="flex-1 px-3 py-2 border rounded"
              />
              <Button
                onClick={handleAddComment}
                disabled={!commentText.trim()}
              >
                Post
              </Button>
            </div>

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

      {/* Username Setup Dialog */}
      <Dialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Your Username</DialogTitle>
            <DialogDescription>
              Choose a username to post comments and share hands. This will be saved for future use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetUsername()}
                placeholder="Enter your username"
                maxLength={20}
                autoFocus
              />
              <p className="text-sm text-gray-500">
                This username will be used across all shared hands and comments.
              </p>
            </div>
          </div>
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowUsernameDialog(false);
                setAttemptedComment('');
                setCommentText('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetUsername}
              disabled={!usernameInput.trim()}
            >
              Set Username & Comment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}