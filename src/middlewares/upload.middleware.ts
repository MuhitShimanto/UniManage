import multer from 'multer';
import { AppError } from '../utils/appError';

const storage = multer.memoryStorage();

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new AppError('Only image files are allowed.', 400));
      return;
    }
    cb(null, true);
  },
});

export const uploadPdf = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new AppError('Only PDF files are allowed.', 400));
      return;
    }
    cb(null, true);
  },
});
