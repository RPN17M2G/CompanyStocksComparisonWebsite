import { useState, useCallback } from 'react'; 
import {
Button,
TextField,
Theme, 
} from '@mui/material';
import { GlassDialog } from '../../shared/ui/GlassDialog';
import React from 'react';

interface AddCompanyDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (ticker: string) => void;
}

export function AddCompanyDialog({ open, onClose, onAdd }: AddCompanyDialogProps) {
  const [ticker, setTicker] = useState('');

  const handleClose = useCallback(() => {
    setTicker('');
    onClose();
  }, [onClose]); 

  const handleAdd = useCallback(() => {
    const trimmedTicker = ticker.trim();
    if (!trimmedTicker) return;

    onAdd(trimmedTicker.toUpperCase());
    handleClose(); 
  }, [ticker, onAdd, handleClose]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  }, [handleAdd]); 

  return (
    <GlassDialog
      open={open}
      onClose={handleClose}
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
          '& .MuiOutlinedInput-root': {
            backgroundColor: (theme: Theme) =>
              theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.4)',
            borderRadius: 2,
         },
          '& .MuiInputLabel-root': {
            color: (theme: Theme) => theme.palette.text.secondary,
          }
        }}
      />
    </GlassDialog>
  );
}
