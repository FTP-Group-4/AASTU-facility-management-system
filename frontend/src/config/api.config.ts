export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

export const AUTH_CONFIG = {
  ACCESS_TOKEN_KEY: 'aastu_fms_access_token',
  REFRESH_TOKEN_KEY: 'aastu_fms_refresh_token',
  USER_KEY: 'aastu_fms_user',
  TOKEN_REFRESH_INTERVAL: 300000, // 5 minutes
};