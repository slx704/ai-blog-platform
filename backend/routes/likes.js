const express = require('express')
const router = express.Router()
const likeController = require('../controllers/likeController')
const { authenticateToken } = require('../middleware/auth')

router.get('/', authenticateToken, likeController.getLikeStatus)
router.post('/toggle', authenticateToken, likeController.toggleLike)

module.exports = router