const { ddbDocClient } = require('../config/dynamoDB');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = 'userLikedProducts';

const likeProduct = async (userId, productId) => {
  const item = {
    userId,
    productId,
  };

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: item
  });

  await ddbDocClient.send(command);
  return item;
};

module.exports = {
  likeProduct,
};
