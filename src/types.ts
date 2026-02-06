// Core type definitions for the file converter

export type FileType = 'image' | 'text' | 'html' | 'markdown' | 'docx' | 'unknown';

export type ConversionStatus = 'pending' | 'converting' | 'done' | 'error';

export interface ConvertibleFile {
   id: string;
   file: File;
   type: FileType;
   preview: string | null;
   status: ConversionStatus;
   progress: number;
   error?: string;
}

export interface ConversionResult {
   blob: Blob;
   filename: string;
   pageCount: number;
}

export interface ConversionOptions {
   pageSize: 'A4' | 'letter' | 'fit';
   quality: number; // 0.1 to 1.0
   margin: number; // in mm
}

export interface ValidationResult {
   valid: boolean;
   error?: string;
   type?: FileType;
}

// MIME type mappings
export const SUPPORTED_MIME_TYPES: Record<string, FileType> = {
   'image/png': 'image',
   'image/jpeg': 'image',
   'image/jpg': 'image',
   'image/gif': 'image',
   'image/tiff': 'image',
   'image/webp': 'image',
   'text/plain': 'text',
   'text/html': 'html',
   'text/markdown': 'markdown',
   'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

// File extension mappings (fallback)
export const EXTENSION_TO_TYPE: Record<string, FileType> = {
   '.png': 'image',
   '.jpg': 'image',
   '.jpeg': 'image',
   '.gif': 'image',
   '.tiff': 'image',
   '.tif': 'image',
   '.webp': 'image',
   '.txt': 'text',
   '.html': 'html',
   '.htm': 'html',
   '.md': 'markdown',
   '.markdown': 'markdown',
   '.docx': 'docx',
};

// Size limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
export const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total
