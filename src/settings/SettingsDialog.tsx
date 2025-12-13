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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Upload } from 'lucide-react';
import { DataProviderConfig } from '../shared/types/types';
import { availableAdapters } from '../adapters/AdapterManager';
import { GlassDialog } from '../shared/ui/GlassDialog';
import { storageService } from '../services/storageService';

interface ApiProvider {
  provider: string;
  apiKey: string;
  remember: boolean;
}

interface SettingsDialogProps {
  open: boolean;
  config: DataProviderConfig | null;
  onClose: () => void;
  onSave: (config: DataProviderConfig | DataProviderConfig[]) => void;
}

const waveEffect = keyframes`
  0% {
    filter: drop-shadow(0 1px 3px rgba(96, 165, 250, 0.4));
  }
  50% {
    filter: drop-shadow(0 2px 8px rgba(96, 165, 250, 0.8));
  }
  100% {
    filter: drop-shadow(0 1px 3px rgba(96, 165, 250, 0.4));
  }
`;

const GlassmorphicCheckbox = styled(Checkbox)(({ theme }) => ({
  marginRight: 3, 
  marginLeft: 7, 
  padding: 4, 
  transition: 'background-color 0.2s ease, color 0.2s ease',

  color: theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.5)'
    : 'rgba(0, 0, 0, 0.5)',

  '&:hover': {
    borderRadius: '6px',
    background: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.04)',
  },

  '&.Mui-checked': {
    color: '#3B82F6', 
    background: 'transparent',
    border: 'none',
    
    '&:hover': {
      background: theme.palette.mode === 'dark'
        ? 'rgba(96, 165, 250, 0.1)' 
        : 'rgba(96, 165, 250, 0.08)',
    },

    '& .MuiSvgIcon-root': {
      animation: `${waveEffect} 2s infinite ease-in-out`,
    }
  },

  '& .MuiSvgIcon-root': {
    fontSize: 22, 
    filter: 'none',
    transition: 'filter 0.3s ease', 
  },
}));


export function SettingsDialog({ open, config, onClose, onSave }: SettingsDialogProps) {
  const [useMultiApi, setUseMultiApi] = useState(false);
  const [providers, setProviders] = useState<ApiProvider[]>([
    { provider: '', apiKey: '', remember: false }
  ]);

  useEffect(() => {
    if (open) {
      const savedKeys = storageService.getApiKeys();
      if (savedKeys.length > 0) {
        setProviders(savedKeys.map(k => ({ ...k, remember: true })));
        setUseMultiApi(savedKeys.length > 1);
      } else if (config) {
        const currentProviders = Array.isArray(config) ? config : [config];
        setProviders(currentProviders.map(p => ({ ...p, remember: false })));
        setUseMultiApi(Array.isArray(config) && config.length > 1);
      } else {
        setProviders([{ provider: '', apiKey: '', remember: false }]);
        setUseMultiApi(false);
      }
    }
  }, [config, open]);

  const handleAddProvider = useCallback(() => {
    setProviders(prev => [...prev, { provider: '', apiKey: '', remember: false }]);
  }, []);

  const handleRemoveProvider = useCallback((index: number) => {
    setProviders(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleProviderChange = useCallback((index: number, field: keyof ApiProvider, value: string | boolean) => {
    setProviders(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }, []);

  const handleRememberAll = useCallback(() => {
    setProviders(prev => prev.map(p => ({ ...p, remember: true })));
  }, []);

  const handleForgetAll = useCallback(() => {
    setProviders(prev => prev.map(p => ({ ...p, remember: false })));
  }, []);

  const handleImportFromFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const imported = JSON.parse(content);
          
          // Validate format - should be array of {provider, apiKey} or single object
          let importedProviders: DataProviderConfig[] = [];
          
          if (Array.isArray(imported)) {
            importedProviders = imported.filter(
              (p: any) => p && typeof p.provider === 'string' && typeof p.apiKey === 'string'
            );
          } else if (imported && typeof imported.provider === 'string' && typeof imported.apiKey === 'string') {
            importedProviders = [imported];
          } else {
            alert('Invalid file format. Expected JSON array of {provider, apiKey} objects or a single {provider, apiKey} object.');
            return;
          }

          if (importedProviders.length === 0) {
            alert('No valid API keys found in file.');
            return;
          }

          // Merge with existing providers (avoid duplicates)
          setProviders(prev => {
            const existing = new Set(prev.map(p => `${p.provider}:${p.apiKey}`));
            const newProviders = importedProviders
              .filter(p => !existing.has(`${p.provider}:${p.apiKey}`))
              .map(p => ({ ...p, remember: true }));
            return [...prev, ...newProviders];
          });
          
          if (importedProviders.length > 1) {
            setUseMultiApi(true);
          }
        } catch (error) {
          alert('Error reading file: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const handleSave = useCallback(() => {
    const validProviders = providers.filter(p => p.provider && p.apiKey.trim());
    
    if (validProviders.length === 0) {
      onClose();
      return;
    }

    const providersToSaveInStorage = validProviders
      .filter(p => p.remember)
      .map(p => ({ provider: p.provider, apiKey: p.apiKey.trim() }));
      
    storageService.saveApiKeys(providersToSaveInStorage);

    const providersForSession = validProviders.map(p => ({ provider: p.provider, apiKey: p.apiKey.trim() }));

    if (useMultiApi && providersForSession.length > 1) {
      onSave(providersForSession);
    } else {
      onSave(providersForSession[0]);
    }
    onClose();
  }, [providers, useMultiApi, onSave, onClose]);
  
  const handleClose = useCallback(() => {
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
        Configure your data provider(s) and API key(s). Select 'Remember' to save an API key for future sessions.
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
        <Box 
          key={index} 
          sx={{ 
            mb: 2, 
            p: 2, 
            borderRadius: 3, 
            border: '1px solid', 
            borderColor: 'divider',
            background: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)',
            backdropFilter: 'blur(5px)',
          }}
        >
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
            sx={{ mb: 1 }}
          />
          
          <FormControlLabel
            control={
              <GlassmorphicCheckbox
                checked={providerConfig.remember}
                onChange={(e) => handleProviderChange(index, 'remember', e.target.checked)}
              />
            }
            label="Remember this API Key"
            sx={{
              mt: 1,
              '& .MuiTypography-root': {
                userSelect: 'none',
                fontSize: '0.875rem',
              }
            }}
          />
        </Box>
      ))}

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 1.5,
        mb: 2,
        borderRadius: 3,
        background: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)',
        backdropFilter: 'blur(5px)',
        border: '1px solid',
        borderColor: 'divider',
      }}>
        <Typography variant="body2" sx={{ flexGrow: 1, userSelect: 'none' }}>
          Manage all keys at once
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            onClick={handleImportFromFile}
            variant="outlined"
            startIcon={<Upload size={16} />}
            sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.8rem' }}
          >
            Import
          </Button>
          <Button
            size="small"
            onClick={handleRememberAll}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.8rem' }}
          >
            Remember All
          </Button>
          <Button
            size="small"
            onClick={handleForgetAll}
            variant="outlined"
            color="warning"
            sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.8rem' }}
          >
            Forget All
          </Button>
        </Box>
      </Box>

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