import { jsPDF } from 'jspdf';
import type { ConversionOptions, ConversionResult } from '../types';
import { readAsDataURL, loadImage } from '../utils';

// Maximum canvas dimension to avoid memory issues
const MAX_DIMENSION = 4096;

// Page dimensions in mm
const PAGE_SIZES = {
   A4: { width: 210, height: 297 },
   letter: { width: 215.9, height: 279.4 },
   fit: { width: 210, height: 297 }, // Will be overridden
};

interface ImageDimensions {
   width: number;
   height: number;
}

/**
 * Resize image dimensions to fit within max size while maintaining aspect ratio
 */
function constrainDimensions(width: number, height: number): ImageDimensions {
   if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
      return { width, height };
   }

   const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
   return {
      width: Math.floor(width * ratio),
      height: Math.floor(height * ratio),
   };
}

/**
 * Draw image to canvas with optional resizing
 */
function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
   const { width, height } = constrainDimensions(img.naturalWidth, img.naturalHeight);

   const canvas = document.createElement('canvas');
   canvas.width = width;
   canvas.height = height;

   const ctx = canvas.getContext('2d');
   if (!ctx) throw new Error('Failed to get canvas context');

   ctx.drawImage(img, 0, 0, width, height);
   return canvas;
}

/**
 * Calculate image placement on PDF page
 */
function calculatePlacement(
   imgWidth: number,
   imgHeight: number,
   pageWidth: number,
   pageHeight: number,
   margin: number
): { x: number; y: number; width: number; height: number } {
   const availWidth = pageWidth - margin * 2;
   const availHeight = pageHeight - margin * 2;

   const imgRatio = imgWidth / imgHeight;
   const pageRatio = availWidth / availHeight;

   let width: number, height: number;

   if (imgRatio > pageRatio) {
      // Image is wider than page ratio
      width = availWidth;
      height = availWidth / imgRatio;
   } else {
      // Image is taller than page ratio
      height = availHeight;
      width = availHeight * imgRatio;
   }

   // Center on page
   const x = margin + (availWidth - width) / 2;
   const y = margin + (availHeight - height) / 2;

   return { x, y, width, height };
}

/**
 * Convert multiple images to a single PDF with one image per page
 */
export async function imagesToPdf(
   files: File[],
   options: ConversionOptions,
   onProgress?: (progress: number) => void
): Promise<ConversionResult> {
   if (files.length === 0) {
      throw new Error('No images to convert');
   }

   const pageSize = PAGE_SIZES[options.pageSize];
   let pdf: jsPDF | null = null;

   for (let i = 0; i < files.length; i++) {
      const file = files[i];
      onProgress?.((i / files.length) * 100);

      // Read and load image
      const dataUrl = await readAsDataURL(file);
      const img = await loadImage(dataUrl);

      // Convert to canvas (handles resizing)
      const canvas = imageToCanvas(img);
      const imgData = canvas.toDataURL('image/jpeg', options.quality);

      // Determine page dimensions
      let pageW = pageSize.width;
      let pageH = pageSize.height;

      if (options.pageSize === 'fit') {
         // Scale to fit image with some margin
         const imgRatio = canvas.width / canvas.height;
         if (imgRatio > 1) {
            pageW = 297; // A4 landscape width
            pageH = pageW / imgRatio;
         } else {
            pageH = 297; // A4 portrait height
            pageW = pageH * imgRatio;
         }
         pageW += options.margin * 2;
         pageH += options.margin * 2;
      }

      // Create PDF or add page
      if (i === 0) {
         const orientation = pageW > pageH ? 'landscape' : 'portrait';
         pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format: options.pageSize === 'fit' ? [pageW, pageH] : options.pageSize.toLowerCase() as 'a4' | 'letter',
         });
      } else {
         const orientation = pageW > pageH ? 'l' : 'p';
         pdf!.addPage(
            options.pageSize === 'fit' ? [pageW, pageH] : options.pageSize.toLowerCase() as 'a4' | 'letter',
            orientation
         );
      }

      // Calculate placement and add image
      const { x, y, width, height } = calculatePlacement(
         canvas.width,
         canvas.height,
         pageW,
         pageH,
         options.margin
      );

      pdf!.addImage(imgData, 'JPEG', x, y, width, height);

      // Cleanup canvas
      canvas.width = 0;
      canvas.height = 0;
   }

   onProgress?.(100);

   // Generate output
   const blob = pdf!.output('blob');
   return {
      blob,
      filename: 'converted-images.pdf',
      pageCount: files.length,
   };
}

/**
 * Convert a single image to PDF
 */
export async function imageToPdf(
   file: File,
   options: ConversionOptions,
   onProgress?: (progress: number) => void
): Promise<ConversionResult> {
   return imagesToPdf([file], options, onProgress);
}
