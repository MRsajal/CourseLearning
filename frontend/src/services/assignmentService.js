import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Get user token from localStorage
const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// Get multipart config for file uploads
const getMultipartConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  };
};

const assignmentService = {
  // Create new assignment (Instructor)
  createAssignment: async (assignmentData) => {
    try {
      const response = await axios.post(
        `${API_URL}/assignments/create`,
        assignmentData,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error("Error creating assignment:", error);
      throw error.response?.data || error;
    }
  },

  // Get assignments for a course
  getCourseAssignments: async (courseId) => {
    try {
      const response = await axios.get(
        `${API_URL}/assignments/course/${courseId}`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching course assignments:", error);
      throw error.response?.data || error;
    }
  },

  // Get instructor's assignments across all courses
  getInstructorAssignments: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/assignments/instructor`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching instructor assignments:", error);
      throw error.response?.data || error;
    }
  },

  // Submit assignment (Student)
  submitAssignment: async (assignmentId, submissionData) => {
    try {
      const formData = new FormData();
      formData.append("submissionType", submissionData.submissionType);

      if (submissionData.submissionType === "text") {
        formData.append("textContent", submissionData.textContent);
      } else if (
        submissionData.submissionType === "pdf" &&
        submissionData.file
      ) {
        formData.append("file", submissionData.file);
      }

      const response = await axios.post(
        `${API_URL}/assignments/${assignmentId}/submit`,
        formData,
        getMultipartConfig()
      );
      return response.data;
    } catch (error) {
      console.error("Error submitting assignment:", error);
      throw error.response?.data || error;
    }
  },

  // Grade assignment submission (Instructor)
  gradeSubmission: async (assignmentId, submissionId, gradeData) => {
    try {
      const response = await axios.put(
        `${API_URL}/assignments/${assignmentId}/grade/${submissionId}`,
        gradeData,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error("Error grading submission:", error);
      throw error.response?.data || error;
    }
  },

  // Get assignment details with submissions (Instructor)
  getAssignmentSubmissions: async (assignmentId) => {
    try {
      const response = await axios.get(
        `${API_URL}/assignments/${assignmentId}/submissions`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching assignment submissions:", error);
      throw error.response?.data || error;
    }
  },

  // Download submitted file (Instructor)
  downloadSubmission: async (assignmentId, submissionId) => {
    try {
      const response = await axios.get(
        `${API_URL}/assignments/${assignmentId}/download/${submissionId}`,
        {
          ...getAuthConfig(),
          responseType: "blob",
        }
      );
      return response;
    } catch (error) {
      console.error("Error downloading submission:", error);
      throw error.response?.data || error;
    }
  },

  // Delete assignment (Instructor)
  deleteAssignment: async (assignmentId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/assignments/${assignmentId}`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting assignment:", error);
      throw error.response?.data || error;
    }
  },
};

export default assignmentService;
