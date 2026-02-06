import { useMemo } from 'react';
import './PdfPreview.css';

interface PdfPreviewProps {
   blob: Blob;
   filename: string;
   pageCount: number;
   onDownload: () => void;
   onReset: () => void;
}

export function PdfPreview({ blob, filename, pageCount, onDownload, onReset }: PdfPreviewProps) {
   const previewUrl = useMemo(() => URL.createObjectURL(blob), [blob]);

   return (
      <div className="pdf-preview">
         <div className="pdf-preview__header">
            <div className="pdf-preview__info">
               <span className="pdf-preview__icon">📄</span>
               <div>
                  <h3 className="pdf-preview__title">{filename}</h3>
                  <p className="pdf-preview__meta">
                     {pageCount} page{pageCount !== 1 ? 's' : ''} • {(blob.size / 1024).toFixed(1)} KB
                  </p>
               </div>
            </div>
            <div className="pdf-preview__actions">
               <button
                  type="button"
                  className="btn btn--secondary btn--small"
                  onClick={onReset}
               >
                  Convert More
               </button>
               <button
                  type="button"
                  className="btn btn--primary btn--small"
                  onClick={onDownload}
               >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                     <polyline points="7 10 12 15 17 10" />
                     <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF
               </button>
            </div>
         </div>

         <div className="pdf-preview__container">
            <iframe
               src={previewUrl}
               title="PDF Preview"
               className="pdf-preview__iframe"
            />
         </div>
      </div>
   );
}
