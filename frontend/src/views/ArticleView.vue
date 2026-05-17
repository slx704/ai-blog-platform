<template>
  <div class="article">
    <div class="container">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="fetchArticle" class="retry-btn">重试</button>
      </div>
      
      <article v-else class="article-content">
        <div class="article-main">
          <header class="article-header">
            <h1 class="article-title">{{ article.title }}</h1>
            <div class="article-meta">
              <span class="author">{{ article.username }}</span>
              <span class="dot">·</span>
              <span class="date">{{ formatDate(article.created_at) }}</span>
              <span class="dot">·</span>
              <span class="views">{{ article.view_count }} 阅读</span>
            </div>
          </header>
          
          <div class="article-body" v-html="renderedContent"></div>
          
          <footer class="article-footer">
            <div class="article-actions">
              <button @click="handleLike" :class="['action-btn', { liked: isLiked }]" :disabled="!checkLogin()">
                <span class="action-icon">{{ isLiked ? '❤️' : '🤍' }}</span>
                <span>{{ article.like_count }} 点赞</span>
              </button>
            </div>
            
            <div class="article-tags">
              <span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </footer>
        </div>
        
        <section class="comments-section">
          <h3 class="comments-title">评论 ({{ comments.length }})</h3>
          
          <div v-if="comments.length === 0" class="empty-comments">
            <p>暂无评论，快来发表第一条评论吧！</p>
          </div>
          
          <div v-else class="comments-list">
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">{{ comment.username }}</span>
                  <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
                  <button v-if="canDeleteComment(comment)" @click="handleDeleteComment(comment.id)" class="delete-comment-btn">删除</button>
                  <button @click="toggleReply(comment.id)" class="reply-btn">回复</button>
                </div>
                <p class="comment-text">{{ comment.content }}</p>
                <p v-if="comment.translatedContent" class="comment-translated">{{ comment.translatedContent }}</p>
                <button v-if="!comment.translatedContent" @click="handleTranslateComment(comment)" class="translate-btn">翻译</button>
                
                <div v-if="replyTo === comment.id" class="reply-form">
                  <textarea v-model="replyContent" placeholder="输入回复内容..." class="reply-input"></textarea>
                  <div class="reply-actions">
                    <button @click="toggleReply(comment.id)" class="reply-cancel">取消</button>
                    <button @click="handleReply(comment.id)" class="reply-submit">回复</button>
                  </div>
                </div>
                
                <div v-if="comment.children && comment.children.length > 0" class="nested-comments">
                  <div v-for="child in comment.children" :key="child.id" class="nested-comment">
                    <div class="comment-content">
                      <div class="comment-header">
                        <span class="comment-author">{{ child.username }}</span>
                        <span class="comment-date">{{ formatDate(child.created_at) }}</span>
                        <button v-if="canDeleteComment(child)" @click="handleDeleteComment(child.id)" class="delete-comment-btn">删除</button>
                      </div>
                      <p class="comment-text">{{ child.content }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <form @submit.prevent="handleSubmitComment" class="comment-form">
            <textarea v-model="newComment" placeholder="写下你的评论..." class="comment-input"></textarea>
            <button type="submit" class="submit-comment-btn">发表评论</button>
          </form>
        </section>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { fetchArticleById, updateViewCount, likeArticle, unlikeArticle } from '../api/articles'
import { createComment, fetchCommentsByArticleId, deleteComment } from '../api/comments'
import { streamTranslate } from '../api/ai'
import { isAuthenticated } from '../api/auth'
import { devLog, devError } from '../utils/devLogger'

interface Article {
  id: number
  title: string
  content: string
  view_count: number
  like_count: number
  created_at: string
  username: string
  tags: string[]
}

interface Comment {
  id: number
  article_id: number
  user_id: number
  content: string
  parent_id: number | null
  username: string
  created_at: string
  children?: Comment[]
  translatedContent?: string
}

const route = useRoute()
const articleId = ref(0)
const article = ref<Article>({
  id: 0,
  title: '',
  content: '',
  view_count: 0,
  like_count: 0,
  created_at: '',
  username: '',
  tags: []
})
const comments = ref<Comment[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const isLiked = ref(false)
const newComment = ref('')
const replyContent = ref('')
const replyTo = ref<number | null>(null)

const renderedContent = computed(() => {
  const html = marked(article.value.content)
  return DOMPurify.sanitize(html)
})

const checkLogin = () => {
  return isAuthenticated()
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchArticle = async () => {
  loading.value = true
  error.value = null
  
  try {
    const id = parseInt(route.params.id as string)
    articleId.value = id
    article.value = await fetchArticleById(id)
    await updateViewCount(id)
    await fetchComments()
  } catch (err) {
    error.value = '获取文章失败'
    devError('获取文章失败:', err)
  } finally {
    loading.value = false
  }
}

const fetchComments = async () => {
  try {
    comments.value = await fetchCommentsByArticleId(articleId.value)
  } catch (err) {
    devError('获取评论失败:', err)
  }
}

const handleLike = async () => {
  if (!checkLogin()) return
  
  try {
    if (isLiked.value) {
      await unlikeArticle(articleId.value)
      article.value.like_count--
    } else {
      await likeArticle(articleId.value)
      article.value.like_count++
    }
    isLiked.value = !isLiked.value
  } catch (err) {
    devError('点赞失败:', err)
  }
}

const handleSubmitComment = async () => {
  if (!newComment.value.trim() || !checkLogin()) return
  
  try {
    devLog('正在提交评论:', newComment.value)
    const result = await createComment(articleId.value, newComment.value.trim())
    devLog('评论提交结果:', result)
    
    const newCommentObj: Comment = {
      id: result.id,
      article_id: articleId.value,
      user_id: 0,
      content: newComment.value.trim(),
      parent_id: null,
      username: '用户',
      created_at: new Date().toISOString(),
      children: []
    }
    
    comments.value = [...comments.value, newCommentObj]
    newComment.value = ''
    devLog('评论已添加到列表')
  } catch (err) {
    devError('发表评论失败:', err)
    alert('发表评论失败，请稍后重试')
  }
}

const handleReply = async (parentId: number) => {
  if (!replyContent.value.trim()) return
  
  try {
    devLog('正在提交回复:', replyContent.value)
    const result = await createComment(articleId.value, replyContent.value.trim(), parentId)
    devLog('回复提交结果:', result)
    
    const newReplyObj: Comment = {
      id: result.id,
      article_id: articleId.value,
      user_id: 0,
      content: replyContent.value.trim(),
      parent_id: parentId,
      username: '用户',
      created_at: new Date().toISOString()
    }
    
    const parentComment = comments.value.find(c => c.id === parentId)
    if (parentComment) {
      if (!parentComment.children) {
        parentComment.children = []
      }
      parentComment.children = [...(parentComment.children || []), newReplyObj]
    }
    
    replyContent.value = ''
    replyTo.value = null
    devLog('回复已添加到列表')
  } catch (err) {
    devError('回复评论失败:', err)
    alert('回复失败，请稍后重试')
  }
}

const toggleReply = (commentId: number) => {
  replyTo.value = replyTo.value === commentId ? null : commentId
  replyContent.value = ''
}

const handleDeleteComment = async (commentId: number) => {
  if (!confirm('确定删除这条评论吗？')) return
  
  try {
    devLog('正在删除评论:', commentId)
    await deleteComment(commentId)
    
    comments.value = comments.value.filter(c => c.id !== commentId)
    comments.value.forEach(c => {
      if (c.children) {
        c.children = c.children.filter(child => child.id !== commentId)
      }
    })
    
    devLog('评论已从列表中删除')
  } catch (err) {
    devError('删除评论失败:', err)
    alert('删除评论失败，请稍后重试')
  }
}

const canDeleteComment = (comment: Comment) => {
  return true
}

const handleTranslateComment = async (comment: Comment) => {
  try {
    let result = ''
    await streamTranslate(comment.content, '中文', (chunk) => {
      result += chunk
    })
    comment.translatedContent = result
  } catch (err) {
    devError('翻译失败:', err)
  }
}

onMounted(() => {
  fetchArticle()
})
</script>

<style scoped>
.article {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: 30px 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.loading {
  text-align: center;
  padding: 60px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 40px 0;
  color: #d32f2f;
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.article-content {
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 2px 10px var(--shadow);
  overflow: hidden;
}

.article-main {
  padding: 30px;
}

.article-header {
  margin-bottom: 30px;
}

.article-title {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.article-meta {
  font-size: 14px;
  color: var(--text-muted);
  display: flex;
  gap: 8px;
}

.article-body {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
}

.article-body :deep(h1) {
  font-size: 24px;
  margin: 24px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.article-body :deep(h2) {
  font-size: 20px;
  margin: 20px 0 12px;
}

.article-body :deep(h3) {
  font-size: 18px;
  margin: 16px 0 10px;
}

.article-body :deep(p) {
  margin: 12px 0;
}

.article-body :deep(code) {
  background: var(--bg-secondary);
  padding: 2px 6px;
  font-family: 'Consolas', monospace;
  font-size: 14px;
  border-radius: 3px;
}

.article-body :deep(pre) {
  background: #1e1e1e;
  padding: 16px;
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.article-body :deep(pre code) {
  background: none;
  padding: 0;
  color: #ccc;
}

.article-body :deep(blockquote) {
  border-left: 3px solid #667eea;
  margin: 16px 0;
  padding-left: 16px;
  color: var(--text-secondary);
}

.article-body :deep(a) {
  color: #667eea;
  text-decoration: none;
}

.article-body :deep(a:hover) {
  text-decoration: underline;
}

.article-body :deep(ul), .article-body :deep(ol) {
  padding-left: 24px;
  margin: 12px 0;
}

.article-body :deep(li) {
  margin: 4px 0;
}

.article-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.article-actions {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--bg-secondary);
  border: none;
  border-radius: 25px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  background: var(--border-color);
}

.action-btn.liked {
  background: #ffeef0;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  font-size: 16px;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 5px 12px;
  background: var(--bg-secondary);
  border-radius: 15px;
  font-size: 12px;
  color: var(--text-secondary);
}

.comments-section {
  padding: 30px;
  border-top: 1px solid var(--border-color);
}

.comments-title {
  font-size: 18px;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.empty-comments {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 10px;
}

.comment-content {
  background: var(--bg-card);
  padding: 15px;
  border-radius: 8px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.comment-author {
  font-weight: 600;
  color: var(--text-primary);
}

.comment-date {
  font-size: 12px;
  color: var(--text-muted);
}

.delete-comment-btn, .reply-btn {
  margin-left: auto;
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-comment-btn {
  background: #fff0f0;
  color: #d32f2f;
}

.reply-btn {
  background: #f0f7ff;
  color: #667eea;
}

.comment-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  margin: 0;
}

.comment-translated {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 10px 0 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--border-color);
  font-style: italic;
}

.translate-btn, .translate-toggle {
  margin-top: 10px;
  padding: 4px 10px;
  font-size: 12px;
  background: #f0f7ff;
  color: #667eea;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.reply-form {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed var(--border-color);
}

.reply-input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.reply-submit {
  padding: 6px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.reply-cancel {
  padding: 6px 16px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.nested-comments {
  margin-top: 15px;
  padding-left: 20px;
  border-left: 2px solid var(--border-color);
}

.nested-comment {
  margin-top: 15px;
}

.comment-form {
  margin-top: 20px;
}

.comment-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.submit-comment-btn {
  margin-top: 12px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  float: right;
}

@media (max-width: 768px) {
  .article-main, .comments-section {
    padding: 20px;
  }
  
  .article-title {
    font-size: 22px;
  }
  
  .article-actions {
    gap: 10px;
  }
  
  .action-btn {
    padding: 8px 14px;
    font-size: 13px;
  }
}
</style>