'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessions } from '@/hooks/useSessions';
import { PokerTable } from '@/components/poker/PokerTable';
import { Currency, CURRENCY_SYMBOLS } from '@/types/poker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Check, Play, Calendar } from 'lucide-react';

interface SessionFormData {
  name: string;
  type: 'cash' | 'tournament';
  currency: Currency;
  buyIn: string;
  smallBlind: string;
  bigBlind: string;
  ante: string;
  location: string;
  seats: 2 | 4 | 6 | 8 | 9 | 10;
}

interface TableSetupData {
  smallBlindSeat: number | null;
  bigBlindSeat: number | null;
  heroSeat: number | null;
}

export default function CreateSessionPage() {
  const router = useRouter();
  const { createSession, updateSession } = useSessions();
  const [step, setStep] = useState<'details' | 'blinds' | 'seat'>('details');
  
  const [sessionData, setSessionData] = useState<SessionFormData>({
    name: `Poker Session ${new Date().toLocaleDateString()}`,
    type: 'cash',
    currency: 'USD',
    buyIn: '100',
    smallBlind: '1',
    bigBlind: '2',
    ante: '',
    location: 'Home Game',
    seats: 9
  });

  const [tableSetup, setTableSetup] = useState<TableSetupData>({
    smallBlindSeat: null,
    bigBlindSeat: null,
    heroSeat: null,
  });

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const handleNextStep = () => {
    if (step === 'details' && canProceedFromDetails()) {
      setStep('blinds');
    } else if (step === 'blinds' && canProceedFromBlinds()) {
      setStep('seat');
    }
  };

  const handlePrevStep = () => {
    if (step === 'seat') {
      setStep('blinds');
      setTableSetup(prev => ({ ...prev, heroSeat: null }));
    } else if (step === 'blinds') {
      setStep('details');
      setTableSetup({ smallBlindSeat: null, bigBlindSeat: null, heroSeat: null });
    }
  };

  const handleBlindsSelect = (smallBlind: number, bigBlind: number) => {
    setTableSetup(prev => ({
      ...prev,
      smallBlindSeat: smallBlind,
      bigBlindSeat: bigBlind,
    }));
    
    // Automatically advance to seat selection step
    setStep('seat');
  };

  const handleSeatSelect = (seatIndex: number) => {
    setTableSetup(prev => ({ ...prev, heroSeat: seatIndex }));
  };

  const handleComplete = async () => {
    if (!canComplete()) return;

    try {
      const session = await createSession({
        name: sessionData.name,
        type: sessionData.type,
        currency: sessionData.currency,
        buyIn: parseFloat(sessionData.buyIn),
        smallBlind: parseFloat(sessionData.smallBlind),
        bigBlind: parseFloat(sessionData.bigBlind),
        ante: sessionData.ante ? parseFloat(sessionData.ante) : undefined,
        seats: sessionData.seats,
        location: sessionData.location || undefined,
        startTime: new Date(),
        totalHands: 0,
      });

      // Update with table setup (button is 1 seat left of SB, but can't be dealer at seat 0)
      const totalSeats = sessionData.seats + 1;
      let buttonSeat = (tableSetup.smallBlindSeat! - 1 + totalSeats) % totalSeats;
      // If button would be on dealer seat (0), move it to the last player seat
      if (buttonSeat === 0) {
        buttonSeat = totalSeats - 1;
      }
      const dealerSeat = 0; // Fixed dealer position at seat 0 (top of table)
      await updateSession(session.id, {
        bigBlindPosition: tableSetup.bigBlindSeat!,
        smallBlindPosition: tableSetup.smallBlindSeat!,
        heroPosition: tableSetup.heroSeat!,
        buttonPosition: buttonSeat,
        dealerPosition: dealerSeat,
      });

      router.push(`/session/${session.id}`);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const canProceedFromDetails = () => {
    return sessionData.name.trim() && 
           sessionData.buyIn.trim() && 
           sessionData.smallBlind.trim() && 
           sessionData.bigBlind.trim();
  };

  const canProceedFromBlinds = () => {
    return tableSetup.smallBlindSeat !== null && tableSetup.bigBlindSeat !== null;
  };

  const canComplete = () => {
    return canProceedFromDetails() && canProceedFromBlinds() && tableSetup.heroSeat !== null;
  };

  const getStepTitle = () => {
    switch (step) {
      case 'details':
        return 'Session Details';
      case 'blinds':
        return 'Select Small Blind Position';
      case 'seat':
        return 'Choose Your Seat';
      default:
        return 'Create Session';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'details':
        return 'Enter the basic details for your poker session';
      case 'blinds':
        return '';
      case 'seat':
        return '';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Main header row */}
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="p-2 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:ml-2 sm:inline">Back</span>
              </Button>
              <h1 className="text-lg sm:text-xl font-bold truncate">Create New Session</h1>
            </div>
            
            {/* Date - hide on small screens */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 ml-4">
              <Calendar className="h-4 w-4" />
              <span className="whitespace-nowrap">{today}</span>
            </div>
          </div>
          
          {/* Mobile date row - show on small screens */}
          <div className="sm:hidden flex items-center justify-center gap-2 text-xs text-gray-600 pb-3 -mt-1">
            <Calendar className="h-3 w-3" />
            <span>{today}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Progress Steps */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-bold ${
              step === 'details' ? 'bg-emerald-500 text-white' : 
              (step === 'blinds' || step === 'seat') ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {(step === 'blinds' || step === 'seat') && canProceedFromDetails() ? (
                <Check className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                '1'
              )}
            </div>
            <div className="w-8 sm:w-16 h-px bg-gray-300"></div>
            <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-bold ${
              step === 'blinds' ? 'bg-emerald-500 text-white' : 
              step === 'seat' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step === 'seat' && canProceedFromBlinds() ? (
                <Check className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                '2'
              )}
            </div>
            <div className="w-8 sm:w-16 h-px bg-gray-300"></div>
            <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-bold ${
              step === 'seat' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step === 'seat' && tableSetup.heroSeat !== null ? (
                <Check className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                '3'
              )}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className={`text-xl sm:text-2xl font-bold text-gray-900 mb-2 ${
                (step === 'blinds' && tableSetup.smallBlindSeat === null) || 
                (step === 'seat' && tableSetup.heroSeat === null)
                  ? 'animate-pulse' 
                  : ''
              }`}>
                {getStepTitle()}
              </h2>
              <p className="text-sm sm:text-base text-gray-600">{getStepDescription()}</p>
            </div>

            {/* Step 1: Session Details */}
            {step === 'details' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-900">Session Name</Label>
                  <Input
                    id="name"
                    placeholder="Friday Night Game"
                    value={sessionData.name}
                    onChange={(e) => setSessionData({ ...sessionData, name: e.target.value })}
                    className="h-10 sm:h-11"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium text-gray-900">Game Type</Label>
                    <Select 
                      value={sessionData.type} 
                      onValueChange={(value: 'cash' | 'tournament') => 
                        setSessionData({ ...sessionData, type: value })
                      }
                    >
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash Game</SelectItem>
                        <SelectItem value="tournament">Tournament</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-medium text-gray-900">Currency</Label>
                    <Select 
                      value={sessionData.currency} 
                      onValueChange={(value: Currency) => 
                        setSessionData({ ...sessionData, currency: value })
                      }
                    >
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">{CURRENCY_SYMBOLS.USD} USD</SelectItem>
                        <SelectItem value="EUR">{CURRENCY_SYMBOLS.EUR} EUR</SelectItem>
                        <SelectItem value="GBP">{CURRENCY_SYMBOLS.GBP} GBP</SelectItem>
                        <SelectItem value="CAD">{CURRENCY_SYMBOLS.CAD} CAD</SelectItem>
                        <SelectItem value="AUD">{CURRENCY_SYMBOLS.AUD} AUD</SelectItem>
                        <SelectItem value="JPY">{CURRENCY_SYMBOLS.JPY} JPY</SelectItem>
                        <SelectItem value="INR">{CURRENCY_SYMBOLS.INR} INR</SelectItem>
                        <SelectItem value="BRL">{CURRENCY_SYMBOLS.BRL} BRL</SelectItem>
                        <SelectItem value="MXN">{CURRENCY_SYMBOLS.MXN} MXN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="seats" className="text-sm font-medium text-gray-900">Table Seats</Label>
                    <Select 
                      value={sessionData.seats.toString()} 
                      onValueChange={(value) => 
                        setSessionData({ ...sessionData, seats: parseInt(value) as 2 | 4 | 6 | 8 | 9 | 10 })
                      }
                    >
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 Players</SelectItem>
                        <SelectItem value="4">4 Players</SelectItem>
                        <SelectItem value="6">6 Players</SelectItem>
                        <SelectItem value="8">8 Players</SelectItem>
                        <SelectItem value="9">9 Players</SelectItem>
                        <SelectItem value="10">10 Players</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyin" className="text-sm font-medium text-gray-900">Buy-in ({CURRENCY_SYMBOLS[sessionData.currency]})</Label>
                    <Input
                      id="buyin"
                      type="number"
                      placeholder="100"
                      value={sessionData.buyIn}
                      onChange={(e) => setSessionData({ ...sessionData, buyIn: e.target.value })}
                      className="h-10 sm:h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smallblind" className="text-sm font-medium text-gray-900">Small Blind ({CURRENCY_SYMBOLS[sessionData.currency]})</Label>
                    <Input
                      id="smallblind"
                      type="number"
                      step="0.01"
                      placeholder="1"
                      value={sessionData.smallBlind}
                      onChange={(e) => setSessionData({ ...sessionData, smallBlind: e.target.value })}
                      className="h-10 sm:h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bigblind" className="text-sm font-medium text-gray-900">Big Blind ({CURRENCY_SYMBOLS[sessionData.currency]})</Label>
                    <Input
                      id="bigblind"
                      type="number"
                      step="0.01"
                      placeholder="2"
                      value={sessionData.bigBlind}
                      onChange={(e) => setSessionData({ ...sessionData, bigBlind: e.target.value })}
                      className="h-10 sm:h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ante" className="text-sm font-medium text-gray-600">Ante ({CURRENCY_SYMBOLS[sessionData.currency]}) <span className="text-xs">(Optional)</span></Label>
                  <Input
                    id="ante"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={sessionData.ante}
                    onChange={(e) => setSessionData({ ...sessionData, ante: e.target.value })}
                    className="h-10 sm:h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium text-gray-600">Location <span className="text-xs">(Optional)</span></Label>
                  <Input
                    id="location"
                    placeholder="Home Game"
                    value={sessionData.location}
                    onChange={(e) => setSessionData({ ...sessionData, location: e.target.value })}
                    className="h-10 sm:h-11"
                  />
                </div>
              </div>
            )}

            {/* Step 2 & 3: Table Setup */}
            {(step === 'blinds' || step === 'seat') && (
              <div className="py-4 sm:py-6">
                <PokerTable
                  seats={sessionData.seats}
                  showBlindSelection={step === 'blinds'}
                  showSeatSelection={step === 'seat'}
                  onBlindsSelect={handleBlindsSelect}
                  onSeatSelect={handleSeatSelect}
                  smallBlindSeat={tableSetup.smallBlindSeat ?? undefined}
                  bigBlindSeat={tableSetup.bigBlindSeat ?? undefined}
                  selectedSeat={tableSetup.heroSeat ?? undefined}
                  buttonSeat={tableSetup.smallBlindSeat ? (() => {
                    const totalSeats = sessionData.seats + 1;
                    const btn = (tableSetup.smallBlindSeat - 1 + totalSeats) % totalSeats;
                    return btn === 0 ? totalSeats - 1 : btn;
                  })() : 0}
                  dealerSeat={0}
                  allowHeroAsBlind={true}
                  showPositions={tableSetup.smallBlindSeat !== null}
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 pt-6 sm:pt-8">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={step === 'details'}
                className="flex-1 sm:flex-none h-10 sm:h-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Back</span>
                <span className="xs:hidden">Back</span>
              </Button>

              {/* Only show next/start button for details and seat steps */}
              {step !== 'blinds' && (
                <Button
                  onClick={step === 'seat' ? handleComplete : handleNextStep}
                  disabled={
                    (step === 'details' && !canProceedFromDetails()) ||
                    (step === 'seat' && !canComplete())
                  }
                  className="flex-1 sm:flex-none h-10 sm:h-auto bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                >
                  {step === 'seat' ? (
                    <>
                      <Play className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden xs:inline">Start Session</span>
                      <span className="xs:hidden">Start</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden xs:inline">Next</span>
                      <span className="xs:hidden">Next</span>
                      <ArrowRight className="h-4 w-4 ml-1 sm:ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}