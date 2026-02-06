import * as JSZip from 'jszip';
import type { ConversionOptions, ConversionResult } from '../types';
import { readAsArrayBuffer } from '../utils';
import { htmlToPdf } from './htmlToPdf';

/**
 * Extract text content from DOCX document.xml
 */
function extractTextFromXml(xml: string): string {
   // Remove namespaces for easier parsing
   const cleanXml = xml.replace(/<[^:>]+:/g, '<').replace(/<\/[^:>]+:/g, '</');

   const paragraphs: string[] = [];

   // Match paragraph elements
   const pMatches = cleanXml.match(/<p[^>]*>[\s\S]*?<\/p>/g) || [];

   for (const pMatch of pMatches) {
      // Extract text from <t> elements within paragraph
      const textMatches = pMatch.match(/<t[^>]*>([^<]*)<\/t>/g) || [];
      const paragraphText = textMatches
         .map(t => t.replace(/<t[^>]*>/, '').replace(/<\/t>/, ''))
         .join('');

      if (paragraphText.trim()) {
         paragraphs.push(paragraphText);
      } else {
         // Empty paragraph = line break
         paragraphs.push('');
      }
   }

   return paragraphs.join('\n');
}

/**
 * Extract images from DOCX word/media folder
 */
async function extractImages(zip: JSZip): Promise<Map<string, string>> {
   const images = new Map<string, string>();
   const mediaFolder = zip.folder('word/media');

   if (!mediaFolder) return images;

   const imageFiles = Object.keys(zip.files).filter(
      name => name.startsWith('word/media/') && /\.(png|jpg|jpeg|gif|webp)$/i.test(name)
   );

   for (const imagePath of imageFiles) {
      try {
         const file = zip.file(imagePath);
         if (file) {
            const data = await file.async('base64');
            const ext = imagePath.split('.').pop()?.toLowerCase() || 'png';
            const mimeType = ext === 'jpg' ? 'jpeg' : ext;
            images.set(imagePath, `data:image/${mimeType};base64,${data}`);
         }
      } catch {
         // Skip failed images
      }
   }

   return images;
}

/**
 * Convert extracted content to basic HTML
 */
function contentToHtml(text: string, images: Map<string, string>): string {
   // Escape HTML entities
   let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

   // Convert paragraphs
   html = html
      .split('\n')
      .map(line => `<p>${line || '&nbsp;'}</p>`)
      .join('\n');

   // Add images at the end if any
   if (images.size > 0) {
      html += '<div style="margin-top: 24px;">';
      html += '<h3>Extracted Images</h3>';
      for (const [, dataUrl] of images) {
         html += `<img src="${dataUrl}" style="max-width: 100%; margin: 8px 0;" alt="Extracted image" />`;
      }
      html += '</div>';
   }

   return html;
}

/**
 * Extract content from DOCX and convert to PDF
 * Note: This is a basic extraction without formatting preservation
 */
export async function docxToPdf(
   file: File,
   options: ConversionOptions,
   onProgress?: (progress: number) => void
): Promise<ConversionResult> {
   onProgress?.(10);

   // Read DOCX as ArrayBuffer
   const arrayBuffer = await readAsArrayBuffer(file);
   onProgress?.(20);

   // Parse as ZIP
   const zip = await JSZip.loadAsync(arrayBuffer);
   onProgress?.(30);

   // Extract document.xml
   const documentXml = zip.file('word/document.xml');
   if (!documentXml) {
      throw new Error('Invalid DOCX file: missing document.xml');
   }

   const xmlContent = await documentXml.async('string');
   onProgress?.(40);

   // Extract text content
   const text = extractTextFromXml(xmlContent);
   onProgress?.(50);

   // Extract images
   const images = await extractImages(zip);
   onProgress?.(60);

   // Convert to HTML
   const html = contentToHtml(text, images);

   // Create a fake HTML file for the htmlToPdf converter
   const htmlBlob = new Blob([html], { type: 'text/html' });
   const htmlFile = new File([htmlBlob], file.name.replace('.docx', '.html'), { type: 'text/html' });

   // Convert HTML to PDF
   const result = await htmlToPdf(htmlFile, options, (progress) => {
      onProgress?.(60 + progress * 0.4);
   });

   return {
      ...result,
      filename: file.name.replace('.docx', '.pdf'),
   };
}

/**
 * Convert multiple DOCX files to a single PDF
 */
export async function docxsToSinglePdf(
   files: File[],
   options: ConversionOptions,
   onProgress?: (progress: number) => void
): Promise<ConversionResult> {
   if (files.length === 0) {
      throw new Error('No files to convert');
   }

   // For multiple files, we'll extract all content and combine
   const allHtmlParts: string[] = [];

   for (let i = 0; i < files.length; i++) {
      const file = files[i];
      onProgress?.((i / files.length) * 50);

      const arrayBuffer = await readAsArrayBuffer(file);
      const zip = await JSZip.loadAsync(arrayBuffer);

      const documentXml = zip.file('word/document.xml');
      if (!documentXml) continue;

      const xmlContent = await documentXml.async('string');
      const text = extractTextFromXml(xmlContent);
      const images = await extractImages(zip);

      // Add file separator
      allHtmlParts.push(`<h1 style="border-bottom: 2px solid #ddd; padding-bottom: 8px;">${file.name}</h1>`);
      allHtmlParts.push(contentToHtml(text, images));
      allHtmlParts.push('<div style="page-break-after: always;"></div>');
   }

   onProgress?.(50);

   // Combine and convert
   const combinedHtml = allHtmlParts.join('\n');
   const htmlBlob = new Blob([combinedHtml], { type: 'text/html' });
   const htmlFile = new File([htmlBlob], 'combined.html', { type: 'text/html' });

   const result = await htmlToPdf(htmlFile, options, (progress) => {
      onProgress?.(50 + progress * 0.5);
   });

   return {
      ...result,
      filename: 'converted-documents.pdf',
   };
}
