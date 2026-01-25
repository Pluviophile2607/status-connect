const mongoose = require('mongoose');

const agentCampaignClaimSchema = new mongoose.Schema({
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
  business_id: { // redundant but helpful for queries
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Business',
  },
  views_committed: {
    type: Number,
    required: true,
  },
  views_delivered: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'submitted', 'pending_approval', 'approved', 'rejected', 'completed'],
    default: 'active',
  },
  proof_url: {
    type: String, // Screenshot or link to proof
  },
  proof_hash: {
    type: String, // Perceptual Hash for duplicate detection
  },
}, { timestamps: true });

module.exports = mongoose.model('AgentCampaignClaim', agentCampaignClaimSchema);
