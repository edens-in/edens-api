const { ddbDocClient } = require('../config/dynamoDB');
const { PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { tableName: CATEGORY_TABLE } = require('../models/categoryModel');

const createCategory = async (data) => {
  const item = { ...data, categoryId: uuidv4() };
  await ddbDocClient.send(new PutCommand({ TableName: CATEGORY_TABLE, Item: item }));
  return item;
};

const getAllCategories = async () => {
  const result = await ddbDocClient.send(new ScanCommand({ TableName: CATEGORY_TABLE }));
  return result.Items;
};

module.exports = { createCategory, getAllCategories };