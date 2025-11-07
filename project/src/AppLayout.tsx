// src/components/AppLayout.tsx
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
import { animatedBackgroundStyles, scrollbarStyles } from './theme';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Plus, Settings, TrendingUp, Edit3 } from 'lucide-react';
import { ThemeMode } from './useThemeManager';

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
}: AppLayoutProps) => {
  const showDetailView = Boolean(detailView);

  return (
    <>
      <CssBaseline />
      <GlobalStyles styles={animatedBackgroundStyles} />

      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'transparent' }}>
        <AppBar position="sticky" elevation={1}>
          <Toolbar>
            <TrendingUp size={28} style={{ marginRight: 12 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Stock-to-Metrics Dashboard
            </Typography>
            <Button color="inherit" startIcon={<Edit3 size={20} />} onClick={onShowCustomMetrics}>
              Custom Metrics
            </Button>
            <Button color="inherit" startIcon={<Settings size={20} />} onClick={onShowSettings}>
              Settings
            </Button>
            <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Box
            component="main"
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 4,
              transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              width: showDetailView ? '60%' : '100%',
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

          {detailView}
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
              bottom: 24,
              width: 56,
              height: 56,
              borderRadius: '50%',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              color: 'text.primary',
              right: isFabHovered ? 24 : -28,
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
            }}
          >
            <Plus size={28} />
          </Fab>
        )}
      </Box>
    </>
  );
};
