const shared = {
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 },
  font: {
    sizeXs: 12, sizeSm: 14, sizeMd: 16, sizeLg: 18, sizeXl: 22, sizeXxl: 28, sizeDisplay: 34,
    weightRegular: '400' as const,
    weightMedium: '500' as const,
    weightBold: '700' as const,
    weightBlack: '900' as const,
  },
};

export const darkTheme = {
  colors: {
    bg: '#0B0B0F',
    surface: '#16161D',
    surfaceAlt: '#1E1E26',
    border: '#23232C',
    text: '#F5F5F7',
    muted: '#8A8A93',
    accent: '#C6FF3D',
    accentText: '#0B0B0F',
    danger: '#FF4D5E',
    success: '#3DD68C',
  },
  ...shared,
};

export const lightTheme = {
  colors: {
    bg: '#F7FCF8',
    surface: '#FFFFFF',
    surfaceAlt: '#ECF8EF',
    border: '#CFE7D5',
    text: '#0F2A18',
    muted: '#4E6B59',
    accent: '#2E9E58',
    accentText: '#FFFFFF',
    danger: '#E11D48',
    success: '#15803D',
  },
  ...shared,
};

// Backward-compatible default used by existing screens/components.
export const theme = darkTheme;
export type Theme = typeof theme;
