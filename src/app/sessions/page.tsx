'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessions } from '@/hooks/useSessions';
import { Session } from '@/types/poker';
import { CURRENCY_SYMBOLS } from '@/types/poker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  DollarSign, 
  Trash2, 
  Play, 
  Users, 
  MapPin,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function SessionsPage() {
  const router = useRouter();
  const { sessions, loading, deleteSession } = useSessions();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(session => {
    // Apply status filter
    const statusMatch = filter === 'all' || 
      (filter === 'active' && !session.endTime) ||
      (filter === 'completed' && session.endTime);

    // Apply search filter
    const searchMatch = searchQuery === '' || 
      session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.location && session.location.toLowerCase().includes(searchQuery.toLowerCase()));

    return statusMatch && searchMatch;
  });

  const handleDeleteSession = async (session: Session) => {
    const confirmed = confirm(`Are you sure you want to delete "${session.name}"?`);
    if (confirmed) {
      try {
        await deleteSession(session.id);
      } catch (error) {
        console.error('Failed to delete session:', error);
        alert('Failed to delete session. Please try again.');
      }
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
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
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              Active ({sessions.filter(s => !s.endTime).length})
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
              className={filter === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
            >
              Completed ({sessions.filter(s => s.endTime).length})
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
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => router.push('/create-session')}
                >
                  Create First Session
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {filteredSessions.map((session) => (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{session.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.endTime 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {session.endTime ? 'Completed' : 'Active'}
                        </div>
                        <span className="text-sm text-gray-500 capitalize">{session.type}</span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/session/${session.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {!session.endTime && (
                          <DropdownMenuItem onClick={() => router.push(`/session/${session.id}`)}>
                            <Play className="h-4 w-4 mr-2" />
                            Continue Session
                          </DropdownMenuItem>
                        )}
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
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <div className="text-sm text-gray-500">Duration</div>
                      <div className="font-semibold text-sm">{formatDuration(session.startTime, session.endTime)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Buy-in</div>
                      <div className="font-semibold text-sm">{CURRENCY_SYMBOLS[session.currency || 'USD']}{session.buyIn}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Blinds</div>
                      <div className="font-semibold text-sm">{CURRENCY_SYMBOLS[session.currency || 'USD']}{session.smallBlind || '1'}/{session.bigBlind || '2'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Hands</div>
                      <div className="font-semibold text-sm">{session.totalHands}</div>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(session.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{session.seats} seats</span>
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
                    {session.endTime ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => router.push(`/session/${session.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        className="w-full bg-emerald-500 hover:bg-emerald-600"
                        onClick={() => router.push(`/session/${session.id}`)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Continue Session
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}