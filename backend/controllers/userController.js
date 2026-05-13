const pool = require('../config/db')

const getProfile = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, username, avatar, signature, age, total_tokens, created_at FROM users WHERE id = ?',
            [req.user.id]
        )

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: '用户不存在' })
        }

        res.json({
            success: true,
            data: users[0]
        })
    } catch (error) {
        console.error('获取用户信息失败:', error)
        res.status(500).json({ success: false, message: '获取用户信息失败' })
    }
}

const updateProfile = async (req, res) => {
    try {
        const { avatar, signature, age } = req.body

        const [result] = await pool.query(
            'UPDATE users SET avatar = ?, signature = ?, age = ? WHERE id = ?',
            [avatar, signature, age, req.user.id]
        )

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '用户不存在' })
        }

        res.json({
            success: true,
            message: '更新成功'
        })
    } catch (error) {
        console.error('更新用户信息失败:', error)
        res.status(500).json({ success: false, message: '更新用户信息失败' })
    }
}

const getUserArticles = async (req, res) => {
    try {
        const { userId } = req.params

        const [articles] = await pool.query(
            `SELECT a.*, u.username, u.avatar 
             FROM articles a 
             JOIN users u ON a.user_id = u.id 
             WHERE a.user_id = ? 
             ORDER BY a.created_at DESC`,
            [userId]
        )

        res.json({
            success: true,
            data: articles
        })
    } catch (error) {
        console.error('获取用户文章失败:', error)
        res.status(500).json({ success: false, message: '获取用户文章失败' })
    }
}

const getUserLikes = async (req, res) => {
    try {
        const [likes] = await pool.query(
            `SELECT a.*, u.username, u.avatar 
             FROM article_likes al 
             JOIN articles a ON al.article_id = a.id 
             JOIN users u ON a.user_id = u.id 
             WHERE al.user_id = ? 
             ORDER BY al.created_at DESC`,
            [req.user.id]
        )

        res.json({
            success: true,
            data: likes
        })
    } catch (error) {
        console.error('获取用户点赞失败:', error)
        res.status(500).json({ success: false, message: '获取用户点赞失败' })
    }
}

module.exports = { getProfile, updateProfile, getUserArticles, getUserLikes }