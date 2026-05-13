import api from '../utils/request'

export interface Article {
  id: number
  user_id: number
  title: string
  content: string
  category: string
  view_count: number
  like_count: number
  comment_count?: number
  created_at: string
  updated_at: string
  username: string
  avatar?: string
}

export interface CreateArticleRequest {
  title: string
  content: string
  category?: string
  tags?: string[]
}

export const fetchArticles = async (keyword?: string, category?: string): Promise<Article[]> => {
  let url = '/articles'
  if (keyword) {
    url = `/articles/search?keyword=${encodeURIComponent(keyword)}`
  } else if (category && category !== 'all') {
    url = `/articles?category=${encodeURIComponent(category)}`
  }
  const response = await api.get(url)
  return response.data
}

export const fetchArticleById = async (id: number): Promise<Article> => {
  const response = await api.get(`/articles/${id}`)
  return response.data
}

export const createArticle = async (data: CreateArticleRequest): Promise<{ id: number }> => {
  const response = await api.post('/articles', data)
  return response.data
}

export const updateArticle = async (id: number, data: CreateArticleRequest): Promise<void> => {
  await api.put(`/articles/${id}`, data)
}

export const deleteArticle = async (id: number): Promise<void> => {
  await api.delete(`/articles/${id}`)
}

export const fetchArticlesByCategory = async (category: string): Promise<Article[]> => {
  const response = await api.get(`/articles?category=${encodeURIComponent(category)}`)
  return response.data
}