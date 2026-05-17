const express = require('express')
const router = express.Router()
const articleController = require('../controllers/articleController')
const { authenticateToken } = require('../middleware/auth')

router.get('/', articleController.getAllArticles)
router.get('/search', articleController.searchArticles)
router.get('/:id', articleController.getArticleById)
router.post('/', authenticateToken, articleController.createArticle)
router.put('/:id', authenticateToken, articleController.updateArticle)
router.delete('/:id', authenticateToken, articleController.deleteArticle)
router.patch('/:id/view', articleController.updateViewCount)
router.post('/:id/like', authenticateToken, articleController.likeArticle)
router.delete('/:id/like', authenticateToken, articleController.unlikeArticle)

module.exports = router