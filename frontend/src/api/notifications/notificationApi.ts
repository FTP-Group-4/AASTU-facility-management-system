import { api } from '../../api/axiosInstance';
import type { Notification, NotificationListResponse } from './types';
import type { ReportApiResponse } from '../reports/types';

export const notificationApi = {
    // Get notifications
    getNotifications: async (filters?: { unread_only?: boolean; type?: string; limit?: number }): Promise<NotificationListResponse> => {
        const params = new URLSearchParams();
        if (filters?.unread_only !== undefined) params.append('unread_only', filters.unread_only.toString());
        if (filters?.type) params.append('type', filters.type);
        if (filters?.limit) params.append('limit', filters.limit.toString());

        const response = await api.get<ReportApiResponse<NotificationListResponse>>(`/notifications?${params.toString()}`);
        return response.data.data;
    },

    // Mark notification as read
    markAsRead: async (notificationId: string): Promise<void> => {
        await api.post(`/notifications/${notificationId}/read`);
    },

    // Mark all notifications as read
    markAllAsRead: async (): Promise<void> => {
        await api.post('/notifications/read-all');
    },
};
