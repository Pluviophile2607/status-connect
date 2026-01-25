const Business = require('../models/Business');

// @desc    Create a new business
// @route   POST /api/business
// @access  Private
const createBusiness = async (req, res) => {
  try {
    const { company_name, gst_number, address, website } = req.body;

    const business = await Business.create({
      owner_id: req.user.id,
      company_name,
      gst_number,
      address,
      website,
    });

    res.status(201).json(business);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's business
// @route   GET /api/business/mine
// @access  Private
const getMyBusiness = async (req, res) => {
  try {
    const business = await Business.findOne({ owner_id: req.user.id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    res.json(business);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBusiness,
  getMyBusiness,
};
