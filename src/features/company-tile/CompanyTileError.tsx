import {
  Card,
  CardContent,
  Typography,
  Box,
  SxProps,
  Theme,
  Alert,
} from '@mui/material';
import { AlertCircle, Info, RefreshCw } from 'lucide-react';
import { TileRemoveButton } from '../../shared/ui/TileRemoveButton';
import { translateApiError } from '../../utils/errorTranslator';
import React, { useMemo } from 'react';

interface CompanyTileErrorProps {
  ticker: string;
  error: string;
  cardSx: SxProps<Theme>;
  onRemove: () => void;
  onShowDetails: () => void;
  onRefresh?: (ticker: string) => void;
}

export const CompanyTileError = React.memo(
  ({
    ticker,
    error,
    cardSx,
    onRemove,
    onShowDetails,
    onRefresh,
  }: CompanyTileErrorProps) => {
    const errorInfo = useMemo(() => translateApiError(error), [error]);

    const handleRefresh = React.useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (onRefresh) {
        onRefresh(ticker);
      }
    }, [ticker, onRefresh]);

    return (
      <Card
        sx={{
          ...cardSx,
          position: 'relative',
          borderColor: 'error.main',
          borderWidth: 2,
        }}
        onClick={onShowDetails}
      >
        <TileRemoveButton onRemove={onRemove} />
        
        {onRefresh && (
          <Box
            onClick={handleRefresh}
            sx={{
              position: 'absolute',
              top: 8,
              right: 48,
              zIndex: 1,
              cursor: 'pointer',
              p: 0.5,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'rgba(120, 120, 120, 0.1)',
              },
            }}
            title="Try again"
          >
            <RefreshCw size={16} />
          </Box>
        )}

        <CardContent sx={{ pt: 3, pb: 2 }}>
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            mb={2}
            sx={{ px: 2 }}
          >
            <AlertCircle size={24} color="#d32f2f" />
            <Typography variant="h6" color="error" sx={{ fontWeight: 600 }}>
              {errorInfo.title}
            </Typography>
          </Box>

          <Box sx={{ px: 2, mb: 2 }}>
            <Alert 
              severity={errorInfo.isApiIssue ? "warning" : "info"}
              icon={<Info size={20} />}
              sx={{ 
                mb: 2,
                backgroundColor: (theme) => 
                  errorInfo.isApiIssue 
                    ? theme.palette.mode === 'dark' 
                      ? 'rgba(237, 108, 2, 0.1)' 
                      : 'rgba(237, 108, 2, 0.05)'
                    : theme.palette.mode === 'dark'
                      ? 'rgba(2, 136, 209, 0.1)'
                      : 'rgba(2, 136, 209, 0.05)',
                border: '1px solid',
                borderColor: errorInfo.isApiIssue ? 'warning.main' : 'info.main',
              }}
            >
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                {errorInfo.isApiIssue 
                  ? "This is an issue with the data provider, not your setup."
                  : "Double-check the information you entered."
                }
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {errorInfo.message}
              </Typography>
            </Alert>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.03)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 0.5,
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                }}
              >
                <Box component="span" sx={{ fontWeight: 600, mt: 0.25 }}>
                  💡 Suggestion:
                </Box>
                <Box component="span">{errorInfo.suggestion}</Box>
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="caption"
            sx={{ 
              display: 'block', 
              px: 2,
              pt: 1,
              color: 'text.secondary',
              fontSize: '0.75rem',
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            Symbol: <strong>{ticker}</strong>
          </Typography>
        </CardContent>
      </Card>
    );
  }
);
