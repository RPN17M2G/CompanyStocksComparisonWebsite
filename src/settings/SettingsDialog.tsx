import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Alert,
  Theme,
} from '@mui/material';
import { DataProviderConfig } from '../shared/types/types';
import { availableAdapters } from '../adapters/AdapterManager';
import { GlassDialog } from '../shared/ui/GlassDialog';

interface SettingsDialogProps {
  open: boolean;
  config: DataProviderConfig | null;
  onClose: () => void;
  onSave: (config: DataProviderConfig) => void;
}

export function SettingsDialog({ open, config, onClose, onSave }: SettingsDialogProps) {
  const [provider, setProvider] = useState(config?.provider || '');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');

  useEffect(() => {
    // This effect correctly resets the form state when the dialog is opened
    if (open) {
      setProvider(config?.provider || '');
      setApiKey(config?.apiKey || '');
    }
  }, [config, open]);

  const handleSave = useCallback(() => {
    if (!provider || !apiKey.trim()) return;

    onSave({
      provider,
      apiKey: apiKey.trim(),
    });
    onClose();
  }, [provider, apiKey, onSave, onClose]);
  
  const handleClose = useCallback(() => {
    // Don't need to manually reset state here, the useEffect on 'open' handles it.
    onClose();
  }, [onClose]);

  return (
    <GlassDialog
      open={open}
      onClose={handleClose}
      title="Settings"
      maxWidth="sm"
      fullWidth
      actions={
        <>
          <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!provider || !apiKey.trim()}
            sx={{ borderRadius: 2 }}
          >
            Save Settings
          </Button>
        </>
      }
    >
      <Alert
        severity="info"
        sx={{
          mb: 3,
          borderRadius: 3,
          backgroundColor: (theme: Theme) => 
            theme.palette.mode === 'dark' ? 'rgba(3, 155, 229, 0.1)' : 'rgba(3, 155, 229, 0.1)',
          backdropFilter: 'blur(5px)',
          border: '1px solid',
          borderColor: (theme: Theme) => 
            theme.palette.mode === 'dark' ? 'rgba(3, 155, 229, 0.3)' : 'rgba(3, 155, 229, 0.4)',
          color: 'info.main',
        }}
      >
        Configure your data provider and API key. Your API key is stored securely in
        your browser's local storage and never sent to any server except the
        selected data provider.
      </Alert>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Data Provider</InputLabel>
        <Select
          value={provider}
          label="Data Provider"
          onChange={(e) => setProvider(e.target.value)}
        >
          {availableAdapters.map(adapter => (
            <MenuItem key={adapter.name} value={adapter.name}>
              {adapter.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="API Key"
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter your API key"
        helperText={
          provider === 'Alpha Vantage'
            ? 'Get your free API key at alphavantage.co'
            : 'Enter your API key for the selected provider'
        }
      />

      {provider === 'Alpha Vantage' && (
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Free Alpha Vantage API keys have a rate limit of 5 requests per minute
            and 500 requests per day.
          </Typography>
        </Box>
      )}
    </GlassDialog>
  );
}
