const express = require('express');
const router = express.Router();
const { createClaim, getBusinessClaims, getMyClaims } = require('../controllers/claimController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createClaim);
router.get('/business', protect, getBusinessClaims);
router.get('/my-claims', protect, getMyClaims);
router.put('/:id/status', protect, require('../controllers/claimController').updateClaimStatus);

// Admin route
router.get('/admin/all', protect, require('../controllers/claimController').getAllClaims);

module.exports = router;
