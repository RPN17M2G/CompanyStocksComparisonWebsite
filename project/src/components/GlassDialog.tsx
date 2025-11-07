import React from 'react';
import {
  Dialog,
  DialogProps,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Theme, // <-- 1. Import Theme
} from '@mui/material';
import { X } from 'lucide-react';

// --- Reusable hidden scrollbar styles ---
const scrollbarStyles = {
  // Hide scrollbar for Chrome, Safari and Opera
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  // Hide scrollbar for IE, Edge and Firefox
  '-ms-overflow-style': 'none', // IE and Edge
  'scrollbar-width': 'none', // Firefox
};
// ----------------------------------------

interface GlassDialogProps extends Omit<DialogProps, 'title'> {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode; // Optional footer with buttons
}

export function GlassDialog({
  open,
  onClose,
  title,
  children,
  actions,
  ...rest
}: GlassDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md" // Set a default, but can be overridden
      {...rest}
      // --- Apply glassy effect to modal backdrop ---
      BackdropProps={{
        sx: { backdropFilter: 'blur(5px)' }
      }}
      PaperProps={{
        sx: {
          backgroundColor: 'transparent', // Make default paper transparent
          boxShadow: 'none',
        }
      }}
    >
      {/* --- Main Floating Glassy Card --- */}
      <Box
        sx={{
          borderRadius: 4, // 16px
          // Glassmorphism effect
          // 2. Fixed 'any' type
          backgroundColor: (theme: Theme) => 
            theme.palette.mode === 'dark' ? 'rgba(18, 30, 54, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          boxShadow: (theme: Theme) => theme.shadows[10], // 2. Fixed 'any' type
          border: '1px solid',
          // 2. Fixed 'any' type
          borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          
          maxHeight: '90vh', // Float effect
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden', // Let content scroll internally
        }}
      >
        {/* --- Sticky Header --- */}
        <DialogTitle sx={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 10,
          // Glassy header
          // 2. Fixed 'any' type
          backgroundColor: (theme: Theme) => 
            theme.palette.mode === 'dark' ? 'rgba(11, 17, 32, 0.8)' : 'rgba(248, 250, 252, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: 1,
          borderColor: 'divider',
        }}>
          <Typography variant="h6" fontWeight="600">
            {title}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: 'rgba(120, 120, 120, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(120, 120, 120, 0.2)',
              }
            }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>

        {/* --- Scrolling Content --- */}
        <DialogContent sx={{ ...scrollbarStyles, overflowY: 'auto' }}>
          {/* Add padding so content isn't right up against edges */}
          <Box sx={{ py: 3 }}>
            {children}
          </Box>
        </DialogContent>

        {/* --- Sticky Footer (Actions) --- */}
        {actions && (
          <DialogActions sx={{ 
            position: 'sticky', 
            bottom: 0, 
            zIndex: 10,
            // Glassy footer
            // 2. Fixed 'any' type
            backgroundColor: (theme: Theme) => 
              theme.palette.mode === 'dark' ? 'rgba(11, 17, 32, 0.8)' : 'rgba(248, 250, 252, 0.8)',
            backdropFilter: 'blur(10px)',
            borderTop: 1,
            borderColor: 'divider',
          }}>
            {actions}
          </DialogActions>
        )}
      </Box>
    </Dialog>
  );
}
