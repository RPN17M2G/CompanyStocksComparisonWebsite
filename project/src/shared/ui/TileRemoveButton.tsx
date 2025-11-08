import { IconButton } from '@mui/material';
import { X } from 'lucide-react';
import React from 'react';
import { useCallback } from 'react';

interface TileRemoveButtonProps {
  onRemove: () => void;
}

export const TileRemoveButton = React.memo(({ onRemove }: TileRemoveButtonProps) => {
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Stop the click from bubbling to the card
    onRemove();
  }, [onRemove]);

  return (
    <IconButton
      aria-label="remove"
      size="small"
      onClick={handleClick}
      sx={{
        position: 'absolute',
        top: 8,
        left: 8,
        zIndex: 1,
        backgroundColor: 'rgba(120, 120, 120, 0.1)',
        '&:hover': {
          backgroundColor: 'rgba(120, 120, 120, 0.2)',
        }
      }}
    >
      <X size={18} />
    </IconButton>
  );
});
