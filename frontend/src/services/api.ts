import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor to inject Token and Tenant ID headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('educenter_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Try resolving tenant ID from local storage or from subdomain
    const tenantId = localStorage.getItem('educenter_tenant_id')
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId
    }

    return config;
  },
  (error) => Promise.reject(error)
)

export default api
