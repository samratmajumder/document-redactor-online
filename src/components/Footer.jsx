import React from 'react';
import { Box, Container, Typography, Link, useTheme } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';

const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box component="footer" sx={{ py: 3, bgcolor: 'background.paper', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'center', md: 'flex-start' }, textAlign: { xs: 'center', md: 'left' } }}>
          <Box sx={{ mb: { xs: 2, md: 0 } }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mr: 1 }}>
                <SecurityIcon color="primary" fontSize="small" sx={{ mr: 0.5 }} />
                Client-Side Security
              </Box>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              All document processing happens in your browser.
              <br />
              Your documents never leave your device.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              &copy; {currentYear} TeleNext Systems Pvt. Ltd.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <Link href="https://www.telenextsystems.com" target="_blank" color="inherit" underline="hover" sx={{ mr: 2 }}>
                Website
              </Link>
              <Link href="https://www.telenextsystems.com/privacy" target="_blank" color="inherit" underline="hover" sx={{ mr: 2 }}>
                Privacy
              </Link>
              <Link href="https://www.telenextsystems.com/terms" target="_blank" color="inherit" underline="hover">
                Terms
              </Link>
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
