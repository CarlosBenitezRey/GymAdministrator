import { colors } from './colors';

/**
 * Estilos tipográficos modernos - Sanson Gym
 * - Títulos: Blanco puro ('#FFFFFF') con peso Black ('900') y letterSpacing ajustado (-0.4 a -0.6)
 * - Subtítulos: Blanco medio gris ('#94A3B8') con peso Semibold ('600'-'700') y letterSpacing (-0.35)
 * - Precios y montos: Verde destacado ('#10B981') con peso Black ('900')
 */
export const TYPOGRAPHY = {
  title: {
    color: colors.text, // #FFFFFF (Blanco puro)
    fontWeight: '900' as const,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textMuted, // #94A3B8 (Blanco medio gris)
    fontWeight: '600' as const,
    letterSpacing: -0.35,
  },
  price: {
    color: colors.success, // #10B981 (Verde destacado)
    fontWeight: '900' as const,
    letterSpacing: -0.5,
  },
  secondary: {
    color: colors.textMuted,
    fontWeight: '600' as const,
  },
  placeholder: colors.textMuted,
} as const;

export const POS_TYPOGRAPHY = TYPOGRAPHY;
