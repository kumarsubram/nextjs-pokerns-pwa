'use client';

import { SessionMetadata } from '@/types/poker-v2';

interface HandSettingsPanelProps {
  session: SessionMetadata;
  stack: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  onStackChange: (value: number) => void;
  onSmallBlindChange: (value: number) => void;
  onBigBlindChange: (value: number) => void;
  onAnteChange: (value: number) => void;
}

export function HandSettingsPanel({
  session,
  stack,
  smallBlind,
  bigBlind,
  ante,
  onStackChange,
  onSmallBlindChange,
  onBigBlindChange,
  onAnteChange
}: HandSettingsPanelProps) {
  const handleNumberInput = (value: string, setter: (n: number) => void) => {
    if (value === '') {
      setter(0);
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 0) {
        setter(numValue);
      }
    }
  };

  return (
    <div className="bg-gray-100 rounded-lg p-3 mb-3">
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-xs text-gray-500 block mb-1 text-center">Stack</label>
          <input
            type="number"
            value={stack}
            onChange={(e) => handleNumberInput(e.target.value, onStackChange)}
            onFocus={(e) => e.target.select()}
            className="w-full px-2 py-1 text-base border rounded text-center"
          />
          {/* Profit/Loss indicator */}
          {session && session.buyIn && (
            <div className="text-xs text-center mt-1">
              {(() => {
                const profitLoss = stack - session.buyIn;
                const isProfit = profitLoss > 0;
                const isLoss = profitLoss < 0;
                return (
                  <span
                    className={
                      isProfit
                        ? 'text-green-600 font-medium'
                        : isLoss
                        ? 'text-red-600 font-medium'
                        : 'text-gray-500'
                    }
                  >
                    {isProfit ? '+' : ''}
                    {profitLoss}
                  </span>
                );
              })()}
            </div>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1 text-center">SB</label>
          <input
            type="number"
            value={smallBlind}
            onChange={(e) => handleNumberInput(e.target.value, onSmallBlindChange)}
            onFocus={(e) => e.target.select()}
            className="w-full px-2 py-1 text-base border rounded text-center"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1 text-center">BB</label>
          <input
            type="number"
            value={bigBlind}
            onChange={(e) => handleNumberInput(e.target.value, onBigBlindChange)}
            onFocus={(e) => e.target.select()}
            className="w-full px-2 py-1 text-base border rounded text-center"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1 text-center">Ante</label>
          <input
            type="number"
            value={ante}
            onChange={(e) => handleNumberInput(e.target.value, onAnteChange)}
            onFocus={(e) => e.target.select()}
            className="w-full px-2 py-1 text-base border rounded text-center"
          />
        </div>
      </div>
    </div>
  );
}