import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

/**
 * Multer storage configuration generator
 * @param folder - Folder where files will be saved (default: ./public/uploads)
 */
export const storageConfig = (folder = './uploads') =>
  diskStorage({
    destination: (req, file, callback) => {
      try {
        const uploadPath = join(process.cwd(), folder);

        // Ensure directory exists
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }

        callback(null, uploadPath);
      } catch (error) {
        callback(error as Error, '');
      }
    },
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname).toLowerCase(); // keeps .jpg, .png, etc.
      callback(null, `${uniqueSuffix}${ext}`);
    },
  });
