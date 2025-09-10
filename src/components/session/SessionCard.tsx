'use client';

import { Session } from '@/types/poker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, MapPin, Trophy, Clock, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SessionCardProps {
  session: Session;
  onEdit?: (session: Session) => void;
  onDelete?: (session: Session) => void;
  onView?: (session: Session) => void;
}

export function SessionCard({ session, onEdit, onDelete, onView }: SessionCardProps) {
  const isActive = !session.endTime;
  const duration = session.endTime 
    ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 / 60)
    : Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000 / 60);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Card className={`relative ${isActive ? 'border-green-500 bg-green-50/50' : ''}`}>
      {isActive && (
        <div className="absolute top-2 right-2">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{session.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(session)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(session)}>
                Edit Session
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(session)}
                className="text-red-600"
              >
                Delete Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex gap-2 mt-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            session.type === 'tournament' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {session.type === 'tournament' ? <Trophy className="h-3 w-3 mr-1" /> : <DollarSign className="h-3 w-3 mr-1" />}
            {session.type}
          </span>
          {isActive && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              Active
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          {format(new Date(session.startTime), 'MMM d, yyyy h:mm a')}
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-2" />
          Duration: {formatDuration(duration)}
        </div>
        
        {session.location && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            {session.location}
          </div>
        )}
        
        <div className="flex items-center text-sm text-muted-foreground">
          <DollarSign className="h-4 w-4 mr-2" />
          Buy-in: ${session.buyIn}
        </div>
        
        <div className="pt-2 flex justify-between items-center">
          <span className="text-sm font-medium">
            {session.totalHands} hands played
          </span>
          {session.profit !== undefined && (
            <span className={`text-sm font-bold ${
              session.profit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {session.profit >= 0 ? '+' : ''}${session.profit}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}