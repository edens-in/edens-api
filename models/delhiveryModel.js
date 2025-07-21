const { v4: uuidv4 } = require('uuid');

function createShipmentModel(orderDetails) {
  return {
    shipment_id: uuidv4(),
    order_id: orderDetails.orderId,
    customer_name: orderDetails.address.name,
    customer_phone: orderDetails.address.phone,
    customer_address: `${orderDetails.address.street}, ${orderDetails.address.city}, ${orderDetails.address.state} - ${orderDetails.address.pincode}`,
    pin_code: orderDetails.address.pincode,
    payment_mode: orderDetails.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
    amount_to_collect: orderDetails.paymentMethod === 'cod' ? orderDetails.totalAmount : 0,
    weight: orderDetails.weight || 0.5, // Default 0.5kg
    order_date: new Date().toISOString()
  };
}

// Tracking response 
function createTrackingModel(trackingData) {
  return {
    status: trackingData.status,
    estimated_delivery: trackingData.estimated_delivery,
    tracking_url: trackingData.tracking_url,
    courier_name: trackingData.courier_name || "Delhivery"
  };
}

module.exports = {
  createShipmentModel,
  createTrackingModel
};