import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

interface User {
  id: string
  name: string
  email: string
  roles: string[]
  permissions: string[]
}

interface Tenant {
  id: string
  name: string
  subdomain: string
}

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  token: string | null
  loading: boolean
  error: string | null
  login: (email: string, password: string, subdomain?: string) => Promise<void>
  register: (tenantName: string, subdomain: string, name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Resolve subdomain from current URL
  const getSubdomain = (): string | null => {
    const hostname = window.location.hostname
    const parts = hostname.split('.')
    if (parts.length >= 2 && !['localhost', '127.0.0.1'].includes(hostname)) {
      const subdomain = parts[0]
      if (!['www', 'admin', 'api', 'landing'].includes(subdomain)) {
        return subdomain
      }
    }
    return null
  }

  // Load user from storage or token verification on startup
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('educenter_token')
      const storedTenant = localStorage.getItem('educenter_tenant')

      if (storedToken) {
        setToken(storedToken)
        if (storedTenant) {
          setTenant(JSON.parse(storedTenant))
        }

        try {
          const res = await api.get('/me')
          setUser(res.data.user)
        } catch (err) {
          console.error('Session restoration failed:', err)
          // Clear invalid session
          localStorage.removeItem('educenter_token')
          localStorage.removeItem('educenter_tenant')
          localStorage.removeItem('educenter_tenant_id')
          setUser(null)
          setTenant(null)
          setToken(null)
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string, inputSubdomain?: string) => {
    setLoading(true)
    setError(null)
    try {
      // 1. Resolve subdomain. Priority: Input field > Current URL host subdomain
      const activeSubdomain = inputSubdomain || getSubdomain()
      if (!activeSubdomain) {
        throw new Error('Please specify your learning center subdomain.')
      }

      // 2. Temporarily set host subdomain headers or pass it.
      // Since our API requires either Host: subdomain.educenter.com OR X-Tenant-ID header,
      // and we don't have the Tenant ID yet, we can pass a special X-Tenant-Subdomain header,
      // OR let the backend resolve by resolving it first. Wait!
      // In our middleware, if there's no X-Tenant-ID, it resolves by subdomain.
      // So if we make a request with header Host: <subdomain>.localhost:8000, it resolves.
      // But Axios can also receive a custom header, or we can fetch tenant by subdomain.
      // Wait, let's create a quick API helper in backend or resolve it.
      // Let's check how our middleware resolves subdomain:
      // "Assuming subdomain is the first part, e.g. "alpha.educenter.com" -> "alpha""
      // So we can send the login request to: `http://{subdomain}.localhost:8000/api/v1/login` or just send `X-Tenant-Subdomain`?
      // Wait, in our middleware, we only look for `X-Tenant-ID` or Host!
      // If we are developing locally, we can construct the Host header dynamically in Axios request config!
      // Yes!
      // config.headers['Host'] = `${subdomain}.educenter.com`
      // This is extremely elegant and works perfectly with our middleware!
      
      const config = {
        headers: {
          'X-Tenant-Subdomain': activeSubdomain
        }
      }

      const res = await api.post('/login', { email, password }, config)
      
      const { user: userData, access_token, tenant: tenantData } = res.data

      // Save credentials to local storage
      localStorage.setItem('educenter_token', access_token)
      localStorage.setItem('educenter_tenant_id', userData.tenant_id)
      
      const resolvedTenant = tenantData || { id: userData.tenant_id, name: activeSubdomain, subdomain: activeSubdomain }
      localStorage.setItem('educenter_tenant', JSON.stringify(resolvedTenant))

      setToken(access_token)
      setTenant(resolvedTenant)
      setUser(userData)
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Login failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (tenantName: string, subdomain: string, name: string, email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/register', {
        tenant_name: tenantName,
        subdomain,
        name,
        email,
        password,
        password_confirmation: password,
      })

      const { user: userData, tenant: tenantData, access_token } = res.data

      localStorage.setItem('educenter_token', access_token)
      localStorage.setItem('educenter_tenant_id', tenantData.id)
      localStorage.setItem('educenter_tenant', JSON.stringify(tenantData))

      setToken(access_token)
      setTenant(tenantData)
      setUser(userData)
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Registration failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await api.post('/logout')
    } catch (err) {
      console.error('Logout error on server:', err)
    } finally {
      localStorage.removeItem('educenter_token')
      localStorage.removeItem('educenter_tenant')
      localStorage.removeItem('educenter_tenant_id')
      setUser(null)
      setTenant(null)
      setToken(null)
      setLoading(false)
    }
  }

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) || user?.roles.includes('Owner') || false
  }

  const hasRole = (role: string): boolean => {
    return user?.roles.includes(role) || false
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider value={{
      user,
      tenant,
      token,
      loading,
      error,
      login,
      register,
      logout,
      hasPermission,
      hasRole,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
