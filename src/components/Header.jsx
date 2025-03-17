import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, useMediaQuery, useTheme } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
      <Toolbar sx={{ justifyContent: 'space-between', py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="h4"
            component="div"
            sx={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: 'bold',
              color: theme.palette.primary.main,
              '& span': {
                background: 'linear-gradient(90deg, #0056D2 0%, #00C2FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }
            }}
          >
            <LockIcon sx={{ mr: 1 }} />
            <span>TeleNext</span> 
            <Box component="span" sx={{ ml: 1, color: theme.palette.text.primary, WebkitTextFillColor: 'initial' }}>
              Redact
            </Box>
          </Typography>
        </Box>

        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              Powered by TeleNext Systems
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              href="https://www.telenextsystems.com" 
              target="_blank"
              rel="noopener noreferrer"
              size="small"
            >
              Visit Website
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
