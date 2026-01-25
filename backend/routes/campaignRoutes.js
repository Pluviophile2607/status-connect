const express = require('express');
const router = express.Router();
const { createCampaign, getCampaigns, getMyCampaigns, deleteCampaign } = require('../controllers/campaignController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createCampaign)
  .get(getCampaigns);

router.get('/my-campaigns', protect, getMyCampaigns);

router.route('/:id')
  .delete(protect, deleteCampaign);

module.exports = router;
