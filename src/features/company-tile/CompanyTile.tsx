import { Company, ComparisonGroup, CustomMetric } from '../../shared/types/types';
import { CompanyTileLoading } from './CompanyTileLoading';
import { CompanyTileError } from './CompanyTileError';
import { CompanyTileEmpty } from './CompanyTileEmpty';
import { CompanyTileContent } from './CompanyTileContent'; 
import { SxProps, Theme } from '@mui/material';

export const cardSx: SxProps<Theme> = {
  height: '100%',
  minHeight: 200,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  borderRadius: 4,
  backgroundColor: (theme: Theme) =>
    theme.palette.mode === 'dark' ? 'rgba(18, 30, 54, 0.7)' : 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(10px)',
  boxShadow: (theme: Theme) => theme.shadows[1],
  border: '1px solid transparent',
  '&:hover': {
    boxShadow: (theme: Theme) => theme.shadows[6],
    transform: 'translateY(-4px)',
    borderColor: 'primary.light',
  },
};

export const selectedCardSx: SxProps<Theme> = {
  borderColor: 'primary.main',
  borderWidth: 2,
  '&:hover': {
    borderColor: 'primary.main',
  },
};

interface CompanyTileProps {
  item: Company | ComparisonGroup;
  keyMetrics: string[];
  customMetrics: CustomMetric[];
  isSelected: boolean;
  onShowDetails: () => void;
  onToggleSelect: () => void;
  onRemove: () => void;
}

export function CompanyTile({
  item,
  isSelected,
  ...props 
}: CompanyTileProps) {
  
  const isGroup = 'isGroup' in item;
  const company = item as Company;

  const combinedCardSx = {
    ...cardSx,
    ...(isSelected && selectedCardSx),
  };

  // --- State 1: Loading ---
  if (!isGroup && company.isLoading) {
    return (
      <CompanyTileLoading 
        ticker={company.ticker} 
        cardSx={combinedCardSx} 
      />
    );
  }

  // --- State 2: Error ---
  if (!isGroup && company.error) {
    return (
      <CompanyTileError
        ticker={company.ticker}
        error={company.error}
        cardSx={combinedCardSx}
        onRemove={props.onRemove}
        onShowDetails={props.onShowDetails}
      />
    );
  }
  
  const data = !isGroup ? company.rawData : null;
  
  // --- State 3: Empty/No Data ---
  if (!isGroup && !data && !company.isLoading && !company.error) {
    return (
      <CompanyTileEmpty
        ticker={company.ticker}
        name={company.ticker} // Will show ticker if name not available
        cardSx={combinedCardSx}
        onRemove={props.onRemove}
        onShowDetails={props.onShowDetails}
      />
    );
  }

  // --- State 4: Success/Content ---
  return (
    <CompanyTileContent
      item={item}
      isSelected={isSelected}
      cardSx={combinedCardSx}
      {...props}
    />
  );
}
