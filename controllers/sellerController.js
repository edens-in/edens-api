//File: controllers/sellerController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createSeller, getSellerByEmail } = require('../services/sellerService');

const signupSeller = async (req, res) => {
  try {
    const { email, password, phone } = req.body;
    const existing = await getSellerByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const seller = await createSeller({ email, passwordHash, phone });

    // creating a seller obj omiting password
    const {passwordHash: _, ...sellerData} = seller; 

    //creating token for seller
    const token = jwt.sign({sellerId: seller.sellerId}, process.env.JWT_SECRET, {expiresIn: '7d'});
    
    
    // httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production', // only on HTTPS in production
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });


    res.status(201).json({ sellerData, message: 'Signup successful' });
    
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
 
const loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body;
    const seller = await getSellerByEmail(email);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    const isMatch = await bcrypt.compare(password, seller.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ sellerId: seller.sellerId }, process.env.JWT_SECRET, { expiresIn: '7d' });


    // httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production', // only on HTTPS in production
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({message: 'Login Successfull'}); 
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { signupSeller, loginSeller };