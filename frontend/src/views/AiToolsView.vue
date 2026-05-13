<template>
  <div class="ai-tools">
    <div class="container">
      <div class="page-header">
        <h1>🤖 AI工具中心</h1>
        <p>让AI帮你提升写作效率</p>
      </div>
      
      <div class="tools-tabs">
        <button 
          v-for="tool in tools" 
          :key="tool.id"
          :class="['tool-tab', { active: activeTool === tool.id }]"
          @click="activeTool = tool.id"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
          <span class="tool-name">{{ tool.name }}</span>
        </button>
      </div>
      
      <div class="tool-content">
        <div v-if="activeTool === 'polish'" class="polish-tool">
          <div class="tool-card">
            <h3>✨ 文案润色</h3>
            <p class="tool-desc">让AI帮你优化文案，让文字更加生动有力</p>
            
            <div class="input-section">
              <textarea 
                v-model="inputText" 
                placeholder="输入需要润色的文案..."
                rows="8"
                class="input-textarea"
              ></textarea>
            </div>
            
            <div class="action-bar">
              <button 
                @click="handlePolish"
                :disabled="!inputText.trim() || loading"
                class="action-btn primary"
              >
                <span v-if="loading" class="loading-spinner-small"></span>
                {{ loading ? '润色中...' : '开始润色' }}
              </button>
              <button @click="clearAll" class="action-btn secondary">清空</button>
            </div>
            
            <div v-if="outputText" class="output-section">
              <div class="output-header">
                <span>润色结果</span>
                <button @click="copyOutput" class="copy-btn">复制</button>
              </div>
              <textarea 
                :value="outputText" 
                readonly
                rows="8"
                class="output-textarea"
              ></textarea>
            </div>
          </div>
        </div>
        
        <div v-if="activeTool === 'translate'" class="translate-tool">
          <div class="tool-card">
            <h3>🌍 多语言翻译</h3>
            <p class="tool-desc">支持多种语言互译，打破语言障碍</p>
            
            <div class="language-selector">
              <select v-model="targetLang" class="lang-select">
                <option value="中文">中文</option>
                <option value="English">English</option>
                <option value="日本語">日本語</option>
                <option value="한국어">한국어</option>
                <option value="Français">Français</option>
                <option value="Deutsch">Deutsch</option>
              </select>
            </div>
            
            <div class="input-section">
              <textarea 
                v-model="translateInput" 
                placeholder="输入需要翻译的文本..."
                rows="8"
                class="input-textarea"
              ></textarea>
            </div>
            
            <div class="action-bar">
              <button 
                @click="handleTranslate"
                :disabled="!translateInput.trim() || translateLoading"
                class="action-btn primary"
              >
                <span v-if="translateLoading" class="loading-spinner-small"></span>
                {{ translateLoading ? '翻译中...' : '开始翻译' }}
              </button>
              <button @click="clearTranslate" class="action-btn secondary">清空</button>
            </div>
            
            <div v-if="translateOutput" class="output-section">
              <div class="output-header">
                <span>翻译结果</span>
                <button @click="copyTranslate" class="copy-btn">复制</button>
              </div>
              <textarea 
                :value="translateOutput" 
                readonly
                rows="8"
                class="output-textarea"
              ></textarea>
            </div>
          </div>
        </div>
        
        <div v-if="activeTool === 'chat'" class="chat-tool">
          <div class="tool-card">
            <h3>💬 AI聊天助手</h3>
            <p class="tool-desc">与AI进行对话，获取专业解答</p>
            
            <div class="chat-history">
              <div 
                v-for="(msg, index) in chatMessages" 
                :key="index"
                :class="['chat-message', { user: msg.role === 'user' }]"
              >
                <div class="message-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
                <div class="message-content">{{ msg.content }}</div>
              </div>
              
              <div v-if="chatLoading" class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
              </div>
            </div>
            
            <div class="chat-input">
              <input 
                v-model="chatInput" 
                placeholder="输入你的问题..."
                @keyup.enter="handleChat"
                class="chat-input-field"
              />
              <button 
                @click="handleChat"
                :disabled="!chatInput.trim() || chatLoading"
                class="send-btn"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { streamPolish, streamTranslate } from '../api/ai'

const tools = [
  { id: 'polish', name: '文案润色', icon: '✨' },
  { id: 'translate', name: '多语言翻译', icon: '🌍' },
  { id: 'chat', name: 'AI聊天', icon: '💬' }
]

const activeTool = ref('polish')

const inputText = ref('')
const outputText = ref('')
const loading = ref(false)

const translateInput = ref('')
const translateOutput = ref('')
const translateLoading = ref(false)
const targetLang = ref('中文')

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const chatMessages = ref<ChatMessage[]>([
  { role: 'assistant', content: '你好！我是你的AI助手，有什么我可以帮你的吗？' }
])
const chatInput = ref('')
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
        console.error('润色失败:', error)
      }
    )
  } catch (err) {
    loading.value = false
    console.error('润色失败:', err)
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
        console.error('翻译失败:', error)
      }
    )
  } catch (err) {
    translateLoading.value = false
    console.error('翻译失败:', err)
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
        console.error('聊天失败:', error)
      }
    )
  } catch (err) {
    chatLoading.value = false
    console.error('聊天失败:', err)
  }
}
</script>

<style scoped>
.ai-tools {
  min-height: 100vh;
  background: #f5f7fa;
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
  color: #999;
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
  background: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.tool-tab:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.tool-card h3 {
  font-size: 20px;
  margin: 0 0 8px 0;
}

.tool-desc {
  color: #999;
  margin: 0 0 20px 0;
}

.language-selector {
  margin-bottom: 20px;
}

.lang-select {
  padding: 10px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

.input-section {
  margin-bottom: 20px;
}

.input-textarea {
  width: 100%;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
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
  background: #f0f0f0;
  color: #666;
}

.action-btn.secondary:hover {
  background: #e0e0e0;
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
  background: #fafafa;
  border-radius: 8px;
  padding: 15px;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 600;
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
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  background: white;
}

.chat-history {
  height: 400px;
  overflow-y: auto;
  padding: 20px;
  background: #fafafa;
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.chat-message.user .message-avatar {
  background: #667eea;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  background: white;
  border-radius: 15px;
  font-size: 14px;
  line-height: 1.6;
}

.chat-message.user .message-content {
  background: #667eea;
  color: white;
  border-radius: 15px;
}

.typing-indicator {
  display: flex;
  gap: 6px;
  padding: 12px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.chat-input {
  display: flex;
  gap: 10px;
}

.chat-input-field {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 25px;
  font-size: 14px;
}

.send-btn {
  padding: 12px 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
}

.send-btn:disabled {
  opacity: 0.6;
}

@media (max-width: 768px) {
  .tool-card {
    padding: 20px;
  }
  
  .tools-tabs {
    flex-wrap: wrap;
  }
  
  .tool-tab {
    padding: 10px 18px;
  }
  
  .action-bar {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
  
  .chat-history {
    height: 300px;
  }
  
  .message-content {
    max-width: 85%;
  }
}
</style>