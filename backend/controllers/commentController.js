const pool = require('../config/db')

const getCommentsByArticleId = async (req, res) => {
    try {
        const { articleId } = req.params

        const [comments] = await pool.query(
            `SELECT c.*, u.username, u.avatar 
             FROM comments c 
             JOIN users u ON c.user_id = u.id 
             WHERE c.article_id = ? 
             ORDER BY c.created_at ASC`,
            [articleId]
        )

        const buildTree = (comments, parentId = null) => {
            return comments
                .filter(comment => comment.parent_id === parentId)
                .map(comment => ({
                    ...comment,
                    children: buildTree(comments, comment.id)
                }))
        }

        const nestedComments = buildTree(comments)

        res.json({
            success: true,
            data: nestedComments
        })
    } catch (error) {
        console.error('获取评论失败:', error)
        res.status(500).json({ success: false, message: '获取评论失败' })
    }
}

const createComment = async (req, res) => {
    try {
        const { articleId, content, parentId } = req.body

        if (!content) {
            return res.status(400).json({ success: false, message: '评论内容不能为空' })
        }

        const [result] = await pool.query(
            'INSERT INTO comments (article_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
            [articleId, req.user.id, content, parentId || null]
        )

        res.status(201).json({
            success: true,
            message: '评论成功',
            data: {
                id: result.insertId
            }
        })
    } catch (error) {
        console.error('发表评论失败:', error)
        res.status(500).json({ success: false, message: '发表评论失败' })
    }
}

const deleteComment = async (req, res) => {
    try {
        const { id } = req.params

        const [comments] = await pool.query('SELECT user_id, article_id FROM comments WHERE id = ?', [id])
        if (comments.length === 0) {
            return res.status(404).json({ success: false, message: '评论不存在' })
        }

        if (comments[0].user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: '无权删除此评论' })
        }

        await pool.query('DELETE FROM comments WHERE id = ? OR parent_id = ?', [id, id])

        res.json({
            success: true,
            message: '评论删除成功'
        })
    } catch (error) {
        console.error('删除评论失败:', error)
        res.status(500).json({ success: false, message: '删除评论失败' })
    }
}

module.exports = { getCommentsByArticleId, createComment, deleteComment }