const pool = require('../config/db')

const toggleLike = async (req, res) => {
    try {
        const { articleId } = req.body

        const [existing] = await pool.query(
            'SELECT id FROM article_likes WHERE user_id = ? AND article_id = ?',
            [req.user.id, articleId]
        )

        if (existing.length > 0) {
            await pool.query('DELETE FROM article_likes WHERE id = ?', [existing[0].id])
            await pool.query('UPDATE articles SET like_count = like_count - 1 WHERE id = ?', [articleId])

            res.json({
                success: true,
                message: '取消点赞成功',
                data: { liked: false }
            })
        } else {
            await pool.query(
                'INSERT INTO article_likes (user_id, article_id) VALUES (?, ?)',
                [req.user.id, articleId]
            )
            await pool.query('UPDATE articles SET like_count = like_count + 1 WHERE id = ?', [articleId])

            res.json({
                success: true,
                message: '点赞成功',
                data: { liked: true }
            })
        }
    } catch (error) {
        console.error('点赞失败:', error)
        res.status(500).json({ success: false, message: '点赞失败' })
    }
}

const getLikeStatus = async (req, res) => {
    try {
        const { articleId } = req.query

        const [likes] = await pool.query(
            'SELECT id FROM article_likes WHERE user_id = ? AND article_id = ?',
            [req.user.id, articleId]
        )

        res.json({
            success: true,
            data: {
                liked: likes.length > 0
            }
        })
    } catch (error) {
        console.error('获取点赞状态失败:', error)
        res.status(500).json({ success: false, message: '获取点赞状态失败' })
    }
}

module.exports = { toggleLike, getLikeStatus }