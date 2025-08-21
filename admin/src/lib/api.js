import axios from 'axios'
import toast from 'react-hot-toast'

// Create axios instance
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Show error toast for non-401 errors
    const message = error.response?.data?.message || error.message || 'An error occurred'
    toast.error(message)
    
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },
  
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  },
  
  logout: async (refreshToken) => {
    const response = await api.post('/auth/logout', { refreshToken })
    return response.data
  },
}

// Content API
export const contentAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/explore/list', { params })
    return response.data
  },
  
  getById: async (id) => {
    const response = await api.get(`/content/${id}`)
    return response.data
  },
  
  create: async (data) => {
    const response = await api.post('/admin/content', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await api.put(`/admin/content/${id}`, data)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/admin/content/${id}`)
    return response.data
  },
  
  getStats: async () => {
    const response = await api.get('/content/admin/stats')
    return response.data
  },
  
  getCategories: async () => {
    const response = await api.get('/content/categories')
    return response.data
  },
}

// Users API
export const usersAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/admin/users', { params })
    return response.data
  },
  
  getById: async (id) => {
    const response = await api.get(`/admin/users/${id}`)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await api.put(`/admin/users/${id}`, data)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/admin/users/${id}`)
    return response.data
  },
}

// Upload API
export const uploadAPI = {
  uploadFile: async (file, type = 'content') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    
    const response = await api.post('/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

export default api
