const express = require('express');
const router = express.Router();

// Real-time stats fetching (In future, add DB counts here)
router.get('/stats', (req, res) => {
  res.json({
    totalUsers: 1,
    totalCoins: 1500,
    verifiedHosts: 1,
    pendingPayouts: 0,
    revenue: "₹0.00" // Currency changed to INR as requested
  });
});

module.exports = router;
