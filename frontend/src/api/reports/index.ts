// Re-export everything from the report API files
export { reportApi } from './reportApi';
// export { coordinatorApi } from './coordinatorApi';

// Re-export all types
export type {
//   ApiResponse,
//   SubmitReportResponse,
//   ReportsListResponse,
//   CoordinatorDashboardResponse,
  ReviewReportRequest,
} from './types';

// Re-export main types from the types directory
export type {
  Report,
  ReportCategory,
  ReportStatus,
//   PriorityLevel,
  Location,
//   ReportPhoto,
//   WorkflowAction,
  ReportSummary,
//   ReportSubmission,
//   ReportFilter,
//   DuplicateWarning,
} from '../../types/report';

export type {
  Block,
//   BlockStats,
  BlockAssignment,
} from '../../types/block';