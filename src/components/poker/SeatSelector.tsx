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
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-center">
        {title}
      </h2>

      <div className="mb-4">
        <SimplePokerTable
          seats={tableSeats}
          userSeat={currentSeat}
          onSeatClick={onSeatSelect}
          highlightedPositions={[]}
          showBlinkingSeats={true}
          className="mb-4"
        />
      </div>

      <div className="text-center text-sm text-gray-600 mb-4">
        {currentSeat
          ? `✓ Selected: ${currentSeat} - Tap any seat to change`
          : 'Click on any seat to select your position'
        }
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
  );
}