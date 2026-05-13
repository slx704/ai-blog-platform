const express = require('express')
const router = express.Router()
const historyController = require('../controllers/historyController')
const { authenticateToken } = require('../middleware/auth')

router.get('/', authenticateToken, historyController.getHistory)
router.delete('/:id', authenticateToken, historyController.deleteHistory)

module.exports = router