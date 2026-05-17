const pool = require('../config/db')

const getAllArticles = async (req, res) => {
    try {
        const { page = 1, limit = 10, category } = req.query

        let query = `SELECT a.*, u.username, u.avatar, 
                     COALESCE((SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id), 0) as comment_count
                     FROM articles a 
                     JOIN users u ON a.user_id = u.id`

        let params = []

        if (category && category !== 'all') {
            query += ' WHERE a.category = ?'
            params.push(category)
        }

        query += ' ORDER BY a.created_at DESC'

        const offset = (page - 1) * limit
        const [articles] = await pool.query(query + ' LIMIT ? OFFSET ?',
            [...params, limit, offset])

        let countQuery = 'SELECT COUNT(*) as total FROM articles'
        let countParams = []
        if (category && category !== 'all') {
            countQuery += ' WHERE category = ?'
            countParams.push(category)
        }
        const [countResult] = await pool.query(countQuery, countParams)

        res.json({
            success: true,
            data: articles,
            pagination: {
                total: countResult[0].total,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        })
    } catch (error) {
        console.error('获取文章列表失败:', error)
        res.status(500).json({ success: false, message: '获取文章列表失败' })
    }
}

const getArticleById = async (req, res) => {
    try {
        const { id } = req.params

        const [articles] = await pool.query(
            `SELECT a.*, u.username, u.avatar, 
             COALESCE((SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id), 0) as comment_count
             FROM articles a 
             JOIN users u ON a.user_id = u.id 
             WHERE a.id = ?`,
            [id]
        )

        if (articles.length === 0) {
            return res.status(404).json({ success: false, message: '文章不存在' })
        }

        await pool.query('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [id])

        res.json({
            success: true,
            data: articles[0]
        })
    } catch (error) {
        console.error('获取文章详情失败:', error)
        res.status(500).json({ success: false, message: '获取文章详情失败' })
    }
}

const createArticle = async (req, res) => {
    try {
        const { title, content, category, tags } = req.body

        if (!title || !content) {
            return res.status(400).json({ success: false, message: '标题和内容不能为空' })
        }

        const articleCategory = category || 'daily'

        const [result] = await pool.query(
            'INSERT INTO articles (user_id, title, content, category) VALUES (?, ?, ?, ?)',
            [req.user.id, title, content, articleCategory]
        )

        const articleId = result.insertId

        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                let [tagResult] = await pool.query('SELECT id FROM tags WHERE name = ?', [tagName])
                let tagId

                if (tagResult.length === 0) {
                    const [insertResult] = await pool.query('INSERT INTO tags (name) VALUES (?)', [tagName])
                    tagId = insertResult.insertId
                } else {
                    tagId = tagResult[0].id
                }

                await pool.query('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)', [articleId, tagId])
            }
        }

        res.status(201).json({
            success: true,
            message: '文章创建成功',
            data: {
                id: articleId
            }
        })
    } catch (error) {
        console.error('创建文章失败:', error)
        res.status(500).json({ success: false, message: '创建文章失败' })
    }
}

const updateArticle = async (req, res) => {
    try {
        const { id } = req.params
        const { title, content, category, tags } = req.body

        const [articles] = await pool.query('SELECT user_id FROM articles WHERE id = ?', [id])
        if (articles.length === 0) {
            return res.status(404).json({ success: false, message: '文章不存在' })
        }

        if (articles[0].user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: '无权修改此文章' })
        }

        const articleCategory = category || 'daily'
        await pool.query('UPDATE articles SET title = ?, content = ?, category = ? WHERE id = ?', [title, content, articleCategory, id])

        if (tags !== undefined) {
            await pool.query('DELETE FROM article_tags WHERE article_id = ?', [id])

            if (tags && tags.length > 0) {
                for (const tagName of tags) {
                    let [tagResult] = await pool.query('SELECT id FROM tags WHERE name = ?', [tagName])
                    let tagId

                    if (tagResult.length === 0) {
                        const [insertResult] = await pool.query('INSERT INTO tags (name) VALUES (?)', [tagName])
                        tagId = insertResult.insertId
                    } else {
                        tagId = tagResult[0].id
                    }

                    await pool.query('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)', [id, tagId])
                }
            }
        }

        res.json({
            success: true,
            message: '文章更新成功'
        })
    } catch (error) {
        console.error('更新文章失败:', error)
        res.status(500).json({ success: false, message: '更新文章失败' })
    }
}

const deleteArticle = async (req, res) => {
    try {
        const { id } = req.params

        const [articles] = await pool.query('SELECT user_id FROM articles WHERE id = ?', [id])
        if (articles.length === 0) {
            return res.status(404).json({ success: false, message: '文章不存在' })
        }

        if (articles[0].user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: '无权删除此文章' })
        }

        await pool.query('DELETE FROM article_tags WHERE article_id = ?', [id])

        try {
            await pool.query('DELETE FROM comments WHERE article_id = ?', [id])
        } catch (e) {
            console.log('comments table may not exist, skipping')
        }

        try {
            await pool.query('DELETE FROM article_likes WHERE article_id = ?', [id])
        } catch (e) {
            console.log('article_likes table may not exist, skipping')
        }

        await pool.query('DELETE FROM articles WHERE id = ?', [id])

        res.json({
            success: true,
            message: '文章删除成功'
        })
    } catch (error) {
        console.error('删除文章失败:', error)
        res.status(500).json({ success: false, message: '删除文章失败' })
    }
}

const searchArticles = async (req, res) => {
    try {
        const { keyword } = req.query

        if (!keyword) {
            return res.status(400).json({ success: false, message: '搜索关键词不能为空' })
        }

        const [articles] = await pool.query(
            `SELECT a.*, u.username, u.avatar, 
             COALESCE((SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id), 0) as comment_count
             FROM articles a 
             JOIN users u ON a.user_id = u.id 
             WHERE a.title LIKE ? OR a.content LIKE ? 
             ORDER BY a.created_at DESC`,
            [`%${keyword}%`, `%${keyword}%`]
        )

        res.json({
            success: true,
            data: articles
        })
    } catch (error) {
        console.error('搜索文章失败:', error)
        res.status(500).json({ success: false, message: '搜索文章失败' })
    }
}

const updateViewCount = async (req, res) => {
    try {
        const { id } = req.params
        await pool.query('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [id])
        res.json({ success: true, message: '浏览次数已更新' })
    } catch (error) {
        console.error('更新浏览次数失败:', error)
        res.status(500).json({ success: false, message: '更新浏览次数失败' })
    }
}

const likeArticle = async (req, res) => {
    try {
        const { id } = req.params
        await pool.query('INSERT INTO article_likes (user_id, article_id) VALUES (?, ?)', [req.user.id, id])
        await pool.query('UPDATE articles SET like_count = like_count + 1 WHERE id = ?', [id])
        res.json({ success: true, message: '点赞成功' })
    } catch (error) {
        console.error('点赞失败:', error)
        res.status(500).json({ success: false, message: '点赞失败' })
    }
}

const unlikeArticle = async (req, res) => {
    try {
        const { id } = req.params
        await pool.query('DELETE FROM article_likes WHERE user_id = ? AND article_id = ?', [req.user.id, id])
        await pool.query('UPDATE articles SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?', [id])
        res.json({ success: true, message: '取消点赞成功' })
    } catch (error) {
        console.error('取消点赞失败:', error)
        res.status(500).json({ success: false, message: '取消点赞失败' })
    }
}

module.exports = { getAllArticles, getArticleById, createArticle, updateArticle, deleteArticle, searchArticles, updateViewCount, likeArticle, unlikeArticle }