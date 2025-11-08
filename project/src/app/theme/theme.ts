// --- Theme Palettes ---
export const lightTheme = {
    mode: 'light',
    primary: {
      main: '#5c87e4ff', // Blue
    },
    secondary: {
      main: '#10b981', // Green
    },
    background: {
      default: '#f8fafc', // A very light gray
      paper: '#ffffff',   // White
    }
  }

export const darkTheme = {
  mode: 'dark',
  primary: {
    main: '#2563eb', // Same Blue
  },
  secondary: {
    main: '#10b981', // Green
  },
  background: {
    default: '#0b1120', // A very dark blue/gray
    paper: '#121e36',   // A slightly lighter dark blue/gray
  }
}

export const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
};

// --- Global Styles for the Animation ---
export const animatedBackgroundStyles = (theme: any) => ({
  '@keyframes gradientAnimation': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
  'body': {
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(-45deg, 
          ${theme.palette.background.default}, 
          ${theme.palette.background.paper}, 
          ${theme.palette.primary.dark}, 
          ${theme.palette.secondary.dark})`
      : `linear-gradient(-45deg, 
          ${theme.palette.background.default}, 
          ${theme.palette.background.paper}, 
          ${theme.palette.primary.light}, 
          ${theme.palette.secondary.light})`,
    backgroundSize: '400% 400%',
    animation: 'gradientAnimation 20s ease infinite',
    transition: 'background 300ms ease-in-out',
  },
});

export const scrollbarStyles = {
  // Hide scrollbar for Chrome, Safari and Opera
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  // Hide scrollbar for IE, Edge and Firefox
  '-ms-overflow-style': 'none',  // IE and Edge
  'scrollbar-width': 'none',  // Firefox
};
