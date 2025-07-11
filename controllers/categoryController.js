const categoryService = require('../services/categoryService');

const createCategory = async (req, res) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json(category);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create category' });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const result = await categoryService.getAllCategories();
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

module.exports = { createCategory, getAllCategories };

