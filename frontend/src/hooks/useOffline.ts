// import { useState, useEffect, useCallback } from 'react';
// // import { useNotification } from './useNotifications';

// export interface OfflineReport {
//   id: string;
//   category: 'electrical' | 'mechanical';
//   location: {
//     type: 'specific' | 'general';
//     block_id?: number;
//     room_number?: string;
//     description?: string;
//   };
//   equipment_description: string;
//   problem_description: string;
//   photos: string[]; // base64 encoded
//   created_at: string;
//   status: 'pending' | 'syncing' | 'synced' | 'failed';
//   error?: string;
// }

// export interface OfflineContextType {
//   isOnline: boolean;
//   pendingReports: OfflineReport[];
//   syncing: boolean;
//   lastSync: Date | null;
//   syncError: string | null;
//   addPendingReport: (report: Omit<OfflineReport, 'id' | 'status' | 'created_at'>) => string;
//   removePendingReport: (id: string) => void;
//   syncReports: () => Promise<void>;
//   clearFailedReports: () => void;
//   getPendingCount: () => number;
//   getStorageUsage: () => { used: number; total: number; percentage: number };
//   clearAllReports: () => void;
//   updatePendingReport: (id: string, updates: Partial<OfflineReport>) => void;
// }

// const STORAGE_KEY = 'aastu_fms_offline_reports';
// const MAX_STORAGE_SIZE = 10 * 1024 * 1024; // 10MB limit
// const SYNC_RETRY_LIMIT = 3;

// export function useOffline() {
//   const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
//   const [pendingReports, setPendingReports] = useState<OfflineReport[]>([]);
//   const [syncing, setSyncing] = useState<boolean>(false);
//   const [lastSync, setLastSync] = useState<Date | null>(null);
//   const [syncError, setSyncError] = useState<string | null>(null);
//   const { showNotification } = useNotification();

//   // Load pending reports from localStorage on mount
//   useEffect(() => {
//     try {
//       const stored = localStorage.getItem(STORAGE_KEY);
//       if (stored) {
//         const parsed = JSON.parse(stored);
//         setPendingReports(parsed);
        
//         // Check if any reports need retry
//         const failedReports = parsed.filter((r: OfflineReport) => r.status === 'failed');
//         if (failedReports.length > 0 && navigator.onLine) {
//           showNotification({
//             type: 'warning',
//             title: 'Failed Reports',
//             message: `${failedReports.length} report(s) failed to sync. Click to retry.`,
//             action: syncReports
//           });
//         }
//       }
//     } catch (error) {
//       console.error('Failed to load offline reports:', error);
//       showNotification({
//         type: 'error',
//         title: 'Storage Error',
//         message: 'Failed to load offline reports'
//       });
//     }
//   }, []);

//   // Save pending reports to localStorage on change
//   useEffect(() => {
//     try {
//       localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingReports));
//     } catch (error) {
//       console.error('Failed to save offline reports:', error);
//     }
//   }, [pendingReports]);

//   // Network status listener
//   useEffect(() => {
//     const handleOnline = () => {
//       setIsOnline(true);
//       showNotification({
//         type: 'success',
//         title: 'Back Online',
//         message: 'Connection restored. Syncing pending reports...',
//         duration: 3000
//       });
      
//       // Auto-sync when coming back online
//       if (pendingReports.length > 0) {
//         setTimeout(() => syncReports(), 1000);
//       }
//     };

//     const handleOffline = () => {
//       setIsOnline(false);
//       showNotification({
//         type: 'warning',
//         title: 'Offline Mode',
//         message: 'You are offline. Reports will be saved locally.',
//         duration: 5000
//       });
//     };

//     window.addEventListener('online', handleOnline);
//     window.addEventListener('offline', handleOffline);

//     return () => {
//       window.removeEventListener('online', handleOnline);
//       window.removeEventListener('offline', handleOffline);
//     };
//   }, [pendingReports]);

//   // Calculate storage usage
//   const getStorageUsage = useCallback(() => {
//     try {
//       const total = MAX_STORAGE_SIZE;
//       const used = new Blob([JSON.stringify(pendingReports)]).size;
//       const percentage = (used / total) * 100;
      
//       return {
//         used: Math.round(used / 1024), // KB
//         total: Math.round(total / 1024), // KB
//         percentage: Math.min(percentage, 100)
//       };
//     } catch (error) {
//       return { used: 0, total: MAX_STORAGE_SIZE / 1024, percentage: 0 };
//     }
//   }, [pendingReports]);

//   // Check if we have enough storage
//   const hasEnoughStorage = useCallback((newReportSize: number): boolean => {
//     const currentSize = new Blob([JSON.stringify(pendingReports)]).size;
//     return currentSize + newReportSize <= MAX_STORAGE_SIZE;
//   }, [pendingReports]);

//   // Generate unique ID for offline reports
//   const generateId = useCallback(() => {
//     return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//   }, []);

//   // Add a new pending report
//   const addPendingReport = useCallback((
//     report: Omit<OfflineReport, 'id' | 'status' | 'created_at'>
//   ): string => {
//     const newReportSize = new Blob([JSON.stringify(report)]).size;
    
//     if (!hasEnoughStorage(newReportSize)) {
//       showNotification({
//         type: 'error',
//         title: 'Storage Full',
//         message: 'Cannot save report. Please clear some offline data.',
//         duration: 5000
//       });
//       throw new Error('Storage limit exceeded');
//     }

//     const newReport: OfflineReport = {
//       ...report,
//       id: generateId(),
//       status: 'pending',
//       created_at: new Date().toISOString()
//     };

//     setPendingReports(prev => [...prev, newReport]);
    
//     showNotification({
//       type: 'success',
//       title: 'Report Saved Offline',
//       message: 'Report will be synced when you are back online.',
//       duration: 3000
//     });

//     // Auto-sync if online
//     if (isOnline && !syncing) {
//       setTimeout(() => syncReports(), 2000);
//     }

//     return newReport.id;
//   }, [isOnline, syncing, hasEnoughStorage, generateId]);

//   // Remove a pending report
//   const removePendingReport = useCallback((id: string) => {
//     setPendingReports(prev => prev.filter(report => report.id !== id));
//   }, []);

//   // Update a pending report
//   const updatePendingReport = useCallback((id: string, updates: Partial<OfflineReport>) => {
//     setPendingReports(prev => 
//       prev.map(report => 
//         report.id === id ? { ...report, ...updates } : report
//       )
//     );
//   }, []);

//   // Clear failed reports
//   const clearFailedReports = useCallback(() => {
//     setPendingReports(prev => prev.filter(report => report.status !== 'failed'));
//     showNotification({
//       type: 'info',
//       title: 'Cleared Failed Reports',
//       message: 'All failed reports have been removed.',
//       duration: 3000
//     });
//   }, []);

//   // Clear all offline reports
//   const clearAllReports = useCallback(() => {
//     setPendingReports([]);
//     showNotification({
//       type: 'info',
//       title: 'Cleared All Reports',
//       message: 'All offline reports have been removed.',
//       duration: 3000
//     });
//   }, []);

//   // Sync reports with server
//   const syncReports = useCallback(async () => {
//     if (syncing || pendingReports.length === 0) return;

//     setSyncing(true);
//     setSyncError(null);
    
//     const pending = pendingReports.filter(r => r.status === 'pending' || r.status === 'failed');
    
//     if (pending.length === 0) {
//       setSyncing(false);
//       return;
//     }

//     let successCount = 0;
//     let failCount = 0;

//     try {
//       // Update status to syncing
//       setPendingReports(prev => 
//         prev.map(report => 
//           (report.status === 'pending' || report.status === 'failed') 
//             ? { ...report, status: 'syncing' }
//             : report
//         )
//       );

//       // Prepare reports for sync
//       const reportsToSync = pending.map(report => ({
//         local_id: report.id,
//         category: report.category,
//         location: report.location,
//         equipment_description: report.equipment_description,
//         problem_description: report.problem_description,
//         photos: report.photos,
//         created_at: report.created_at
//       }));

//       // Simulate API call - replace with actual API endpoint
//       // const response = await fetch('http://localhost:3001/sync/reports', {
//       //   method: 'POST',
//       //   headers: {
//       //     'Authorization': `Bearer ${token}`,
//       //     'Content-Type': 'application/json',
//       //   },
//       //   body: JSON.stringify({
//       //     pending_reports: reportsToSync
//       //   })
//       // });

//       // Mock API response
//       await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      
//       // Simulate successful sync for demonstration
//       const mockResponse = {
//         success: true,
//         data: {
//           synced_reports: pending.map(report => ({
//             local_id: report.id,
//             ticket_id: `AASTU-FIX-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`,
//             status: 'submitted'
//           })),
//           failed_reports: [],
//           pending_updates: []
//         }
//       };

//       if (mockResponse.success) {
//         // Update successfully synced reports
//         mockResponse.data.synced_reports.forEach(synced => {
//           updatePendingReport(synced.local_id, { 
//             status: 'synced',
//             // Store server ticket_id for reference
//             ...(synced.ticket_id && { server_id: synced.ticket_id })
//           });
//           successCount++;
//         });

//         // Handle failed reports
//         mockResponse.data.failed_reports.forEach(failed => {
//           updatePendingReport(failed.local_id, { 
//             status: 'failed',
//             error: failed.error || 'Sync failed'
//           });
//           failCount++;
//         });

//         setLastSync(new Date());

//         // Show sync summary
//         if (successCount > 0) {
//           showNotification({
//             type: 'success',
//             title: 'Sync Complete',
//             message: `${successCount} report(s) synced successfully.`,
//             duration: 5000
//           });
//         }

//         if (failCount > 0) {
//           showNotification({
//             type: 'warning',
//             title: 'Partial Sync',
//             message: `${successCount} synced, ${failCount} failed.`,
//             duration: 5000
//           });
//         }

//         // Clean up synced reports after 1 minute
//         setTimeout(() => {
//           setPendingReports(prev => 
//             prev.filter(report => report.status !== 'synced')
//           );
//         }, 60000);

//       } else {
//         throw new Error('Sync failed');
//       }

//     } catch (error: any) {
//       console.error('Sync error:', error);
//       setSyncError(error.message || 'Failed to sync reports');
      
//       // Mark all syncing reports as failed
//       setPendingReports(prev => 
//         prev.map(report => 
//           report.status === 'syncing' 
//             ? { ...report, status: 'failed', error: error.message }
//             : report
//         )
//       );

//       showNotification({
//         type: 'error',
//         title: 'Sync Failed',
//         message: 'Failed to sync reports. Please try again.',
//         duration: 5000
//       });

//     } finally {
//       setSyncing(false);
//     }
//   }, [pendingReports, syncing, updatePendingReport]);

//   // Manual sync with retry
//   const syncWithRetry = useCallback(async (retryCount = 0) => {
//     if (retryCount >= SYNC_RETRY_LIMIT) {
//       showNotification({
//         type: 'error',
//         title: 'Max Retries Exceeded',
//         message: 'Failed to sync after multiple attempts.',
//         duration: 5000
//       });
//       return;
//     }

//     try {
//       await syncReports();
//     } catch (error) {
//       setTimeout(() => syncWithRetry(retryCount + 1), 2000 * (retryCount + 1));
//     }
//   }, [syncReports]);

//   // Get pending count
//   const getPendingCount = useCallback(() => {
//     return pendingReports.filter(r => r.status === 'pending' || r.status === 'failed').length;
//   }, [pendingReports]);

//   // Auto-sync on interval when online
//   useEffect(() => {
//     if (!isOnline || pendingReports.length === 0) return;

//     const interval = setInterval(() => {
//       const hasPending = pendingReports.some(r => r.status === 'pending');
//       if (hasPending && !syncing) {
//         syncReports();
//       }
//     }, 30000); // Every 30 seconds

//     return () => clearInterval(interval);
//   }, [isOnline, pendingReports, syncing, syncReports]);

//   // Storage warning
//   useEffect(() => {
//     const { percentage } = getStorageUsage();
//     if (percentage > 80) {
//       showNotification({
//         type: 'warning',
//         title: 'Storage Warning',
//         message: `Offline storage is ${Math.round(percentage)}% full.`,
//         duration: 5000
//       });
//     }
//   }, [pendingReports, getStorageUsage]);

//   return {
//     isOnline,
//     pendingReports,
//     syncing,
//     lastSync,
//     syncError,
//     addPendingReport,
//     removePendingReport,
//     syncReports: syncWithRetry,
//     clearFailedReports,
//     getPendingCount,
//     getStorageUsage,
//     clearAllReports,
//     updatePendingReport
//   };
// }