// API utility functions

/**
 * Get the base URL for API calls
 * @returns {string} The base URL for the backend API
 */
export const getApiBaseUrl = () => {
  // Check if we're in development or production
  if (process.env.NODE_ENV === 'development') {
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  }
  
  // In production, you might want to use a different URL
  return process.env.REACT_APP_BACKEND_URL || window.location.origin;
};

/**
 * Get the full URL for an API endpoint
 * @param {string} endpoint - The API endpoint (e.g., '/api/users')
 * @returns {string} The full URL
 */
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
};

/**
 * Open a backend URL in a new window (bypasses React Router)
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Additional options
 * @param {string} options.token - JWT token to include in URL
 */
export const openBackendUrl = (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const finalUrl = options.token ? `${url}?token=${options.token}` : url;
  window.open(finalUrl, '_blank');
};
