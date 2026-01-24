import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, AUTH_CONFIG } from '../config/api.config';

// Create axios instance with base configuration
export const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add request ID for tracing
      // config.headers['X-Request-ID'] = crypto.randomUUID();

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  let isRefreshing = false;
  let failedQueue: any[] = [];

  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });

    failedQueue = [];
  };

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Handle API response format
      if (response.data && typeof response.data === 'object') {
        return response.data;
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Handle 401 Unauthorized - try token refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = 'Bearer ' + token;
            }
            return instance(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

          if (refreshToken) {
            // Attempt to refresh token
            const refreshResponse = await axios.post(
              `${API_CONFIG.BASE_URL}/auth/refresh`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${refreshToken}`,
                },
              }
            );

            if (refreshResponse.data.success) {
              const { access_token, refresh_token } = refreshResponse.data.data;

              // Update tokens in storage
              localStorage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, access_token);
              localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refresh_token);

              // Update auth header and retry original request
              instance.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
              }

              processQueue(null, access_token);

              return instance(originalRequest);
            }
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
          localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
          localStorage.removeItem(AUTH_CONFIG.USER_KEY);

          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Handle other errors
      const errorData = error.response?.data as any;
      const errorMessage = errorData?.message || error.message || 'An error occurred';
      const errorCode = errorData?.error_code || 'UNKNOWN_ERROR';

      return Promise.reject({
        message: errorMessage,
        code: errorCode,
        status: error.response?.status,
        data: errorData?.data,
      });
    }
  );

  return instance;
};

// Export a singleton instance
export const api = createAxiosInstance();