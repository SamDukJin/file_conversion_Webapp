import type { ConvertibleFile } from '../types';
import { formatFileSize } from '../utils';
import './FileList.css';

interface FileListProps {
   files: ConvertibleFile[];
   onRemove: (id: string) => void;
   disabled?: boolean;
}

function getFileIcon(type: string): string {
   switch (type) {
      case 'image':
         return '🖼️';
      case 'text':
         return '📄';
      case 'html':
         return '🌐';
      case 'markdown':
         return '📝';
      case 'docx':
         return '📑';
      default:
         return '📎';
   }
}

function getStatusIcon(status: string): string {
   switch (status) {
      case 'pending':
         return '';
      case 'converting':
         return '⏳';
      case 'done':
         return '✅';
      case 'error':
         return '❌';
      default:
         return '';
   }
}

export function FileList({ files, onRemove, disabled }: FileListProps) {
   if (files.length === 0) {
      return null;
   }

   return (
      <div className="file-list" role="list" aria-label="Selected files">
         {files.map((file) => (
            <div
               key={file.id}
               className={`file-item file-item--${file.status}`}
               role="listitem"
            >
               {/* Preview or icon */}
               <div className="file-item__preview">
                  {file.preview ? (
                     <img
                        src={file.preview}
                        alt={`Preview of ${file.file.name}`}
                        className="file-item__image"
                     />
                  ) : (
                     <span className="file-item__icon" aria-hidden="true">
                        {getFileIcon(file.type)}
                     </span>
                  )}
               </div>

               {/* File info */}
               <div className="file-item__info">
                  <p className="file-item__name" title={file.file.name}>
                     {file.file.name}
                  </p>
                  <p className="file-item__meta">
                     <span className="file-item__size">
                        {formatFileSize(file.file.size)}
                     </span>
                     <span className="file-item__type">{file.type.toUpperCase()}</span>
                  </p>
               </div>

               {/* Status */}
               <div className="file-item__status" aria-label={`Status: ${file.status}`}>
                  {file.status === 'converting' ? (
                     <div className="file-item__spinner" aria-label="Converting..." />
                  ) : (
                     <span>{getStatusIcon(file.status)}</span>
                  )}
               </div>

               {/* Remove button */}
               <button
                  type="button"
                  className="file-item__remove"
                  onClick={() => onRemove(file.id)}
                  disabled={disabled || file.status === 'converting'}
                  aria-label={`Remove ${file.file.name}`}
                  title="Remove file"
               >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <line x1="18" y1="6" x2="6" y2="18" />
                     <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
               </button>
            </div>
         ))}
      </div>
   );
}
