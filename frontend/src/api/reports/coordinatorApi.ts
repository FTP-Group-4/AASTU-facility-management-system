import { api } from '../../api/axiosInstance';
import type { 
  ReportFilters, 
  ReportsResponse, 
  Report,
  ReportPriority 
} from '../../types/report';
import type { ReportApiResponse, ReviewReportRequest, ReviewReportResponse } from './types';

export interface CoordinatorDashboardResponse {
  assigned_blocks: Array<{
    block_id: number;
    block_name: string;
    pending_approvals: number;
    in_progress: number;
    overdue: number;
  }>;
  pending_reports: Array<{
    ticket_id: string;
    category: 'electrical' | 'mechanical';
    location: string;
    problem_summary: string;
    submitted_at: string;
    submitted_by: string;
    photos_count: number;
    possible_duplicates?: Array<{
      ticket_id: string;
      status: string;
    }>;
  }>;
  stats: {
    total_pending: number;
    approved_today: number;
    sla_compliance_rate: number;
  };
}

export const coordinatorApi = {
  // Get coordinator dashboard
  getDashboard: async (): Promise<CoordinatorDashboardResponse> => {
    const response = await api.get<ReportApiResponse<CoordinatorDashboardResponse>>(
      '/coordinator/dashboard'
    );
    return response.data.data;
  },

  // Get reports for assigned blocks
  getAssignedReports: async (filters?: ReportFilters): Promise<ReportsResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.block_id) params.append('block_id', filters.block_id.toString());
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<ReportApiResponse<ReportsResponse>>(
      `/coordinator/reports?${params.toString()}`
    );
    return response.data.data;
  },

  // Review and approve/reject report
  reviewReport: async (ticketId: string, data: ReviewReportRequest): Promise<ReviewReportResponse> => {
    const response = await api.post<ReportApiResponse<ReviewReportResponse>>(
      `/coordinator/reports/${ticketId}/review`,
      data
    );
    return response.data.data;
  },

  // Get report details for coordinator
  getReportForReview: async (ticketId: string): Promise<Report> => {
    const response = await api.get<ReportApiResponse<Report>>(`/coordinator/reports/${ticketId}`);
    return response.data.data;
  },

  // Get pending approvals count
  getPendingCount: async (): Promise<number> => {
    const response = await api.get<ReportApiResponse<{ count: number }>>(
      '/coordinator/pending-count'
    );
    return response.data.data.count;
  },
};