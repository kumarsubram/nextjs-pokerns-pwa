'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionService } from '@/services/session.service';
import { SessionMetadata } from '@/types/poker-v2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  Clock,
  Trash2,
  Play,
  Users,
  MapPin,
  Search,
  MoreVertical,
  Eye,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<SessionMetadata | null>(null);

  useEffect(() => {
    const loadSessions = () => {
      try {
        const allSessions = SessionService.getSessionList();
        setSessions(allSessions);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const filteredSessions = sessions.filter(session => {
    // Apply status filter
    const statusMatch = filter === 'all' ||
      (filter === 'active' && session.status === 'active') ||
      (filter === 'completed' && session.status === 'completed');

    // Apply search filter
    const searchMatch = searchQuery === '' ||
      session.sessionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.location && session.location.toLowerCase().includes(searchQuery.toLowerCase()));

    return statusMatch && searchMatch;
  });

  const handleDeleteSession = (session: SessionMetadata) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSession = () => {
    if (sessionToDelete) {
      try {
        SessionService.deleteSession(sessionToDelete.sessionId);
        setSessions(prev => prev.filter(s => s.sessionId !== sessionToDelete.sessionId));
        setDeleteDialogOpen(false);
        setSessionToDelete(null);
      } catch (error) {
        console.error('Failed to delete session:', error);
        // Keep dialog open and show error in console for now
      }
    }
  };

  const handleDeleteAllSessions = () => {
    setDeleteAllDialogOpen(true);
  };

  const confirmDeleteAllSessions = () => {
    setDeleteAllDialogOpen(false);
    setDeleteAllConfirmOpen(true);
  };

  const finalConfirmDeleteAll = () => {
    try {
      SessionService.deleteAllSessions();
      setSessions([]);
      setDeleteAllConfirmOpen(false);
    } catch (error) {
      console.error('Failed to delete all sessions:', error);
      // Keep dialog open and show error in console for now
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  const activeSessions = sessions.filter(s => s.status === 'active');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <div className="flex items-center gap-2">
          {sessions.length > 0 && (
            <Button
              variant="outline"
              onClick={handleDeleteAllSessions}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 px-2 sm:px-4"
              size="sm"
            >
              <Trash2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Delete All</span>
            </Button>
          )}
          <Button
            onClick={() => router.push('/create-session')}
            className="bg-emerald-500 hover:bg-emerald-600 px-2 sm:px-4"
            size="sm"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">New Session</span>
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
          >
            All ({sessions.length})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
            className={filter === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
          >
            Active ({activeSessions.length})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
            className={filter === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
          >
            Completed ({completedSessions.length})
          </Button>
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="bg-muted rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || filter !== 'all' ? 'No sessions found' : 'No sessions yet'}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first poker session to get started tracking your games.'
              }
            </p>
            {(!searchQuery && filter === 'all') && (
              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600"
                onClick={() => router.push('/create-session')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Session
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filteredSessions.map((session) => (
            <Card key={session.sessionId} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{session.sessionName}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'completed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {session.status === 'completed' ? 'Completed' : 'Active'}
                      </div>
                      <span className="text-sm text-gray-500 capitalize">{session.gameType}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Quick Delete Icon */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session);
                      }}
                      title="Delete Session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          if (session.status === 'active') {
                            router.push(`/session/${session.sessionId}`);
                          } else {
                            router.push(`/session/${session.sessionId}/history`);
                          }
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          {session.status === 'active' ? 'Continue Session' : 'View History'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteSession(session)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Session
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-sm text-gray-500">Duration</div>
                    <div className="font-semibold text-sm">{session.totalDuration || '0h 0m'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Buy-in</div>
                    <div className="font-semibold text-sm">${session.buyIn}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Hands</div>
                    <div className="font-semibold text-sm">{session.totalHands}</div>
                  </div>
                </div>

                {/* Result */}
                {session.result && (
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Result</div>
                    <div className={`font-semibold text-sm ${
                      session.result.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {session.result}
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(session.startTime)} at {formatTime(session.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{session.tableSeats} seats</span>
                  </div>
                  {session.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{session.location}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <Button
                    size="sm"
                    className={`w-full ${
                      session.status === 'active'
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                    onClick={() => {
                      if (session.status === 'active') {
                        router.push(`/session/${session.sessionId}`);
                      } else {
                        router.push(`/session/${session.sessionId}/history`);
                      }
                    }}
                  >
                    {session.status === 'active' ? (
                      <><Play className="h-4 w-4 mr-2" />Continue Session</>
                    ) : (
                      <><Eye className="h-4 w-4 mr-2" />View History</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Single Session Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{sessionToDelete?.sessionName}&quot;?
              <br /><br />
              This will permanently remove all hand data and session metadata. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSessionToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSession}
            >
              Delete Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Sessions Dialog */}
      <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete All Sessions</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete ALL sessions?
              <br /><br />
              This will permanently remove:
              <br />• {sessions.length} session{sessions.length !== 1 ? 's' : ''}
              <br />• All hand data
              <br />• All session metadata
              <br /><br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteAllDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAllSessions}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation Dialog for Delete All */}
      <Dialog open={deleteAllConfirmOpen} onOpenChange={setDeleteAllConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Final Warning</DialogTitle>
            <DialogDescription>
              This is your final warning. Delete ALL sessions permanently?
              <br /><br />
              <strong>This action cannot be undone!</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteAllConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={finalConfirmDeleteAll}
            >
              Delete All Sessions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}