import { useState, useEffect, createContext, useContext } from 'react'
import { authAPI } from '../lib/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem('admin_token')
      const userData = localStorage.getItem('admin_user')
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData)
          // Verify user has admin role
          if (parsedUser.roles && parsedUser.roles.includes('admin')) {
            setUser(parsedUser)
          } else {
            // Clear invalid user data
            localStorage.removeItem('admin_token')
            localStorage.removeItem('admin_user')
          }
        } catch (error) {
          console.error('Error parsing user data:', error)
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_user')
        }
      }
      
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    try {
      setLoading(true)
      const response = await authAPI.login(email, password)
      
      if (response.success && response.data) {
        const { user: userData, accessToken, refreshToken } = response.data
        
        // Verify user has admin role
        if (!userData.roles || !userData.roles.includes('admin')) {
          throw new Error('Access denied. Admin privileges required.')
        }
        
        // Store tokens and user data
        localStorage.setItem('admin_token', accessToken)
        localStorage.setItem('admin_refresh_token', refreshToken)
        localStorage.setItem('admin_user', JSON.stringify(userData))
        
        setUser(userData)
        toast.success('Login successful!')
        return { success: true }
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('admin_refresh_token')
      if (refreshToken) {
        await authAPI.logout(refreshToken)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_refresh_token')
      localStorage.removeItem('admin_user')
      setUser(null)
      toast.success('Logged out successfully')
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// For use in components that need auth context
export default function AuthWrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}
