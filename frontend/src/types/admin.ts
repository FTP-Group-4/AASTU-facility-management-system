export interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'coordinator' | 'electrical_fixer' | 'mechanical_fixer' | 'reporter';
    phone?: string;
    is_active: boolean;
    profile_picture?: string;
    created_at: string;
    updated_at: string;
    department?: string;
}

export interface UserFilters {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
}

export interface CreateUserPayload {
    email: string;
    full_name: string;
    password?: string;
    role: 'admin' | 'coordinator' | 'electrical_fixer' | 'mechanical_fixer' | 'reporter';
    phone?: string;
    department?: string;
}

export interface UpdateUserPayload {
    role?: 'admin' | 'coordinator' | 'electrical_fixer' | 'mechanical_fixer' | 'reporter';
    is_active?: boolean;
}

export interface DashboardData {
    system_health: {
        uptime: string;
        active_users: number;
        api_response_time: string;
    };
    reports_summary: {
        total_reports: number;
        reports_today: number;
        completion_rate: number;
        avg_rating: number;
    };
    sla_compliance: {
        emergency: number;
        high: number;
        medium: number;
        low: number;
    };
    alerts: Array<{
        type: string;
        message: string;
        severity: 'high' | 'medium' | 'low';
    }>;
}

export interface CoordinatorAssignment {
    id: string;
    name: string;
    email: string;
    is_primary: boolean;
}

export interface Block {
    id: string;
    block_number: number;
    name: string;
    description?: string;
    coordinators: CoordinatorAssignment[];
    report_count: number;
}
