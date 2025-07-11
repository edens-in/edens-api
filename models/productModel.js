const PRODUCT_TABLE = 'products';

module.exports = {
  tableName: PRODUCT_TABLE,
  schema: {
    productId: 'string',
    sellerId: 'string',
    categoryId: 'string',
    brand: 'string',
    color: 'string',
    size: 'list',
    gender: 'string',
    material: 'string',
    productName: 'string',
    productDescription: 'string',
    price: 'number',
    discount: 'number',
    stock: 'number',
    imageUrls: 'list',
    createdAt: 'string',
  }
};
