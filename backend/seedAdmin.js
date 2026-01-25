const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    const email = 'aizadmin@aizboostr.com';
    const password = 'aizboostr';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.findOne({ email });

    if (user) {
      user.password = hashedPassword;
      user.role = 'admin';
      // Ensure other required fields are present if needed, though they should be there
      await user.save();
      console.log('Admin user updated successfully');
    } else {
      await User.create({
        name: 'Admin',
        email,
        password: hashedPassword,
        role: 'admin',
        mobile_number: '0000000000'
      });
      console.log('Admin user created successfully');
    }

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
