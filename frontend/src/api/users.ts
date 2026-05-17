import api from '../utils/request'

export interface UserProfile {
  id: number
  username: string
  avatar?: string
  signature?: string
  bio?: string
  nickname?: string
  gender?: 'male' | 'female' | 'other'
  birthday?: string
  country?: string
  province?: string
  city?: string
  age?: number
  total_tokens: number
  created_at: string
}

export const getProfile = async (): Promise<UserProfile> => {
  const response = await api.get('/users/profile')
  return response.data
}

export const updateProfile = async (data: { 
  avatar?: string; 
  signature?: string; 
  bio?: string;
  nickname?: string;
  gender?: string;
  birthday?: string;
  country?: string;
  province?: string;
  city?: string;
  age?: number 
}): Promise<void> => {
  await api.put('/users/profile', data)
}

export const updatePassword = async (data: { oldPassword: string; newPassword: string }): Promise<void> => {
  await api.put('/users/password', data)
}

export const getUserArticles = async (userId: number): Promise<any[]> => {
  const response = await api.get(`/users/articles/${userId}`)
  return response.data
}

export const getUserLikes = async (): Promise<any[]> => {
  const response = await api.get('/users/likes')
  return response.data
}