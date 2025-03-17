import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb } from 'pdf-lib';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Renders a PDF page to a canvas
 * @param {Object} page - PDF.js page object
 * @param {HTMLCanvasElement} canvas - Canvas element to render to
 * @param {number} scale - Scale factor for rendering
 * @returns {Promise<Object>} Canvas dimensions and scale
 */
export const renderPage = async (page, canvas, scale = 1.5) => {
  const viewport = page.getViewport({ scale });
  const context = canvas.getContext('2d');
  
  // Get original PDF page dimensions
  const originalWidth = page.view[2]; // width
  const originalHeight = page.view[3]; // height
  
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  
  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };
  
  await page.render(renderContext).promise;
  
  // Calculate scale factors between PDF coordinates and canvas pixels
  const scaleFactorX = canvas.width / originalWidth;
  const scaleFactorY = canvas.height / originalHeight;
  
  return {
    width: viewport.width,
    height: viewport.height,
    originalWidth,
    originalHeight,
    scaleFactorX,
    scaleFactorY
  };
};

/**
 * Checks if a PDF is encrypted/password protected
 * @param {ArrayBuffer} arrayBuffer - PDF data as ArrayBuffer
 * @returns {Promise<boolean>} True if PDF is encrypted
 */
export const isPdfEncrypted = async (arrayBuffer) => {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    
    return new Promise((resolve) => {
      loadingTask.onPassword = (updateCallback, reason) => {
        // If this callback is triggered, the document is password-protected
        resolve(true);
      };
      
      loadingTask.promise.then(() => {
        // Document loaded successfully without password
        resolve(false);
      }).catch(error => {
        // Check if error is related to password protection
        if (error.name === 'PasswordException') {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('Error checking if PDF is encrypted:', error);
    return false;
  }
};

/**
 * Loads a PDF document
 * @param {ArrayBuffer} arrayBuffer - PDF data as ArrayBuffer
 * @param {string} password - Password for encrypted PDFs (optional)
 * @returns {Promise<Object>} PDF.js document
 */
export const loadPdf = async (arrayBuffer, password = null) => {
  const loadingTask = pdfjsLib.getDocument({ 
    data: arrayBuffer,
    password: password
  });
  
  return loadingTask.promise;
};

/**
 * Applies redactions to a PDF document
 * @param {ArrayBuffer} pdfArrayBuffer - Original PDF data
 * @param {Array} redactions - Array of redaction objects with coordinates
 * @param {string} password - Password for encrypted PDFs (optional)
 * @param {boolean} removeEncryption - Whether to remove encryption in output
 * @returns {Promise<Blob>} Redacted PDF as Blob
 */
export const applyRedactions = async (pdfArrayBuffer, redactions, password = null, removeEncryption = true) => {
  try {
    // Load the PDF using pdf-lib
    const pdfLoadOptions = {};
    if (password) {
      pdfLoadOptions.password = password;
    }
    
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer, pdfLoadOptions);
    
    // Group redactions by page
    const redactionsByPage = {};
    redactions.forEach(redaction => {
      if (!redactionsByPage[redaction.pageIndex]) {
        redactionsByPage[redaction.pageIndex] = [];
      }
      redactionsByPage[redaction.pageIndex].push(redaction);
    });
    
    // Apply redactions to each page
    const pages = pdfDoc.getPages();
    
    for (const pageIndexStr in redactionsByPage) {
      const pageIndex = parseInt(pageIndexStr, 10);
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const page = pages[pageIndex];
        const pageRedactions = redactionsByPage[pageIndex];
        
        // Get page dimensions
        const { width, height } = page.getSize();
        
        // Apply each redaction
        pageRedactions.forEach(redaction => {
          // Create a black rectangle for each redaction
          // Convert from canvas coordinates (top-left origin) to PDF coordinates (bottom-left origin)
          // Calculate the position in PDF space based on the original redaction coordinates
          // and the scaling between canvas and PDF
          
          // First convert the canvas pixel coordinates back to PDF user space
          // We use the stored canvas dimensions to determine the correct scaling
          const canvasWidth = redaction.canvasWidth || width; // Fallback to page width if not stored
          const canvasHeight = redaction.canvasHeight || height; // Fallback to page height if not stored
          
          // Calculate the scaling factors between canvas and PDF coordinates
          const xScale = width / canvasWidth;
          const yScale = height / canvasHeight;
          
          // Scale the redaction coordinates to PDF space
          const pdfX = redaction.x * xScale;
          const pdfY = redaction.y * yScale;
          const pdfWidth = redaction.width * xScale;
          const pdfHeight = redaction.height * yScale;
          
          // Draw the redaction rectangle - flip Y since PDF origin is bottom-left
          page.drawRectangle({
            x: pdfX,
            y: height - pdfY - pdfHeight, // Flip Y coordinate (PDF origin is bottom-left)
            width: pdfWidth,
            height: pdfHeight,
            color: rgb(0, 0, 0), // Use PDF-lib's built-in rgb helper
            opacity: 1,
          });
        });
      }
    }
    
    // Serialize the PDF back to a Blob, removing encryption if requested
    const saveOptions = {};
    if (removeEncryption) {
      // Remove any encryption from the output file
      saveOptions.userPassword = undefined;
      saveOptions.ownerPassword = undefined;
    }
    
    const pdfBytes = await pdfDoc.save(saveOptions);
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error in applyRedactions:', error);
    throw new Error(`Failed to apply redactions: ${error.message}`);
  }
};