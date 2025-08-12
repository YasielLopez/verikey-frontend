// services/modernTheme.ts
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const modernColors = {
  // Primary palette - Cyberpunk inspired
  background: '#0A0B0F',      // Deep space black
  surface: '#12141A',         // Slightly lighter black
  glassSurface: 'rgba(18, 20, 26, 0.7)',
  
  // Neon accents
  neonCyan: '#00F5FF',        // Primary accent
  neonPink: '#FF006E',        // Secondary accent
  neonGreen: '#00FF88',       // Success
  neonYellow: '#FFD700',      // Warning
  neonPurple: '#B026FF',      // Special
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.4)',
  
  // Semantic colors
  danger: '#FF3B3B',
  warning: '#FFB800',
  success: '#00FF88',
  info: '#00B8FF',
  
  // Borders and overlays
  borderGlow: 'rgba(0, 245, 255, 0.3)',
  borderSubtle: 'rgba(255, 255, 255, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.8)',
  
  // Gradients
  gradientStart: 'rgba(0, 245, 255, 0.15)',
  gradientEnd: 'rgba(255, 0, 110, 0.15)',
};

export const modernSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const modernTypography = {
  hero: {
    fontSize: 32,
    fontWeight: '900' as const,
    letterSpacing: -1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
  caption: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.4,
  },
  micro: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
};

export const modernShadows = {
  neonGlow: {
    shadowColor: modernColors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGlow: {
    shadowColor: modernColors.neonCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const modernAnimations = {
  spring: {
    useNativeDriver: true,
    tension: 50,
    friction: 7,
  },
  smooth: {
    useNativeDriver: true,
    duration: 300,
  },
  quick: {
    useNativeDriver: true,
    duration: 200,
  },
  bounce: {
    useNativeDriver: true,
    velocity: 3,
    tension: 40,
    friction: 8,
  },
};