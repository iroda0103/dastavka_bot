const express = require('express')
const router = express.Router()

router.post('/orders/created-order',async (req, res) => {
  try {
    console.log("Received data:", req.body);
    res.send(res.body);
  } catch (error) {
    console.error("Error in /orders/created-order:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router