const express = require('express')
const router = express.Router()
const aiController = require('../controllers/aiController')
const { authenticateToken } = require('../middleware/auth')

router.post('/chat', authenticateToken, aiController.chat)
router.post('/polish', authenticateToken, aiController.polish)
router.post('/code-comment', authenticateToken, aiController.codeComment)
router.post('/translate', authenticateToken, aiController.translate)

module.exports = router