import { api } from '../../api/axiosInstance';
import type {
    UserProfileResponse,
    UpdateProfileRequest,
    ReportApiResponse
} from '../reports/types';

export const userApi = {
    // Get user profile
    getProfile: async (): Promise<UserProfileResponse> => {
        const response = await api.get<ReportApiResponse<UserProfileResponse>>('/users/profile') as any;
        return response.data;
    },

    // Update user profile
    updateProfile: async (data: UpdateProfileRequest): Promise<UserProfileResponse> => {
        const response = await api.put<ReportApiResponse<UserProfileResponse>>('/users/profile', data) as any;
        return response.data;
    },
};
