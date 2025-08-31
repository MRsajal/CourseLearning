import axios from 'axios';
import { preBuiltCourses } from '../data/coursesData';
import COURSE_CONFIG from '../config/courseConfig';

class CourseService {
  async getAllCourses(filters = {}) {
    try {
      if (COURSE_CONFIG.dataSource === 'static') {
        return this.getStaticCourses(filters);
      }
      
      if (COURSE_CONFIG.dataSource === 'api') {
        return await this.getApiCourses(filters);
      }
      
      if (COURSE_CONFIG.dataSource === 'hybrid') {
        return await this.getHybridCourses(filters);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      
      if (COURSE_CONFIG.fallbackToStatic) {
        console.log('Falling back to static data...');
        return this.getStaticCourses(filters);
      }
      
      throw error;
    }
  }

  getStaticCourses(filters = {}) {
    let filteredCourses = [...preBuiltCourses];
    
    // Apply filters
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredCourses = filteredCourses.filter(course => 
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm) ||
        course.instructorName.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.category && filters.category !== "all") {
      filteredCourses = filteredCourses.filter(course => 
        course.category === filters.category
      );
    }
    
    if (filters.level && filters.level !== "all") {
      filteredCourses = filteredCourses.filter(course => 
        course.level === filters.level
      );
    }
    
    return {
      courses: filteredCourses,
      count: filteredCourses.length,
      source: 'static'
    };
  }

  async getApiCourses(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.category && filters.category !== "all") {
      params.append("category", filters.category);
    }
    if (filters.level && filters.level !== "all") {
      params.append("level", filters.level);
    }
    if (filters.search) {
      params.append("search", filters.search);
    }
    
    const response = await axios.get(`${COURSE_CONFIG.apiEndpoint}?${params.toString()}`);
    
    return {
      courses: response.data.courses || response.data || [],
      count: response.data.count || (response.data.courses || response.data || []).length,
      source: 'api',
      dbCount: response.data.dbCount || 0,
      staticCount: response.data.staticCount || 0
    };
  }

  async getHybridCourses(filters = {}) {
    try {
      // Try API first (which includes both DB and static courses)
      const apiResult = await this.getApiCourses(filters);
      return {
        ...apiResult,
        source: 'hybrid'
      };
    } catch (error) {
      // Fallback to static only
      console.log('API failed, using static data only');
      return {
        ...this.getStaticCourses(filters),
        source: 'static-fallback'
      };
    }
  }

  async getFeaturedCourses(limit = 6) {
    const result = await this.getAllCourses();
    return {
      courses: result.courses.slice(0, limit),
      count: Math.min(result.count, limit),
      source: result.source
    };
  }

  async getCourseById(id) {
    try {
      if (COURSE_CONFIG.dataSource === 'static') {
        return preBuiltCourses.find(course => course.id === parseInt(id));
      }
      
      // For API or hybrid, try API first
      const response = await axios.get(`${COURSE_CONFIG.apiEndpoint}/${id}`);
      return response.data.course;
    } catch (error) {
      // Fallback to static data
      if (COURSE_CONFIG.fallbackToStatic) {
        return preBuiltCourses.find(course => course.id === parseInt(id));
      }
      throw error;
    }
  }
}

const courseService = new CourseService();
export default courseService;
