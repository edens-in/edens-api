const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const s3 = new S3Client({ region: process.env.AWS_REGION });

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const extension = file.originalname.split('.').pop();
      const fileKey = `products/${uuidv4()}.${extension}`;
      cb(null, fileKey);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = upload;
