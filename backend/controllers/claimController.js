const AgentCampaignClaim = require('../models/AgentCampaignClaim');
const Campaign = require('../models/Campaign');
const Business = require('../models/Business');
const Payment = require('../models/Payment');
const imghash = require('imghash');
const fs = require('fs');
const path = require('path');
const os = require('os');
const hamming = require('hamming');

// @desc    Create a new claim (Agent joins a campaign)
// @route   POST /api/claims
// @access  Private (Agent)
const createClaim = async (req, res) => {
  try {
    const { campaign_id, views_committed } = req.body;
    const views = parseInt(views_committed);

    if (isNaN(views) || views <= 0) {
        return res.status(400).json({ message: 'Invalid views committed' });
    }

    const campaign = await Campaign.findById(campaign_id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.pending_views < views) {
      return res.status(400).json({ message: `Only ${campaign.pending_views} views available` });
    }

    // Decrement pending views
    campaign.pending_views -= views;
    await campaign.save();

    const claim = await AgentCampaignClaim.create({
      agent_id: req.user.id,
      campaign_id,
      views_committed: views,
      status: 'active',
    });

    // Calculate earnings (Price per view = Total Price / Target Views)
    const pricePerView = campaign.price / campaign.target_views;
    const earnings = pricePerView * views;

    res.status(201).json({
        success: true,
        claim,
        remaining_views: campaign.pending_views,
        earnings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get claims for a specific business (to see which agents joined)
// @route   GET /api/claims/business
// @access  Private (Business Owner)
const getBusinessClaims = async (req, res) => {
  try {
    const business = await Business.findOne({ owner_id: req.user.id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Find all claims for campaigns owned by this business
    // First, find all campaign IDs for this business
    const campaigns = await Campaign.find({ business_id: business._id }).select('_id');
    const campaignIds = campaigns.map(c => c._id);

    const claims = await AgentCampaignClaim.find({ campaign_id: { $in: campaignIds } })
      .populate('agent_id', 'name email')
      .populate('campaign_id', 'title target_views price')
      .sort({ createdAt: -1 });

    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get claims for logged in agent
// @route   GET /api/claims/my-claims
// @access  Private (Agent)
const getMyClaims = async (req, res) => {
  try {
    const claims = await AgentCampaignClaim.find({ agent_id: req.user.id })
      .populate({
        path: 'campaign_id',
        populate: {
            path: 'business_id',
            select: 'company_name'
        }
      })
      .sort({ createdAt: -1 });

    // Fetch payment status for each claim
    const enrichedClaims = await Promise.all(claims.map(async (claim) => {
        const payment = await Payment.findOne({
            campaign_id: claim.campaign_id?._id,
            agent_id: req.user.id
        }).select('payment_status amount');
        
        // Debug log
        if (payment) {
             console.log(`Payment found for Claim ${claim._id}: Status=${payment.payment_status}, Amount=${payment.amount}`);
        } else {
             console.log(`No payment found for Claim ${claim._id}`);
        }
        
        return {
            ...claim.toObject(),
            payment_status: payment ? payment.payment_status : 'unpaid',
            payment_amount: payment ? payment.amount : 0
        };
    }));

    res.json(enrichedClaims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update claim status (Submit, Approve, Reject)
// @route   PUT /api/claims/:id/status
// @access  Private (Agent for submit, Admin for approve/reject)
const updateClaimStatus = async (req, res) => {
  try {
    console.log('Update Claim Status Request:', req.params.id, req.body);
    const { status } = req.body;
    const claim = await AgentCampaignClaim.findById(req.params.id);

    if (!claim) {
      console.log('Claim not found');
      return res.status(404).json({ message: 'Claim not found' });
    }

    // Agent submitting for review
    if (status === 'submitted') {
        // Ensure we compare strings
        const claimAgentId = claim.agent_id.toString();
        const requestUserId = req.user._id.toString();
        
        console.log(`Verifying Agent: ClaimAgent=${claimAgentId}, ReqUser=${requestUserId}`);

        if (claimAgentId !== requestUserId) {
             console.log('Auth Mismatch:', claimAgentId, requestUserId);
             return res.status(401).json({ message: 'Not authorized to submit this claim' });
        }
        if (req.body.proof_url) {
            try {
                // 1. Decode Base64
                const matches = req.body.proof_url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                
                if (matches && matches.length === 3) {
                    const buffer = Buffer.from(matches[2], 'base64');
                    const tempFilePath = path.join(os.tmpdir(), `claim_${claim._id}.png`);

                    // 2. Write to temp file
                    fs.writeFileSync(tempFilePath, buffer);

                    // 3. Compute pHash
                    const hash = await imghash.hash(tempFilePath);
                    
                    // 4. Cleanup temp file
                    fs.unlinkSync(tempFilePath);

                    console.log(`Computed pHash for Claim ${claim._id}: ${hash}`);

                    // 5. Check for duplicates (Hamming Distance < 5)
                    // Optimization: We could limit this query, but for now we scan recent claims
                    const allClaims = await AgentCampaignClaim.find({ 
                        proof_hash: { $exists: true },
                        _id: { $ne: claim._id } // Don't match self
                    }).select('proof_hash agent_id');

                    let isDuplicate = false;
                    for (const existing of allClaims) {
                        const distance = hamming(hash, existing.proof_hash);
                        if (distance < 5) {
                            console.log(`Duplicate detected! Matches Claim ${existing._id} (Dist: ${distance})`);
                            isDuplicate = true;
                            break;
                        }
                    }

                    if (isDuplicate) {
                        return res.status(400).json({ 
                            message: 'Duplicate screenshot detected. This proof has already been used.' 
                        });
                    }

                    claim.proof_hash = hash;
                }
            } catch (err) {
                console.error('Hash computation failed:', err);
                // We don't block submission if hash fails (for now), or we could:
                // return res.status(500).json({ message: 'Image verification failed' });
            }

            claim.proof_url = req.body.proof_url;
        }
        claim.status = 'pending_approval';
        await claim.save();
        console.log('Claim submitted successfully');
        return res.json(claim);
    }

    // Admin Approving/Rejecting
    if (status === 'approved' || status === 'rejected') {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can approve or reject claims' });
        }
        
        claim.status = status;
        
        // If approved, update delivered views and create Payment
        if (status === 'approved') {
            claim.views_delivered = claim.views_committed;
            
            // Calculate payout
            const campaign = await Campaign.findById(claim.campaign_id);
            if (campaign) {
                const payout = (claim.views_committed / campaign.target_views) * campaign.price;
                
                await Payment.create({
                    business_id: campaign.business_id,
                    campaign_id: campaign._id,
                    agent_id: claim.agent_id,
                    amount: payout,
                    payment_status: 'pending', // Created as unpaid/pending
                });
            }
        }
        
        await claim.save();
        return res.json(claim);
    }

    return res.status(400).json({ message: 'Invalid status update' });

  } catch (error) {
    console.error('Update Claim Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all claims (Admin only)
// @route   GET /api/claims/admin/all
// @access  Private (Admin)
const getAllClaims = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const claims = await AgentCampaignClaim.find({})
            .populate('agent_id', 'name email')
            .populate({
                path: 'campaign_id',
                populate: { path: 'business_id', select: 'company_name' }
            })
            .sort({ createdAt: -1 });
        
        res.json(claims);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
  createClaim,
  getBusinessClaims,
  getMyClaims,
  updateClaimStatus,
  getAllClaims,
};
