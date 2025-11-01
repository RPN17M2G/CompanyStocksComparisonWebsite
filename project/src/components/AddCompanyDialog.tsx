import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { GlassDialog } from './GlassDialog';

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

  return (
    <GlassDialog open={open} onClose={onClose} title="Add Company" maxWidth="xs" fullWidth
      actions={
        <>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAdd} variant="contained" disabled={!ticker.trim()}>
          Add
        </Button> </>
        }>
        <TextField
          autoFocus
          fullWidth
          label="Stock Ticker"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g., AAPL"
          sx={{ mt: 2 }}
        />
    </GlassDialog>
  );
}
