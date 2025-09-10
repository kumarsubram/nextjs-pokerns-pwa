'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PokerTable } from './PokerTable';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface TableSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (setup: TableSetup) => void;
  sessionName: string;
  seats: 2 | 4 | 6 | 8 | 9 | 10;
}

export interface TableSetup {
  bigBlindPosition: number;
  smallBlindPosition: number;
  heroPosition: number;
}

export function TableSetupModal({
  isOpen,
  onClose,
  onComplete,
  sessionName,
  seats,
}: TableSetupModalProps) {
  const [step, setStep] = useState<'blinds' | 'seat'>('blinds');
  const [smallBlindSeat, setSmallBlindSeat] = useState<number | null>(null);
  const [bigBlindSeat, setBigBlindSeat] = useState<number | null>(null);
  const [heroSeat, setHeroSeat] = useState<number | null>(null);

  const handleBlindsSelect = (smallBlind: number, bigBlind: number) => {
    setSmallBlindSeat(smallBlind);
    setBigBlindSeat(bigBlind);
    setStep('seat');
  };

  const handleSeatSelect = (seatIndex: number) => {
    setHeroSeat(seatIndex);
  };

  const handleComplete = () => {
    if (smallBlindSeat !== null && bigBlindSeat !== null && heroSeat !== null) {
      onComplete({
        smallBlindPosition: smallBlindSeat,
        bigBlindPosition: bigBlindSeat,
        heroPosition: heroSeat,
      });
      onClose();
      // Reset state
      setStep('blinds');
      setSmallBlindSeat(null);
      setBigBlindSeat(null);
      setHeroSeat(null);
    }
  };

  const canProceed = () => {
    if (step === 'blinds') {
      return smallBlindSeat !== null && bigBlindSeat !== null;
    }
    return heroSeat !== null;
  };

  const getStepTitle = () => {
    switch (step) {
      case 'blinds':
        return 'Select Small Blind Position';
      case 'seat':
        return 'Choose Your Seat';
      default:
        return 'Table Setup';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'blinds':
        return '';
      case 'seat':
        return 'Now choose where you want to sit at the table';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
            {getStepTitle()}
          </DialogTitle>
          <p className="text-gray-600">{getStepDescription()}</p>
          <div className="mt-4 text-sm text-gray-500">
            Setting up <span className="font-medium text-gray-700">{sessionName}</span> • {seats} seats
          </div>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              step === 'blinds' ? 'bg-emerald-500 text-white' : 'bg-emerald-500 text-white'
            }`}>
              {smallBlindSeat !== null && bigBlindSeat !== null ? (
                <Check className="h-4 w-4" />
              ) : (
                '1'
              )}
            </div>
            <div className="w-16 h-px bg-gray-300"></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              step === 'seat' ? 'bg-emerald-500 text-white' : 
              (smallBlindSeat !== null && bigBlindSeat !== null) ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {heroSeat !== null ? (
                <Check className="h-4 w-4" />
              ) : (
                '2'
              )}
            </div>
          </div>
        </div>

        {/* Poker Table */}
        <div className="py-6">
          <PokerTable
            seats={seats}
            showBlindSelection={step === 'blinds'}
            showSeatSelection={step === 'seat'}
            onBlindsSelect={handleBlindsSelect}
            onSeatSelect={handleSeatSelect}
            smallBlindSeat={smallBlindSeat ?? undefined}
            bigBlindSeat={bigBlindSeat ?? undefined}
            selectedSeat={heroSeat ?? undefined}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 'seat') {
                setStep('blinds');
                setHeroSeat(null);
              } else {
                onClose();
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === 'seat' ? 'Back' : 'Cancel'}
          </Button>

          <Button
            onClick={() => {
              if (step === 'blinds' && canProceed()) {
                setStep('seat');
              } else if (step === 'seat' && canProceed()) {
                handleComplete();
              }
            }}
            disabled={!canProceed()}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
          >
            {step === 'seat' ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Complete Setup
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}