const pool = require('../config/db')
const bcrypt = require('bcryptjs')

const getProfile = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, username, avatar, signature, bio, nickname, gender, birthday, country, province, city, age, total_tokens, role, created_at FROM users WHERE id = ?',
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
        console.log('updateProfile request body:', req.body)
        const { avatar, signature, bio, nickname, gender, birthday, country, province, city, age } = req.body

        const [result] = await pool.query(
            'UPDATE users SET avatar = COALESCE(?, avatar), signature = COALESCE(?, signature), bio = COALESCE(?, bio), nickname = COALESCE(?, nickname), gender = COALESCE(?, gender), birthday = COALESCE(SUBSTRING_INDEX(?, \'T\', 1), birthday), country = COALESCE(?, country), province = COALESCE(?, province), city = COALESCE(?, city), age = COALESCE(?, age) WHERE id = ?',
            [avatar, signature, bio, nickname, gender, birthday, country, province, city, age, req.user.id]
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

const updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: '请填写所有字段' })
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: '新密码至少需要6位' })
        }

        const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id])

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: '用户不存在' })
        }

        const isMatch = await bcrypt.compare(oldPassword, users[0].password)

        if (!isMatch) {
            return res.status(401).json({ success: false, message: '原密码错误' })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id])

        res.json({
            success: true,
            message: '密码修改成功'
        })
    } catch (error) {
        console.error('修改密码失败:', error)
        res.status(500).json({ success: false, message: '修改密码失败' })
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

module.exports = { getProfile, updateProfile, updatePassword, getUserArticles, getUserLikes }