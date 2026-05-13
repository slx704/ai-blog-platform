<template>
  <div class="home">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">AI博客平台</h1>
        <p class="subtitle">让AI帮你写出更精彩的内容</p>
      </div>
      
      <div class="category-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.icon }} {{ tab.name }}
        </button>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="fetchArticlesData" class="retry-btn">重试</button>
      </div>
      
      <div v-else-if="filteredArticles.length === 0" class="empty">
        <p>暂无文章</p>
      </div>
      
      <div v-else class="article-list">
        <article v-for="article in filteredArticles" :key="article.id" class="article-card">
          <router-link :to="`/article/${article.id}`" class="article-link">
            <div class="article-tags">
              <span v-for="tag in getArticleTags(article.id)" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <h2 class="article-title">{{ article.title }}</h2>
            <div class="article-meta">
              <span class="author">{{ article.username || '博主' }}</span>
              <span class="dot">·</span>
              <span class="date">{{ formatDate(article.created_at) }}</span>
              <span class="dot">·</span>
              <span class="views">{{ article.view_count || 0 }} 阅读</span>
              <span class="dot">·</span>
              <span class="likes">{{ article.like_count || 0 }} 点赞</span>
            </div>
            <p class="article-excerpt">{{ truncateContent(article.content) }}</p>
          </router-link>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchArticles } from '../api/articles'

interface Article {
  id: number
  title: string
  content: string
  view_count: number
  like_count: number
  created_at: string
  updated_at: string
  username: string
  tags?: string[]
}

const route = useRoute()
const articles = ref<Article[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref('all')

const tabs = [
  { id: 'all', name: '全部', icon: '📋' },
  { id: 'daily', name: '日常', icon: '🏠' },
  { id: 'code', name: '开发', icon: '💻' }
]

const tagMap = ref<Record<number, string[]>>({})

const filteredArticles = computed(() => {
  if (activeTab.value === 'all') return articles.value
  return articles.value.filter(article => article.category === activeTab.value)
})

const getArticleTags = (articleId: number): string[] => {
  return tagMap.value[articleId] || []
}

const fetchArticlesData = async () => {
  loading.value = true
  error.value = null
  try {
    const searchQuery = route.query.q as string
    const data = await fetchArticles(searchQuery, activeTab.value)
    articles.value = data
    
    data.forEach((article: Article & { tags?: string[] }) => {
      if (article.tags) {
        tagMap.value[article.id] = article.tags
      }
    })
  } catch (err) {
    error.value = '获取文章列表失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

watch(activeTab, () => {
  fetchArticlesData()
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const truncateContent = (content: string) => {
  let text = content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/^\s*>\s+/gm, '')
    .replace(/- /g, '')
    .replace(/\n+/g, ' ')
  return text.length > 120 ? text.substring(0, 120) + '...' : text
}

onMounted(() => {
  fetchArticlesData()
})

watch(() => route.query.q, () => {
  fetchArticlesData()
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 30px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 0;
}

.page-title {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.subtitle {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

.category-tabs {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
}

.tab-btn {
  padding: 10px 25px;
  border: none;
  border-radius: 25px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.tab-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
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

.retry-btn:hover {
  background: #5a6fd6;
}

.empty {
  text-align: center;
  padding: 60px 0;
  color: #999;
}

.article-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.article-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.3s;
}

.article-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}

.article-link {
  text-decoration: none;
  color: inherit;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.tag {
  padding: 3px 10px;
  background: #f0f0f0;
  border-radius: 15px;
  font-size: 12px;
  color: #666;
}

.article-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.article-title:hover {
  color: #667eea;
}

.article-meta {
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.article-excerpt {
  font-size: 14px;
  line-height: 1.6;
  color: #666;
  margin: 0;
}

@media (max-width: 768px) {
  .article-list {
    grid-template-columns: 1fr;
  }
  
  .article-card {
    padding: 18px;
  }
  
  .page-title {
    font-size: 28px;
  }
  
  .category-tabs {
    gap: 10px;
  }
  
  .tab-btn {
    padding: 8px 18px;
    font-size: 13px;
  }
}
</style>