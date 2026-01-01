/* eslint-disable @typescript-eslint/no-unsafe-return */
import { extname } from 'path';
import multerS3 from 'multer-s3';
import { s3Client } from '../aws/s3.client';

export const storageConfig = (folder = 'uploads') => {
  if (process.env.USE_S3 !== 'true') {
    throw new Error('S3 storage is disabled. Set USE_S3=true');
  }

  return multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET!,
    // acl: 'public-read', // change to 'private' if needed
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      try {
        const uniqueSuffix =
          Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname || '').toLowerCase();

        cb(null, `${folder}/${uniqueSuffix}${ext}`);
      } catch (error) {
        cb(error as Error, '');
      }
    },
  });
};
