import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';

const FileUploader = ({ onFileSelect }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current.click();
  };

  return (
    <Box>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="application/pdf,image/jpeg,image/png,image/gif"
        style={{ display: 'none' }}
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 4,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 500,
            mb: 3,
          }}
        >
          <Paper
            sx={{
              p: 4,
              border: `2px dashed ${isDragging ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.1)'}`,
              borderRadius: 2,
              backgroundColor: isDragging ? 'rgba(0, 86, 210, 0.04)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: 'rgba(0, 86, 210, 0.04)',
              },
            }}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClickUpload}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CloudUploadIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drag & Drop Your Document Here
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                or click to browse files
              </Typography>
              <Button
                variant="contained"
                component="span"
                size="large"
                onClick={handleClickUpload}
                sx={{ mt: 1 }}
              >
                Select File
              </Button>
            </Box>
          </Paper>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'center',
            gap: 3,
            mt: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PictureAsPdfIcon sx={{ color: '#E44D26', mr: 1 }} />
            <Typography variant="body2">PDF Documents</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ImageIcon sx={{ color: '#4CAF50', mr: 1 }} />
            <Typography variant="body2">JPG/PNG Images</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InsertDriveFileIcon sx={{ color: '#2196F3', mr: 1 }} />
            <Typography variant="body2">Client-Side Processing</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FileUploader;