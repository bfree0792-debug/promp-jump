const express = require('express');
const router = express.Router();

// Placeholder route for reservations if needed in the future
router.get('/', (req, res) => {
  res.json({ message: 'Reservation endpoint' });
});

module.exports = router;