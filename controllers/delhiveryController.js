const delhiveryService = require('../services/delhiveryService');

// New shipment create
async function createShipment(req, res) {
  try {
    const orderDetails = req.body;
    
    if (!orderDetails.orderId || !orderDetails.address) {
      return res.status(400).json({
        success: false,
        message: "Order ID required and address details must be provided"
      });
    }

    const result = await delhiveryService.createNewShipment(orderDetails);
    
    res.status(200).json({
      success: true,
      message: "Shipment created successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// Tracking status check 
async function trackShipment(req, res) {
  try {
    const { awb } = req.params;
    
    if (!awb) {
      return res.status(400).json({
        success: false,
        message: "AWB number is required for tracking"
      });
    }

    const trackingInfo = await delhiveryService.getTrackingStatus(awb);
    
    res.status(200).json({
      success: true,
      data: trackingInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  createShipment,
  trackShipment
};