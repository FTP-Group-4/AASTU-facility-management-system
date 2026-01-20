import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';
import { WifiOff, CloudOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '../../../hooks/useOffline';

export interface OfflineBannerProps extends HTMLAttributes<HTMLDivElement> {
  showSyncStatus?: boolean;
}

const OfflineBanner = ({ 
  className, 
  showSyncStatus = true,
  ...props 
}: OfflineBannerProps) => {
  const { isOnline, pendingSyncCount } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      className={cn(
        'offline-banner fixed top-0 left-0 right-0 z-50 animate-slide-in-down',
        className
      )}
      role="alert"
      aria-live="assertive"
      {...props}
    >
      <div className="container mx-auto flex items-center justify-center gap-2 py-2">
        <WifiOff className="w-4 h-4" />
        <span>You are currently offline. Some features may be limited.</span>
        
        {showSyncStatus && pendingSyncCount > 0 && (
          <>
            <CloudOff className="w-4 h-4 ml-2" />
            <span>{pendingSyncCount} report(s) pending sync</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineBanner;