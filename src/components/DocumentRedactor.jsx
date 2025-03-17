import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Stack,
  Snackbar,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import UndoIcon from '@mui/icons-material/Undo';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import ImageIcon from '@mui/icons-material/Image';
import LockIcon from '@mui/icons-material/Lock';
import FileUploader from './FileUploader';
import RedactionCanvas from './RedactionCanvas';
import PasswordDialog from './PasswordDialog';
import { loadPdf, renderPage, applyRedactions, isPdfEncrypted } from '../utils/pdfUtils';
import { loadImage, applyImageRedactions, renderImageToCanvas } from '../utils/imageUtils';

const DocumentRedactor = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [fileType, setFileType] = useState(null); // 'pdf', 'image', null
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [redactions, setRedactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [image, setImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedacted, setIsRedacted] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [redactionMode, setRedactionMode] = useState(0); // 0: Rectangle, 1: Text Detection (future feature)
  
  // Password protection states
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isPasswordRetry, setIsPasswordRetry] = useState(false);
  const [pdfPassword, setPdfPassword] = useState(null);
  const [removeEncryption, setRemoveEncryption] = useState(true);
  
  const canvasRef = useRef(null);
  const fileData = useRef(null);

  // Handle file selection
  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;
    
    try {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setErrorMessage('');
      setRedactions([]);
      setCurrentPage(1);
      setIsRedacted(false);
      setIsPasswordProtected(false);
      setPdfPassword(null);
      
      // Store the file itself (not the arrayBuffer) for later use
      fileData.current = selectedFile;
      
      const fileExt = selectedFile.name.split('.').pop().toLowerCase();
      
      if (['pdf'].includes(fileExt)) {
        setFileType('pdf');
        
        // For PDF handling, we'll use the file directly each time
        // rather than reusing an ArrayBuffer that might get detached
        
        // Check if the PDF is encrypted - read a copy of the file
        const fileForEncryptionCheck = await selectedFile.slice(0).arrayBuffer();
        const encrypted = await isPdfEncrypted(fileForEncryptionCheck);
        
        if (encrypted) {
          setIsPasswordProtected(true);
          setShowPasswordDialog(true);
          return;
        }
        
        // Load and render the non-encrypted PDF with a fresh copy
        await loadAndRenderPdf();
      } 
      else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
        setFileType('image');
        setTotalPages(1);
        
        const img = await loadImage(selectedFile);
        setImage(img);
        
        // Render image
        renderImageToCanvas(img, canvasRef.current);
      } 
      else {
        setErrorMessage('Unsupported file type. Please upload a PDF or image file (JPG, PNG, GIF).');
        setFile(null);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setErrorMessage('Failed to process the file. Please try again with a different file.');
      setFile(null);
    }
  };
  
  // Load and render PDF with optional password
  const loadAndRenderPdf = async (password = null) => {
    try {
      // Create a fresh ArrayBuffer from the file each time to avoid detachment issues
      const freshArrayBuffer = await fileData.current.slice(0).arrayBuffer();
      
      const pdfDoc = await loadPdf(freshArrayBuffer, password);
      setPdfDocument(pdfDoc);
      setTotalPages(pdfDoc.numPages);
      
      // Render first page
      const page = await pdfDoc.getPage(1);
      await renderPage(page, canvasRef.current);
      
      if (password) {
        setPdfPassword(password);
      }
      
      return true;
    } catch (error) {
      console.error('Error loading PDF:', error);
      
      // Check if error is password-related
      if (error.name === 'PasswordException' || error.message.includes('password')) {
        return false;
      }
      
      setErrorMessage('Failed to load the PDF file. The file may be corrupted or in an unsupported format.');
      setFile(null);
      return false;
    }
  };
  
  // Handle password submission
  const handlePasswordSubmit = async (password, removePasswordOption) => {
    try {
      setRemoveEncryption(removePasswordOption);
      
      // Use the updated loadAndRenderPdf function that creates its own fresh ArrayBuffer
      const success = await loadAndRenderPdf(password);
      
      if (success) {
        setShowPasswordDialog(false);
        setIsPasswordRetry(false);
      } else {
        setIsPasswordRetry(true);
      }
    } catch (error) {
      console.error('Error with password:', error);
      setIsPasswordRetry(true);
    }
  };

  // Handle page navigation
  const handlePageChange = async (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    
    try {
      setCurrentPage(newPage);
      
      if (fileType === 'pdf' && pdfDocument) {
        // Get the page from the existing PDF document
        // pdfDocument should have been loaded with the correct password already
        const page = await pdfDocument.getPage(newPage);
        await renderPage(page, canvasRef.current);
      }
    } catch (error) {
      console.error('Error changing page:', error);
      setErrorMessage('Failed to render page. Please try again.');
    }
  };

  // Add redaction
  const addRedaction = (newRedaction) => {
    // Store page dimensions and scale factors to ensure proper mapping to PDF coordinates
    const redactionData = {
      ...newRedaction,
      pageIndex: currentPage - 1,
      // Store canvas dimensions at the time of redaction for accurate scaling
      canvasWidth: canvasRef.current?.width || 0,
      canvasHeight: canvasRef.current?.height || 0,
    };
    
    setRedactions([...redactions, redactionData]);
  };

  // Undo last redaction
  const undoLastRedaction = () => {
    const currentPageRedactions = redactions.filter(r => r.pageIndex === currentPage - 1);
    if (currentPageRedactions.length > 0) {
      const newRedactions = [...redactions];
      const lastIndex = newRedactions.findLastIndex(r => r.pageIndex === currentPage - 1);
      if (lastIndex !== -1) {
        newRedactions.splice(lastIndex, 1);
        setRedactions(newRedactions);
        setShowSnackbar(true);
        setSnackbarMessage('Last redaction removed');
      }
    }
  };

  // Apply redactions and download
  const handleApplyRedactions = async () => {
    if (redactions.length === 0) {
      setShowSnackbar(true);
      setSnackbarMessage('No redactions to apply');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      let redactedBlob;
      
      if (fileType === 'pdf') {
        // Create a fresh ArrayBuffer copy for redaction
        const freshArrayBuffer = await fileData.current.arrayBuffer();
        
        // Apply redactions, using password if document is protected
        redactedBlob = await applyRedactions(
          freshArrayBuffer, 
          redactions, 
          isPasswordProtected ? pdfPassword : null,
          removeEncryption
        );
        
        // If it was password protected and encryption was removed, update message
        if (isPasswordProtected && removeEncryption) {
          setSnackbarMessage('Document successfully redacted, decrypted, and downloaded');
        }
      } else if (fileType === 'image') {
        const fileExt = fileName.split('.').pop().toLowerCase();
        redactedBlob = await applyImageRedactions(image, redactions.filter(r => r.pageIndex === 0), fileExt);
      }
      
      // Create download link
      const downloadUrl = URL.createObjectURL(redactedBlob);
      const downloadLink = document.createElement('a');
      
      const fileNameParts = fileName.split('.');
      const extension = fileNameParts.pop();
      const baseName = fileNameParts.join('.');
      
      downloadLink.href = downloadUrl;
      downloadLink.download = `${baseName}_redacted.${extension}`;
      downloadLink.click();
      
      URL.revokeObjectURL(downloadUrl);
      setIsRedacted(true);
      setShowSnackbar(true);
      if (!snackbarMessage) {
        setSnackbarMessage('Document successfully redacted and downloaded');
      }
    } catch (error) {
      console.error('Error applying redactions:', error);
      
      // Check for password-related errors
      if (error.message.includes('password') || error.name === 'PasswordException') {
        setErrorMessage('Failed to apply redactions. The password may be incorrect.');
      } else {
        setErrorMessage('Failed to apply redactions. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear the document and redactions
  const handleClear = () => {
    setFile(null);
    setFileName('');
    setFileType(null);
    setPdfDocument(null);
    setImage(null);
    setRedactions([]);
    setCurrentPage(1);
    setTotalPages(1);
    setIsRedacted(false);
    fileData.current = null;
    
    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Render current page with existing redactions
  const renderCurrentPageWithRedactions = async () => {
    if (!file) return;
    
    try {
      let dimensions;
      
      if (fileType === 'pdf' && pdfDocument) {
        const page = await pdfDocument.getPage(currentPage);
        dimensions = await renderPage(page, canvasRef.current);
      } else if (fileType === 'image' && image) {
        dimensions = renderImageToCanvas(image, canvasRef.current);
      }
      
      // Draw existing redactions for current page
      if (dimensions && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pageRedactions = redactions.filter(
          (redaction) => redaction.pageIndex === currentPage - 1
        );
        
        // Get the current canvas display vs actual dimensions for scaling
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        const actualWidth = canvas.width;
        const actualHeight = canvas.height;
        
        // Calculate scale factors for displaying redactions correctly
        const scaleX = displayWidth / actualWidth;
        const scaleY = displayHeight / actualHeight;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        pageRedactions.forEach((redaction) => {
          // Draw the redaction directly - the coordinates are already in canvas space
          // because we handled the scaling when the redaction was created
          ctx.fillRect(redaction.x, redaction.y, redaction.width, redaction.height);
        });
      }
    } catch (error) {
      console.error('Error rendering page with redactions:', error);
    }
  };

  // Re-render page when redactions change
  useEffect(() => {
    renderCurrentPageWithRedactions();
  }, [redactions, currentPage]);

  return (
    <Box sx={{ mb: 4 }} className="fade-in">
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Document Redaction Tool
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          Securely redact sensitive information from your documents and images. 
          All processing happens in your browser - your files never leave your device.
        </Typography>
      </Box>

      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: 3, 
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        {!file ? (
          <FileUploader onFileSelect={handleFileSelect} />
        ) : (
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 } }}>
                <IconButton 
                  size="small" 
                  onClick={handleClear}
                  aria-label="Clear document"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
                <Typography 
                  variant="subtitle1" 
                  sx={{ ml: 1, fontWeight: 'medium', display: 'flex', alignItems: 'center' }}
                >
                  {fileType === 'pdf' ? <TextSnippetIcon sx={{ mr: 0.5, fontSize: 20 }} /> : <ImageIcon sx={{ mr: 0.5, fontSize: 20 }} />}
                  {fileName}
                </Typography>
              </Box>
              
              <Box>
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, mb: { xs: 1, sm: 0 } }}>
                    <Button 
                      size="small" 
                      onClick={() => handlePageChange(currentPage - 1)} 
                      disabled={currentPage === 1}
                    >
                      Prev
                    </Button>
                    <Typography variant="body2" sx={{ mx: 1 }}>
                      {currentPage} / {totalPages}
                    </Typography>
                    <Button 
                      size="small" 
                      onClick={() => handlePageChange(currentPage + 1)} 
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              mb: 2,
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 1
            }}>
              <Tabs 
                value={redactionMode} 
                onChange={(e, newValue) => setRedactionMode(newValue)}
                aria-label="redaction mode tabs"
                sx={{
                  '.MuiTabs-indicator': {
                    backgroundColor: theme.palette.primary.main
                  }
                }}
              >
                <Tab 
                  label="Rectangle" 
                  icon={<LockIcon fontSize="small" />} 
                  iconPosition="start"
                  sx={{ minHeight: 40, py: 0.5 }}
                />
              </Tabs>
              
              <Stack direction="row" spacing={1}>
                <Tooltip title="Undo last redaction">
                  <span>
                    <Button 
                      startIcon={<UndoIcon />} 
                      onClick={undoLastRedaction} 
                      disabled={redactions.filter(r => r.pageIndex === currentPage - 1).length === 0}
                      size="small"
                      variant="outlined"
                    >
                      Undo
                    </Button>
                  </span>
                </Tooltip>
                
                <Button 
                  startIcon={<DownloadIcon />} 
                  onClick={handleApplyRedactions} 
                  disabled={redactions.length === 0 || isProcessing}
                  variant="contained" 
                  color="primary"
                  size="small"
                >
                  {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Apply & Download'}
                </Button>
              </Stack>
            </Box>
            
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'center',
              overflow: 'auto',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: 1,
              width: '100%',
              backgroundColor: '#f5f5f5',
              p: 2
            }}>
              <RedactionCanvas 
                canvasRef={canvasRef} 
                onAddRedaction={addRedaction} 
                redactionMode={redactionMode}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
              Click and drag on the document to create redaction areas. Use the controls above to undo redactions or download the redacted document.
            </Typography>
          </Box>
        )}
        
        {errorMessage && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}
      </Paper>
      
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        <Typography variant="h6" gutterBottom>
          How It Works
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 2, 
          alignItems: 'stretch',
          mt: 2
        }}>
          <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <UploadFileIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Upload
              </Typography>
            </Box>
            <Typography variant="body2">
              Upload your PDF document or image (JPG, PNG). Files are processed entirely in your browser.
            </Typography>
          </Paper>
          
          <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LockIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Redact
              </Typography>
            </Box>
            <Typography variant="body2">
              Draw rectangles over sensitive information that you want to permanently remove from the document.
            </Typography>
          </Paper>
          
          <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <DownloadIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Download
              </Typography>
            </Box>
            <Typography variant="body2">
              Download your redacted document with the sensitive information permanently removed, not just visually covered.
            </Typography>
          </Paper>
        </Box>
      </Paper>
      
      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={() => {
          setShowSnackbar(false);
          setSnackbarMessage('');
        }}
        message={snackbarMessage}
      />
      
      {/* Password dialog for encrypted PDFs */}
      <PasswordDialog 
        open={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          if (!pdfPassword) {
            // If user cancels without providing a password, reset everything
            handleClear();
          }
        }}
        onSubmit={handlePasswordSubmit}
        isRetry={isPasswordRetry}
      />
    </Box>
  );
};

export default DocumentRedactor;