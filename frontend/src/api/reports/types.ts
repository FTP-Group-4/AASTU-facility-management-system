import type { 
  Report, 
  ReportSummary, 
  ReportFilters, 
  SubmitReportRequest, 
  SubmitReportResponse, 
  RatingRequest,
  ReportPriority,
  ReportStatus 
} from '../../types/report';

export interface ReportApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  error_code: string | null;
}

export interface DuplicateCheckResponse {
  is_duplicate: boolean;
  duplicate_ticket_id?: string;
  duplicate_status?: ReportStatus;
  similarity_score: number;
}

export interface ReviewReportRequest {
  action: 'approve' | 'reject' | 'reviewing';
  priority?: ReportPriority;
  rejection_reason?: string;
}

export interface ReviewReportResponse {
  ticket_id: string;
  new_status: ReportStatus;
  priority?: ReportPriority;
  sla_deadline?: string;
  message: string;
}