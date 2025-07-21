const { ddbDocClient } = require('../config/dynamoDB');
const { PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { getProductById } = require('../services/productService');
const { buildOrderItem } = require('../models/orderModel');
const { generateTransactionId, buildPaymentItem } = require('../models/paymentModel');
const { createDelhiveryShipment } = require('../services/delhiveryService');

const ORDERS_TABLE = 'Orders';
const PAYMENTS_TABLE = 'Payments';

const createOrder = async (req, res) => {
    try {
        const { userId, address, items, paymentMethod = 'razorpay' } = req.body;

        if (!userId || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing userId or items' 
            });
        }

        const transactionId = generateTransactionId();
        let totalAmount = 0;
        const currentTime = new Date().toISOString();

        // Process each product in the order
        const orderItems = await Promise.all(items.map(async item => {
            const product = await getProductById(item.productId, item.productCategory);
            if (!product) {
                throw new Error(`Product not found: ${item.productId} (${item.productCategory})`);
            }

            const orderItem = buildOrderItem({
                userId,
                transactionId,
                product,
                quantity: parseInt(item.quantity),
                address
            });

            totalAmount += orderItem.totalAmount;

            await ddbDocClient.send(new PutCommand({
                TableName: ORDERS_TABLE,
                Item: orderItem
            }));

            return orderItem;
        }));

        // Create payment entry
        const paymentItem = buildPaymentItem({
            userId,
            transactionId,
            totalAmount,
            paymentMethod
        });

        await ddbDocClient.send(new PutCommand({
            TableName: PAYMENTS_TABLE,
            Item: paymentItem
        }));

        // Calculate total weight (simple implementation - sum of all items' weights)
        const calculateTotalWeight = (items) => {
            return items.reduce((total, item) => {
                return total + (item.product?.weight || 0.5) * item.quantity;
            }, 0);
        };

        // Prepare shipping details using the first order item
        const shippingDetails = {
            orderId: orderItems[0].orderId, // Using the first order's ID
            address: address,
            totalAmount: totalAmount,
            paymentMethod: paymentMethod,
            weight: calculateTotalWeight(items.map(item => ({
                product: item.product,
                quantity: item.quantity
            })))
        };

        // Create shipping with Delhivery
        const shipment = await createDelhiveryShipment(shippingDetails);
    console.log('Shipping details:', shippingDetails);

        return res.status(201).json({
            success: true,
            message: 'Order, payment and shipment created successfully',
            data: {
                transactionId,
                orders: orderItems,
                payment: paymentItem,
                shipment: {
                    awb: shipment.awb ,
                    trackingUrl: shipment.trackingUrl 
                }
            }
        });

    } catch (error) {
        console.error('Order creation failed:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create order',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};



// Get user orders
const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const orders = await orderService.getOrdersByUser(userId);

    const simplifiedOrders = orders.map(order => ({
      orderId: order.orderId,
      productName: order.productName,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      trackingUrl: order.trackingUrl
    }));

    res.status(200).json({
      success: true,
      count: simplifiedOrders.length,
      orders: simplifiedOrders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get orders for seller
const getOrderBySeller = async (req, res) => {
  try {
    const sellerId = req.seller?.sellerId;

    if (!sellerId) {
      return res.status(400).json({ success: false, message: 'Seller authentication required' });
    }

    const orders = await orderService.getOrdersBySeller(sellerId);

    const sellerOrders = orders.map(order => ({
      orderId: order.orderId,
      userId: order.userId,
      productName: order.productName,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      paymentStatus: order.paymentStatus,
      trackingUrl: order.trackingUrl,
      address: order.address
    }));

    res.status(200).json({
      success: true,
      count: sellerOrders.length,
      orders: sellerOrders
    });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    let { orderId } = req.params;
    const { status } = req.body;
    const sellerId = req.seller?.sellerId;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ success: false, message: 'Order ID is required and must be a string' });
    }

    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, '');

    if (!sellerId) {
      return res.status(403).json({ success: false, message: 'Seller authentication required' });
    }

    if (!status || !['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status is required' });
    }

    const updatedOrder = await orderService.updateOrderStatus(cleanOrderId, sellerId, status);

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        orderId: updatedOrder.orderId,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt
      }
    });

  } catch (error) {
    console.error('Controller error:', error);
    const statusCode = error.message.includes('not found') ? 404 :
        error.message.includes('Unauthorized') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update order status',
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          error: error.message,
          stack: error.stack
        }
      })
    });
  }
};

// Cancel user order
const cancelUserOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.userId;

    if (!orderId || !userId) {
      return res.status(400).json({ success: false, message: 'Order ID and user authentication required' });
    }

    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, '');
    const updatedOrder = await orderService.cancelUserOrder(cleanOrderId, userId);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        orderId: updatedOrder.orderId,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt
      }
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 :
        error.message.includes('Unauthorized') ? 403 :
            error.message.includes('Cannot cancel') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to cancel order'
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderBySeller,
  updateOrderStatus,
  cancelUserOrder
};
