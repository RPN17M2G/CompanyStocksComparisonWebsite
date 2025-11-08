import {
  Card,
  CardContent,
  Typography,
  Box,
  SxProps,
  Theme,
} from '@mui/material';
import { AlertCircle } from 'lucide-react';
import { TileRemoveButton } from '../../shared/ui/TileRemoveButton';
import React from 'react';

interface CompanyTileErrorProps {
  ticker: string;
  error: string;
  cardSx: SxProps<Theme>;
  onRemove: () => void;
  onShowDetails: () => void;
}

export const CompanyTileError = React.memo(
  ({
    ticker,
    error,
    cardSx,
    onRemove,
    onShowDetails,
  }: CompanyTileErrorProps) => {
    return (
      <Card
        sx={{
          ...cardSx,
          position: 'relative',
          borderColor: 'error.main',
        }}
        onClick={onShowDetails}
      >
        <TileRemoveButton onRemove={onRemove} />

        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            mb={2}
            sx={{ pt: 2, pl: 3 }}
          >
            <AlertCircle size={24} color="#d32f2f" />
            <Typography color="error">Error</Typography>
          </Box>
          <Typography variant="body2" sx={{ 
            pl: 3,
            maxWidth: '25ch',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            }}>
            {error}
          </Typography>
          <Typography
            variant="caption"
            sx={{ mt: 1, display: 'block', pl: 3 }}
          >
            Ticker: {ticker}
          </Typography>
        </CardContent>
      </Card>
    );
  }
);
