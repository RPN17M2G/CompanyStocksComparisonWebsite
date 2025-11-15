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

interface CompanyTileEmptyProps {
  ticker: string;
  name?: string;
  cardSx: SxProps<Theme>;
  onRemove: () => void;
  onShowDetails: () => void;
}

export const CompanyTileEmpty = React.memo(
  ({
    ticker,
    name,
    cardSx,
    onRemove,
    onShowDetails,
  }: CompanyTileEmptyProps) => {
    return (
      <Card
        sx={{
          ...cardSx,
          position: 'relative',
          borderColor: 'warning.main',
          opacity: 0.7,
        }}
        onClick={onShowDetails}
      >
        <TileRemoveButton onRemove={onRemove} />

        <CardContent sx={{ pt: 3, px: 1 }}>
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            mb={2}
            sx={{ pr: '40px' }}
          >
            <AlertCircle size={20} color="#ed6c02" />
            <Typography variant="body2" color="text.secondary">
              No Data Available
            </Typography>
          </Box>
          <Box sx={{ pr: '40px' }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                maxWidth: '22ch',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {name || ticker}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                maxWidth: '22ch',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {ticker}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }
);

