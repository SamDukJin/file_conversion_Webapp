/**
 * File reading utilities using FileReader API
 */

/**
 * Read file as DataURL (for images)
 */
export function readAsDataURL(file: File): Promise<string> {
   return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
   });
}

/**
 * Read file as ArrayBuffer (for binary files like DOCX)
 */
export function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
   return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsArrayBuffer(file);
   });
}

/**
 * Read file as text (for text/HTML/Markdown)
 */
export function readAsText(file: File): Promise<string> {
   return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsText(file);
   });
}

/**
 * Load image from DataURL and return Image element
 */
export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
   return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
   });
}

/**
 * Create object URL from blob (remember to revoke when done)
 */
export function createObjectURL(blob: Blob): string {
   return URL.createObjectURL(blob);
}

/**
 * Revoke object URL to free memory
 */
export function revokeObjectURL(url: string): void {
   URL.revokeObjectURL(url);
}
