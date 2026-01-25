const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  business_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  caption: {
    type: String,
  },
  cta_text: {
    type: String,
  },
  status: {
    type: String,
    enum: ['open', 'active', 'completed', 'pending_review', 'paused'],
    default: 'open',
  },
  media_url: {
    type: String,
  },
  media_type: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  target_views: {
    type: Number,
    required: true,
  },
  pending_views: { // Views currently being worked on by agents
    type: Number,
    default: 0,
  },
  completed_views: { // Validated views
    type: Number,
    default: 0,
  },
  leads: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
