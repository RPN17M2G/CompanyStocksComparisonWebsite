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
  IconButton,
  Chip,
} from '@mui/material';
import { Plus, X } from 'lucide-react';
import { DataProviderConfig } from '../shared/types/types';
import { availableAdapters } from '../adapters/AdapterManager';
import { GlassDialog } from '../shared/ui/GlassDialog';

interface ApiProvider {
  provider: string;
  apiKey: string;
}

interface SettingsDialogProps {
  open: boolean;
  config: DataProviderConfig | null;
  onClose: () => void;
  onSave: (config: DataProviderConfig | DataProviderConfig[]) => void;
}

export function SettingsDialog({ open, config, onClose, onSave }: SettingsDialogProps) {
  const [useMultiApi, setUseMultiApi] = useState(false);
  const [providers, setProviders] = useState<ApiProvider[]>([
    { provider: config?.provider || '', apiKey: config?.apiKey || '' }
  ]);

  useEffect(() => {
    if (open) {
      if (config) {
        setProviders([{ provider: config.provider, apiKey: config.apiKey }]);
        setUseMultiApi(false);
      } else {
        setProviders([{ provider: '', apiKey: '' }]);
        setUseMultiApi(false);
      }
    }
  }, [config, open]);

  const handleAddProvider = useCallback(() => {
    setProviders(prev => [...prev, { provider: '', apiKey: '' }]);
  }, []);

  const handleRemoveProvider = useCallback((index: number) => {
    setProviders(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleProviderChange = useCallback((index: number, field: 'provider' | 'apiKey', value: string) => {
    setProviders(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }, []);

  const handleSave = useCallback(() => {
    const validProviders = providers.filter(p => p.provider && p.apiKey.trim());
    
    if (validProviders.length === 0) {
      return;
    }

    if (useMultiApi && validProviders.length > 1) {
      // Save as array for multi-API
      onSave(validProviders.map(p => ({ provider: p.provider, apiKey: p.apiKey.trim() })));
    } else {
      // Save as single config
      onSave({
        provider: validProviders[0].provider,
        apiKey: validProviders[0].apiKey.trim(),
      });
    }
    onClose();
  }, [providers, useMultiApi, onSave, onClose]);
  
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
            disabled={providers.every(p => !p.provider || !p.apiKey.trim())}
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
        Configure your data provider(s) and API key(s). Multiple APIs can be merged to get comprehensive data.
        Your API keys are stored securely in your browser's local storage.
      </Alert>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2">Use Multiple APIs (Merge Data)</Typography>
        <Chip
          label={useMultiApi ? 'Enabled' : 'Disabled'}
          color={useMultiApi ? 'primary' : 'default'}
          size="small"
          onClick={() => setUseMultiApi(!useMultiApi)}
          sx={{ cursor: 'pointer' }}
        />
      </Box>

      {providers.map((providerConfig, index) => (
        <Box key={index} sx={{ mb: 2, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">
              API Provider {index + 1}
            </Typography>
            {providers.length > 1 && (
              <IconButton
                size="small"
                onClick={() => handleRemoveProvider(index)}
                color="error"
              >
                <X size={18} />
              </IconButton>
            )}
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Data Provider</InputLabel>
            <Select
              value={providerConfig.provider}
              label="Data Provider"
              onChange={(e) => handleProviderChange(index, 'provider', e.target.value)}
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
            value={providerConfig.apiKey}
            onChange={(e) => handleProviderChange(index, 'apiKey', e.target.value)}
            placeholder="Enter your API key"
            helperText={
              providerConfig.provider === 'Alpha Vantage'
                ? 'Get your free API key at alphavantage.co'
                : 'Enter your API key for the selected provider'
            }
          />
        </Box>
      ))}

      {useMultiApi && (
        <Button
          variant="outlined"
          startIcon={<Plus size={18} />}
          onClick={handleAddProvider}
          fullWidth
          sx={{ mb: 2 }}
        >
          Add Another API Provider
        </Button>
      )}

      {providers.some(p => p.provider === 'Alpha Vantage') && (
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
