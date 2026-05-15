<template>
  <div class="code-review">
    <div class="container">
      <div class="page-header">
        <h1>💻 代码审查中心</h1>
        <p>让AI帮你完善代码，添加专业注释</p>
      </div>
      
      <div class="main-content">
        <div class="input-panel">
          <div class="panel-header">
            <span class="panel-title">输入代码</span>
            <div class="language-selector">
              <select v-model="selectedLanguage" class="lang-select">
                <option value="JavaScript">JavaScript</option>
                <option value="TypeScript">TypeScript</option>
                <option value="Python">Python</option>
                <option value="Java">Java</option>
                <option value="Go">Go</option>
                <option value="Rust">Rust</option>
                <option value="C++">C++</option>
                <option value="C#">C#</option>
              </select>
            </div>
          </div>
          
          <textarea 
            v-model="inputCode" 
            placeholder="粘贴你的代码..."
            rows="15"
            class="code-input"
          ></textarea>
          
          <div class="action-bar">
            <button 
              @click="handleAddComment"
              :disabled="!inputCode.trim() || loading"
              class="action-btn primary"
            >
              <span v-if="loading" class="loading-spinner-small"></span>
              {{ loading ? '处理中...' : '🔧 添加注释' }}
            </button>
            <button @click="handleOptimize" :disabled="!inputCode.trim() || loading" class="action-btn secondary">
              <span v-if="loading" class="loading-spinner-small"></span>
              {{ loading ? '处理中...' : '✨ 优化代码' }}
            </button>
            <button @click="clearAll" class="action-btn tertiary">清空</button>
          </div>
        </div>
        
        <div class="output-panel">
          <div class="panel-header">
            <span class="panel-title">AI处理结果</span>
            <button v-if="outputCode" @click="copyOutput" class="copy-btn">📋 复制</button>
          </div>
          
          <div v-if="!outputCode" class="empty-output">
            <p>AI处理后的代码将在这里显示</p>
            <p class="hint">支持为代码添加注释、优化代码结构等功能</p>
          </div>
          
          <pre v-else class="code-output"><code>{{ outputCode }}</code></pre>
        </div>
      </div>
      
      <div class="examples-section">
        <h3>📝 示例代码</h3>
        <div class="examples-grid">
          <button 
            v-for="example in examples" 
            :key="example.id"
            @click="loadExample(example)"
            class="example-card"
          >
            <span class="example-icon">{{ example.icon }}</span>
            <span class="example-name">{{ example.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { streamCodeComment } from '../api/ai'
import { devError } from '../utils/devLogger'

const inputCode = ref('')
const outputCode = ref('')
const selectedLanguage = ref('JavaScript')
const loading = ref(false)

interface Example {
  id: string
  name: string
  icon: string
  code: string
  language: string
}

const examples: Example[] = [
  {
    id: '1',
    name: '快速排序',
    icon: '🔀',
    language: 'JavaScript',
    code: `function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  return [...quickSort(left), ...middle, ...quickSort(right)];
}`
  },
  {
    id: '2',
    name: '防抖函数',
    icon: '⏱️',
    language: 'TypeScript',
    code: `function debounce<T extends (...args: unknown[]) => void>(
  fn: T, 
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}`
  },
  {
    id: '3',
    name: 'Promise.all',
    icon: '🤝',
    language: 'JavaScript',
    code: `function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (promises.length === 0) {
      resolve([]);
      return;
    }
    const results = [];
    let completed = 0;
    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(value => {
          results[index] = value;
          completed++;
          if (completed === promises.length) {
            resolve(results);
          }
        })
        .catch(reject);
    });
  });
}`
  },
  {
    id: '4',
    name: '二分查找',
    icon: '🔍',
    language: 'Python',
    code: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`
  }
]

const handleAddComment = async () => {
  if (!inputCode.value.trim() || loading.value) return
  
  loading.value = true
  outputCode.value = ''
  
  try {
    await streamCodeComment(
      inputCode.value,
      selectedLanguage.value,
      (chunk) => {
        outputCode.value += chunk
      },
      () => {
        loading.value = false
      },
      (error) => {
        loading.value = false
        devError('添加注释失败:', error)
      }
    )
  } catch (err) {
    loading.value = false
    devError('添加注释失败:', err)
  }
}

const handleOptimize = async () => {
  if (!inputCode.value.trim() || loading.value) return
  
  loading.value = true
  outputCode.value = ''
  
  const optimizePrompt = `请优化以下${selectedLanguage.value}代码：\n\n${inputCode.value}\n\n要求：
1. 优化代码结构和可读性
2. 修复潜在的bug
3. 提升性能
4. 添加必要的注释
5. 直接输出优化后的代码`
  
  try {
    await streamCodeComment(
      optimizePrompt,
      selectedLanguage.value,
      (chunk) => {
        outputCode.value += chunk
      },
      () => {
        loading.value = false
      },
      (error) => {
        loading.value = false
        devError('优化失败:', error)
      }
    )
  } catch (err) {
    loading.value = false
    devError('优化失败:', err)
  }
}

const clearAll = () => {
  inputCode.value = ''
  outputCode.value = ''
}

const copyOutput = () => {
  navigator.clipboard.writeText(outputCode.value)
}

const loadExample = (example: Example) => {
  inputCode.value = example.code
  selectedLanguage.value = example.language
}
</script>

<style scoped>
.code-review {
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

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.language-selector {
  margin-left: auto;
}

.lang-select {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  background: white;
}

.input-panel, .output-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.code-input {
  width: 100%;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  background: #fafafa;
}

.code-input:focus {
  outline: none;
  border-color: #667eea;
}

.action-bar {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
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
  background: #ffd700;
  color: #333;
}

.action-btn.secondary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.action-btn.tertiary {
  background: #f0f0f0;
  color: #666;
}

.action-btn.tertiary:hover {
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
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.copy-btn {
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.empty-output {
  padding: 40px 20px;
  text-align: center;
  color: #999;
}

.empty-output p {
  margin: 0 0 8px 0;
}

.empty-output .hint {
  font-size: 13px;
  color: #bbb;
}

.code-output {
  background: #2d2d2d;
  color: #ccc;
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.code-output code {
  background: none;
}

.examples-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.examples-section h3 {
  font-size: 16px;
  margin: 0 0 15px 0;
  color: #333;
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.example-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  background: #fafafa;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.example-card:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
}

.example-icon {
  font-size: 18px;
}

.example-name {
  font-size: 13px;
  color: #333;
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .action-bar {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
  }
  
  .examples-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>