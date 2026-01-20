import { api } from '../../api/axiosInstance';
import type { 
  SubmitReportRequest, 
  SubmitReportResponse, 
  ReportFilters, 
  ReportsResponse,
  Report,
  RatingRequest 
} from '../../types/report';
import type { ReportApiResponse, DuplicateCheckResponse } from './types';

export const reportApi = {
  // Submit new report
  submitReport: async (data: SubmitReportRequest): Promise<SubmitReportResponse> => {
    const response = await api.post<ReportApiResponse<SubmitReportResponse>>('/reports', data);
    return response.data.data;
  },

  // Get reporter's reports
  getMyReports: async (filters?: ReportFilters): Promise<ReportsResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.block_id) params.append('block_id', filters.block_id.toString());
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get<ReportApiResponse<ReportsResponse>>(
      `/reports/my?${params.toString()}`
    );
    return response.data.data;
  },

  // Get report details
  getReport: async (ticketId: string): Promise<Report> => {
    const response = await api.get<ReportApiResponse<Report>>(`/reports/${ticketId}`);
    return response.data.data;
  },

  // Submit rating for completed report
  submitRating: async (ticketId: string, data: RatingRequest): Promise<{ new_status: string }> => {
    const response = await api.post<ReportApiResponse<{ new_status: string }>>(
      `/reports/${ticketId}/rate`,
      data
    );
    return response.data.data;
  },

  // Check for duplicates
  checkDuplicate: async (data: {
    block_id?: number;
    room_number?: string;
    equipment_description: string;
  }): Promise<DuplicateCheckResponse> => {
    const response = await api.post<ReportApiResponse<DuplicateCheckResponse>>(
      '/reports/check-duplicate',
      data
    );
    return response.data.data;
  },

  // Delete report (if allowed)
  deleteReport: async (ticketId: string): Promise<void> => {
    await api.delete(`/reports/${ticketId}`);
  },
};