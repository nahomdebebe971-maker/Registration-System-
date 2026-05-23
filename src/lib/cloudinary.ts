/**
 * Cloudinary Unsigned Upload Configuration
 * Cloud Name: dgwspegi5
 * Upload Preset: school_registration
 */

const CLOUDINARY_CLOUD_NAME = 'dgwspegi5';
const UPLOAD_PRESET = 'school_registration';

interface UploadOptions {
  folder: 'school-registration/transcripts' | 'school-registration/receipts';
  onProgress: (percent: number) => void;
  onSuccess: (url: string) => void;
  onError: (error: string) => void;
}

/**
 * Validates file constraints
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Max file size: 5MB
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is ${MAX_SIZE_MB}MB.` };
  }

  // Allowed formats
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: `Invalid file format (.${extension}). Allowed formats: JPG, JPEG, PNG, WEBP, PDF.` };
  }

  return { valid: true };
}

/**
 * Compress an image file using HTML5 Canvas before sending it to Cloudinary.
 * If the file is a PDF, it will skip compression.
 */
export async function compressAndOptimizeImage(file: File): Promise<Blob | File> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (extension === 'pdf') {
    return file; // Do not compress PDF
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maximum dimensions for optimized uploads (e.g., 1600px edge)
        const MAX_DIM = 1600;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // Fallback to raw if canvas ctx failed
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as optimized JPEG at 80% quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8
        );
      };
      
      img.onerror = () => {
        resolve(file); // Fallback on image loading error
      };

      if (event.target?.result) {
        img.src = event.target.result as string;
      } else {
        resolve(file);
      }
    };

    reader.onerror = () => {
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a file to Cloudinary with real-time XMLHttpRequest progress
 */
export async function uploadToCloudinary(file: File, options: UploadOptions): Promise<void> {
  const validation = validateFile(file);
  if (!validation.valid) {
    options.onError(validation.error || 'Invalid file');
    return;
  }

  try {
    options.onProgress(5); // Show immediate progress feedback

    // Compress first if image
    const optimizedFile = await compressAndOptimizeImage(file);
    options.onProgress(15);

    const xhr = new XMLHttpRequest();
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

    xhr.open('POST', url, true);

    // Track real progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        // Map remaining progress from 15% to 95%
        const calculatedPercent = Math.round(15 + (event.loaded / event.total) * 80);
        options.onProgress(calculatedPercent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          options.onProgress(100);
          
          // Secure Cloudinary SSL Deliverable URL
          const secureUrl = response.secure_url || response.url;
          options.onSuccess(secureUrl);
        } catch {
          options.onError('Failed to parse Cloudinary response');
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          options.onError(errRes.error?.message || `Cloudinary upload failed: Star code ${xhr.status}`);
        } catch {
          options.onError(`Cloudinary upload failed with status ${xhr.status}`);
        }
      }
    };

    xhr.onerror = () => {
      options.onError('Alternative network failure while uploading to Cloudinary');
    };

    const formData = new FormData();
    formData.append('file', optimizedFile, file.name.substring(0, file.name.lastIndexOf('.')) + '.jpg');
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', options.folder);

    xhr.send(formData);
  } catch (err: any) {
    options.onError(err.message || 'An unexpected error occurred during processing');
  }
}
