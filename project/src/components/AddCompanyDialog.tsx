import { useState } from 'react';
import {
  Button,
  TextField,
} from '@mui/material';
import { GlassDialog } from './GlassDialog';
import React from 'react'; // Added import

interface AddCompanyDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (ticker: string) => void;
}

export function AddCompanyDialog({ open, onClose, onAdd }: AddCompanyDialogProps) {
  const [ticker, setTicker] = useState('');

  const handleAdd = () => {
    if (!ticker.trim()) return;
    onAdd(ticker.trim().toUpperCase());
    setTicker('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  // Close and reset local state
  const handleClose = () => {
    setTicker('');
    onClose();
  };

  return (
    <GlassDialog
      open={open}
      onClose={handleClose} // Use handleClose to reset state
      title="Add Company"
      maxWidth="xs"
      fullWidth
      actions={
        <>
          <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained" disabled={!ticker.trim()} sx={{ borderRadius: 2 }}>
            Add
          </Button>
        </>
      }
    >
      <TextField
        autoFocus
        fullWidth
        label="Stock Ticker"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="e.g., AAPL"
        sx={{
          // Apply the "poppy" form field style for readability
          '& .MuiOutlinedInput-root': {
            backgroundColor: (theme: any) =>
              theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.4)',
            borderRadius: 2,
          },
          '& .MuiInputLabel-root': {
            color: (theme: any) => theme.palette.text.secondary,
          }
        }}
      />
    </GlassDialog>
  );
}
