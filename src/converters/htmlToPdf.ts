import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { ConversionOptions, ConversionResult } from '../types';
import { readAsText } from '../utils';

// Page dimensions in mm
const PAGE_SIZES = {
   A4: { width: 210, height: 297 },
   letter: { width: 215.9, height: 279.4 },
   fit: { width: 210, height: 297 },
};

// Pixels per mm at 96 DPI
const PX_PER_MM = 96 / 25.4;

/**
 * Simple Markdown to HTML converter
 */
function markdownToHtml(markdown: string): string {
   let html = markdown
      // Headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Lists
      .replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>')
      // Paragraphs (double newline)
      .replace(/\n\n/g, '</p><p>')
      // Line breaks
      .replace(/\n/g, '<br>');

   // Wrap in paragraph tags
   html = '<p>' + html + '</p>';

   // Wrap consecutive li elements in ul
   html = html.replace(/(<li>.*?<\/li>\s*)+/g, '<ul>$&</ul>');

   return html;
}

/**
 * Create a styled container for rendering HTML
 */
function createRenderContainer(html: string, width: number): HTMLDivElement {
   const container = document.createElement('div');
   container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: ${width}px;
    padding: 20px;
    background: white;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #333;
  `;

   // Add base styles for HTML content
   container.innerHTML = `
    <style>
      h1 { font-size: 24px; margin: 0 0 16px; color: #111; }
      h2 { font-size: 20px; margin: 16px 0 12px; color: #222; }
      h3 { font-size: 16px; margin: 12px 0 8px; color: #333; }
      p { margin: 0 0 12px; }
      ul, ol { margin: 0 0 12px; padding-left: 24px; }
      li { margin: 4px 0; }
      code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: 'Consolas', monospace; }
      pre { background: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto; }
      pre code { padding: 0; background: none; }
      a { color: #0066cc; text-decoration: underline; }
      blockquote { margin: 0 0 12px; padding-left: 16px; border-left: 3px solid #ddd; color: #666; }
    </style>
    ${html}
  `;

   document.body.appendChild(container);
   return container;
}

/**
 * Convert HTML/Markdown to PDF using html2canvas
 */
export async function htmlToPdf(
   file: File,
   options: ConversionOptions,
   onProgress?: (progress: number) => void
): Promise<ConversionResult> {
   onProgress?.(10);

   // Read file content
   const content = await readAsText(file);
   onProgress?.(20);

   // Convert markdown to HTML if needed
   const isMarkdown = file.name.endsWith('.md') || file.name.endsWith('.markdown');
   const html = isMarkdown ? markdownToHtml(content) : content;

   const pageSize = PAGE_SIZES[options.pageSize];
   const margin = options.margin;
   const contentWidthMm = pageSize.width - margin * 2;
   const contentWidthPx = contentWidthMm * PX_PER_MM;

   // Create render container
   const container = createRenderContainer(html, contentWidthPx);

   onProgress?.(40);

   try {
      // Render to canvas
      const canvas = await html2canvas(container, {
         scale: 2, // Higher quality
         useCORS: true,
         logging: false,
         backgroundColor: '#ffffff',
      });

      onProgress?.(70);

      // Calculate pages needed
      const contentHeightMm = pageSize.height - margin * 2;
      const contentHeightPx = contentHeightMm * PX_PER_MM * 2; // Account for scale
      const totalPages = Math.ceil(canvas.height / contentHeightPx);

      // Create PDF
      const pdf = new jsPDF({
         orientation: 'portrait',
         unit: 'mm',
         format: options.pageSize === 'fit' ? 'a4' : options.pageSize.toLowerCase() as 'a4' | 'letter',
      });

      // Split canvas into pages
      for (let page = 0; page < totalPages; page++) {
         if (page > 0) {
            pdf.addPage();
         }

         // Create page canvas
         const pageCanvas = document.createElement('canvas');
         pageCanvas.width = canvas.width;
         pageCanvas.height = Math.min(contentHeightPx, canvas.height - page * contentHeightPx);

         const ctx = pageCanvas.getContext('2d');
         if (!ctx) throw new Error('Failed to get canvas context');

         // Draw portion of full canvas
         ctx.drawImage(
            canvas,
            0, page * contentHeightPx,
            canvas.width, pageCanvas.height,
            0, 0,
            pageCanvas.width, pageCanvas.height
         );

         // Add to PDF
         const imgData = pageCanvas.toDataURL('image/jpeg', options.quality);
         const imgHeight = (pageCanvas.height / pageCanvas.width) * contentWidthMm;
         pdf.addImage(imgData, 'JPEG', margin, margin, contentWidthMm, imgHeight);

         onProgress?.(70 + (page / totalPages) * 30);
      }

      onProgress?.(100);

      // Cleanup
      document.body.removeChild(container);

      const blob = pdf.output('blob');
      return {
         blob,
         filename: file.name.replace(/\.[^.]+$/, '') + '.pdf',
         pageCount: totalPages,
      };
   } catch (error) {
      // Cleanup on error
      document.body.removeChild(container);
      throw error;
   }
}

/**
 * Convert multiple HTML/Markdown files to a single PDF
 */
export async function htmlsToSinglePdf(
   files: File[],
   options: ConversionOptions,
   onProgress?: (progress: number) => void
): Promise<ConversionResult> {
   if (files.length === 0) {
      throw new Error('No files to convert');
   }

   const pageSize = PAGE_SIZES[options.pageSize];
   const margin = options.margin;
   const contentWidthMm = pageSize.width - margin * 2;
   const contentWidthPx = contentWidthMm * PX_PER_MM;
   const contentHeightMm = pageSize.height - margin * 2;
   const contentHeightPx = contentHeightMm * PX_PER_MM * 2;

   let pdf: jsPDF | null = null;
   let totalPages = 0;

   for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex];
      const content = await readAsText(file);
      const isMarkdown = file.name.endsWith('.md') || file.name.endsWith('.markdown');
      const html = isMarkdown ? markdownToHtml(content) : content;

      const container = createRenderContainer(html, contentWidthPx);

      try {
         const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
         });

         const fileTotalPages = Math.ceil(canvas.height / contentHeightPx);

         for (let page = 0; page < fileTotalPages; page++) {
            if (pdf === null) {
               pdf = new jsPDF({
                  orientation: 'portrait',
                  unit: 'mm',
                  format: options.pageSize === 'fit' ? 'a4' : options.pageSize.toLowerCase() as 'a4' | 'letter',
               });
            } else {
               pdf.addPage();
            }
            totalPages++;

            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = Math.min(contentHeightPx, canvas.height - page * contentHeightPx);

            const ctx = pageCanvas.getContext('2d');
            if (!ctx) throw new Error('Failed to get canvas context');

            ctx.drawImage(
               canvas,
               0, page * contentHeightPx,
               canvas.width, pageCanvas.height,
               0, 0,
               pageCanvas.width, pageCanvas.height
            );

            const imgData = pageCanvas.toDataURL('image/jpeg', options.quality);
            const imgHeight = (pageCanvas.height / pageCanvas.width) * contentWidthMm;
            pdf.addImage(imgData, 'JPEG', margin, margin, contentWidthMm, imgHeight);
         }

         document.body.removeChild(container);
         onProgress?.(((fileIndex + 1) / files.length) * 100);
      } catch (error) {
         document.body.removeChild(container);
         throw error;
      }
   }

   onProgress?.(100);

   const blob = pdf!.output('blob');
   return {
      blob,
      filename: 'converted-documents.pdf',
      pageCount: totalPages,
   };
}
