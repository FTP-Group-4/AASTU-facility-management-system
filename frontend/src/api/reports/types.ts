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

export interface CoordinatorAnalyticsResponse {
  block_performance: Array<{
    block_id: number;
    block_name: string;
    metrics: {
      total_reports: number;
      completion_rate: number;
      avg_completion_time_hours: number;
      avg_rating: number;
      duplicate_rate: number;
    };
  }>;
  priority_distribution: {
    emergency: number;
    high: number;
    medium: number;
    low: number;
  };
  trends: {
    reports_last_7_days: number[];
    completion_rate_trend: number[];
  };
}

export interface UserProfileResponse {
  id: string;
  email: string;
  role: string;
  full_name: string;
  assigned_blocks?: Array<{
    block_id: number;
    block_name: string;
  }>;
  location_not_specified?: boolean;
  stats?: {
    pending_approvals: number;
    approved_today: number;
    sla_compliance: number;
  };
}

export interface UpdateProfileRequest {
  full_name?: string;
  phone?: string;
  avatar?: string;
}