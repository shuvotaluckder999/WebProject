import axios from "axios";
import { create } from "zustand";

const API_URL = "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth Store
const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/auth/register", data);
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      set({ user, token, loading: false });
      return { success: true, data: user };
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Registration failed";
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      set({ user, token, loading: false });
      return { success: true, data: user };
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Login failed";
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null, error: null });
  },

  updateProfile: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put("/auth/update", data);
      const { user } = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      set({ user, loading: false });
      return { success: true, data: user };
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Update failed";
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  clearError: () => set({ error: null }),
}));

// Class Store
const useClassStore = create((set) => ({
  classes: [],
  currentClass: null,
  loading: false,
  error: null,

  fetchClasses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/class");
      set({ classes: response.data.data, loading: false });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to fetch classes";
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  getClass: async (classId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/class/${classId}`);
      set({ currentClass: response.data.data, loading: false });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to fetch class";
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  createClass: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/class", data);
      set((state) => ({
        classes: [...state.classes, response.data.data],
        loading: false,
      }));
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to create class";
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  joinClass: async (code) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/class/join/code", { code });
      set((state) => ({
        classes: [...state.classes, response.data.data],
        loading: false,
      }));
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to join class";
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  deleteClass: async (classId) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/class/${classId}`);
      set((state) => ({
        classes: state.classes.filter((c) => c._id !== classId),
        loading: false,
      }));
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to delete class";
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  clearError: () => set({ error: null }),
}));

// Task Store
const useTaskStore = create((set) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async (classId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/task/class/${classId}`);
      set({ tasks: response.data.data, loading: false });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to fetch tasks";
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  createTask: async (classId, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/task", {
        ...data,
        classId,
      });
      set((state) => ({
        tasks: [...state.tasks, response.data.data],
        loading: false,
      }));
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to create task";
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  deleteTask: async (taskId) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/task/${taskId}`);
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== taskId),
        loading: false,
      }));
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to delete task";
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  clearError: () => set({ error: null }),
}));

// Assignment Store
const useAssignmentStore = create((set) => ({
  assignments: [],
  loading: false,
  error: null,

  fetchMyAssignments: async (classId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/assignment/my/${classId}`);
      set({ assignments: response.data.data, loading: false });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to fetch assignments";
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  submitAssignment: async (assignmentId, submission) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/assignment/${assignmentId}/submit`, {
        submission,
      });
      set((state) => ({
        assignments: state.assignments.map((a) =>
          a._id === assignmentId ? response.data.data : a
        ),
        loading: false,
      }));
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to submit assignment";
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  spinAssignments: async (classId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/assignment/spin/${classId}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to spin assignments";
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  clearError: () => set({ error: null }),
}));

export {
  api,
  useAuthStore,
  useClassStore,
  useTaskStore,
  useAssignmentStore,
};
