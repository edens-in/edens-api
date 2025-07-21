const express = require('express');
const router = express.Router();
const getDelhiveryEstimate = require('../controllers/estimateController');

router.post('/', getDelhiveryEstimate);

module.exports = router;
