import type { ConversionOptions } from '../types';
import './ConversionPanel.css';

interface ConversionPanelProps {
   fileCount: number;
   suggestion: string;
   options: ConversionOptions;
   onOptionsChange: (options: ConversionOptions) => void;
   onConvert: () => void;
   onClear: () => void;
   isConverting: boolean;
   progress: number;
}

export function ConversionPanel({
   fileCount,
   suggestion,
   options,
   onOptionsChange,
   onConvert,
   onClear,
   isConverting,
   progress,
}: ConversionPanelProps) {
   if (fileCount === 0) {
      return null;
   }

   return (
      <div className="conversion-panel">
         {/* Suggestion */}
         <div className="conversion-panel__suggestion">
            <span className="conversion-panel__icon">💡</span>
            <span>{suggestion}</span>
         </div>

         {/* Options */}
         <div className="conversion-panel__options">
            <div className="option-group">
               <label htmlFor="page-size" className="option-label">Page Size</label>
               <select
                  id="page-size"
                  className="option-select"
                  value={options.pageSize}
                  onChange={(e) => onOptionsChange({ ...options, pageSize: e.target.value as 'A4' | 'letter' | 'fit' })}
                  disabled={isConverting}
               >
                  <option value="A4">A4</option>
                  <option value="letter">Letter</option>
                  <option value="fit">Fit to Content</option>
               </select>
            </div>

            <div className="option-group">
               <label htmlFor="quality" className="option-label">Quality</label>
               <select
                  id="quality"
                  className="option-select"
                  value={options.quality}
                  onChange={(e) => onOptionsChange({ ...options, quality: parseFloat(e.target.value) })}
                  disabled={isConverting}
               >
                  <option value="0.6">Low (smaller file)</option>
                  <option value="0.8">Medium</option>
                  <option value="0.9">High</option>
                  <option value="1">Maximum</option>
               </select>
            </div>

            <div className="option-group">
               <label htmlFor="margin" className="option-label">Margin</label>
               <select
                  id="margin"
                  className="option-select"
                  value={options.margin}
                  onChange={(e) => onOptionsChange({ ...options, margin: parseInt(e.target.value) })}
                  disabled={isConverting}
               >
                  <option value="0">None</option>
                  <option value="5">Small (5mm)</option>
                  <option value="10">Medium (10mm)</option>
                  <option value="20">Large (20mm)</option>
               </select>
            </div>
         </div>

         {/* Progress bar */}
         {isConverting && (
            <div className="conversion-panel__progress">
               <div className="progress-bar">
                  <div
                     className="progress-bar__fill"
                     style={{ width: `${progress}%` }}
                     role="progressbar"
                     aria-valuenow={progress}
                     aria-valuemin={0}
                     aria-valuemax={100}
                  />
               </div>
               <span className="progress-bar__text">{Math.round(progress)}%</span>
            </div>
         )}

         {/* Actions */}
         <div className="conversion-panel__actions">
            <button
               type="button"
               className="btn btn--secondary"
               onClick={onClear}
               disabled={isConverting}
            >
               Clear All
            </button>
            <button
               type="button"
               className="btn btn--primary"
               onClick={onConvert}
               disabled={isConverting}
            >
               {isConverting ? (
                  <>
                     <span className="btn__spinner" />
                     Converting...
                  </>
               ) : (
                  <>
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                     </svg>
                     Convert to PDF
                  </>
               )}
            </button>
         </div>
      </div>
   );
}
