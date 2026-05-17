const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { authenticateToken } = require('../middleware/auth')

router.get('/profile', authenticateToken, userController.getProfile)
router.put('/profile', authenticateToken, userController.updateProfile)
router.put('/password', authenticateToken, userController.updatePassword)
router.get('/articles/:userId', userController.getUserArticles)
router.get('/likes', authenticateToken, userController.getUserLikes)

module.exports = router