import {
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Fab,
  IconButton,
  GlobalStyles,
  Divider,
} from '@mui/material';
import { animatedBackgroundStyles, scrollbarStyles } from './theme/theme';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Plus, Settings, TrendingUp, Edit3 } from 'lucide-react';
import { ThemeMode } from './theme/useThemeManager';
import logo_without_name from '../assets/logo-without-name.png';

type AppLayoutProps = {
  children: React.ReactNode;
  detailView: React.ReactNode;
  mode: ThemeMode;
  hasConfig: boolean;
  isFabHovered: boolean;
  toggleTheme: () => void;
  onShowCustomMetrics: () => void;
  onShowSettings: () => void;
  onShowAddDialog: () => void;
  onFabMouseEnter: () => void;
  onFabMouseLeave: () => void;
  detailViewWidth?: number; // Optional: width percentage for detail view on desktop
  isDetailViewResizing?: boolean; // Whether the detail view is currently being resized
};

export const AppLayout = ({
  children,
  detailView,
  mode,
  hasConfig,
  isFabHovered,
  toggleTheme,
  onShowCustomMetrics,
  onShowSettings,
  onShowAddDialog,
  onFabMouseEnter,
  onFabMouseLeave,
  detailViewWidth = 35,
  isDetailViewResizing = false,
}: AppLayoutProps) => {
  const showDetailView = Boolean(detailView);

  return (
    <>
      <CssBaseline />
      <GlobalStyles styles={animatedBackgroundStyles} />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'transparent' }}>
        <AppBar position="sticky" elevation={1}>
          <Toolbar sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: { xs: 1, sm: 0 } }}>
            <img 
              src={logo_without_name} 
              alt="PeerCompare Logo" 
              style={{ 
                height: '90px',
                maxHeight: '100%',
                width: 'auto',
                objectFit: 'contain'
              }}
              className="logo-img"
            />
            
            <Typography 
              variant="h5" 
              component="div" 
              sx={{ 
                flexGrow: 1,
                fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                display: { xs: 'none', sm: 'block' }
              }}
            >
              PeerCompare
            </Typography>
            
            <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, alignItems: 'center' }}>
              <IconButton 
                color="inherit" 
                onClick={onShowCustomMetrics}
                sx={{ display: { xs: 'flex', sm: 'none' } }}
                title="Custom Metrics"
              >
                <Edit3 size={20} />
              </IconButton>
              <Button 
                color="inherit" 
                startIcon={<Edit3 size={20} />} 
                onClick={onShowCustomMetrics}
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              >
                Custom Metrics
              </Button>
              
              <IconButton 
                color="inherit" 
                onClick={onShowSettings}
                sx={{ display: { xs: 'flex', sm: 'none' } }}
                title="Settings"
              >
                <Settings size={20} />
              </IconButton>
              <Button 
                color="inherit" 
                startIcon={<Settings size={20} />} 
                onClick={onShowSettings}
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              >
                Settings
              </Button>
              
              <IconButton sx={{ ml: { xs: 0, sm: 1 } }} onClick={toggleTheme} color="inherit">
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: { xs: 'column', md: 'row' } }}>
          <Box
            component="main"
            sx={{
              overflowY: 'auto',
              p: { xs: 2, sm: 3, md: 4 },
              // Smooth transition for flex changes
              transition: 'flex 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              // Use flex: 1 to automatically fill remaining space
              flex: { xs: '1 1 100%', md: '1 1 auto' },
              minWidth: 0, // Allow flex item to shrink
              boxSizing: 'border-box',
              ...scrollbarStyles,
            }}
          >
            {children}
          </Box>

          {showDetailView && (
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                display: { xs: 'none', md: 'block' },
                borderWidth: 0,
                width: '3px',
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.3), rgba(255,255,255,0))'
                    : 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.2), rgba(0,0,0,0))',
                height: '75%',
                my: 'auto',
                borderRadius: '2px',
                boxShadow: (theme) =>
                  `0 0 10px ${
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                  }`,
              }}
            />
          )}

          {showDetailView && (
            <Box 
              sx={{ 
                display: { xs: 'block', md: 'block' },
                height: { xs: '50vh', md: '100%' },
                overflow: 'hidden',
                flexShrink: 0,
                // Use width with smooth transition during drag
                width: { xs: '100%', md: `${detailViewWidth}%` },
                // Smooth transition that works during dragging
                transition: 'width 80ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                // Optimize for performance - use transform for smoother animation
                willChange: 'width',
                // Force hardware acceleration
                transform: 'translateZ(0)',
              }}
            >
              {detailView}
            </Box>
          )}
        </Box>

        {hasConfig && (
          <Fab
            color="default"
            disableRipple
            aria-label="add"
            onClick={onShowAddDialog}
            onMouseEnter={onFabMouseEnter}
            onMouseLeave={onFabMouseLeave}
            sx={{
              position: 'fixed',
              bottom: { xs: 16, sm: 24 },
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              borderRadius: '50%',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              color: 'text.primary',
              right: { xs: 16, sm: isFabHovered ? 24 : -28 },
              boxShadow: (theme) => theme.shadows[isFabHovered ? 4 : 2],
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(37, 99, 235, 0.6)'
                  : 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(66, 121, 240, 0.65)'
                    : 'rgba(233, 232, 232, 0.75)',
              },
              zIndex: 1000,
            }}
          >
            <Plus size={28} />
          </Fab>
        )}
      </Box>
    </>
  );
};
