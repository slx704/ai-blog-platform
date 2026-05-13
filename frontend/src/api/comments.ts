import api from '../utils/request'

export interface Comment {
  id: number
  article_id: number
  user_id: number
  content: string
  parent_id: number | null
  username: string
  avatar?: string
  created_at: string
  children?: Comment[]
}

export const fetchCommentsByArticleId = async (articleId: number): Promise<Comment[]> => {
  const response = await api.get(`/comments/article/${articleId}`)
  return response.data
}

export const createComment = async (articleId: number, content: string, parentId?: number): Promise<{ id: number }> => {
  const response = await api.post('/comments', { articleId, content, parentId })
  return response.data
}

export const deleteComment = async (id: number): Promise<void> => {
  await api.delete(`/comments/${id}`)
}