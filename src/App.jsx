import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header';
import DocumentRedactor from './components/DocumentRedactor';
import Footer from './components/Footer';
import './styles/App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0056D2',
    },
    secondary: {
      main: '#00C2FF',
    },
    background: {
      default: '#f7f9fc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 86, 210, 0.15)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #0056D2 0%, #00C2FF 100%)',
          '&:hover': {
            background: 'linear-gradient(90deg, #004AB8 0%, #00B2E8 100%)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app-container">
        <Header />
        <main>
          <DocumentRedactor />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;
