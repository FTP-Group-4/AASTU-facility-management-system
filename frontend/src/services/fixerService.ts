import { api } from '../api/axiosInstance';

// Dashboard job item interface
export interface DashboardJob {
    id: string;
    ticket_id: string;
    priority: 'emergency' | 'high' | 'medium' | 'low';
    priority_color: string;
    location: string;
    problem_summary: string;
    category: 'electrical' | 'mechanical';
    assigned_at: string;
    sla_deadline: string | null;
    sla_remaining: string | null;
    reporter_name: string;
    photos: string[];
    status: string;
}

// Dashboard response interface
export interface FixerDashboardData {
    assigned_jobs: DashboardJob[];
    in_progress_jobs: DashboardJob[];
    completed_today: number;
    stats: {
        total_assigned: number;
        emergency_count: number;
        avg_completion_time: string;
    };
}

// Queue job item interface
export interface JobQueueItem {
    id: string;
    ticket_id: string;
    priority: 'emergency' | 'high' | 'medium' | 'low';
    location: string;
    problem: string;
    waiting_time: string;
    sla_urgency: string;
    assigned_to_me: boolean;
}

// Queue response interface
export interface JobQueueResponse {
    queue: JobQueueItem[];
    queue_stats: {
        total_waiting: number;
        emergency_count: number;
        oldest_waiting: string;
    };
}

export interface UpdateJobStatusPayload {
    status: 'assigned' | 'in_progress' | 'completed';
    notes?: string;
    parts_used?: string;
    time_spent_minutes?: number;
}

export const fixerService = {
    /**
     * Get fixer dashboard with assigned jobs and statistics
     * GET /fixer/dashboard
     */
    getDashboard: async (): Promise<FixerDashboardData> => {
        const response = await api.get('/fixer/dashboard');
        return response.data; // Correctly return the data field from the server response
    },

    /**
     * Get job queue sorted by priority, filtered by fixer category
     * GET /fixer/queue
     */
    getJobQueue: async (): Promise<JobQueueResponse> => {
        const response = await api.get('/fixer/queue');
        return response.data; // Correctly return the data field from the server response
    },

    /**
     * Get detailed job information
     * GET /reports/:id
     */
    getJobDetails: async (id: string): Promise<any> => {
        const response = await api.get(`/reports/${id}`);
        return response.data.report; // Access the nested report object
    },

    /**
     * Update job status (assigned, in_progress, completed)
     * POST /fixer/jobs/:ticketId/status
     */
    updateJobStatus: async (ticketId: string, data: UpdateJobStatusPayload): Promise<any> => {
        const response = await api.post(`/fixer/jobs/${ticketId}/status`, data);
        return response.data; // Correctly return the data field from the server response
    }
};

