import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve persistent or temporary upload directory
export const uploadDir = (process.env.VERCEL || process.env.NODE_ENV === 'production')
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '../../uploads');

// Ensure directory exists
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('Storage directory initialization warning:', err.message);
}

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const ALLOWED_DOC_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.txt', '.xlsx', '.xls',
  '.jpg', '.jpeg', '.png', '.webp',
]);
const ALLOWED_DOC_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg', 'image/png', 'image/webp',
]);

/**
 * Validates file extension and mime type against allowed types
 */
export function validateFile(file, type = 'any') {
  if (!file) throw new Error('No file provided');
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (type === 'image') {
    if (!ALLOWED_IMAGE_EXTENSIONS.has(ext) || !ALLOWED_IMAGE_MIMES.has(mime)) {
      throw new Error('Only valid image files (JPG, PNG, WebP, GIF) are allowed');
    }
  } else if (type === 'document') {
    if (!ALLOWED_DOC_EXTENSIONS.has(ext) || !ALLOWED_DOC_MIMES.has(mime)) {
      throw new Error('Only valid documents (PDF, Word, Excel, Images) are allowed');
    }
  }

  // Sanitize against path traversal
  const sanitizedBase = path.basename(file.originalname || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
  return { ext, sanitizedBase };
}

/**
 * Saves a file to Vercel Blob (if configured) or local disk with safe naming
 * @param {Express.Multer.File} file
 * @param {Object} options
 * @returns {Promise<{ url: string, filename: string, provider: string }>}
 */
export async function saveUploadedFile(file, options = { type: 'any', folder: 'uploads' }) {
  const { ext } = validateFile(file, options.type);
  const safeFilename = `${Date.now()}-${randomUUID()}${ext}`;
  const buffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);

  if (!buffer) {
    throw new Error('File buffer is empty or unavailable');
  }

  // 1. If Vercel Blob token is configured, use cloud object storage
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import('@vercel/blob');
      const blob = await put(`${options.folder || 'uploads'}/${safeFilename}`, buffer, {
        access: 'public',
        contentType: file.mimetype,
      });
      return {
        url: blob.url,
        filename: safeFilename,
        provider: 'vercel-blob',
      };
    } catch (blobErr) {
      console.warn('Vercel Blob upload failed, falling back to disk/base64 storage:', blobErr.message);
    }
  }

  // 2. In serverless without Blob token: for small profile images (<= 2MB), encode as Data URL
  // to prevent image loss on container shutdown
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isServerless && options.type === 'image' && buffer.length <= 2 * 1024 * 1024) {
    const dataUrl = `data:${file.mimetype || 'image/jpeg'};base64,${buffer.toString('base64')}`;
    return {
      url: dataUrl,
      filename: safeFilename,
      provider: 'data-url',
    };
  }

  // 3. Persistent or local temporary disk storage
  const destinationPath = path.join(uploadDir, safeFilename);
  await fs.promises.writeFile(destinationPath, buffer);

  return {
    url: `/uploads/${safeFilename}`,
    filename: safeFilename,
    provider: 'local-disk',
  };
}

/**
 * Deletes an uploaded file by its URL
 */
export async function deleteUploadedFile(fileUrl) {
  if (!fileUrl) return;

  if (fileUrl.startsWith('http') && fileUrl.includes('blob.vercel-storage.com')) {
    try {
      const { del } = await import('@vercel/blob');
      await del(fileUrl);
    } catch (err) {
      console.warn('Failed to delete Vercel Blob file:', err.message);
    }
    return;
  }

  if (fileUrl.startsWith('/uploads/')) {
    const filename = path.basename(fileUrl);
    const filePath = path.join(uploadDir, filename);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      console.warn('Failed to delete local upload file:', err.message);
    }
  }
}
