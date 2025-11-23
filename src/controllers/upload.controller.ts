import { Response, NextFunction } from 'express';
import cloudinary from '../config/cloudinary';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { Readable } from 'stream';

export class UploadController {
  async uploadImage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError(400, 'No image file provided');
      }

      // Convert buffer to stream
      const stream = Readable.from(req.file.buffer);

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'drapely',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.pipe(uploadStream);
      });

      res.json({
        url: (result as any).secure_url,
        publicId: (result as any).public_id,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError(400, 'No image file provided');
      }

      const stream = Readable.from(req.file.buffer);

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'drapely/avatars',
            resource_type: 'image',
            transformation: [
              { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.pipe(uploadStream);
      });

      res.json({
        url: (result as any).secure_url,
        publicId: (result as any).public_id,
      });
    } catch (error) {
      next(error);
    }
  }
}
