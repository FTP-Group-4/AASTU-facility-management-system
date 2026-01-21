export type ReportCategory = 'electrical' | 'mechanical';
export type ReportPriority = 'emergency' | 'high' | 'medium' | 'low';
export type ReportStatus =
  | 'submitted'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'closed'
  | 'reopened'
  | 'reviewing';

export interface Location {
  type: 'specific' | 'general';
  block_id?: number; // 1-100
  room_number?: string;
  description?: string; // Required if general
}

export interface Photo {
  id: string;
  url: string;
  thumbnail_url: string;
  caption?: string;
}

export interface WorkflowStep {
  action: string;
  by: string;
  at: string;
  priority?: ReportPriority;
  notes?: string;
}

export interface SLA {
  deadline: string;
  remaining_hours: number;
}

export interface ReporterInfo {
  name: string;
  role: string;
  department?: string;
  email?: string;
}

export interface PartUsed {
  name: string;
  quantity: number;
  unit?: string;
}

export interface Report {
  ticket_id: string;
  category: ReportCategory;
  location: Location;
  equipment_description: string;
  problem_description: string;
  status: ReportStatus;
  priority: ReportPriority;
  submitted_at: string;
  submitted_by: ReporterInfo;
  photos: Photo[];
  workflow: WorkflowStep[];
  sla?: SLA;
  notes?: string;
  parts_used?: PartUsed[];
  completion_notes?: string;
  time_spent_minutes?: number;
  rating?: number;
  feedback?: string;
  duplicate_of?: string;
}

export interface ReportSummary {
  ticket_id: string;
  category: ReportCategory;
  location: {
    block_id?: number;
    block_name?: string;
    room_number?: string;
    description?: string;
  };
  problem_summary: string;
  status: ReportStatus;
  priority: ReportPriority;
  submitted_at: string;
  sla_deadline?: string;
  current_assignee?: string;
}

export interface ReportFilters {
  status?: ReportStatus;
  priority?: ReportPriority;
  block_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface ReportsResponse {
  reports: ReportSummary[];
  summary: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    rejected: number;
  };
}

// CHANGE THIS: Make photos File[] instead of string[]
export interface SubmitReportRequest {
  category: ReportCategory;
  location: Location;
  equipment_description: string;
  problem_description: string;
  photos: File[]; // CHANGED: Now File[] instead of string[]
}

export interface SubmitReportResponse {
  ticket_id: string;
  status: ReportStatus;
  submitted_at: string;
  coordinator_assigned: {
    name: string;
    email: string;
  };
  message: string;
  duplicate_ticket_id?: string;
  duplicate_status?: ReportStatus;
}

export interface RatingRequest {
  rating: number; // 0-5
  comment?: string; // Required for ratings 0-3
  mark_still_broken?: boolean;
}