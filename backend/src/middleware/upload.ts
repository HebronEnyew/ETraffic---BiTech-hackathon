import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create upload directories if they don't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const idPhotosDir = path.join(uploadsDir, 'id');
const reportPhotosDir = path.join(uploadsDir, 'reports');

[uploadsDir, idPhotosDir, reportPhotosDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for ID photos
const idPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, idPhotosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `id-${uniqueSuffix}${ext}`);
  },
});

// Configure storage for report photos
const reportPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, reportPhotosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `report-${uniqueSuffix}${ext}`);
  },
});

// File filter for ID photos
const idPhotoFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and PDF files are allowed for ID photos'));
  }
};

// File filter for report photos
const reportPhotoFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const allowedExts = ['.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG and PNG images are allowed for report photos'));
  }
};

// ID photo upload middleware (single file)
export const uploadIdPhoto = multer({
  storage: idPhotoStorage,
  fileFilter: idPhotoFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Report photos upload middleware (multiple files)
export const uploadReportPhotos = multer({
  storage: reportPhotoStorage,
  fileFilter: reportPhotoFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5, // Max 5 photos per report
  },
});

