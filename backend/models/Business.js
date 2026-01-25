const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  company_name: {
    type: String,
    required: true,
  },
  gst_number: {
    type: String,
  },
  address: {
    type: String,
  },
  website: {
    type: String,
  },
  // Add other fields as needed based on usage
}, { timestamps: true });

module.exports = mongoose.model('Business', businessSchema);
