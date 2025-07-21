const axios = require('axios');
const { ddbDocClient } = require('../config/dynamoDB');
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const DELHIVERY_BASE_URL = 'https://track.delhivery.com';
const DELHIVERY_TOKEN = '6d25a65144329a5b87fe79679190ee6aa6a38f70';

async function createDelhiveryShipment(orderDetails) {
    try {
        const payload = {
            format: 'json',
            data: JSON.stringify({
                shipments: [{
                    name: orderDetails.address.name,
                    order: orderDetails.orderId,
                    payment_mode: orderDetails.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
                    total_amount: orderDetails.totalAmount,
                    amount_to_collect: orderDetails.paymentMethod === 'cod' ? orderDetails.totalAmount : 0,
                    add: orderDetails.address.street,
                    city: orderDetails.address.city,
                    state: orderDetails.address.state,
                    pin: orderDetails.address.pincode,
                    phone: orderDetails.address.phone,
                    quantity: 1,
                    weight: orderDetails.weight || 0.5
                }],
                pickup_location: {
                    name:' Warehouse',
                    city: 'Mumbai',
                    pin: '400001',
                    country: 'India',
                    phone: '9876543210'
                }
            })
        };

        const response = await axios.post(
            `${DELHIVERY_BASE_URL}/api/cmu/create.json`,
            payload,
            {
                headers: {
                    'Authorization': `Token ${DELHIVERY_TOKEN}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const awb = response.data?.packages?.[0]?.waybill;

        if (!awb) {
            console.warn('❗Delhivery returned no AWB. Using dummy AWB for now.');
            return {
                success: true,
                awb: 'DUMMY1234567890',
                trackingUrl: 'https://www.delhivery.com/track/DUMMY1234567890'
            };
        }

        return {
            success: true,
            awb: awb,
            trackingUrl: `https://www.delhivery.com/track/${awb}`
        };

    } catch (error) {
        console.error('Delhivery API Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        // Fallback dummy response
        return {
            success: false,
            awb: 'DUMMY1234567890',
            trackingUrl: 'https://www.delhivery.com/track/DUMMY1234567890'
        };
    }
}


module.exports = {
    createDelhiveryShipment
};