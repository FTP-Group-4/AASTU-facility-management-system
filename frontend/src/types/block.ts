export interface Block {
  id: number; // 1-100
  name: string;
  description?: string;
  floors: number;
  coordinators: CoordinatorAssignment[];
  report_count?: number;
}

export interface CoordinatorAssignment {
  coordinator_id: string;
  name: string;
  email: string;
  is_primary: boolean;
}

export interface BlockAssignment {
  block_id: number;
  block_name: string;
  pending_approvals: number;
  in_progress: number;
  overdue: number;
}