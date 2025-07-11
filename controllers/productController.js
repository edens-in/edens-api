const productService = require('../services/productService');
const { generatePresignedUrl } = require('../services/s3/productImageService');
const userLikeService = require('../services/userLikeService');

const createProduct = async (req, res) => {
  try {
    const data = req.body;
    const imageUrls = req.files.map(file => file.key);
    const result = await productService.createProduct(data, imageUrls);
    res.status(201).json(result);
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });

    if (Array.isArray(product.imageUrls)) {
      const signedUrls = await Promise.all(
        product.imageUrls.map(key => generatePresignedUrl(key))
      );
      product.imageUrls = signedUrls;
    }

    res.json(product);
  } catch {
    res.status(500).json({ error: 'Error fetching product' });
  }
};


const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Error deleting product' });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts();

    const updatedProducts = await Promise.all(products.map(async (product) => {
      if (!Array.isArray(product.imageUrls)) return product;

      const signedUrls = await Promise.all(
        product.imageUrls.map(key => generatePresignedUrl(key))
      );

      return {
        ...product,
        imageUrls: signedUrls
      };
    }));

    res.json(updatedProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};



const searchProducts = async (req, res) => {
  try {
    const { productName } = req.query;
    if (!productName) {
      return res.status(400).json({ error: 'Missing productName in query' });
    }

    const matchedProducts = await productService.searchProductsByName(productName);

    const updated = await Promise.all(matchedProducts.map(async (product) => {
      if (!Array.isArray(product.imageUrls)) return product;

      const signedUrls = await Promise.all(
        product.imageUrls.map(key => generatePresignedUrl(key))
      );

      return {
        ...product,
        imageUrls: signedUrls
      };
    }));

    res.json(updated);
  } catch (err) {
    console.error("Search product error:", err);
    res.status(500).json({ error: "Failed to search products" });
  }
};



const likeProduct = async (req, res) => {
  const userId = req.user?.userId;
  const { productId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. Please log in to like products.' });
  }

  if (!productId) {
    return res.status(400).json({ error: 'productId is required' });
  }

  try {
    console.log("Trying to like product:", productId, "by user:", userId);
    await userLikeService.likeProduct(userId, productId);
    res.status(201).json({ message: 'Product liked', data: { userId, productId } });
  } catch (err) {
    console.error('Like product error:', err); // ✅ log exact error
    res.status(500).json({ error: 'Failed to like product' });
  }
};


const getLikedProducts = async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  try {
    const likes = await userLikeService.getLikedProducts(userId);

    return res.status(200).json({
      message: likes.length === 0 ? 'No liked products found.' : 'Liked products fetched',
      likedProducts: likes,
    });
  } catch (err) {
    console.error('Get liked products error:', err);
    res.status(500).json({ error: 'Failed to fetch liked products' });
  }
};



module.exports = {
  createProduct,
  getProductById,
  deleteProduct,
  getAllProducts,
  searchProducts,
  likeProduct,
  getLikedProducts
};