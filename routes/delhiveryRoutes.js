const express = require('express');
const router = express.Router();
const delhiveryController = require('../controllers/delhiveryController');
const orderController = require('../controllers/orderController');
const { trackDelhiveryShipment } = require('../services/delhiveryService');

// Create new shipment
router.post('/create', delhiveryController.createShipment);

// Track shipment
router.get('/track/:awb', delhiveryController.trackShipment);

// router.post('/create', orderController.createOrder);
// ... other existing routes ...

// New tracking route
router.get('/track/:awb', async (req, res) => {
    try {
        const { awb } = req.params;
        if (!awb) {
            return res.status(400).json({
                success: false,
                message: 'AWB number is required'
            });
        }

        const trackingInfo = await trackDelhiveryShipment(awb);
        res.json({
            success: true,
            data: trackingInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to track shipment'
        });
    }
});

module.exports = router;