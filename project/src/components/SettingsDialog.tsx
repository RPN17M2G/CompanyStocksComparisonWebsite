import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { DataProviderConfig } from '../types';
import { availableAdapters } from '../adapters';

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
    if (config) {
      setProvider(config.provider);
      setApiKey(config.apiKey);
    }
  }, [config]);

  const handleSave = () => {
    if (!provider || !apiKey.trim()) return;

    onSave({
      provider,
      apiKey: apiKey.trim(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Box mt={2}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Configure your data provider and API key. Your API key is stored securely in your
            browser's local storage and never sent to any server except the selected data provider.
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
                Free Alpha Vantage API keys have a rate limit of 5 requests per minute and 500
                requests per day.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!provider || !apiKey.trim()}
        >
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
}
