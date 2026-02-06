import { jsPDF } from 'jspdf';
import type { ConversionOptions, ConversionResult } from '../types';
import { readAsText } from '../utils';

// Page dimensions in mm
const PAGE_SIZES = {
   A4: { width: 210, height: 297 },
   letter: { width: 215.9, height: 279.4 },
   fit: { width: 210, height: 297 },
};

// Font settings
const FONT_SIZE = 12;
const LINE_HEIGHT = 6; // mm

/**
 * Convert plain text file to PDF
 */
export async function textToPdf(
   file: File,
   options: ConversionOptions,
   onProgress?: (progress: number) => void
): Promise<ConversionResult> {
   onProgress?.(10);

   // Read text content
   const text = await readAsText(file);
   onProgress?.(30);

   const pageSize = PAGE_SIZES[options.pageSize];
   const margin = options.margin;
   const contentWidth = pageSize.width - margin * 2;
   const contentHeight = pageSize.height - margin * 2;
   const linesPerPage = Math.floor(contentHeight / LINE_HEIGHT);

   // Create PDF
   const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: options.pageSize === 'fit' ? 'a4' : options.pageSize.toLowerCase() as 'a4' | 'letter',
   });

   pdf.setFont('courier', 'normal');
   pdf.setFontSize(FONT_SIZE);

   // Split text into lines that fit within content width
   const lines = pdf.splitTextToSize(text, contentWidth);
   const totalLines = lines.length;
   const totalPages = Math.ceil(totalLines / linesPerPage);

   onProgress?.(50);

   let currentPage = 1;
   let y = margin;

   for (let i = 0; i < lines.length; i++) {
      // Check if we need a new page
      if (y + LINE_HEIGHT > pageSize.height - margin) {
         pdf.addPage();
         currentPage++;
         y = margin;
      }

      // Add line
      pdf.text(lines[i], margin, y + LINE_HEIGHT);
      y += LINE_HEIGHT;

      // Update progress
      if (i % 50 === 0) {
         onProgress?.(50 + (i / totalLines) * 50);
      }
   }

   onProgress?.(100);

   // Generate output
   const blob = pdf.output('blob');
   return {
      blob,
      filename: file.name.replace(/\.[^.]+$/, '') + '.pdf',
      pageCount: totalPages,
   };
}

/**
 * Convert multiple text files to a single PDF
 */
export async function textsToSinglePdf(
   files: File[],
   options: ConversionOptions,
   onProgress?: (progress: number) => void
): Promise<ConversionResult> {
   if (files.length === 0) {
      throw new Error('No files to convert');
   }

   const pageSize = PAGE_SIZES[options.pageSize];
   const margin = options.margin;
   const contentWidth = pageSize.width - margin * 2;

   const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: options.pageSize === 'fit' ? 'a4' : options.pageSize.toLowerCase() as 'a4' | 'letter',
   });

   pdf.setFont('courier', 'normal');
   pdf.setFontSize(FONT_SIZE);

   let y = margin;
   let totalPages = 1;
   let isFirstFile = true;

   for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex];
      const text = await readAsText(file);
      const lines = pdf.splitTextToSize(text, contentWidth);

      onProgress?.((fileIndex / files.length) * 100);

      // Add file separator (new page) for subsequent files
      if (!isFirstFile) {
         pdf.addPage();
         totalPages++;
         y = margin;
      }
      isFirstFile = false;

      // Add filename as header
      pdf.setFont('courier', 'bold');
      pdf.text(`=== ${file.name} ===`, margin, y + LINE_HEIGHT);
      pdf.setFont('courier', 'normal');
      y += LINE_HEIGHT * 2;

      for (const line of lines) {
         if (y + LINE_HEIGHT > pageSize.height - margin) {
            pdf.addPage();
            totalPages++;
            y = margin;
         }
         pdf.text(line, margin, y + LINE_HEIGHT);
         y += LINE_HEIGHT;
      }
   }

   onProgress?.(100);

   const blob = pdf.output('blob');
   return {
      blob,
      filename: 'converted-texts.pdf',
      pageCount: totalPages,
   };
}
