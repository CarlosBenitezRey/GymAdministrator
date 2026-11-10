import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ASSETS } from '../../theme';

export type BiometricStatus = 'idle' | 'scanning' | 'success' | 'error';

interface BiometricIndicatorProps {
  status: BiometricStatus;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
}

export const BiometricIndicator: React.FC<BiometricIndicatorProps> = ({
  status,
  title = 'Control de Acceso',
  subtitle = 'Terminal de Identificación',
  onPress,
}) => {
  // Valores animados
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const laserValue = useRef(new Animated.Value(0)).current;

  const fingerprintOpacity = useRef(new Animated.Value(1)).current;
  const fingerprintScale = useRef(new Animated.Value(1)).current;

  const checkScale = useRef(new Animated.Value(0.2)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  const errorScale = useRef(new Animated.Value(0.2)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;

  // Manejo de animaciones de escaneo en bucle
  useEffect(() => {
    let spinLoop: Animated.CompositeAnimation | null = null;
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let laserLoop: Animated.CompositeAnimation | null = null;

    if (status === 'scanning') {
      // 1. Giro del anillo de progreso
      spinValue.setValue(0);
      spinLoop = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinLoop.start();

      // 2. Respiración / pulso del contenedor
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.04,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // 3. Haz láser vertical escaneando arriba y abajo
      laserValue.setValue(0);
      laserLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(laserValue, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(laserValue, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      laserLoop.start();

      // Asegurar que la huella sea visible durante el escaneo
      Animated.parallel([
        Animated.timing(fingerprintOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(fingerprintScale, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(checkScale, { toValue: 0.2, duration: 150, useNativeDriver: true }),
        Animated.timing(errorOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(errorScale, { toValue: 0.2, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      spinValue.stopAnimation();
      pulseValue.stopAnimation();
      laserValue.stopAnimation();
      pulseValue.setValue(1);
      laserValue.setValue(0);
    }

    return () => {
      spinLoop?.stop();
      pulseLoop?.stop();
      laserLoop?.stop();
    };
  }, [status]);

  // Manejo de transiciones a 'success', 'error' o 'idle'
  useEffect(() => {
    if (status === 'success') {
      // Transición huella -> check verde
      Animated.parallel([
        Animated.timing(fingerprintOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fingerprintScale, {
          toValue: 0.4,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(errorOpacity, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 4,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (status === 'error') {
      // Transición huella -> error rojo
      Animated.parallel([
        Animated.timing(fingerprintOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fingerprintScale, {
          toValue: 0.4,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.spring(errorScale, {
          toValue: 1,
          friction: 4,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(errorOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (status === 'idle') {
      // Retornar a reposo
      Animated.parallel([
        Animated.timing(fingerprintOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(fingerprintScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(checkScale, {
          toValue: 0.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(errorOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(errorScale, {
          toValue: 0.2,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [status]);

  // Interpolación de rotación del anillo
  const spinInterpolation = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Interpolación del haz láser vertical
  const laserTranslateY = laserValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-90, 90],
  });

  // Colores dinámicos según el estado
  const getBorderColor = () => {
    switch (status) {
      case 'scanning':
        return '#2563EB';
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      default:
        return '#CBD5E1';
    }
  };

  const getContainerGlow = () => {
    switch (status) {
      case 'scanning':
        return {
          shadowColor: '#2563EB',
          shadowOpacity: 0.3,
          shadowRadius: 26,
          elevation: 10,
        };
      case 'success':
        return {
          shadowColor: '#10B981',
          shadowOpacity: 0.4,
          shadowRadius: 30,
          elevation: 12,
        };
      case 'error':
        return {
          shadowColor: '#EF4444',
          shadowOpacity: 0.4,
          shadowRadius: 30,
          elevation: 12,
        };
      default:
        return {
          shadowColor: '#000000',
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 5,
        };
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Encabezado: Escudo/Candado + Título en tamaño grande y limpio */}
      <View style={styles.headerRow}>
        <View style={styles.shieldBadge}>
          <Ionicons name="shield-checkmark" size={44} color="#002566" />
        </View>
        <View style={styles.headerTexts}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.subtitleText}>{subtitle}</Text>
        </View>
      </View>

      {/* Contenedor biométrico redondeado en tamaño grande */}
      <TouchableOpacity
        activeOpacity={onPress ? 0.85 : 1}
        onPress={onPress}
        disabled={!onPress}
        style={styles.biometricCenterArea}
      >
        <Animated.View
          style={[
            styles.biometricCircle,
            getContainerGlow(),
            {
              borderColor: getBorderColor(),
              transform: [{ scale: pulseValue }],
            },
          ]}
        >
          {/* Anillo de carga progresiva giratorio (visible al escanear) */}
          {status === 'scanning' && (
            <Animated.View
              style={[
                styles.spinnerRing,
                {
                  transform: [{ rotate: spinInterpolation }],
                },
              ]}
            />
          )}

          {/* Haz láser vertical animado (durante escaneo) */}
          {status === 'scanning' && (
            <Animated.View
              style={[
                styles.laserLine,
                {
                  transform: [{ translateY: laserTranslateTranslateSafe(laserTranslateY) }],
                },
              ]}
            >
              <View style={styles.laserGlow} />
            </Animated.View>
          )}

          {/* 1. Huella dactilar grande */}
          <Animated.View
            style={[
              styles.iconLayer,
              {
                opacity: fingerprintOpacity,
                transform: [{ scale: fingerprintScale }],
              },
            ]}
          >
            <Image
              source={ASSETS.huellaDactilar}
              style={[
                styles.fingerprintImage,
                {
                  tintColor: status === 'scanning' ? '#2563EB' : '#002566',
                },
              ]}
              resizeMode="contain"
            />
          </Animated.View>

          {/* 2. Checkmark Verde de éxito */}
          <Animated.View
            style={[
              styles.iconLayer,
              styles.absoluteCenter,
              {
                opacity: checkOpacity,
                transform: [{ scale: checkScale }],
              },
            ]}
            pointerEvents="none"
          >
            <Ionicons name="checkmark-circle" size={155} color="#10B981" />
          </Animated.View>

          {/* 3. Ícono Rojo de error / denegado */}
          <Animated.View
            style={[
              styles.iconLayer,
              styles.absoluteCenter,
              {
                opacity: errorOpacity,
                transform: [{ scale: errorScale }],
              },
            ]}
            pointerEvents="none"
          >
            <Ionicons name="close-circle" size={155} color="#EF4444" />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

// Helper para interpolación segura de translateY
function laserTranslateTranslateSafe(val: Animated.AnimatedInterpolation<string | number>) {
  return val;
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  shieldBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 37, 102, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTexts: {
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#002566',
    letterSpacing: -0.8,
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  biometricCenterArea: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  biometricCircle: {
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  spinnerRing: {
    position: 'absolute',
    width: 288,
    height: 288,
    borderRadius: 144,
    borderWidth: 5,
    borderTopColor: '#2563EB',
    borderRightColor: '#60A5FA',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  laserLine: {
    position: 'absolute',
    width: '88%',
    height: 4,
    backgroundColor: '#38BDF8',
    zIndex: 10,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 10,
  },
  laserGlow: {
    position: 'absolute',
    top: -5,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: 7,
  },
  iconLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  absoluteCenter: {
    position: 'absolute',
  },
  fingerprintImage: {
    width: 165,
    height: 165,
  },
});
