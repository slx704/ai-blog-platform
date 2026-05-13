const express = require('express')
const router = express.Router()
const commentController = require('../controllers/commentController')
const { authenticateToken } = require('../middleware/auth')

router.get('/article/:articleId', commentController.getCommentsByArticleId)
router.post('/', authenticateToken, commentController.createComment)
router.delete('/:id', authenticateToken, commentController.deleteComment)

module.exports = router