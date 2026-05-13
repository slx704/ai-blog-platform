<template>
  <div class="profile">
    <div class="container">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else class="profile-content">
        <div class="profile-header">
          <div class="avatar-section">
            <div class="avatar">
              <img v-if="profile.avatar" :src="profile.avatar" alt="头像" class="avatar-img" />
              <span v-else class="avatar-icon">👤</span>
            </div>
            <div class="user-info">
              <h2 class="username">{{ profile.username }}</h2>
              <p class="signature">{{ profile.signature || '暂无签名' }}</p>
              <div class="user-stats">
                <span class="stat-item">🎂 {{ profile.age || '未知' }} 岁</span>
                <span class="stat-item">📅 {{ formatDate(profile.created_at) }} 加入</span>
                <span class="stat-item">💾 {{ profile.total_tokens.toLocaleString() }} 消耗token</span>
              </div>
            </div>
          </div>
          <button @click="openEditModal" class="edit-btn">编辑资料</button>
        </div>
        
        <div class="profile-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.icon }} {{ tab.name }}
          </button>
        </div>
        
        <div class="tab-content">
          <div v-if="activeTab === 'articles'" class="articles-tab">
            <div v-if="userArticles.length === 0" class="empty-state">
              <p>暂无文章</p>
            </div>
            <div v-else class="article-list">
              <article v-for="article in userArticles" :key="article.id" class="article-item">
                <router-link :to="`/article/${article.id}`" class="article-link">
                  <h3 class="article-title">{{ article.title }}</h3>
                  <div class="article-meta">
                    <span class="date">{{ formatDate(article.created_at) }}</span>
                    <span class="views">{{ article.view_count }} 阅读</span>
                    <span class="likes">{{ article.like_count }} 点赞</span>
                  </div>
                </router-link>
                <button @click="handleDeleteArticle(article.id)" class="delete-btn">删除</button>
              </article>
            </div>
          </div>
          
          <div v-if="activeTab === 'likes'" class="likes-tab">
            <div v-if="likedArticles.length === 0" class="empty-state">
              <p>暂无点赞的文章</p>
            </div>
            <div v-else class="article-list">
              <article v-for="article in likedArticles" :key="article.id" class="article-item">
                <router-link :to="`/article/${article.id}`" class="article-link">
                  <h3 class="article-title">{{ article.title }}</h3>
                  <div class="article-meta">
                    <span class="author">{{ article.username }}</span>
                    <span class="date">{{ formatDate(article.created_at) }}</span>
                    <span class="views">{{ article.view_count }} 阅读</span>
                  </div>
                </router-link>
              </article>
            </div>
          </div>
          
          <div v-if="activeTab === 'history'" class="history-tab">
            <div v-if="historyRecords.length === 0" class="empty-state">
              <p>暂无使用记录</p>
            </div>
            <div v-else class="history-list">
              <div v-for="record in historyRecords" :key="record.id" class="history-item">
                <div class="history-header">
                  <span class="tool-type">{{ getToolTypeName(record.tool_type) }}</span>
                  <span class="date">{{ formatDate(record.created_at) }}</span>
                </div>
                <div class="history-content">
                  <p class="input-text">{{ truncate(record.input_text, 50) }}</p>
                  <p class="output-text">{{ truncate(record.output_text, 100) }}</p>
                </div>
                <div class="tokens-used">消耗 {{ record.tokens_used }} token</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>编辑资料</h3>
            <button @click="showEditModal = false" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group avatar-upload">
              <label>头像</label>
              <div class="avatar-preview">
                <img v-if="editForm.avatar || profile.avatar" :src="editForm.avatar || profile.avatar" alt="头像预览" />
                <span v-else class="no-avatar">👤</span>
              </div>
              <input id="avatar-upload" type="file" accept="image/*" @change="handleAvatarUpload" class="avatar-input" />
              <label for="avatar-upload" class="upload-btn">选择图片</label>
              <button v-if="editForm.avatar || profile.avatar" @click="removeAvatar" class="remove-avatar-btn">移除头像</button>
            </div>
            <div class="form-group">
              <label>签名</label>
              <input v-model="editForm.signature" type="text" placeholder="输入签名" class="form-input" />
            </div>
            <div class="form-group">
              <label>年龄</label>
              <input v-model.number="editForm.age" type="number" placeholder="输入年龄" class="form-input" />
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showEditModal = false" class="cancel-btn">取消</button>
            <button @click="handleUpdateProfile" class="confirm-btn">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProfile, updateProfile, getUserArticles, getUserLikes } from '../api/users'
import { deleteArticle } from '../api/articles'

interface UserProfile {
  id: number
  username: string
  avatar?: string
  signature?: string
  age?: number
  total_tokens: number
  created_at: string
}

interface Article {
  id: number
  title: string
  view_count: number
  like_count: number
  created_at: string
  username?: string
}

interface HistoryRecord {
  id: number
  tool_type: string
  input_text: string
  output_text: string
  tokens_used: number
  created_at: string
}

const router = useRouter()

const profile = ref<UserProfile>({
  id: 0,
  username: '',
  signature: '',
  age: undefined,
  total_tokens: 0,
  created_at: new Date().toISOString()
})
const userArticles = ref<Article[]>([])
const likedArticles = ref<Article[]>([])
const historyRecords = ref<HistoryRecord[]>([])
const loading = ref(false)
const activeTab = ref('articles')
const showEditModal = ref(false)

const editForm = reactive({
  avatar: '',
  signature: '',
  age: 0
})

const tabs = [
  { id: 'articles', name: '我的文章', icon: '📝' },
  { id: 'likes', name: '我的点赞', icon: '❤️' },
  { id: 'history', name: 'AI使用记录', icon: '📊' }
]

const toolTypeNames: Record<string, string> = {
  polish: '✨ 文案润色',
  code_comment: '💻 代码注释',
  translate: '🌍 翻译'
}

const formatDate = (dateString: string) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '未知'
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const truncate = (text: string, maxLength: number) => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const getToolTypeName = (type: string) => {
  return toolTypeNames[type] || type
}

const fetchProfile = async () => {
  loading.value = true
  try {
    profile.value = await getProfile()
    await fetchUserArticles()
    await fetchLikedArticles()
  } catch (err) {
    console.error('获取资料失败:', err)
  } finally {
    loading.value = false
  }
}

const fetchUserArticles = async () => {
  try {
    userArticles.value = await getUserArticles(profile.value.id)
  } catch (err) {
    console.error('获取文章失败:', err)
  }
}

const fetchLikedArticles = async () => {
  try {
    likedArticles.value = await getUserLikes()
  } catch (err) {
    console.error('获取点赞失败:', err)
  }
}

const handleDeleteArticle = async (articleId: number) => {
  if (!confirm('确定删除这篇文章吗？')) return
  try {
    await deleteArticle(articleId)
    await fetchUserArticles()
  } catch (err) {
    console.error('删除文章失败:', err)
  }
}

const openEditModal = () => {
  editForm.avatar = ''
  editForm.signature = profile.value.signature || ''
  editForm.age = profile.value.age || 0
  showEditModal.value = true
}

const handleAvatarUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    editForm.avatar = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removeAvatar = () => {
  editForm.avatar = ''
}

const handleUpdateProfile = async () => {
  try {
    await updateProfile({
      avatar: editForm.avatar || undefined,
      signature: editForm.signature || undefined,
      age: editForm.age || undefined
    })
    await fetchProfile()
    showEditModal.value = false
    editForm.avatar = ''
  } catch (err) {
    console.error('更新资料失败:', err)
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.profile {
  min-height: 100vh;
  background: #f5f7fa;
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
  border: 3px solid #e0e0e0;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.profile-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 30px;
  border-bottom: 1px solid #eee;
}

.avatar-section {
  display: flex;
  gap: 20px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 48px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.user-info h2 {
  font-size: 24px;
  margin: 0 0 8px 0;
}

.user-info .signature {
  color: #666;
  margin: 0 0 12px 0;
}

.user-stats {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #999;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.edit-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.profile-tabs {
  display: flex;
  gap: 20px;
  padding: 20px 30px;
  border-bottom: 1px solid #eee;
}

.tab-btn {
  padding: 10px 20px;
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.3s;
}

.tab-btn:hover {
  background: #f5f7fa;
}

.tab-btn.active {
  background: #667eea;
  color: white;
}

.tab-content {
  padding: 30px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #999;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.article-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #fafafa;
  border-radius: 10px;
}

.article-link {
  flex: 1;
  text-decoration: none;
  color: inherit;
}

.article-title {
  font-size: 16px;
  margin: 0 0 8px 0;
  color: #333;
}

.article-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #999;
}

.delete-btn {
  padding: 8px 16px;
  background: #fff0f0;
  color: #d32f2f;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.history-item {
  padding: 20px;
  background: #fafafa;
  border-radius: 10px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.tool-type {
  font-weight: 600;
  color: #667eea;
}

.history-content {
  margin-bottom: 10px;
}

.input-text {
  font-size: 13px;
  color: #666;
  margin: 0 0 5px 0;
  font-style: italic;
}

.output-text {
  font-size: 14px;
  color: #333;
  margin: 0;
}

.tokens-used {
  font-size: 12px;
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  font-size: 16px;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-size: 14px;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  overflow: hidden;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-avatar {
  font-size: 48px;
}

.avatar-input {
  display: none;
}

.upload-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 10px;
}

.remove-avatar-btn {
  padding: 8px 16px;
  background: #fff0f0;
  color: #d32f2f;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #eee;
}

.cancel-btn {
  padding: 10px 20px;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.confirm-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .profile-tabs {
    gap: 10px;
    padding: 15px 20px;
  }
  
  .tab-btn {
    padding: 8px 14px;
    font-size: 13px;
  }
  
  .tab-content {
    padding: 20px;
  }
  
  .article-item {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>