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
  onEndSession?: () => void;
  title: string;
  showKeepCurrentButton?: boolean;
}

export function SeatSelector({
  tableSeats,
  currentSeat,
  suggestedSeat,
  onSeatSelect,
  onKeepCurrentSeat,
  onEndSession,
  title,
  showKeepCurrentButton = false
}: SeatSelectorProps) {
  return (
    <div className="h-[calc(100dvh-12rem)] flex flex-col">
      {/* Header with End Session button */}
      {onEndSession && (
        <div className="flex justify-between items-center px-6 py-4 border-b bg-white">
          <h2 className="text-xl font-semibold">
            Choose Next Seat
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onEndSession}
            className="text-red-600 text-sm px-3 py-1.5 flex-shrink-0 font-medium border-red-200 hover:border-red-300 hover:bg-red-50"
          >
            End Session
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-lg space-y-8">
          {!onEndSession && (
            <h2 className="text-xl font-semibold text-center">
              {title}
            </h2>
          )}

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

          {showKeepCurrentButton && suggestedSeat && onKeepCurrentSeat && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={onKeepCurrentSeat}
                className="border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 font-medium px-6 py-3 text-base rounded-lg shadow-sm"
              >
                Choose Seat {suggestedSeat}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}