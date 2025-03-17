/**
 * Loads an image from a File object
 * @param {File} file - Image file
 * @returns {Promise<HTMLImageElement>} Loaded image element
 */
export const loadImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Applies redactions to an image
 * @param {HTMLImageElement} image - Original image
 * @param {Array} redactions - Array of redaction objects with coordinates
 * @returns {Promise<Blob>} Redacted image as Blob
 */
export const applyImageRedactions = (image, redactions, fileType) => {
  return new Promise((resolve) => {
    // Create a canvas to draw the redacted image
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    
    const ctx = canvas.getContext('2d');
    
    // Draw the original image
    ctx.drawImage(image, 0, 0);
    
    // Apply redactions
    ctx.fillStyle = 'black';
    redactions.forEach(redaction => {
      ctx.fillRect(redaction.x, redaction.y, redaction.width, redaction.height);
    });

    // Determine mime type based on file extension
    const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';
    const quality = fileType === 'png' ? undefined : 0.92;
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      resolve(blob);
    }, mimeType, quality);
  });
};

/**
 * Renders an image to a canvas
 * @param {HTMLImageElement} image - Image to render
 * @param {HTMLCanvasElement} canvas - Canvas element to render to
 * @param {number} scale - Scale factor for rendering (optional)
 */
export const renderImageToCanvas = (image, canvas, scale = 1) => {
  const ctx = canvas.getContext('2d');
  
  // Set canvas dimensions
  canvas.width = image.width * scale;
  canvas.height = image.height * scale;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw the image
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  
  return {
    width: canvas.width,
    height: canvas.height
  };
};