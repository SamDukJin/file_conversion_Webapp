import { useCallback, useRef, useState } from 'react';
import './DropZone.css';

interface DropZoneProps {
   onFilesAdded: (files: FileList) => void;
   disabled?: boolean;
}

export function DropZone({ onFilesAdded, disabled }: DropZoneProps) {
   const [isDragging, setIsDragging] = useState(false);
   const inputRef = useRef<HTMLInputElement>(null);

   const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
         setIsDragging(true);
      }
   }, [disabled]);

   const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
   }, []);

   const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
         onFilesAdded(files);
      }
   }, [disabled, onFilesAdded]);

   const handleClick = useCallback(() => {
      if (!disabled) {
         inputRef.current?.click();
      }
   }, [disabled]);

   const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
         e.preventDefault();
         inputRef.current?.click();
      }
   }, [disabled]);

   const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
         onFilesAdded(files);
      }
      // Reset input to allow selecting the same file again
      e.target.value = '';
   }, [onFilesAdded]);

   return (
      <div
         className={`drop-zone ${isDragging ? 'drop-zone--dragging' : ''} ${disabled ? 'drop-zone--disabled' : ''}`}
         onDragOver={handleDragOver}
         onDragLeave={handleDragLeave}
         onDrop={handleDrop}
         onClick={handleClick}
         onKeyDown={handleKeyDown}
         role="button"
         tabIndex={disabled ? -1 : 0}
         aria-label="Drop files here or click to select files"
         aria-disabled={disabled}
      >
         <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,.txt,.html,.htm,.md,.markdown,.docx"
            onChange={handleFileChange}
            className="drop-zone__input"
            aria-hidden="true"
         />

         <div className="drop-zone__content">
            <div className="drop-zone__icon">
               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
               </svg>
            </div>
            <p className="drop-zone__text">
               <strong>Drop files here</strong> or click to browse
            </p>
            <p className="drop-zone__hint">
               Supports images (PNG, JPG, GIF, TIFF), text, HTML, Markdown, DOCX
            </p>
         </div>
      </div>
   );
}
