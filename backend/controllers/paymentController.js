const Payment = require('../models/Payment');
const Business = require('../models/Business');

// @desc    Create a payment record
// @route   POST /api/payments
// @access  Private (Business Owner)
const createPayment = async (req, res) => {
  try {
    const { amount, payment_method, transaction_id, receipt_url, payment_status } = req.body;

    const business = await Business.findOne({ owner_id: req.user.id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const payment = await Payment.create({
      business_id: business._id,
      amount,
      payment_method,
      transaction_id,
      receipt_url,
      payment_status: payment_status || 'pending',
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payments for logged in business
// @route   GET /api/payments/my-payments
// @access  Private (Business Owner)
const getMyPayments = async (req, res) => {
  try {
    const business = await Business.findOne({ owner_id: req.user.id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const payments = await Payment.find({ business_id: business._id })
        .populate('campaign_id', 'title status')
        .populate('agent_id', 'name email')
        .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { payment_status, payment_mode } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify ownership
    const business = await Business.findOne({ owner_id: req.user.id });
    if (!business || payment.business_id.toString() !== business._id.toString()) {
         return res.status(401).json({ message: 'Not authorized' });
    }

    payment.payment_status = payment_status || payment.payment_status;
    payment.payment_mode = payment_mode || payment.payment_mode;
    
    // Always update marked_at if paid
    if (payment_status === 'paid' && !payment.marked_at) {
         payment.marked_at = Date.now();
    }

    await payment.save();
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPayment,
  getMyPayments,
  updatePaymentStatus,
};
