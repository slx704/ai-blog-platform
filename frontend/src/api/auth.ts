import api from '../utils/request'

export interface User {
  id: number
  username: string
  avatar?: string
  signature?: string
  age?: number
  totalTokens?: number
  role?: 'developer' | 'user'
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    token: string
    user: User
  }
}

export const register = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', { username, password })
  return response
}

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', { username, password })
  return response
}

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token')
}

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

export const isDeveloper = (): boolean => {
  const user = getCurrentUser()
  return user?.role === 'developer'
}

export const logout = (): void => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}