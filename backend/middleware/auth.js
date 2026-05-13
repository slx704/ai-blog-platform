const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'integrated-blog-ai-jwt-secret-key-2026'

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ success: false, message: '未登录，请先登录' })
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token 无效或已过期' })
        }
        req.user = user
        next()
    })
}

function generateToken(user) {
    return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '3d' })
}

module.exports = { authenticateToken, generateToken }