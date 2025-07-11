const { ddbDocClient } = require('../config/dynamoDB');
const { v4: uuidv4 } = require('uuid');
const { PutCommand, GetCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const productModel = require('../models/productModel');

// Removes undefined/null inside arrays
function deepClean(value) {
  if (Array.isArray(value)) {
    return value.filter(v => v !== undefined && v !== null);
  }
  return value;
}

// Removes undefined/null fields from object and also deeply cleans arrays
function clean(item) {
  return Object.fromEntries(
    Object.entries(item)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, deepClean(v)])
  );
}

const createProduct = async (data, imageUrls) => {
  const item = clean({
    productId: uuidv4(),
    sellerId: data.sellerId,
    categoryId: data.categoryId,
    brand: data.brand,
    color: data.color,
    size: data.size ? JSON.parse(data.size) : [],
    gender: data.gender,
    material: data.material,
    productName: data.productName,
    productDescription: data.productDescription,
    price: data.price ? Number(data.price) : 0,
    discount: data.discount ? Number(data.discount) : 0,
    stock: data.stock ? Number(data.stock) : 0,
    imageUrls: imageUrls,
    createdAt: new Date().toISOString(),
  });

  await ddbDocClient.send(new PutCommand({
    TableName: productModel.tableName,
    Item: item,
    marshallOptions: {
      removeUndefinedValues: true
    }
  }));

  return item;
};

const getProductById = async (id) => {
  const result = await ddbDocClient.send(new GetCommand({
    TableName: productModel.tableName,
    Key: { productId: id },
  }));
  return result.Item || null;
};

const deleteProduct = async (id) => {
  await ddbDocClient.send(new DeleteCommand({
    TableName: productModel.tableName,
    Key: { productId: id },
  }));
};

const getAllProducts = async () => {
  const result = await ddbDocClient.send(new ScanCommand({
    TableName: productModel.tableName,
  }));
  return result.Items || [];
};



const searchProductsByName = async (queryName) => {
  const result = await ddbDocClient.send(
    new ScanCommand({ TableName: productModel.tableName })
  );

  const allProducts = result.Items || [];
  const lowerQuery = queryName.toLowerCase();

  // Case-insensitive filter
  const filtered = allProducts.filter(prod =>
    prod.productName && prod.productName.toLowerCase().includes(lowerQuery)
  );

  return filtered;
};



module.exports = {
  createProduct,
  getProductById,
  deleteProduct,
  getAllProducts,
  searchProductsByName,
};
