import axios from 'axios';

const baseURL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error status is 401 and there's no originalRequest._retry flag,
    // it means the token has expired and we need to refresh it
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        console.log('Refreshing token with:', refreshToken);
        const response = await axios.post(`${baseURL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (error) {
        // Handle refresh token error or redirect to login
        console.error('Token refresh error:', error);
        console.log('Refresh token is invalid. Logging out...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials) => {
    try {
      // Clear any existing tokens first
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');

      console.log('Login attempt with:', credentials);
      const response = await axios.post(`${baseURL}/token/`, {
        username: credentials.username,
        password: credentials.password
      });
      console.log('Login response:', response.data);
      
      const { access, refresh, user } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Configure axios instance with new token
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      return { access, refresh, user };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export const userService = {
  getProfile: async () => {
    try {
      const response = await api.get('/student/dashboard/');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error.response?.data);
      throw error;
    }
  },
  updateProfile: async (data) => {
    try {
      const response = await api.put('/profile/update/', data);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error.response?.data);
      throw error;
    }
  },
  changePassword: async (data) => {
    try {
      const response = await api.put('/profile/change-password/', data);
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error.response?.data);
      throw error;
    }
  },
  getAllStudents: async () => {
    try {
      const response = await axios.get(`${baseURL}/student-management/students/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all students:', error.response?.data);
      throw error;
    }
  },
  updateStudentStatus: async (studentId, isActive) => {
    try {
      const response = await axios.patch(
        `${baseURL}/student-management/students/${studentId}/update_status/`,
        { is_active: isActive },
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating student status:', error.response?.data);
      throw error;
    }
  },
  sendNotification: async (studentId, message) => {
    try {
      const response = await axios.post(
        `${baseURL}/student-management/students/${studentId}/notify/`,
        { message },
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending notification:', error.response?.data);
      throw error;
    }
  },
  getStudentExamHistory: async (studentId) => {
    try {
      const response = await axios.get(
        `${baseURL}/student-management/students/${studentId}/exam-history/`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching student exam history:', error.response?.data);
      throw error;
    }
  },
  getStudentAnalytics: async (studentId) => {
    try {
      const response = await api.get(`/student-management/${studentId}/analytics/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student analytics:', error.response?.data);
      throw error;
    }
  },
  uploadStudentsCsv: (formData) => api.post('/student-management/upload-students-csv/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export const examService = {
  getExams: async () => {
    try {
      const response = await api.get('/exams/');
      return response.data;
    } catch (error) {
      console.error('Error fetching exams:', error.response?.data);
      throw error;
    }
  },
  getExam: async (id) => {
    try {
      const response = await api.get(`/exams/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exam:', error.response?.data);
      throw error;
    }
  },
  hasSubmittedExam: async (examId) => {
    try {
      const response = await api.get(`/submissions/?exam=${examId}`);
      return response.data.length > 0;
    } catch (error) {
      console.error('Error checking exam submission:', error.response?.data);
      throw error;
    }
  },
  createExam: async (data) => {
    try {
      const response = await api.post('/exams/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating exam:', error.response?.data);
      throw error;
    }
  },
  updateExam: async (id, data) => {
    try {
      const response = await api.put(`/exams/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating exam:', error.response?.data);
      throw error;
    }
  },
  deleteExam: async (id) => {
    try {
      await api.delete(`/exams/${id}/`);
    } catch (error) {
      console.error('Error deleting exam:', error.response?.data);
      throw error;
    }
  },
  getQuestions: async (examId) => {
    try {
      const response = await api.get(`/questions/?exam=${examId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching questions:', error.response?.data);
      throw error;
    }
  },
  createQuestion: async (data) => {
    try {
      const { exam, ...questionData } = data; // Extract exam ID from the data
      const response = await api.post(`/questions/?exam=${exam}`, questionData); // Pass exam ID as a query parameter
      return response.data;
    } catch (error) {
      console.error('Error creating question:', error.response?.data);
      throw error;
    }
  },
  updateQuestion: async (id, data) => {
    try {
      const response = await api.put(`/questions/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating question:', error.response?.data);
      throw error;
    }
  },
  deleteQuestion: async (id) => {
    try {
      await api.delete(`/questions/${id}/`);
    } catch (error) {
      console.error('Error deleting question:', error.response?.data);
      throw error;
    }
  },
  submitExam: async (examId, data) => {
    try {
      const response = await api.post(`/submissions/`, {
        exam: examId,
        answers: data.answers,
        time_taken: data.time_taken
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting exam:', error.response?.data);
      throw error;
    }
  },
  uploadExamsCsv: async (formData) => {
    try {
      const response = await api.post(`/upload-exams-csv/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading exams CSV:', error.response?.data || error.message);
      throw error;
    }
  },
};


export const uploadProctorFrame = async (formData) => {
  try {
    const response = await api.post("/proctoring/frame-analysis/", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("API error uploading frame:", error);
    throw error;
  }
};

export const compileAndRunCode = async (code, language, testCases) => {
  try {
    const response = await api.post('/execute-code/', {
      code,
      language,
      test_cases: testCases,
    });
    return response.data.results;
  } catch (error) {
    console.error('Error executing code:', error);
    throw new Error('Failed to execute code. Please try again.');
  }
};

export default api;