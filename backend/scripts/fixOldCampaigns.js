const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Campaign = require('../models/Campaign');

// Load env vars
dotenv.config({ path: './.env' });

const updateCampaigns = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    const campaigns = await Campaign.find({});
    console.log(`Found ${campaigns.length} campaigns.`);

    let updatedCount = 0;
    for (const campaign of campaigns) {
      let needsUpdate = false;

      // Fix Status
      if (campaign.status === 'pending_review') {
        campaign.status = 'open';
        needsUpdate = true;
      }

      // Fix Pending Views
      if (campaign.pending_views === 0 && campaign.target_views > 0) {
        campaign.pending_views = campaign.target_views;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await campaign.save();
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} campaigns.`);
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateCampaigns();
