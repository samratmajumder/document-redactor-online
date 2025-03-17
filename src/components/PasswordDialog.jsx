import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Alert
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import NoEncryptionIcon from '@mui/icons-material/NoEncryption';

const PasswordDialog = ({ open, onClose, onSubmit, isRetry = false }) => {
  const [password, setPassword] = useState('');
  const [removePassword, setRemovePassword] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    onSubmit(password, removePassword);
    setPassword('');
  };

  const handleCancel = () => {
    onClose();
    setPassword('');
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      aria-labelledby="password-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="password-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
        <LockIcon sx={{ mr: 1, color: 'primary.main' }} />
        <span>Password Protected PDF</span>
      </DialogTitle>
      <DialogContent>
        {isRetry && (
          <Alert severity="error" sx={{ mb: 2 }}>
            The password you entered is incorrect. Please try again.
          </Alert>
        )}
        <DialogContentText>
          This PDF document is password protected. Please enter the password to decrypt it.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          fullWidth
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mt: 2 }}
        />
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={showPassword} 
                onChange={(e) => setShowPassword(e.target.checked)}
                size="small"
              />
            }
            label="Show password"
          />
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <NoEncryptionIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={removePassword} 
                  onChange={(e) => setRemovePassword(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2">
                  Remove password protection from the redacted document
                </Typography>
              }
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={password.trim() === ''}
        >
          Decrypt Document
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordDialog;