const pool = require('../config/db')

const getHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10, toolType } = req.query

        let query = 'SELECT * FROM history_records WHERE user_id = ? ORDER BY created_at DESC'
        let params = [req.user.id]

        if (toolType) {
            query = 'SELECT * FROM history_records WHERE user_id = ? AND tool_type = ? ORDER BY created_at DESC'
            params = [req.user.id, toolType]
        }

        const offset = (page - 1) * limit
        const [records] = await pool.query(query + ' LIMIT ? OFFSET ?', [...params, limit, offset])

        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM history_records WHERE user_id = ?', [req.user.id])

        res.json({
            success: true,
            data: records,
            pagination: {
                total: countResult[0].total,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        })
    } catch (error) {
        console.error('获取历史记录失败:', error)
        res.status(500).json({ success: false, message: '获取历史记录失败' })
    }
}

const deleteHistory = async (req, res) => {
    try {
        const { id } = req.params

        const [records] = await pool.query('SELECT user_id FROM history_records WHERE id = ?', [id])
        if (records.length === 0) {
            return res.status(404).json({ success: false, message: '记录不存在' })
        }

        if (records[0].user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: '无权删除此记录' })
        }

        await pool.query('DELETE FROM history_records WHERE id = ?', [id])

        res.json({
            success: true,
            message: '删除成功'
        })
    } catch (error) {
        console.error('删除历史记录失败:', error)
        res.status(500).json({ success: false, message: '删除历史记录失败' })
    }
}

module.exports = { getHistory, deleteHistory }