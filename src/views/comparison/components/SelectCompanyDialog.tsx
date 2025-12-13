import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Theme,
  IconButton,
} from '@mui/material';
import { Search, X, Check } from 'lucide-react';
import { GlassDialog } from '../../../shared/ui/GlassDialog';
import { Company } from '../../../shared/types/types';
import { scrollbarStyles } from '../../../app/theme/theme';

interface SelectCompanyDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (ticker: string) => void;
  availableCompanies: Company[];
  existingItemIds: Set<string>;
}

export function SelectCompanyDialog({
  open,
  onClose,
  onSelect,
  availableCompanies,
  existingItemIds,
}: SelectCompanyDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter companies that are not already in comparison
  const availableToAdd = useMemo(() => {
    return availableCompanies.filter(
      company => !existingItemIds.has(company.id)
    );
  }, [availableCompanies, existingItemIds]);

  // Filter by search query
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return availableToAdd;
    const query = searchQuery.toLowerCase().trim();
    return availableToAdd.filter(
      company =>
        company.ticker.toLowerCase().includes(query) ||
        (company.rawData?.name &&
          company.rawData.name.toLowerCase().includes(query))
    );
  }, [availableToAdd, searchQuery]);

  const handleSelect = (ticker: string) => {
    onSelect(ticker);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <GlassDialog
      open={open}
      onClose={handleClose}
      title="Add Company to Comparison"
      maxWidth="sm"
      fullWidth
      actions={
        <Button variant="contained" onClick={handleClose} sx={{ borderRadius: 2 }}>
          Close
        </Button>
      }
    >
      <Box sx={scrollbarStyles}>
        <TextField
          fullWidth
          placeholder="Search companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                  sx={{ mr: -1 }}
                >
                  <X size={18} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: (theme: Theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.03)',
              '&:hover': {
                backgroundColor: (theme: Theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
              },
              '&.Mui-focused': {
                backgroundColor: (theme: Theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.08)',
              },
            },
          }}
        />

        {availableToAdd.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              All available companies are already in the comparison.
            </Typography>
          </Box>
        ) : filteredCompanies.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No companies found matching "{searchQuery}".
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, ml: 1 }}>
              {filteredCompanies.length} company{filteredCompanies.length !== 1 ? 'ies' : ''} available
            </Typography>
            <List
              sx={{
                maxHeight: 400,
                overflow: 'auto',
                ...scrollbarStyles,
              }}
            >
              {filteredCompanies.map((company) => (
                <ListItem key={company.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleSelect(company.ticker)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        backgroundColor: (theme: Theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.05)',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="600">
                            {company.ticker}
                          </Typography>
                          {company.rawData?.name && (
                            <Typography variant="body2" color="text.secondary">
                              - {company.rawData.name}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        company.isLoading
                          ? 'Loading...'
                          : company.error
                          ? `Error: ${company.error}`
                          : company.rawData
                          ? 'Ready'
                          : 'No data'
                      }
                    />
                    <Check size={20} style={{ opacity: 0.5 }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    </GlassDialog>
  );
}

