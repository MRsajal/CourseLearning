// Configuration for course data source
const COURSE_CONFIG = {
  // Set to 'static' for frontend-only data, 'api' for backend API, 'hybrid' for both
  dataSource: 'hybrid', // Options: 'static', 'api', 'hybrid'
  
  // API endpoint when using backend
  apiEndpoint: '/api/courses',
  
  // Fallback to static data if API fails
  fallbackToStatic: true
};

export default COURSE_CONFIG;
