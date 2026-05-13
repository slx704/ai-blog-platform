const bcrypt = require('bcryptjs')
const pool = require('../config/db')
const { generateToken } = require('../middleware/auth')

const register = async (req, res) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({ success: false, message: '用户名和密码不能为空' })
        }

        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username])
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: '用户名已存在' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const [result] = await pool.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        )

        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                id: result.insertId,
                username
            }
        })
    } catch (error) {
        console.error('注册失败:', error)
        res.status(500).json({ success: false, message: '注册失败' })
    }
}

const login = async (req, res) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({ success: false, message: '用户名和密码不能为空' })
        }

        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username])
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: '用户名或密码错误' })
        }

        const user = users[0]
        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            return res.status(401).json({ success: false, message: '用户名或密码错误' })
        }

        const token = generateToken(user)

        res.json({
            success: true,
            message: '登录成功',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    avatar: user.avatar,
                    signature: user.signature,
                    age: user.age,
                    totalTokens: user.total_tokens
                }
            }
        })
    } catch (error) {
        console.error('登录失败:', error)
        res.status(500).json({ success: false, message: '登录失败' })
    }
}

module.exports = { register, login }