import { api } from '../../api/axiosInstance';
import type {
  ReportFilters,
  ReportsResponse,
  Report,
} from '../../types/report';
import type {
  ReportApiResponse,
  ReviewReportRequest,
  ReviewReportResponse,
  CoordinatorDashboardResponse,
  CoordinatorAnalyticsResponse
} from './types';

export const coordinatorApi = {
  // Get coordinator dashboard
  getDashboard: async (): Promise<CoordinatorDashboardResponse> => {
    const response = await api.get<ReportApiResponse<CoordinatorDashboardResponse>>(
      '/coordinator/dashboard'
    ) as any;
    return response.data;
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
    ) as any;
    return response.data;
  },

  // Get approved reports
  getApprovedReports: async (filters?: ReportFilters): Promise<ReportsResponse> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.block_id) params.append('block_id', filters.block_id.toString());
    // Add other filters as needed

    const response = await api.get<ReportApiResponse<ReportsResponse>>(
      `/coordinator/reports/approved?${params.toString()}`
    ) as any;
    return response.data;
  },

  // Get rejected reports
  getRejectedReports: async (filters?: ReportFilters): Promise<ReportsResponse> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.block_id) params.append('block_id', filters.block_id.toString());

    const response = await api.get<ReportApiResponse<ReportsResponse>>(
      `/coordinator/reports/rejected?${params.toString()}`
    ) as any;
    return response.data;
  },

  // Review and approve/reject report
  reviewReport: async (ticketId: string, data: ReviewReportRequest): Promise<ReviewReportResponse> => {
    const response = await api.post<ReportApiResponse<ReviewReportResponse>>(
      `/coordinator/reports/${ticketId}/review`,
      data
    ) as any;
    return response.data;
  },

  // Get report details for coordinator
  getReportForReview: async (ticketId: string): Promise<Report> => {
    const response = await api.get<ReportApiResponse<Report>>(`/coordinator/reports/${ticketId}`) as any;
    return response.data;
  },

  // Get analytics for assigned blocks
  getAnalytics: async (filters?: {
    block_id?: number;
    period?: 'day' | 'week' | 'month' | 'quarter' | 'year',
    metric?: string;
  }): Promise<CoordinatorAnalyticsResponse> => {
    const params = new URLSearchParams();
    if (filters?.block_id) params.append('block_id', filters.block_id.toString());
    if (filters?.period) params.append('period', filters.period);
    if (filters?.metric) params.append('metric', filters.metric);

    const response = await api.get<ReportApiResponse<CoordinatorAnalyticsResponse>>(
      `/analytics?${params.toString()}`
    ) as any;
    return response.data;
  },

  // Get pending approvals count
  getPendingCount: async (): Promise<number> => {
    const response = await api.get<ReportApiResponse<{ count: number }>>(
      '/coordinator/pending-count'
    ) as any;
    return response.data.count;
  },
};