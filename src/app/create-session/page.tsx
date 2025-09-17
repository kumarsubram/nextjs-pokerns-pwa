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
import { SimplePokerTable } from '@/components/poker/SimplePokerTable';
import { SessionService } from '@/services/session.service';
import { GameType, TableSeats, Position } from '@/types/poker-v2';

export default function CreateSessionPage() {
  const router = useRouter();

  // Session configuration
  const [sessionName, setSessionName] = useState('');
  const [gameType, setGameType] = useState<GameType>('Tournament');
  const [tableSeats, setTableSeats] = useState<TableSeats>(9);
  const [buyIn, setBuyIn] = useState<number>(100);
  const [userSeat, setUserSeat] = useState<Position | null>(null);

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
    if (!userSeat || !sessionName || buyIn <= 0) return;

    const session = SessionService.createNewSession({
      sessionName,
      gameType,
      tableSeats,
      buyIn,
      userSeat
    });

    // Navigate to the game screen
    router.push(`/session/${session.sessionId}`);
  };

  const isValid = () => {
    return sessionName && buyIn > 0 && userSeat !== null;
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Table Selection */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-8 text-center">
            {!userSeat ? 'Select your Seat - Tap any position' : `✓ Selected: ${userSeat}`}
          </h2>

          <SimplePokerTable
            seats={tableSeats}
            userSeat={userSeat || undefined}
            onSeatClick={(position) => setUserSeat(position)}
            showBlinkingSeats={!userSeat}
          />
        </div>

        {/* Session Configuration */}
        <div className="bg-white rounded-lg p-4 shadow-sm">

          <div className="space-y-4">
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
            <div className="grid grid-cols-2 gap-3">
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
                onChange={(e) => setBuyIn(parseInt(e.target.value) || 0)}
                placeholder="100"
                min="0"
                className="mt-1 h-9 text-sm"
              />
            </div>
          </div>
        </div>


        {/* Start Session Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleCreateSession}
          disabled={!isValid()}
        >
          Start Session
        </Button>
      </div>
    </div>
  );
}