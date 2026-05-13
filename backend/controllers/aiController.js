const pool = require('../config/db')

const DEEPSEEK_API_KEY = 'sk-enbaokepdpeljketbqlgxfkqnepyurqldfcfzyyqhilmzyzs'
const API_URL = 'https://api.siliconflow.cn/v1'
const MODEL = 'deepseek-ai/DeepSeek-V3'

const chat = async (req, res) => {
    try {
        const { messages } = req.body

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ success: false, message: '无效的请求' })
        }

        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')

        const response = await fetch(`${API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages,
                stream: true
            })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            res.write(`data: ${JSON.stringify({ error: errorData.error?.message || '请求失败' })}\n\n`)
            res.end()
            return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
        let totalTokens = 0

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6)

                    res.write(line + '\n')

                    if (data !== '[DONE]') {
                        try {
                            const parsed = JSON.parse(data)
                            const content = parsed.choices?.[0]?.delta?.content
                            if (content) {
                                fullContent += content
                            }
                            if (parsed.usage) {
                                totalTokens = parsed.usage.total_tokens || 0
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }
        }

        if (totalTokens > 0) {
            try {
                await pool.query(
                    'UPDATE users SET total_tokens = total_tokens + ? WHERE id = ?',
                    [totalTokens, req.user.id]
                )
            } catch (e) {
                console.error('更新token失败:', e)
            }
        }

        res.write('data: [DONE]\n\n')
        res.end()
    } catch (error) {
        console.error('AI请求失败:', error)
        res.status(500).json({ success: false, message: 'AI请求失败' })
    }
}

const polish = async (req, res) => {
    try {
        const { text } = req.body

        if (!text) {
            return res.status(400).json({ success: false, message: '请输入需要润色的文本' })
        }

        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')

        const systemPrompt = `你是一位专业的文案编辑，请对用户提供的文案进行润色优化。要求：
1. 保持原意不变
2. 让语言更加流畅、生动
3. 提升文案的吸引力和感染力
4. 适当优化用词和句式结构
5. 直接输出润色后的结果即可，不需要额外解释`

        const response = await fetch(`${API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
                stream: true
            })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            res.write(`data: ${JSON.stringify({ error: errorData.error?.message || '请求失败' })}\n\n`)
            res.end()
            return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
        let totalTokens = 0

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6)
                    res.write(line + '\n')

                    if (data !== '[DONE]') {
                        try {
                            const parsed = JSON.parse(data)
                            const content = parsed.choices?.[0]?.delta?.content
                            if (content) {
                                fullContent += content
                            }
                            if (parsed.usage) {
                                totalTokens = parsed.usage.total_tokens || 0
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }
        }

        if (totalTokens > 0) {
            try {
                await pool.query(
                    'UPDATE users SET total_tokens = total_tokens + ? WHERE id = ?',
                    [totalTokens, req.user.id]
                )
                await pool.query(
                    'INSERT INTO history_records (user_id, tool_type, input_text, output_text, tokens_used) VALUES (?, ?, ?, ?, ?)',
                    [req.user.id, 'polish', text, fullContent, totalTokens]
                )
            } catch (e) {
                console.error('更新记录失败:', e)
            }
        }

        res.write('data: [DONE]\n\n')
        res.end()
    } catch (error) {
        console.error('AI润色失败:', error)
        res.status(500).json({ success: false, message: 'AI润色失败' })
    }
}

const codeComment = async (req, res) => {
    try {
        const { code, language } = req.body

        if (!code) {
            return res.status(400).json({ success: false, message: '请输入代码' })
        }

        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')

        const systemPrompt = `你是一位资深程序员，请为用户提供的代码添加详细的注释。要求：
1. 为每个函数添加函数说明注释
2. 为关键变量和复杂逻辑添加注释
3. 保持代码的原有功能不变
4. 注释要清晰易懂，帮助其他开发者理解代码
5. 如果发现代码中有潜在问题或可优化的地方，请在注释中指出
6. 直接输出添加注释后的代码，不需要额外解释`

        const response = await fetch(`${API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `语言: ${language || 'JavaScript'}\n代码:\n${code}` }
                ],
                stream: true
            })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            res.write(`data: ${JSON.stringify({ error: errorData.error?.message || '请求失败' })}\n\n`)
            res.end()
            return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
        let totalTokens = 0

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6)
                    res.write(line + '\n')

                    if (data !== '[DONE]') {
                        try {
                            const parsed = JSON.parse(data)
                            const content = parsed.choices?.[0]?.delta?.content
                            if (content) {
                                fullContent += content
                            }
                            if (parsed.usage) {
                                totalTokens = parsed.usage.total_tokens || 0
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }
        }

        if (totalTokens > 0) {
            try {
                await pool.query(
                    'UPDATE users SET total_tokens = total_tokens + ? WHERE id = ?',
                    [totalTokens, req.user.id]
                )
                await pool.query(
                    'INSERT INTO history_records (user_id, tool_type, input_text, output_text, tokens_used) VALUES (?, ?, ?, ?, ?)',
                    [req.user.id, 'code_comment', code, fullContent, totalTokens]
                )
            } catch (e) {
                console.error('更新记录失败:', e)
            }
        }

        res.write('data: [DONE]\n\n')
        res.end()
    } catch (error) {
        console.error('AI代码注释失败:', error)
        res.status(500).json({ success: false, message: 'AI代码注释失败' })
    }
}

const translate = async (req, res) => {
    try {
        const { text, targetLang } = req.body

        if (!text) {
            return res.status(400).json({ success: false, message: '请输入需要翻译的文本' })
        }

        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')

        const targetLanguage = targetLang || '中文'
        const systemPrompt = `你是一位专业翻译，请将用户提供的文本翻译成${targetLanguage}。要求：
1. 保持原意不变
2. 翻译准确、流畅
3. 如果是技术术语，请使用标准译法
4. 直接输出翻译结果，不需要额外解释`

        const response = await fetch(`${API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
                stream: true
            })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            res.write(`data: ${JSON.stringify({ error: errorData.error?.message || '请求失败' })}\n\n`)
            res.end()
            return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
        let totalTokens = 0

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6)
                    res.write(line + '\n')

                    if (data !== '[DONE]') {
                        try {
                            const parsed = JSON.parse(data)
                            const content = parsed.choices?.[0]?.delta?.content
                            if (content) {
                                fullContent += content
                            }
                            if (parsed.usage) {
                                totalTokens = parsed.usage.total_tokens || 0
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }
        }

        if (totalTokens > 0) {
            try {
                await pool.query(
                    'UPDATE users SET total_tokens = total_tokens + ? WHERE id = ?',
                    [totalTokens, req.user.id]
                )
                await pool.query(
                    'INSERT INTO history_records (user_id, tool_type, input_text, output_text, tokens_used) VALUES (?, ?, ?, ?, ?)',
                    [req.user.id, 'translate', text, fullContent, totalTokens]
                )
            } catch (e) {
                console.error('更新记录失败:', e)
            }
        }

        res.write('data: [DONE]\n\n')
        res.end()
    } catch (error) {
        console.error('AI翻译失败:', error)
        res.status(500).json({ success: false, message: 'AI翻译失败' })
    }
}

module.exports = { chat, polish, codeComment, translate }