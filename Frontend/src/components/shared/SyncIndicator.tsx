import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function SyncIndicator() {
  const { syncStatus, t } = useApp();

  if (syncStatus.isOnline && syncStatus.pendingActions === 0) {
    return null; // Don't show indicator when everything is fine
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-[var(--shadow-lg)]
        border-2
        ${syncStatus.isOnline 
          ? 'bg-[var(--color-success)] bg-opacity-10 border-[var(--color-success)]'
          : 'bg-[var(--color-warning)] bg-opacity-10 border-[var(--color-warning)]'
        }
      `}>
        {syncStatus.syncing ? (
          <>
            <RefreshCw className="w-5 h-5 text-[var(--color-primary)] animate-spin" />
            <div>
              <p className="font-medium text-[var(--color-text-primary)] text-sm">
                {t('Syncing...', 'በማመሳሰል ላይ...')}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {syncStatus.pendingActions} {t('pending', 'በመጠባበቅ ላይ')}
              </p>
            </div>
          </>
        ) : !syncStatus.isOnline ? (
          <>
            <WifiOff className="w-5 h-5 text-[var(--color-warning)]" />
            <div>
              <p className="font-medium text-[var(--color-text-primary)] text-sm">
                {t('Offline Mode', 'ከመስመር ውጭ ሁነታ')}
              </p>
              {syncStatus.pendingActions > 0 && (
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {syncStatus.pendingActions} {t('pending actions', 'በመጠባበቅ ላይ ያሉ እርምጃዎች')}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <Wifi className="w-5 h-5 text-[var(--color-success)]" />
            <div>
              <p className="font-medium text-[var(--color-text-primary)] text-sm">
                {t('Back Online', 'መስመር ላይ ተመለሰ')}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {t('Syncing pending changes...', 'በመጠባበቅ ላይ ያሉ ለውጦችን በማመሳሰል ላይ...')}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
