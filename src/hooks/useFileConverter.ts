import { useState, useCallback } from 'react';
import type { ConvertibleFile, ConversionOptions, ConversionResult, FileType } from '../types';
import { validateFiles, detectFileType, generateId, readAsDataURL, isImageFile } from '../utils';
import { imagesToPdf, textToPdf, textsToSinglePdf, htmlToPdf, htmlsToSinglePdf, docxToPdf, docxsToSinglePdf } from '../converters';

export interface FileConverterState {
   files: ConvertibleFile[];
   isConverting: boolean;
   overallProgress: number;
   result: ConversionResult | null;
   error: string | null;
}

const defaultOptions: ConversionOptions = {
   pageSize: 'A4',
   quality: 0.9,
   margin: 10,
};

export function useFileConverter() {
   const [state, setState] = useState<FileConverterState>({
      files: [],
      isConverting: false,
      overallProgress: 0,
      result: null,
      error: null,
   });

   const [options, setOptions] = useState<ConversionOptions>(defaultOptions);

   /**
    * Add files to the conversion queue
    */
   const addFiles = useCallback(async (fileList: FileList | File[]) => {
      const newFiles = Array.from(fileList);

      // Validate files
      const validation = validateFiles(newFiles);
      if (!validation.valid) {
         setState(prev => ({ ...prev, error: validation.error || 'Validation failed' }));
         return;
      }

      // Create ConvertibleFile objects with previews
      const convertibleFiles: ConvertibleFile[] = await Promise.all(
         newFiles.map(async (file) => {
            const type = detectFileType(file);
            let preview: string | null = null;

            // Generate preview for images
            if (isImageFile(type)) {
               try {
                  preview = await readAsDataURL(file);
               } catch {
                  // Preview failed, continue without it
               }
            }

            return {
               id: generateId(),
               file,
               type,
               preview,
               status: 'pending',
               progress: 0,
            };
         })
      );

      setState(prev => ({
         ...prev,
         files: [...prev.files, ...convertibleFiles],
         error: null,
         result: null,
      }));
   }, []);

   /**
    * Remove a file from the queue
    */
   const removeFile = useCallback((id: string) => {
      setState(prev => ({
         ...prev,
         files: prev.files.filter(f => f.id !== id),
      }));
   }, []);

   /**
    * Clear all files
    */
   const clearFiles = useCallback(() => {
      setState(prev => ({
         ...prev,
         files: [],
         result: null,
         error: null,
      }));
   }, []);

   /**
    * Convert all files to PDF
    */
   const convert = useCallback(async () => {
      if (state.files.length === 0) {
         setState(prev => ({ ...prev, error: 'No files to convert' }));
         return;
      }

      setState(prev => ({
         ...prev,
         isConverting: true,
         overallProgress: 0,
         result: null,
         error: null,
      }));

      try {
         // Group files by type
         const imageFiles = state.files.filter(f => f.type === 'image').map(f => f.file);
         const textFiles = state.files.filter(f => f.type === 'text').map(f => f.file);
         const htmlFiles = state.files.filter(f => f.type === 'html' || f.type === 'markdown').map(f => f.file);
         const docxFiles = state.files.filter(f => f.type === 'docx').map(f => f.file);

         let result: ConversionResult;

         // Determine which converter to use based on file types
         const types = new Set(state.files.map(f => f.type));

         if (types.size === 1) {
            // Single file type - use appropriate converter
            const type = types.values().next().value as FileType;

            switch (type) {
               case 'image':
                  result = await imagesToPdf(imageFiles, options, p => {
                     setState(prev => ({ ...prev, overallProgress: p }));
                  });
                  break;
               case 'text':
                  if (textFiles.length === 1) {
                     result = await textToPdf(textFiles[0], options, p => {
                        setState(prev => ({ ...prev, overallProgress: p }));
                     });
                  } else {
                     result = await textsToSinglePdf(textFiles, options, p => {
                        setState(prev => ({ ...prev, overallProgress: p }));
                     });
                  }
                  break;
               case 'html':
               case 'markdown':
                  if (htmlFiles.length === 1) {
                     result = await htmlToPdf(htmlFiles[0], options, p => {
                        setState(prev => ({ ...prev, overallProgress: p }));
                     });
                  } else {
                     result = await htmlsToSinglePdf(htmlFiles, options, p => {
                        setState(prev => ({ ...prev, overallProgress: p }));
                     });
                  }
                  break;
               case 'docx':
                  if (docxFiles.length === 1) {
                     result = await docxToPdf(docxFiles[0], options, p => {
                        setState(prev => ({ ...prev, overallProgress: p }));
                     });
                  } else {
                     result = await docxsToSinglePdf(docxFiles, options, p => {
                        setState(prev => ({ ...prev, overallProgress: p }));
                     });
                  }
                  break;
               default:
                  throw new Error('Unsupported file type');
            }
         } else {
            // Mixed file types - convert images first (most common use case)
            // For simplicity, prioritize by: images > text > html > docx
            if (imageFiles.length > 0) {
               result = await imagesToPdf(imageFiles, options, p => {
                  setState(prev => ({ ...prev, overallProgress: p }));
               });
            } else if (textFiles.length > 0) {
               result = await textsToSinglePdf(textFiles, options, p => {
                  setState(prev => ({ ...prev, overallProgress: p }));
               });
            } else if (htmlFiles.length > 0) {
               result = await htmlsToSinglePdf(htmlFiles, options, p => {
                  setState(prev => ({ ...prev, overallProgress: p }));
               });
            } else {
               result = await docxsToSinglePdf(docxFiles, options, p => {
                  setState(prev => ({ ...prev, overallProgress: p }));
               });
            }
         }

         // Mark all files as done
         setState(prev => ({
            ...prev,
            isConverting: false,
            overallProgress: 100,
            result,
            files: prev.files.map(f => ({ ...f, status: 'done', progress: 100 })),
         }));
      } catch (error) {
         setState(prev => ({
            ...prev,
            isConverting: false,
            error: error instanceof Error ? error.message : 'Conversion failed',
            files: prev.files.map(f => ({ ...f, status: 'error' })),
         }));
      }
   }, [state.files, options]);

   /**
    * Download the result PDF
    */
   const download = useCallback(() => {
      if (!state.result) return;

      const url = URL.createObjectURL(state.result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = state.result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
   }, [state.result]);

   /**
    * Get auto-detected conversion suggestion
    */
   const getSuggestion = useCallback((): string => {
      if (state.files.length === 0) return '';

      const types = new Set(state.files.map(f => f.type));
      const typeCount = types.size;
      const fileCount = state.files.length;

      if (typeCount === 1) {
         const type = types.values().next().value;
         if (type === 'image') {
            return `Convert ${fileCount} image${fileCount > 1 ? 's' : ''} to multi-page PDF`;
         }
         return `Convert ${fileCount} ${type} file${fileCount > 1 ? 's' : ''} to PDF`;
      }

      return `Convert ${fileCount} files (mixed types) to PDF`;
   }, [state.files]);

   return {
      ...state,
      options,
      setOptions,
      addFiles,
      removeFile,
      clearFiles,
      convert,
      download,
      getSuggestion,
   };
}
