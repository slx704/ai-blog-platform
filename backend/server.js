require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { errorHandler } = require('./middleware/errorHandler')

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const articleRoutes = require('./routes/articles')
const commentRoutes = require('./routes/comments')
const likeRoutes = require('./routes/likes')
const tagRoutes = require('./routes/tags')
const aiRoutes = require('./routes/ai')
const historyRoutes = require('./routes/history')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'AI博客平台运行正常', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/likes', likeRoutes)
app.use('/api/tags', tagRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/history', historyRoutes)

app.use((req, res) => {
    res.status(404).json({
        success: false,
        code: 404,
        message: '接口不存在',
        data: null
    })
})

app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`AI博客平台后端服务运行在 http://localhost:${PORT}`)
})