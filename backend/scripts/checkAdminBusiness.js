const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Business = require('../models/Business');
const User = require('../models/User');

dotenv.config({ path: './.env' });

const checkAdminBusiness = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const admin = await User.findOne({ email: 'aizadmin@aizboostr.com' });
        if (!admin) {
            console.log('Admin user not found!');
            process.exit(1);
        }

        console.log(`Admin found: ${admin._id}`);

        const business = await Business.findOne({ owner_id: admin._id });
        if (business) {
            console.log(`Admin Business Found: ${business.company_name} (${business._id})`);
        } else {
            console.log('No Business profile found for Admin!');
            
            // Create one if missing
            console.log('Creating Admin Business...');
            await Business.create({
                owner_id: admin._id,
                company_name: 'Admin Business',
                website: 'https://aizboostr.com',
                description: 'Official Admin Business',
                whatsapp_number: '1234567890'
            });
            console.log('Admin Business Created.');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkAdminBusiness();
