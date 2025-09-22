'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { SimplePokerTable } from '@/components/poker/SimplePokerTable';
import { TableSeats, Position } from '@/types/poker-v2';

interface SeatSelectorProps {
  tableSeats: TableSeats;
  currentSeat?: Position;
  suggestedSeat?: Position;
  onSeatSelect: (position: Position) => void;
  onKeepCurrentSeat?: () => void;
  title: string;
  showKeepCurrentButton?: boolean;
}

export function SeatSelector({
  tableSeats,
  currentSeat,
  suggestedSeat,
  onSeatSelect,
  onKeepCurrentSeat,
  title,
  showKeepCurrentButton = false
}: SeatSelectorProps) {
  return (
    <div className="h-[calc(100dvh-12rem)] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg space-y-6">
        <h2 className="text-xl font-semibold text-center">
          {title}
        </h2>

        <div className="flex justify-center">
          <SimplePokerTable
            seats={tableSeats}
            userSeat={currentSeat}
            onSeatClick={onSeatSelect}
            highlightedPositions={[]}
            showBlinkingSeats={true}
            className=""
          />
        </div>

        {/* Instructional text and button below table */}
        <div className="text-center space-y-4">
          <p className="text-gray-600 text-sm">
            Click on any seat to select seat
          </p>

          {showKeepCurrentButton && suggestedSeat && onKeepCurrentSeat && (
            <>
              <p className="text-gray-500 text-sm font-medium">
                OR
              </p>
              <Button
                variant="outline"
                onClick={onKeepCurrentSeat}
                className="border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 font-medium px-6 py-3 text-base rounded-lg shadow-sm"
              >
                Choose Next Seat {suggestedSeat}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}