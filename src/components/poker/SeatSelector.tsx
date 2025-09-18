'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { SimplePokerTable } from '@/components/poker/SimplePokerTable';
import { TableSeats, Position } from '@/types/poker-v2';

interface SeatSelectorProps {
  tableSeats: TableSeats;
  currentSeat?: Position;
  onSeatSelect: (position: Position) => void;
  onKeepCurrentSeat?: () => void;
  title: string;
  showKeepCurrentButton?: boolean;
}

export function SeatSelector({
  tableSeats,
  currentSeat,
  onSeatSelect,
  onKeepCurrentSeat,
  title,
  showKeepCurrentButton = false
}: SeatSelectorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-50">
      <div className="w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-6 text-center">
          {title}
        </h2>

        <div className="mb-8 flex justify-center">
          <SimplePokerTable
            seats={tableSeats}
            userSeat={currentSeat}
            onSeatClick={onSeatSelect}
            highlightedPositions={[]}
            showBlinkingSeats={true}
            className=""
          />
        </div>


        {showKeepCurrentButton && currentSeat && onKeepCurrentSeat && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={onKeepCurrentSeat}
            >
              Keep Current Seat ({currentSeat})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}