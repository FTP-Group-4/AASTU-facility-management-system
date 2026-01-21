export type NotificationType =
    | 'report_status_update'
    | 'sla_warning'
    | 'new_assignment'
    | 'new_feedback'
    | 'system_announcement'
    | 'info'
    | 'success'
    | 'warning'
    | 'error';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    ticket_id?: string;
    action_url?: string;
    is_read: boolean;
    created_at: string;
}

export interface NotificationListResponse {
    notifications: Notification[];
    unread_count: number;
}
