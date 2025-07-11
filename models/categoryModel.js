const CATEGORY_TABLE = 'categories';

module.exports = {
  tableName: CATEGORY_TABLE,
  schema: {
    categoryId: 'string',
    name: 'string',
    description: 'string',
  }
};