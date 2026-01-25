const express = require('express');
const router = express.Router();
const { createPayment, getMyPayments, updatePaymentStatus } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createPayment);
router.get('/my-payments', protect, getMyPayments);
router.put('/:id', protect, updatePaymentStatus);

module.exports = router;
