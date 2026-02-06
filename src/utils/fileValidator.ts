import {
   type FileType,
   type ValidationResult,
   SUPPORTED_MIME_TYPES,
   EXTENSION_TO_TYPE,
   MAX_FILE_SIZE,
   MAX_TOTAL_SIZE,
} from '../types';

/**
 * Detect file type from MIME type or extension
 */
export function detectFileType(file: File): FileType {
   // Try MIME type first
   if (file.type && SUPPORTED_MIME_TYPES[file.type]) {
      return SUPPORTED_MIME_TYPES[file.type];
   }

   // Fallback to extension
   const ext = '.' + file.name.split('.').pop()?.toLowerCase();
   if (ext && EXTENSION_TO_TYPE[ext]) {
      return EXTENSION_TO_TYPE[ext];
   }

   return 'unknown';
}

/**
 * Validate a single file
 */
export function validateFile(file: File): ValidationResult {
   // Check file size
   if (file.size > MAX_FILE_SIZE) {
      return {
         valid: false,
         error: `File "${file.name}" exceeds 10MB limit (${formatFileSize(file.size)})`,
      };
   }

   // Check file type
   const type = detectFileType(file);
   if (type === 'unknown') {
      return {
         valid: false,
         error: `Unsupported file type: ${file.name}`,
      };
   }

   return { valid: true, type };
}

/**
 * Validate multiple files including total size
 */
export function validateFiles(files: File[]): ValidationResult {
   // Check total size
   const totalSize = files.reduce((sum, f) => sum + f.size, 0);
   if (totalSize > MAX_TOTAL_SIZE) {
      return {
         valid: false,
         error: `Total file size exceeds 50MB limit (${formatFileSize(totalSize)})`,
      };
   }

   // Validate each file
   for (const file of files) {
      const result = validateFile(file);
      if (!result.valid) {
         return result;
      }
   }

   return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
   if (bytes < 1024) return bytes + ' B';
   if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
   return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Generate unique ID for files
 */
export function generateId(): string {
   return Math.random().toString(36).substring(2, 11);
}

/**
 * Check if file is an image type
 */
export function isImageFile(type: FileType): boolean {
   return type === 'image';
}

/**
 * Check if file is text-based
 */
export function isTextFile(type: FileType): boolean {
   return type === 'text' || type === 'html' || type === 'markdown';
}
