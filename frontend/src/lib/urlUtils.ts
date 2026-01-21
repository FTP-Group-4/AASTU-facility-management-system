import { API_CONFIG } from '../config/api.config';

/**
 * Ensures a media URL is absolute and points to the backend
 * @param path The relative or absolute path to the media file
 * @returns The absolute URL to the media file
 */
export const getMediaUrl = (path: string | null | undefined): string => {
    if (!path) return '';

    // If it's already an absolute URL (starts with http or https), return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;

    // Append to the backend base URL
    return `${API_CONFIG.BASE_URL}/${cleanPath}`;
};
