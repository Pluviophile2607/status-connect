const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AgentCampaignClaim = require('../models/AgentCampaignClaim');
const User = require('../models/User');

dotenv.config({ path: './.env' });

const debugClaims = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // Find the user "Agent" to see their ID
        // Assuming we can find them by email or list first few
        const agents = await User.find({ role: 'agent' });
        console.log('\nAgents:');
        agents.forEach(a => console.log(`${a.name} (${a._id})`));

        // Find claims
        const claims = await AgentCampaignClaim.find({});
        console.log(`\nFound ${claims.length} claims:`);
        
        claims.forEach(c => {
             console.log(`Claim ID: ${c._id}`);
             console.log(`Agent ID: ${c.agent_id}`);
             console.log(`Status: ${c.status}`);
             console.log('---');
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debugClaims();
