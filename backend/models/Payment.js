const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  business_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  campaign_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  agent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  transaction_id: {
    type: String,
  },
  payment_method: {
    type: String,
  },
  receipt_url: {
    type: String,
  },
  marked_at: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
