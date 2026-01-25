const Campaign = require('../models/Campaign');
const AgentCampaignClaim = require('../models/AgentCampaignClaim');
const Business = require('../models/Business');

// @desc    Create a new campaign
// @route   POST /api/campaigns
// @access  Private (Business Owner)
const createCampaign = async (req, res) => {
  try {
    const { title, description, price, target_views, media_url, media_type } = req.body;

    const business = await Business.findOne({ owner_id: req.user.id });
    if (!business) {
      return res.status(404).json({ message: 'Business profile not found. Please create one first.' });
    }

    const campaign = await Campaign.create({
      business_id: business._id,
      title,
      description,
      price,
      target_views,
      media_url,
      media_type,
      status: 'open', // defaulted to open for MVP
      pending_views: target_views, // Initialize pending views to target views
    });

    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all campaigns (with filters)
// @route   GET /api/campaigns
// @access  Public/Private
const getCampaigns = async (req, res) => {
  try {
    const { status, business_id } = req.query;
    const query = {};

    if (status) query.status = status;
    if (business_id) query.business_id = business_id;

    const campaigns = await Campaign.find(query)
        .populate('business_id', 'company_name website')
        .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get campaigns for logged in business
// @route   GET /api/campaigns/my-campaigns
// @access  Private (Business Owner)
const getMyCampaigns = async (req, res) => {
    try {
      const business = await Business.findOne({ owner_id: req.user.id });
      if (!business) {
        return res.status(404).json({ message: 'Business not found' });
      }
  
      const campaigns = await Campaign.find({ business_id: business._id }).sort({ createdAt: -1 });
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// @desc    Delete a campaign
// @route   DELETE /api/campaigns/:id
// @access  Private (Admin or Owner)
const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check ownership or admin role
    // For now assuming protect middleware adds user to req
    if (req.user.role !== 'admin') {
         const business = await Business.findOne({ owner_id: req.user.id });
         if (!business || campaign.business_id.toString() !== business._id.toString()) {
             return res.status(401).json({ message: 'Not authorized' });
         }
    }

    await AgentCampaignClaim.deleteMany({ campaign_id: campaign._id });
    await campaign.deleteOne();
    res.json({ message: 'Campaign removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getMyCampaigns,
  deleteCampaign,
};
