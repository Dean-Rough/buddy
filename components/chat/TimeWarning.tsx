'use client';

import { useState, useEffect } from 'react';
import BrutalButton from '../ui/BrutalButton';
import BrutalCard from '../ui/BrutalCard';

interface TimeWarningProps {
  minutesRemaining: number;
  warningMessage: string;
  childAge: number;
  canContinueWithOverride: boolean;
  onExtendTime?: () => void;
  onAcknowledge?: () => void;
  onEndSession?: () => void;
}

export default function TimeWarning({
  minutesRemaining,
  warningMessage,
  childAge,
  canContinueWithOverride,
  onExtendTime,
  onAcknowledge,
  onEndSession,
}: TimeWarningProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showParentOptions, setShowParentOptions] = useState(false);

  if (!isVisible) return null;

  const handleAcknowledge = () => {
    setIsVisible(false);
    onAcknowledge?.();
  };

  const handleParentOverride = () => {
    onExtendTime?.();
    setIsVisible(false);
  };

  const handleEndNow = () => {
    onEndSession?.();
  };

  const getWarningIcon = () => {
    if (minutesRemaining <= 2) return '⏰';
    if (minutesRemaining <= 5) return '⏱️';
    return '🕐';
  };

  const getWarningColor = () => {
    if (minutesRemaining <= 2) return 'pink';
    if (minutesRemaining <= 5) return 'yellow';
    return 'blue';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <BrutalCard variant={getWarningColor()}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{getWarningIcon()}</div>
            <div className="flex-1">
              <h3 className="font-avotica font-bold text-lg mb-2">
                Time Check!
              </h3>
              <p className="font-avotica text-sm mb-4">{warningMessage}</p>

              <div className="flex gap-2">
                <BrutalButton
                  variant="white"
                  size="small"
                  onClick={handleAcknowledge}
                >
                  Got it!
                </BrutalButton>

                {canContinueWithOverride && (
                  <BrutalButton
                    variant="blue"
                    size="small"
                    onClick={() => setShowParentOptions(true)}
                  >
                    More time?
                  </BrutalButton>
                )}
              </div>
            </div>
          </div>

          {showParentOptions && (
            <div className="mt-4 pt-4 border-t-2 border-black">
              <p className="font-avotica text-xs text-gray-600 mb-3">
                Ask a parent to enter their PIN for more time:
              </p>

              <div className="flex gap-2">
                <BrutalButton
                  variant="green"
                  size="small"
                  onClick={handleParentOverride}
                >
                  Parent Override
                </BrutalButton>

                <BrutalButton
                  variant="orange"
                  size="small"
                  onClick={handleEndNow}
                >
                  End Now
                </BrutalButton>
              </div>
            </div>
          )}
        </div>
      </BrutalCard>
    </div>
  );
}
