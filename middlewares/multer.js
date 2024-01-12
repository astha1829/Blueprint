import multer from 'multer';
import path from 'path';

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '_' + file.originalname);
  },
});

// Check file type
function checkFileType(file, cb) {
  // Allowed extensions for images and videos
  const filetypes = /jpeg|jpg|png|gif|pdf|mp4|avi|mkv|mov/;
  // Check the extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check the MIME type
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: Images and Videos only!');
  }
}

// Initiate Multer for both images and videos
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 100 }, // 100 MB limit (adjust as needed)
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

export default upload;
