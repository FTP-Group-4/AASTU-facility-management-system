import { api } from '../../api/axiosInstance';
import type {
    SubmitReportRequest,
    SubmitReportResponse,
    ReportFilters,
    ReportsResponse,
    Report,
    RatingRequest
} from '../../types/report';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    error_code: string | null;
    timestamp: string;
}

export const reportApiWithFiles = {
    // Submit new report WITH FILES
    submitReport: async (data: SubmitReportRequest): Promise<SubmitReportResponse> => {
        try {
            console.log('API: Preparing FormData with', data.photos.length, 'files');

            // Create FormData object for multipart/form-data
            const formData = new FormData();

            // Add text fields
            formData.append('category', data.category);
            formData.append('location_type', data.location.type);

            // Add location-specific fields
            if (data.location.type === 'specific') {
                if (data.location.block_id) {
                    formData.append('block_id', data.location.block_id.toString());
                }
                if (data.location.room_number) {
                    formData.append('room_number', data.location.room_number);
                }
            } else if (data.location.type === 'general') {
                if (data.location.description) {
                    formData.append('location_description', data.location.description);
                }
            }

            formData.append('equipment_description', data.equipment_description);
            formData.append('problem_description', data.problem_description);

            // Add each photo file
            data.photos.forEach((photo) => {
                formData.append('photos', photo);
            });

            // Send as multipart/form-data
            // Note: The axios interceptor returns response.data
            const response = await api.post('/reports', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }) as any;

            console.log('API: Submit response:', response);

            if (response.success === false) {
                const error = new Error(response.message || 'Failed to submit report');
                (error as any).error_code = response.error_code;
                (error as any).data = response.data;
                throw error;
            }

            // Success case - return the data payload
            return response.data || response;
        } catch (error: any) {
            console.error('API: Request failed:', error);

            if (error.response) {
                // Server responded with error status
                const errorData = error.response.data;
                const apiError = new Error(errorData?.message || `HTTP ${error.response.status}`);
                (apiError as any).error_code = errorData?.error_code;
                (apiError as any).data = errorData?.data;
                throw apiError;
            } else if (error.request) {
                throw new Error('Network error: No response from server. Check your connection.');
            } else {
                throw error;
            }
        }
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

        const response = await api.get<ApiResponse<ReportsResponse>>(
            `/reports/my?${params.toString()}`
        ) as any;

        if (!response.success) {
            throw new Error(response.message || 'Failed to fetch reports');
        }

        return response.data;
    },

    // Get report details
    getReport: async (ticketId: string): Promise<Report> => {
        const response = await api.get<ApiResponse<{ report: any }>>(`/reports/${ticketId}`) as any;

        if (!response.success) {
            throw new Error(response.message || 'Failed to fetch report details');
        }

        const data = response.data.report;

        // In reportApiWithFiles.getReport
        console.log('Reporter: Fetching report for ticket:', ticketId);
        
        console.log('Reporter API response data:', response.data);
        console.log('Reporter Photos in response:', response.data?.report?.photos);


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
                url: p.url,
                thumbnail_url: p.url
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
        const response = await api.post<ApiResponse<{ new_status: string }>>(
            `/reports/${ticketId}/rate`,
            data
        ) as any;

        if (!response.success) {
            throw new Error(response.message || 'Failed to submit rating');
        }

        return response.data;
    },

    // Check for duplicates
    checkDuplicate: async (data: {
        block_id?: number;
        room_number?: string;
        equipment_description: string;
    }): Promise<any> => {
        const response = await api.post<ApiResponse<any>>(
            '/reports/check-duplicates',
            data
        ) as any;

        if (!response.success) {
            throw new Error(response.message || 'Failed to check for duplicates');
        }

        return response.data;
    },

    // Delete report
    deleteReport: async (ticketId: string): Promise<void> => {
        const response = await api.delete<ApiResponse<void>>(`/reports/${ticketId}`) as any;

        if (!response.success) {
            throw new Error(response.message || 'Failed to delete report');
        }
    },
};