<template>
  <div class="edit">
    <div class="container">
      <div class="edit-header">
        <h1>{{ isEditMode ? '编辑文章' : '发布新文章' }}</h1>
        <div class="header-actions">
          <span class="markdown-hint">支持 Markdown 语法</span>
          <div class="ai-tools">
            <button 
              :disabled="!form.content.trim() || polishing"
              @click="handlePolish"
              class="ai-btn polish-btn"
            >
              ✨ AI润色
            </button>
            <button 
              @click="showTagModal = true"
              class="ai-btn tag-btn"
            >
              🏷️ 添加标签
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="error" class="error-msg">
        {{ error }}
        <button @click="fetchArticleData" class="retry-btn">重试</button>
      </div>
      
      <form @submit.prevent="submitForm" class="edit-form">
        <div class="form-group">
          <label for="title">标题</label>
          <input 
            id="title"
            v-model="form.title"
            type="text" 
            placeholder="请输入标题" 
            class="form-input"
          />
          <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
        </div>
        
        <div class="form-group">
          <label>分区</label>
          <div class="category-selector">
            <button 
              v-for="cat in categories" 
              :key="cat.id"
              :class="['category-btn', { active: form.category === cat.id }]"
              @click="selectCategory(cat.id)"
              type="button"
            >
              {{ cat.icon }} {{ cat.name }}
            </button>
          </div>
          <span v-if="errors.category" class="field-error">{{ errors.category }}</span>
        </div>
        
        <div v-if="form.category" class="form-group">
          <label>标签</label>
          <div class="tags-selector">
            <button 
              v-for="tag in filteredTags" 
              :key="tag"
              :class="['tag-btn', { selected: form.tags?.includes(tag) }]"
              @click="toggleTag(tag)"
              type="button"
            >
              {{ tag }}
            </button>
            <button 
              :class="['tag-btn', { expanded: showCustomInput }]"
              @click="showCustomInput = !showCustomInput"
              type="button"
            >
              + 自定义
            </button>
            <div v-if="showCustomInput" class="custom-tag-inline">
              <input 
                ref="customTagInput"
                v-model="newTag" 
                type="text" 
                placeholder="输入标签"
                @keyup.enter="handleAddCustomTag"
                class="custom-tag-inline-input"
              />
              <button @click="handleAddCustomTag" type="button" class="custom-tag-add-btn">+</button>
              <button @click="showCustomInput = false; newTag = ''" type="button" class="custom-tag-close-btn">×</button>
            </div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group content-group">
            <label for="content">正文</label>
            <textarea 
              id="content"
              v-model="form.content"
              placeholder="支持 Markdown 语法..."
              rows="16"
              class="form-input content-input"
            ></textarea>
            <span v-if="errors.content" class="field-error">{{ errors.content }}</span>
            
            <div v-if="polishing" class="polishing-indicator">
              <span class="loading-text">✨ AI正在润色中...</span>
            </div>
          </div>
          
          <div class="preview-panel">
            <div class="preview-header">
              <span>实时预览</span>
            </div>
            <div class="preview-content markdown-body" v-html="renderedPreview"></div>
          </div>
        </div>
        
        <div class="selected-tags" v-if="form.tags && form.tags.length > 0">
          <span class="tags-label">已选标签:</span>
          <div class="tags-list">
            <span 
              v-for="tag in form.tags" 
              :key="tag" 
              class="selected-tag"
            >
              {{ tag }}
              <button @click="removeTag(tag)" class="remove-tag">×</button>
            </span>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" @click="goBack" class="btn cancel">取消</button>
          <button type="submit" class="btn submit" :disabled="loading">
            {{ loading ? '处理中...' : (isEditMode ? '更新' : '发布') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { fetchArticleById, createArticle, updateArticle } from '../api/articles'
import { streamPolish } from '../api/ai'
import { devError } from '../utils/devLogger'

const route = useRoute()
const router = useRouter()

const isEditMode = computed(() => !!route.params.id)
const articleId = computed(() => Number(route.params.id))

const categories = [
  { id: 'daily', name: '日常', icon: '🏠' },
  { id: 'code', name: '代码', icon: '💻' }
]

const categoryTags = {
  daily: ['日常', '生活', '分享'],
  code: ['前端', '后端', 'AI', '技术']
}

const form = reactive({
  title: '',
  content: '',
  category: '',
  tags: [] as string[]
})

const errors = reactive({
  title: '',
  content: '',
  category: ''
})

const loading = ref(false)
const polishing = ref(false)
const error = ref('')
const newTag = ref('')
const showCustomInput = ref(false)
const customTagInput = ref<HTMLInputElement | null>(null)

const filteredTags = computed(() => {
  if (!form.category) return []
  return categoryTags[form.category as keyof typeof categoryTags] || []
})

const renderedPreview = computed(() => {
  if (!form.content) return ''
  return marked.parse(form.content, { async: false }) as string
})

const selectCategory = (category: string) => {
  if (form.category !== category) {
    form.category = category
    form.tags = []
  }
}

const validate = () => {
  let valid = true
  if (!form.title.trim()) {
    errors.title = '标题不能为空'
    valid = false
  } else {
    errors.title = ''
  }
  if (!form.category) {
    errors.category = '请选择分区'
    valid = false
  } else {
    errors.category = ''
  }
  if (!form.content.trim()) {
    errors.content = '内容不能为空'
    valid = false
  } else {
    errors.content = ''
  }
  return valid
}

const submitForm = async () => {
  if (!validate()) return
  
  loading.value = true
  error.value = ''
  
  try {
    if (isEditMode.value) {
      await updateArticle(articleId.value, form)
      router.push(`/article/${articleId.value}`)
    } else {
      const article = await createArticle(form)
      router.push(`/article/${article.id}`)
    }
  } catch (err) {
    error.value = '操作失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const fetchArticleData = async () => {
  if (!isEditMode.value) return
  
  loading.value = true
  try {
    const article = await fetchArticleById(articleId.value)
    form.title = article.title
    form.content = article.content
    form.tags = article.tags || []
    if (form.tags.includes('日常') || form.tags.includes('生活') || form.tags.includes('分享')) {
      form.category = 'daily'
    } else if (form.tags.includes('前端') || form.tags.includes('后端') || form.tags.includes('AI') || form.tags.includes('技术')) {
      form.category = 'code'
    }
  } catch (err) {
    error.value = '获取文章失败'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  isEditMode.value ? router.push(`/article/${articleId.value}`) : router.push('/')
}

const handlePolish = async () => {
  if (!form.content.trim() || polishing.value) return
  
  polishing.value = true
  const originalContent = form.content
  
  try {
    let polishedContent = ''
    await streamPolish(
      originalContent,
      (chunk) => {
        polishedContent += chunk
        form.content = polishedContent
      },
      () => {
        polishing.value = false
      },
      (error) => {
        polishing.value = false
        form.content = originalContent
        devError('润色失败:', error)
      }
    )
  } catch (err) {
    polishing.value = false
    form.content = originalContent
    devError('润色失败:', err)
  }
}

const toggleTag = (tag: string) => {
  const index = form.tags.indexOf(tag)
  if (index > -1) {
    form.tags.splice(index, 1)
  } else {
    form.tags.push(tag)
  }
}

const removeTag = (tag: string) => {
  const index = form.tags.indexOf(tag)
  if (index > -1) {
    form.tags.splice(index, 1)
  }
}

const addCustomTag = () => {
  const tag = newTag.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
    newTag.value = ''
    showCustomInput.value = false
  }
}

const handleAddCustomTag = () => {
  const tag = newTag.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
    newTag.value = ''
    showCustomInput.value = false
  }
}

onMounted(() => {
  fetchArticleData()
})
</script>

<style scoped>
.edit {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 30px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ddd;
}

.edit-header h1 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.markdown-hint {
  font-size: 12px;
  color: #999;
}

.ai-tools {
  display: flex;
  gap: 10px;
}

.ai-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.polish-btn {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  color: white;
}

.polish-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.polish-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tag-btn {
  background: #667eea;
  color: white;
}

.tag-btn:hover {
  background: #5a6fd6;
}

.error-msg {
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  margin-bottom: 20px;
  text-align: center;
}

.retry-btn {
  margin-left: 10px;
  padding: 4px 12px;
  background: #2e6b2f;
  color: white;
  border: none;
  cursor: pointer;
}

.edit-form {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 500;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.form-input:focus {
  border-color: #667eea;
}

.category-selector {
  display: flex;
  gap: 12px;
}

.category-btn {
  padding: 12px 24px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.category-btn:hover {
  border-color: #667eea;
  background: #f0f2f5;
}

.category-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tags-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.tags-selector .tag-btn {
  padding: 10px 20px;
  border: 2px solid #667eea;
  border-radius: 25px;
  background: white;
  font-size: 14px;
  font-weight: 500;
  color: #667eea;
  cursor: pointer;
  transition: all 0.3s;
}

.tags-selector .tag-btn:hover {
  border-color: #764ba2;
  background: #f0f4ff;
  color: #764ba2;
}

.tags-selector .tag-btn.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tags-selector .tag-btn.expanded {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.custom-tag-inline {
  display: flex;
  gap: 5px;
  margin-left: 5px;
}

.custom-tag-inline-input {
  padding: 10px 12px;
  border: 2px solid #667eea;
  border-radius: 25px;
  font-size: 13px;
  width: 120px;
  outline: none;
}

.custom-tag-inline-input:focus {
  border-color: #764ba2;
}

.custom-tag-add-btn {
  padding: 10px 14px;
  border: 2px solid #667eea;
  border-radius: 50%;
  background: white;
  color: #667eea;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.custom-tag-add-btn:hover {
  background: #667eea;
  color: white;
}

.custom-tag-close-btn {
  padding: 10px 14px;
  border: 2px solid #ddd;
  border-radius: 50%;
  background: white;
  color: #999;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.custom-tag-close-btn:hover {
  border-color: #d32f2f;
  color: #d32f2f;
}

.custom-tag-input {
  display: flex;
  gap: 10px;
}

.custom-tag-input-field {
  flex: 1;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.custom-tag-input-field:focus {
  outline: none;
  border-color: #667eea;
}

.add-tag-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.add-tag-btn:hover {
  background: #5a6fd6;
}

.content-input {
  font-family: 'Consolas', 'Monaco', monospace;
  line-height: 1.6;
  resize: vertical;
}

.field-error {
  display: block;
  color: #d32f2f;
  font-size: 12px;
  margin-top: 5px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.content-group {
  position: relative;
}

.polishing-indicator {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(255, 215, 0, 0.9);
  padding: 8px 16px;
  border-radius: 20px;
}

.loading-text {
  font-size: 13px;
  color: white;
  font-weight: 500;
}

.preview-panel {
  background: #fafbfd;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: fit-content;
  max-height: 600px;
  overflow: hidden;
}

.preview-header {
  background: #f0f2f5;
  padding: 10px 15px;
  font-size: 13px;
  font-weight: 500;
  color: #667eea;
  border-bottom: 1px solid #e0e0e0;
}

.preview-content {
  flex: 1;
  padding: 20px;
  font-size: 14px;
  line-height: 1.7;
  color: #333;
  overflow-y: auto;
  max-height: 500px;
}

.preview-content :deep(h1) {
  font-size: 20px;
  margin: 16px 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #ddd;
}

.preview-content :deep(h2) {
  font-size: 16px;
  margin: 14px 0 10px;
}

.preview-content :deep(p) {
  margin: 10px 0;
}

.preview-content :deep(code) {
  background: #f0f2f5;
  padding: 2px 5px;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  border-radius: 3px;
}

.preview-content :deep(pre) {
  background: #f6f8fa;
  padding: 10px;
  overflow-x: auto;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
}

.preview-content :deep(blockquote) {
  border-left: 3px solid #667eea;
  margin: 12px 0;
  padding-left: 12px;
  color: #666;
}

.selected-tags {
  margin-bottom: 20px;
  padding: 15px;
  background: #fafafa;
  border-radius: 8px;
}

.tags-label {
  font-size: 13px;
  color: #666;
  margin-right: 10px;
}

.tags-list {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: #667eea;
  color: white;
  border-radius: 15px;
  font-size: 12px;
}

.remove-tag {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 10px 28px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  transition: all 0.3s;
}

.cancel {
  background: #f0f0f0;
  color: #666;
}

.cancel:hover {
  background: #e0e0e0;
}

.submit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .edit-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .edit-form {
    padding: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
  
  .category-selector {
    flex-wrap: wrap;
  }
  
  .category-btn {
    flex: 1;
    min-width: 100px;
  }
}
</style>