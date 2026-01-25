const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Campaign = require('../models/Campaign');

dotenv.config({ path: './.env' });

const debugCampaigns = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    const campaigns = await Campaign.find({});
    console.log(`\nFound ${campaigns.length} campaigns:`);

    campaigns.forEach(c => {
        console.log(`\nID: ${c._id}`);
        console.log(`Title: ${c.title}`);
        console.log(`Status: ${c.status}`);
        console.log(`Target Views: ${c.target_views}`);
        console.log(`Pending Views: ${c.pending_views}`);
        console.log(`Business ID: ${c.business_id}`);
    });

    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

debugCampaigns();
