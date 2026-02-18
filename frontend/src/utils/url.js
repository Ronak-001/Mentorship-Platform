/**
 * Resolves media URLs by prepending the backend URL to relative upload paths.
 * @param {string} url - The media URL path from the backend
 * @returns {string} - The corrected absolute URL for the frontend
 */
export const resolveMediaUrl = (url) => {
    if (!url) return null;

    // If it's already an absolute URL (starts with http or https), return it as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Get backend base URL from axios config or fall back to default
    const backendBase = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

    // Ensure we don't end up with double slashes if url already starts with /
    const sanitizedUrl = url.startsWith('/') ? url : `/${url}`;

    return `${backendBase}${sanitizedUrl}`;
};
