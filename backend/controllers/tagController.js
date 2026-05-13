const pool = require('../config/db')

const getAllTags = async (req, res) => {
    try {
        const [tags] = await pool.query(
            `SELECT t.*, COUNT(at.article_id) as article_count
             FROM tags t 
             LEFT JOIN article_tags at ON t.id = at.tag_id
             GROUP BY t.id
             ORDER BY article_count DESC`
        )

        res.json({
            success: true,
            data: tags
        })
    } catch (error) {
        console.error('获取标签失败:', error)
        res.status(500).json({ success: false, message: '获取标签失败' })
    }
}

const getArticlesByTag = async (req, res) => {
    try {
        const { tagName } = req.params

        const [articles] = await pool.query(
            `SELECT a.*, u.username, u.avatar 
             FROM articles a 
             JOIN users u ON a.user_id = u.id
             JOIN article_tags at ON a.id = at.article_id
             JOIN tags t ON at.tag_id = t.id
             WHERE t.name = ?
             ORDER BY a.created_at DESC`,
            [tagName]
        )

        res.json({
            success: true,
            data: articles
        })
    } catch (error) {
        console.error('获取标签文章失败:', error)
        res.status(500).json({ success: false, message: '获取标签文章失败' })
    }
}

module.exports = { getAllTags, getArticlesByTag }