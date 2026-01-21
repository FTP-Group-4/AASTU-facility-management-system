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
    const response = await api.post('/reports', data) as unknown as ReportApiResponse<SubmitReportResponse>;
    return response.data;
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

    const response = await api.get(
      `/reports/my?${params.toString()}`
    ) as unknown as ReportApiResponse<ReportsResponse>;
    return response.data;
  },

  // Get report details
  getReport: async (ticketId: string): Promise<Report> => {
    const response = await api.get(`/reports/${ticketId}`) as unknown as ReportApiResponse<{ report: any }>;
    const data = response.data.report;

    // Transform backend fields to frontend format if necessary
    // (Though we should ideally do this in the backend)
    return {
      ...data,
      submitted_at: data.created_at || data.submitted_at,
      submitted_by: {
        name: data.submitter?.full_name || 'Unknown',
        role: data.submitter?.role || 'reporter',
        department: data.submitter?.department || 'AASTU'
      },
      location: {
        type: data.location_type || 'specific',
        block_id: data.block_id,
        room_number: data.room_number,
        description: data.location_description
      },
      photos: data.photos?.map((p: any) => ({
        id: p.id,
        url: p.file_path,
        thumbnail_url: p.thumbnail_path
      })) || [],
      workflow: data.workflow_history?.map((w: any) => ({
        action: w.action,
        by: w.user?.full_name || 'System',
        at: w.created_at,
        notes: w.notes
      })) || []
    } as Report;
  },

  // Submit rating for completed report
  submitRating: async (ticketId: string, data: RatingRequest): Promise<{ new_status: string }> => {
    const response = await api.post(
      `/reports/${ticketId}/rate`,
      data
    ) as unknown as ReportApiResponse<{ new_status: string }>;
    return response.data;
  },

  // Check for duplicates
  checkDuplicate: async (data: {
    block_id?: number;
    room_number?: string;
    equipment_description: string;
  }): Promise<DuplicateCheckResponse> => {
    const response = await api.post(
      '/reports/check-duplicate',
      data
    ) as unknown as ReportApiResponse<DuplicateCheckResponse>;
    return response.data;
  },

  // Delete report (if allowed)
  deleteReport: async (ticketId: string): Promise<void> => {
    await api.delete(`/reports/${ticketId}`);
  },
};