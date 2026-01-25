const express = require('express');
const router = express.Router();
const { createBusiness, getMyBusiness } = require('../controllers/businessController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createBusiness);
router.get('/mine', protect, getMyBusiness);

module.exports = router;
