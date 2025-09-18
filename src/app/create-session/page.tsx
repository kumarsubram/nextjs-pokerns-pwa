'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SessionService } from '@/services/session.service';
import { GameType, TableSeats } from '@/types/poker-v2';

export default function CreateSessionPage() {
  const router = useRouter();

  // Session configuration
  const [sessionName, setSessionName] = useState('');
  const [gameType, setGameType] = useState<GameType>('Tournament');
  const [tableSeats, setTableSeats] = useState<TableSeats>(9);
  const [buyIn, setBuyIn] = useState<number>(500);
  const [location, setLocation] = useState<string>('');

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeSessionName, setActiveSessionName] = useState<string>('');

  // Generate default session name on mount
  useEffect(() => {
    const nextNumber = parseInt(localStorage.getItem('lastSessionNumber') || '0') + 1;
    const now = new Date();
    const dateStr = now.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(',', '');
    setSessionName(`PS${nextNumber} - ${dateStr}`);
  }, []);

  const handleCreateSession = () => {
    if (!sessionName || buyIn <= 0) return;

    // Check if there's an active session
    const activeSession = SessionService.getCurrentSession();
    if (activeSession && activeSession.status === 'active') {
      // Show confirmation dialog
      setActiveSessionName(activeSession.sessionName);
      setShowConfirmDialog(true);
      return;
    }

    // Create new session directly if no active session
    createNewSession();
  };

  const createNewSession = () => {
    // End current session if exists
    const activeSession = SessionService.getCurrentSession();
    if (activeSession && activeSession.status === 'active') {
      SessionService.endCurrentSession();
    }

    const session = SessionService.createNewSession({
      sessionName,
      gameType,
      tableSeats,
      buyIn,
      location
    });

    // Navigate to the game screen
    router.push(`/session/${session.sessionId}`);
  };

  const isValid = () => {
    return sessionName && buyIn > 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="p-4 max-w-lg mx-auto space-y-2 md:space-y-6">
        {/* Session Configuration */}
        <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm">

          <div className="space-y-3 md:space-y-4">
            {/* Session Name */}
            <div>
              <Label htmlFor="session-name" className="text-xs">Session Name</Label>
              <Input
                id="session-name"
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="PS1 - 9 Sep 25 3:45pm"
                className="mt-1 h-9 text-sm"
              />
            </div>

            {/* Game Type & Table Size */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div>
                <Label htmlFor="game-type" className="text-xs">Game Type</Label>
                <Select
                  value={gameType}
                  onValueChange={(value) => setGameType(value as GameType)}
                >
                  <SelectTrigger id="game-type" className="mt-1 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tournament">Tournament</SelectItem>
                    <SelectItem value="Cash Game">Cash Game</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="table-size" className="text-xs">Table Size</Label>
                <Select
                  value={tableSeats.toString()}
                  onValueChange={(value) => setTableSeats(parseInt(value) as TableSeats)}
                >
                  <SelectTrigger id="table-size" className="mt-1 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6-Handed</SelectItem>
                    <SelectItem value="9">9-Handed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Buy-in */}
            <div>
              <Label htmlFor="buy-in" className="text-xs">
                {gameType === 'Tournament' ? 'Buy-in Amount ($)' : 'Starting Stack (BB)'}
              </Label>
              <Input
                id="buy-in"
                type="number"
                value={buyIn}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setBuyIn(0);
                  } else {
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue) && numValue >= 0) {
                      setBuyIn(numValue);
                    }
                  }
                }}
                placeholder="500"
                min="0"
                className="mt-1 h-9 text-sm"
              />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location" className="text-xs">Location (Optional)</Label>
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Home, Casino, Online..."
                className="mt-1 h-9 text-sm"
              />
            </div>
          </div>
        </div>


        {/* Start Session Button */}
        <Button
          className="w-full h-12 md:h-10"
          size="lg"
          onClick={handleCreateSession}
          disabled={!isValid()}
        >
          Start Session
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px] max-w-[350px]">
          <DialogHeader>
            <DialogTitle>End Current Session?</DialogTitle>
            <DialogDescription>
              You have an active session &quot;{activeSessionName}&quot; running. Creating a new session will automatically end the current one and save its state.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowConfirmDialog(false);
                createNewSession();
              }}
              className="flex-1"
            >
              End & Create New
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}