/**
 * Paleta de Colores Oficial - Sanson Gym
 */

export const colors = {
  primary: '#0284C7',
  backgroundHeader: '#002566',
  primaryButton: '#002566',
  background: '#0F172A',
  surface: '#1E293B',
  text: '#FFFFFF',          // Blanco puro para títulos y elementos de alto contraste
  textMuted: '#94A3B8',     // Blanco medio gris para subtítulos, etiquetas y secundarios
  success: '#10B981',       // Verde para precios, montos activos y acceso permitido
  danger: '#EF4444',
} as const;

export const POS_COLORS = {
  ink: '#FFFFFF',           // Blanco para títulos
  muted: '#94A3B8',         // Blanco medio gris para subtítulos
  primaryDark: '#10B981',   // Verde destacado para precios y montos
  primary: '#0284C7',
} as const;

export type ColorName = keyof typeof colors;

export const theme = {
  ...colors,
  pos: POS_COLORS,

  // Variantes de texto
  textMuted: '#94A3B8',
  textSubtle: 'rgba(255, 255, 255, 0.40)',

  // Bordes y separadores
  border: 'rgba(255, 255, 255, 0.12)',
  borderLight: 'rgba(255, 255, 255, 0.06)',

  // Badges y fondos suaves para resaltar estados
  primarySoft: 'rgba(2, 132, 199, 0.15)',
  successSoft: 'rgba(16, 185, 129, 0.15)',
  dangerSoft: 'rgba(239, 68, 68, 0.15)',
} as const;

export default colors;
