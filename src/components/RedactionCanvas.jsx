import React, { useState, useEffect, useRef } from 'react';
import { Box, useTheme } from '@mui/material';

const RedactionCanvas = ({ canvasRef, onAddRedaction, redactionMode }) => {
  const theme = useTheme();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const selectionRef = useRef(null);
  // Track the canvas size and scale for accurate redaction coordinates
  const canvasDimensionsRef = useRef({
    displayWidth: 0,
    displayHeight: 0,
    actualWidth: 0,
    actualHeight: 0,
    scaleX: 1,
    scaleY: 1
  });

  // Update canvas dimensions reference whenever canvas size changes
  useEffect(() => {
    const updateCanvasDimensions = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Get display dimensions (how it's rendered in the browser)
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      
      // Get actual canvas dimensions (the internal canvas dimensions)
      const actualWidth = canvas.width;
      const actualHeight = canvas.height;
      
      // Calculate scale factors
      const scaleX = actualWidth / displayWidth;
      const scaleY = actualHeight / displayHeight;
      
      canvasDimensionsRef.current = {
        displayWidth,
        displayHeight,
        actualWidth,
        actualHeight,
        scaleX,
        scaleY
      };
    };
    
    // Call immediately
    updateCanvasDimensions();
    
    // Also set up a resize observer to detect when the canvas size changes
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasDimensions();
    });
    
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }
    
    return () => {
      if (canvasRef.current) {
        resizeObserver.unobserve(canvasRef.current);
      }
    };
  }, [canvasRef]);

  // Track mouse movement and draw selection rectangle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const selection = selectionRef.current;
    
    const handleMouseDown = (e) => {
      if (e.button !== 0) return; // Only left mouse button
      
      const rect = canvas.getBoundingClientRect();
      setStartX(e.clientX - rect.left);
      setStartY(e.clientY - rect.top);
      
      setIsDrawing(true);
      
      // Show selection rectangle
      if (selection) {
        selection.style.display = 'block';
        selection.style.left = `${startX}px`;
        selection.style.top = `${startY}px`;
        selection.style.width = '0';
        selection.style.height = '0';
      }
    };
    
    const handleMouseMove = (e) => {
      if (!isDrawing) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate rectangle dimensions
      const width = x - startX;
      const height = y - startY;
      
      // Update selection rectangle position and dimensions
      if (selection) {
        if (width < 0) {
          selection.style.left = `${x}px`;
          selection.style.width = `${Math.abs(width)}px`;
        } else {
          selection.style.left = `${startX}px`;
          selection.style.width = `${width}px`;
        }
        
        if (height < 0) {
          selection.style.top = `${y}px`;
          selection.style.height = `${Math.abs(height)}px`;
        } else {
          selection.style.top = `${startY}px`;
          selection.style.height = `${height}px`;
        }
      }
    };
    
    const handleMouseUp = (e) => {
      if (!isDrawing) return;
      
      const rect = canvas.getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;
      
      // Calculate redaction dimensions in display coordinates
      let redactionX = startX;
      let redactionY = startY;
      let redactionWidth = endX - startX;
      let redactionHeight = endY - startY;
      
      // Handle negative dimensions (user dragged from right to left or bottom to top)
      if (redactionWidth < 0) {
        redactionX = endX;
        redactionWidth = Math.abs(redactionWidth);
      }
      
      if (redactionHeight < 0) {
        redactionY = endY;
        redactionHeight = Math.abs(redactionHeight);
      }
      
      // Minimum size threshold to avoid accidental clicks
      if (redactionWidth > 5 && redactionHeight > 5) {
        // Convert display coordinates to actual canvas coordinates for accurate redaction
        const { scaleX, scaleY } = canvasDimensionsRef.current;
        onAddRedaction({
          x: redactionX * scaleX,
          y: redactionY * scaleY,
          width: redactionWidth * scaleX,
          height: redactionHeight * scaleY,
        });
      }
      
      setIsDrawing(false);
      
      // Hide selection rectangle
      if (selection) {
        selection.style.display = 'none';
      }
    };
    
    const handleMouseLeave = () => {
      if (isDrawing) {
        setIsDrawing(false);
        if (selection) {
          selection.style.display = 'none';
        }
      }
    };
    
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    // Touch events for mobile
    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      setStartX(touch.clientX - rect.left);
      setStartY(touch.clientY - rect.top);
      
      setIsDrawing(true);
      
      if (selection) {
        selection.style.display = 'block';
        selection.style.left = `${startX}px`;
        selection.style.top = `${startY}px`;
        selection.style.width = '0';
        selection.style.height = '0';
      }
    };
    
    const handleTouchMove = (e) => {
      if (!isDrawing || e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Calculate rectangle dimensions
      const width = x - startX;
      const height = y - startY;
      
      // Update selection rectangle position and dimensions
      if (selection) {
        if (width < 0) {
          selection.style.left = `${x}px`;
          selection.style.width = `${Math.abs(width)}px`;
        } else {
          selection.style.left = `${startX}px`;
          selection.style.width = `${width}px`;
        }
        
        if (height < 0) {
          selection.style.top = `${y}px`;
          selection.style.height = `${Math.abs(height)}px`;
        } else {
          selection.style.top = `${startY}px`;
          selection.style.height = `${height}px`;
        }
      }
      
      // Prevent scrolling while drawing
      e.preventDefault();
    };
    
    const handleTouchEnd = (e) => {
      if (!isDrawing) return;
      
      const rect = canvas.getBoundingClientRect();
      let endX, endY;
      
      if (e.changedTouches && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        endX = touch.clientX - rect.left;
        endY = touch.clientY - rect.top;
      } else {
        // Fallback if changedTouches not available
        endX = startX + 10; // Add small offset
        endY = startY + 10;
      }
      
      // Calculate redaction dimensions in display coordinates
      let redactionX = startX;
      let redactionY = startY;
      let redactionWidth = endX - startX;
      let redactionHeight = endY - startY;
      
      // Handle negative dimensions
      if (redactionWidth < 0) {
        redactionX = endX;
        redactionWidth = Math.abs(redactionWidth);
      }
      
      if (redactionHeight < 0) {
        redactionY = endY;
        redactionHeight = Math.abs(redactionHeight);
      }
      
      // Minimum size threshold to avoid accidental taps
      if (redactionWidth > 5 && redactionHeight > 5) {
        // Convert display coordinates to actual canvas coordinates for accurate redaction
        const { scaleX, scaleY } = canvasDimensionsRef.current;
        onAddRedaction({
          x: redactionX * scaleX,
          y: redactionY * scaleY,
          width: redactionWidth * scaleX,
          height: redactionHeight * scaleY,
        });
      }
      
      setIsDrawing(false);
      
      if (selection) {
        selection.style.display = 'none';
      }
    };
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDrawing, startX, startY, canvasRef, onAddRedaction]);

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
      <Box
        ref={selectionRef}
        sx={{
          display: 'none',
          position: 'absolute',
          border: `2px dashed ${theme.palette.primary.main}`,
          backgroundColor: 'rgba(0, 86, 210, 0.2)',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};

export default RedactionCanvas;