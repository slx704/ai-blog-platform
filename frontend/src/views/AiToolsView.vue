<template>
  <div class="ai-tools">
    <div class="container">
      <div class="page-header">
        <h1>🤖 AI工具中心</h1>
        <p>让AI帮你提升写作效率</p>
      </div>
      
      <div class="tools-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tool-tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <span class="tool-icon">{{ tab.icon }}</span>
          <span class="tool-name">{{ tab.name }}</span>
        </button>
      </div>
      
      <div class="tool-content">
        <div v-if="activeTab === 'polish'" class="tool-card">
          <h3>✨ 文案润色</h3>
          <p class="tool-desc">让AI帮你优化文案，让文字更加生动有力</p>
          
          <div class="input-section">
            <textarea 
              v-model="inputText" 
              placeholder="输入需要润色的文案..." 
              class="input-textarea"
              rows="6"
            ></textarea>
          </div>
          
          <div class="action-bar">
            <button @click="handlePolish" :disabled="loading" class="action-btn primary">
              <span v-if="loading" class="loading-spinner-small"></span>
              开始润色
            </button>
            <button @click="clearAll" class="action-btn secondary">清空</button>
          </div>
          
          <div v-if="outputText" class="output-section">
            <div class="output-header">
              <span>润色结果</span>
              <button @click="copyOutput" class="copy-btn">复制</button>
            </div>
            <textarea readonly class="output-textarea" rows="8">{{ outputText }}</textarea>
          </div>
        </div>
        
        <div v-if="activeTab === 'translate'" class="tool-card">
          <h3>🌍 多语言翻译</h3>
          <p class="tool-desc">支持多种语言互译，让你的内容走向世界</p>
          
          <div class="language-selector">
            <select v-model="targetLang" class="lang-select">
              <option value="中文">中文</option>
              <option value="English">English</option>
              <option value="日本語">日本語</option>
              <option value="한국어">한국어</option>
              <option value="Français">Français</option>
              <option value="Español">Español</option>
            </select>
          </div>
          
          <div class="input-section">
            <textarea 
              v-model="translateInput" 
              placeholder="输入需要翻译的文本..." 
              class="input-textarea"
              rows="6"
            ></textarea>
          </div>
          
          <div class="action-bar">
            <button @click="handleTranslate" :disabled="translateLoading" class="action-btn primary">
              <span v-if="translateLoading" class="loading-spinner-small"></span>
              开始翻译
            </button>
            <button @click="clearTranslate" class="action-btn secondary">清空</button>
          </div>
          
          <div v-if="translateOutput" class="output-section">
            <div class="output-header">
              <span>翻译结果</span>
              <button @click="copyTranslate" class="copy-btn">复制</button>
            </div>
            <textarea readonly class="output-textarea" rows="8">{{ translateOutput }}</textarea>
          </div>
        </div>
        
        <div v-if="activeTab === 'chat'" class="tool-card">
          <h3>💬 AI聊天</h3>
          <p class="tool-desc">与AI对话，获取各种问题的解答</p>
          
          <div class="chat-history">
            <div 
              v-for="(message, index) in chatMessages" 
              :key="index"
              :class="['chat-message', message.role]"
            >
              <div class="message-avatar">{{ message.role === 'user' ? '👤' : '🤖' }}</div>
              <div class="message-content">
                <p>{{ message.content }}</p>
              </div>
            </div>
          </div>
          
          <div class="chat-input-section">
            <textarea 
              v-model="chatInput" 
              placeholder="输入你的问题..." 
              class="input-textarea"
              rows="3"
              @keyup.enter="handleChat"
            ></textarea>
            <button @click="handleChat" :disabled="chatLoading || !chatInput.trim()" class="action-btn primary" style="width: 100%; margin-top: 10px;">
              <span v-if="chatLoading" class="loading-spinner-small"></span>
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { streamPolish, streamTranslate } from '../api/ai'
import { devLog, devError } from '../utils/devLogger'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const activeTab = ref('polish')
const tabs = [
  { id: 'polish', name: '文案润色', icon: '✨' },
  { id: 'translate', name: '多语言翻译', icon: '🌍' },
  { id: 'chat', name: 'AI聊天', icon: '💬' }
]

const inputText = ref('')
const outputText = ref('')
const loading = ref(false)

const translateInput = ref('')
const translateOutput = ref('')
const translateLoading = ref(false)
const targetLang = ref('English')

const chatInput = ref('')
const chatMessages = ref<ChatMessage[]>([])
const chatLoading = ref(false)

const handlePolish = async () => {
  if (!inputText.value.trim() || loading.value) return
  
  loading.value = true
  outputText.value = ''
  
  try {
    await streamPolish(
      inputText.value,
      (chunk) => {
        outputText.value += chunk
      },
      () => {
        loading.value = false
      },
      (error) => {
        loading.value = false
        devError('润色失败:', error)
      }
    )
  } catch (err) {
    loading.value = false
    devError('润色失败:', err)
  }
}

const clearAll = () => {
  inputText.value = ''
  outputText.value = ''
}

const copyOutput = () => {
  navigator.clipboard.writeText(outputText.value)
}

const handleTranslate = async () => {
  if (!translateInput.value.trim() || translateLoading.value) return
  
  translateLoading.value = true
  translateOutput.value = ''
  
  try {
    await streamTranslate(
      translateInput.value,
      targetLang.value,
      (chunk) => {
        translateOutput.value += chunk
      },
      () => {
        translateLoading.value = false
      },
      (error) => {
        translateLoading.value = false
        devError('翻译失败:', error)
      }
    )
  } catch (err) {
    translateLoading.value = false
    devError('翻译失败:', err)
  }
}

const clearTranslate = () => {
  translateInput.value = ''
  translateOutput.value = ''
}

const copyTranslate = () => {
  navigator.clipboard.writeText(translateOutput.value)
}

const handleChat = async () => {
  if (!chatInput.value.trim() || chatLoading.value) return
  
  chatMessages.value.push({ role: 'user', content: chatInput.value })
  const userInput = chatInput.value
  chatInput.value = ''
  chatLoading.value = true
  
  try {
    let response = ''
    await streamPolish(
      userInput,
      (chunk) => {
        response += chunk
        if (!chatMessages.value[chatMessages.value.length - 1]?.content) {
          chatMessages.value.push({ role: 'assistant', content: chunk })
        } else {
          chatMessages.value[chatMessages.value.length - 1].content = response
        }
      },
      () => {
        chatLoading.value = false
      },
      (error) => {
        chatLoading.value = false
        devError('聊天失败:', error)
      }
    )
  } catch (err) {
    chatLoading.value = false
    devError('聊天失败:', err)
  }
}
</script>

<style scoped>
.ai-tools {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: 30px 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 32px;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-header p {
  color: var(--text-muted);
  margin: 0;
}

.tools-tabs {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
}

.tool-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 25px;
  background: var(--bg-card);
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 5px var(--shadow);
}

.tool-tab:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow);
}

.tool-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tool-icon {
  font-size: 18px;
}

.tool-name {
  font-size: 14px;
}

.tool-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.tool-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px var(--shadow);
}

.tool-card h3 {
  font-size: 20px;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.tool-desc {
  color: var(--text-muted);
  margin: 0 0 20px 0;
}

.language-selector {
  margin-bottom: 20px;
}

.lang-select {
  padding: 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.input-section {
  margin-bottom: 20px;
}

.input-textarea {
  width: 100%;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.input-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.action-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.action-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.action-btn.secondary {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.action-btn.secondary:hover {
  background: var(--border-color);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.output-section {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 15px;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 600;
  color: var(--text-primary);
}

.copy-btn {
  padding: 5px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.output-textarea {
  width: 100%;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  background: var(--bg-card);
  color: var(--text-primary);
}

.chat-history {
  height: 400px;
  overflow-y: auto;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-bottom: 20px;
}

.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
}

.chat-message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.chat-message.user .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.chat-message.assistant .message-avatar {
  background: var(--bg-card);
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
}

.chat-message.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 18px 18px 4px 18px;
}

.chat-message.assistant .message-content {
  background: var(--bg-card);
  color: var(--text-primary);
  border-radius: 18px 18px 18px 4px;
}

.chat-input-section {
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .tools-tabs {
    gap: 10px;
  }
  
  .tool-tab {
    padding: 10px 18px;
    font-size: 13px;
  }
  
  .tool-card {
    padding: 20px;
  }
  
  .message-content {
    max-width: 85%;
  }
}
</style>