import { useTheme, useFileConverter } from './hooks';
import { DropZone, FileList, ConversionPanel, PdfPreview, ThemeToggle } from './components';
import './index.css';

function App() {
   const { theme, toggleTheme } = useTheme();
   const {
      files,
      isConverting,
      overallProgress,
      result,
      error,
      options,
      setOptions,
      addFiles,
      removeFile,
      clearFiles,
      convert,
      download,
      getSuggestion,
   } = useFileConverter();

   const handleReset = () => {
      clearFiles();
   };

   return (
      <div className="app">
         {/* Header */}
         <header className="app__header">
            <div className="app__logo">
               <div className="app__logo-icon" aria-hidden="true">F</div>
               <h1 className="app__title">File Converter</h1>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
         </header>

         {/* Main Content */}
         <main className="app__main">
            {/* Hero Section */}
            <section className="hero">
               <h2 className="hero__title">
                  Convert Files to <span className="hero__gradient">PDF</span>
               </h2>
               <p className="hero__subtitle">
                  100% client-side conversion. Your files never leave your browser.
               </p>

               {/* Features */}
               <div className="features">
                  <span className="feature-badge">
                     <span className="feature-badge__icon" aria-hidden="true">🔒</span>
                     Private & Secure
                  </span>
                  <span className="feature-badge">
                     <span className="feature-badge__icon" aria-hidden="true">⚡</span>
                     Fast Conversion
                  </span>
                  <span className="feature-badge">
                     <span className="feature-badge__icon" aria-hidden="true">📱</span>
                     Works Offline
                  </span>
               </div>
            </section>

            {/* Conversion UI */}
            {result ? (
               /* Show preview when conversion is complete */
               <PdfPreview
                  blob={result.blob}
                  filename={result.filename}
                  pageCount={result.pageCount}
                  onDownload={download}
                  onReset={handleReset}
               />
            ) : (
               /* Show upload interface */
               <>
                  <DropZone
                     onFilesAdded={addFiles}
                     disabled={isConverting}
                  />

                  {/* Error Message */}
                  {error && (
                     <div className="error" role="alert">
                        <span className="error__icon" aria-hidden="true">⚠️</span>
                        <p className="error__message">{error}</p>
                     </div>
                  )}

                  {/* File List */}
                  <FileList
                     files={files}
                     onRemove={removeFile}
                     disabled={isConverting}
                  />

                  {/* Conversion Panel */}
                  <ConversionPanel
                     fileCount={files.length}
                     suggestion={getSuggestion()}
                     options={options}
                     onOptionsChange={setOptions}
                     onConvert={convert}
                     onClear={clearFiles}
                     isConverting={isConverting}
                     progress={overallProgress}
                  />
               </>
            )}
         </main>

         {/* Footer */}
         <footer className="app__footer">
            <p className="app__footer-text">
               Built with <span className="app__footer-highlight">❤️</span> for privacy.
               No data ever leaves your browser.
            </p>
         </footer>
      </div>
   );
}

export default App;
