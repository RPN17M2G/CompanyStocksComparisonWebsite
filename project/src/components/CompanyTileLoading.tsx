// src/components/CompanyTileLoading.tsx
import { Card, CardContent, CircularProgress, Typography, SxProps, Theme } from '@mui/material';
import React from 'react';

interface CompanyTileLoadingProps {
  ticker: string;
  cardSx: SxProps<Theme>;
}

export const CompanyTileLoading = React.memo(({ ticker, cardSx }: CompanyTileLoadingProps) => {
  return (
    <Card
      sx={{
        ...cardSx,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CardContent>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading {ticker}...</Typography>
      </CardContent>
    </Card>
  );
});
