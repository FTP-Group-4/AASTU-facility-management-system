import { api } from '../api/axiosInstance';
import type { User, UserFilters, CreateUserPayload, UpdateUserPayload, DashboardData, Block } from '../types/admin';

export const adminService = {
    // Dashboard
    getDashboard: async (): Promise<DashboardData> => {
        const response = await api.get('/admin/dashboard');
        return response.data;
    },

    // Users
    getAllUsers: async (params?: UserFilters) => {
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    getUserById: async (id: string): Promise<User> => {
        const response = await api.get(`/admin/users/${id}`);
        return response.data;
    },

    createUser: async (data: CreateUserPayload): Promise<User> => {
        const response = await api.post('/admin/users', data);
        return response.data;
    },

    updateUser: async (id: string, data: UpdateUserPayload): Promise<User> => {
        const response = await api.put(`/admin/users/${id}`, data);
        return response.data;
    },

    deleteUser: async (id: string) => {
        const response = await api.delete(`/admin/users/${id}`);
        return response.data;
    },

    // Blocks
    getAllBlocks: async (params?: any) => {
        const response = await api.get('/admin/blocks', { params });
        return response.data;
    },

    createBlock: async (data: any): Promise<Block> => {
        const response = await api.post('/admin/blocks', data);
        return response.data;
    },

    updateBlock: async (id: string, data: any): Promise<Block> => {
        const response = await api.put(`/admin/blocks/${id}`, data);
        return response.data;
    },

    deleteBlock: async (id: string) => {
        const response = await api.delete(`/admin/blocks/${id}`);
        return response.data;
    },

    // Assignments
    getAssignments: async () => {
        const response = await api.get('/admin/assignments');
        return response.data;
    },

    assignCoordinator: async (blockId: string, coordinatorId: string) => {
        const response = await api.post(`/admin/blocks/${blockId}/coordinators`, { coordinator_id: coordinatorId });
        return response.data;
    },

    removeCoordinatorAssignment: async (blockId: string, coordinatorId: string) => {
        const response = await api.delete(`/admin/blocks/${blockId}/coordinators/${coordinatorId}`);
        return response.data;
    },

    // Reports
    generateReport: async (data: any) => {
        const response = await api.post('/admin/reports/generate', data);
        return response.data;
    },

    // System Config
    getSystemConfig: async () => {
        const response = await api.get('/admin/config');
        return response.data;
    },

    /**
     * Get all reports (Admin view)
     * GET /admin/reports
     */
    getAllReports: async (params?: any) => {
        const response = await api.get('/admin/reports', { params });
        return response.data;
    },

    /**
     * Get report by ID (Admin view)
     * GET /admin/reports/:id
     */
    getReportById: async (id: string) => {
        const response = await api.get(`/reports/${id}`);
        return response.data;
    }
};
