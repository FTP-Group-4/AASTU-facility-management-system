import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Report, 
  ReportSummary, 
  ReportFilters,
  SubmitReportRequest 
} from '../types/report';
import { reportApi } from '../api/reports/reportApi';
import { coordinatorApi } from '../api/reports/coordinatorApi';

interface ReportStore {
  // State
  reports: ReportSummary[];
  currentReport: Report | null;
  filters: ReportFilters;
  isLoading: boolean;
  error: string | null;
  selectedReportId: string | null;
  
  // Actions
  setReports: (reports: ReportSummary[]) => void;
  setCurrentReport: (report: Report | null) => void;
  setFilters: (filters: ReportFilters) => void;
  setSelectedReportId: (id: string | null) => void;
  clearError: () => void;
  
  // API Actions
  fetchMyReports: (filters?: ReportFilters) => Promise<void>;
  fetchReport: (ticketId: string) => Promise<void>;
  submitReport: (data: SubmitReportRequest) => Promise<string>;
  deleteReport: (ticketId: string) => Promise<void>;
  submitRating: (ticketId: string, rating: number, comment?: string) => Promise<void>;
  
  // Coordinator Actions
  fetchCoordinatorReports: (filters?: ReportFilters) => Promise<void>;
  reviewReport: (ticketId: string, action: 'approve' | 'reject' | 'reviewing', priority?: string, reason?: string) => Promise<void>;
}

export const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      // Initial state
      reports: [],
      currentReport: null,
      filters: {
        page: 1,
        limit: 10,
      },
      isLoading: false,
      error: null,
      selectedReportId: null,
      
      // State setters
      setReports: (reports) => set({ reports }),
      setCurrentReport: (report) => set({ currentReport: report }),
      setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
      setSelectedReportId: (id) => set({ selectedReportId: id }),
      clearError: () => set({ error: null }),
      
      // API Actions
      fetchMyReports: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const response = await reportApi.getMyReports(filters || get().filters);
          set({ reports: response.reports, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      fetchReport: async (ticketId) => {
        set({ isLoading: true, error: null });
        try {
          const report = await reportApi.getReport(ticketId);
          set({ currentReport: report, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      submitReport: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await reportApi.submitReport(data);
          
          // Add to local reports list
          const newReport: ReportSummary = {
            ticket_id: response.ticket_id,
            category: data.category,
            location: data.location,
            problem_summary: data.problem_description.substring(0, 100) + '...',
            status: response.status,
            priority: 'medium', // Default
            submitted_at: response.submitted_at,
          };
          
          set((state) => ({
            reports: [newReport, ...state.reports],
            isLoading: false,
          }));
          
          return response.ticket_id;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
      
      deleteReport: async (ticketId) => {
        set({ isLoading: true, error: null });
        try {
          await reportApi.deleteReport(ticketId);
          set((state) => ({
            reports: state.reports.filter(r => r.ticket_id !== ticketId),
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
      
      submitRating: async (ticketId, rating, comment) => {
        set({ isLoading: true, error: null });
        try {
          await reportApi.submitRating(ticketId, { rating, comment });
          
          // Update report status locally
          set((state) => ({
            reports: state.reports.map(r =>
              r.ticket_id === ticketId
                ? { ...r, status: 'closed' }
                : r
            ),
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
      
      // Coordinator Actions
      fetchCoordinatorReports: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const response = await coordinatorApi.getAssignedReports(filters || get().filters);
          set({ reports: response.reports, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      reviewReport: async (ticketId, action, priority, reason) => {
        set({ isLoading: true, error: null });
        try {
          await coordinatorApi.reviewReport(ticketId, {
            action,
            priority: priority as any,
            rejection_reason: reason,
          });
          
          // Update report status locally
          const newStatus = action === 'approve' ? 'approved' : 
                           action === 'reject' ? 'rejected' : 'reviewing';
          
          set((state) => ({
            reports: state.reports.map(r =>
              r.ticket_id === ticketId
                ? { ...r, status: newStatus, priority: priority as any }
                : r
            ),
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'report-storage',
      partialize: (state) => ({
        reports: state.reports,
        filters: state.filters,
      }),
    }
  )
);