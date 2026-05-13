import api from '../utils/request'

export const polishText = async (text: string, callback: (chunk: string) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource('/api/ai/polish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ text })
    })

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close()
        resolve()
      } else {
        try {
          const data = JSON.parse(event.data)
          if (data.error) {
            eventSource.close()
            reject(new Error(data.error))
          } else if (data.content) {
            callback(data.content)
          }
        } catch (e) {
          callback(event.data)
        }
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      reject(new Error('请求失败'))
    }
  })
}

export const streamPolish = async (text: string, callback: (chunk: string) => void, onComplete?: () => void, onError?: (error: Error) => void): Promise<void> => {
  try {
    const response = await fetch('/api/ai/polish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ text })
    })

    if (!response.ok) {
      throw new Error('请求失败')
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应')
    }

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            onComplete?.()
            return
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) {
              onError?.(new Error(parsed.error))
              return
            }
          } catch {
            callback(data)
          }
        }
      }
    }

    onComplete?.()
  } catch (error) {
    onError?.(error as Error)
  }
}

export const streamCodeComment = async (code: string, language: string, callback: (chunk: string) => void, onComplete?: () => void, onError?: (error: Error) => void): Promise<void> => {
  try {
    const response = await fetch('/api/ai/code-comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ code, language })
    })

    if (!response.ok) {
      throw new Error('请求失败')
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应')
    }

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            onComplete?.()
            return
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) {
              onError?.(new Error(parsed.error))
              return
            }
          } catch {
            callback(data)
          }
        }
      }
    }

    onComplete?.()
  } catch (error) {
    onError?.(error as Error)
  }
}

export const streamTranslate = async (text: string, targetLang: string, callback: (chunk: string) => void, onComplete?: () => void, onError?: (error: Error) => void): Promise<void> => {
  try {
    const response = await fetch('/api/ai/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ text, targetLang })
    })

    if (!response.ok) {
      throw new Error('请求失败')
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应')
    }

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            onComplete?.()
            return
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) {
              onError?.(new Error(parsed.error))
              return
            }
          } catch {
            callback(data)
          }
        }
      }
    }

    onComplete?.()
  } catch (error) {
    onError?.(error as Error)
  }
}