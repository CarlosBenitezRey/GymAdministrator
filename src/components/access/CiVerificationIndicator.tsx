import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  ImageSourcePropType,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type CiVerificationStatus = 'idle' | 'scanning' | 'verifying' | 'success' | 'error';

interface CiVerificationIndicatorProps {
  status: CiVerificationStatus;
  title?: string;
  subtitle?: string;
  imageSource?: ImageSourcePropType;
  iconName?: keyof typeof Ionicons.glyphMap;
  badgeIcon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

const DIAMETER = 290;
const RADIUS = DIAMETER / 2;
const BORDER_WIDTH = 8;
const INNER_DIAMETER = DIAMETER - BORDER_WIDTH * 2;
const INNER_RADIUS = INNER_DIAMETER / 2;

export const CiVerificationIndicator: React.FC<CiVerificationIndicatorProps> = ({
  status,
  title = 'Control de Acceso',
  subtitle = 'Verificación de C.I.',
  imageSource,
  iconName = 'lock-closed',
  badgeIcon,
  onPress,
}) => {
  // Progreso animado del círculo (0 a 100)
  const progressValue = useRef(new Animated.Value(0)).current;

  // Pulso del contenedor
  const pulseValue = useRef(new Animated.Value(1)).current;

  // Opacidades y escalas del contenido central
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentScale = useRef(new Animated.Value(1)).current;

  // Checkmark de éxito (verde)
  const checkScale = useRef(new Animated.Value(0.2)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  // Cruz / Alerta de error (rojo)
  const errorScale = useRef(new Animated.Value(0.2)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;

  // Capas de color para el anillo (para 100% useNativeDriver)
  const successColorOpacity = useRef(new Animated.Value(0)).current;
  const errorColorOpacity = useRef(new Animated.Value(0)).current;

  // Loop de pulso
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const isVerifying = status === 'scanning' || status === 'verifying';

  useEffect(() => {
    if (isVerifying) {
      // 1. Inicia progreso progresivo de 0 a 75%
      progressValue.setValue(0);
      successColorOpacity.setValue(0);
      errorColorOpacity.setValue(0);

      Animated.timing(progressValue, {
        toValue: 75,
        duration: 1100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();

      // 2. Pulso sutil de validación
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.03,
            duration: 550,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 550,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoopRef.current.start();

      // Contenido central visible
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(contentScale, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(checkScale, { toValue: 0.2, duration: 150, useNativeDriver: true }),
        Animated.timing(errorOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(errorScale, { toValue: 0.2, duration: 150, useNativeDriver: true }),
      ]).start();
    } else if (status === 'success') {
      pulseLoopRef.current?.stop();
      pulseValue.setValue(1);

      // "si es exitoso se completa rapidamente y muestra un check en el centro"
      Animated.parallel([
        // Rápido llenado al 100%
        Animated.timing(progressValue, {
          toValue: 100,
          duration: 250,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Transición a color verde
        Animated.timing(successColorOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Ocultar imagen central
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
        // Emerger Checkmark con rebote elástico
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
      pulseLoopRef.current?.stop();
      pulseValue.setValue(1);

      // "si no es exitoso se completa rapidamente y muestra una X"
      Animated.parallel([
        // Rápido llenado al 100%
        Animated.timing(progressValue, {
          toValue: 100,
          duration: 250,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Transición a color rojo
        Animated.timing(errorColorOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Ocultar imagen central
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
        // Emerger cruz roja con rebote
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
      pulseLoopRef.current?.stop();
      pulseValue.setValue(1);

      // Resetear a reposo
      Animated.parallel([
        Animated.timing(progressValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(successColorOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(errorColorOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(contentScale, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(checkScale, { toValue: 0.2, duration: 150, useNativeDriver: true }),
        Animated.timing(errorOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(errorScale, { toValue: 0.2, duration: 150, useNativeDriver: true }),
      ]).start();
    }

    return () => {
      pulseLoopRef.current?.stop();
    };
  }, [status, isVerifying]);

  // Interpolación de rotación del semicírculo derecho (0% a 50%)
  const rotateRight = progressValue.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ['0deg', '180deg', '180deg'],
    extrapolate: 'clamp',
  });

  // Interpolación de rotación del semicírculo izquierdo (50% a 100%)
  const rotateLeft = progressValue.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ['0deg', '0deg', '180deg'],
    extrapolate: 'clamp',
  });

  // Glow dinámico del contenedor
  const getContainerGlow = () => {
    if (status === 'success') {
      return {
        shadowColor: '#10B981',
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 12,
      };
    }
    if (status === 'error') {
      return {
        shadowColor: '#EF4444',
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 12,
      };
    }
    if (isVerifying) {
      return {
        shadowColor: '#002566',
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 8,
      };
    }
    return {
      shadowColor: '#000000',
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 4,
    };
  };

  return (
    <View style={styles.wrapper}>
      {/* Encabezado: Escudo/Tarjeta + Título */}
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Ionicons
            name={badgeIcon ?? (imageSource ? 'finger-print-outline' : 'card-outline')}
            size={42}
            color="#002566"
          />
        </View>
        <View style={styles.headerTexts}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.subtitleText}>{subtitle}</Text>
        </View>
      </View>

      {/* Círculo de verificación con progreso animado */}
      <TouchableOpacity
        activeOpacity={onPress ? 0.85 : 1}
        onPress={onPress}
        disabled={!onPress}
        style={styles.centerArea}
      >
        <Animated.View
          style={[
            styles.outerCircle,
            getContainerGlow(),
            {
              transform: [{ scale: pulseValue }],
            },
          ]}
        >
          {/* ======================================================== */}
          {/* 1. Capa de Progreso Normal (Azul Marino / Primario)      */}
          {/* ======================================================== */}
          {/* Mitad Derecha */}
          <View style={styles.maskRight}>
            <Animated.View
              style={[
                styles.rotatorRight,
                {
                  transform: [{ rotate: rotateRight }],
                },
              ]}
            >
              <View style={[styles.semicircleLeft, styles.fillPrimary]} />
            </Animated.View>
          </View>

          {/* Mitad Izquierda */}
          <View style={styles.maskLeft}>
            <Animated.View
              style={[
                styles.rotatorLeft,
                {
                  transform: [{ rotate: rotateLeft }],
                },
              ]}
            >
              <View style={[styles.semicircleRight, styles.fillPrimary]} />
            </Animated.View>
          </View>

          {/* ======================================================== */}
          {/* 2. Capa de Progreso Éxito (Verde Esmeralda #10B981)       */}
          {/* ======================================================== */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: successColorOpacity }]}>
            <View style={styles.maskRight}>
              <Animated.View
                style={[
                  styles.rotatorRight,
                  {
                    transform: [{ rotate: rotateRight }],
                  },
                ]}
              >
                <View style={[styles.semicircleLeft, styles.fillSuccess]} />
              </Animated.View>
            </View>
            <View style={styles.maskLeft}>
              <Animated.View
                style={[
                  styles.rotatorLeft,
                  {
                    transform: [{ rotate: rotateLeft }],
                  },
                ]}
              >
                <View style={[styles.semicircleRight, styles.fillSuccess]} />
              </Animated.View>
            </View>
          </Animated.View>

          {/* ======================================================== */}
          {/* 3. Capa de Progreso Error (Rojo Carmesí #EF4444)         */}
          {/* ======================================================== */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: errorColorOpacity }]}>
            <View style={styles.maskRight}>
              <Animated.View
                style={[
                  styles.rotatorRight,
                  {
                    transform: [{ rotate: rotateRight }],
                  },
                ]}
              >
                <View style={[styles.semicircleLeft, styles.fillError]} />
              </Animated.View>
            </View>
            <View style={styles.maskLeft}>
              <Animated.View
                style={[
                  styles.rotatorLeft,
                  {
                    transform: [{ rotate: rotateLeft }],
                  },
                ]}
              >
                <View style={[styles.semicircleRight, styles.fillError]} />
              </Animated.View>
            </View>
          </Animated.View>

          {/* ======================================================== */}
          {/* 4. Núcleo Interior Blanco (Donde vive la imagen/icono)   */}
          {/* ======================================================== */}
          <View style={styles.innerCircle}>
            {/* Imagen o Ícono Principal */}
            <Animated.View
              style={[
                styles.iconLayer,
                {
                  opacity: contentOpacity,
                  transform: [{ scale: contentScale }],
                },
              ]}
            >
              {imageSource ? (
                <Image
                  source={imageSource}
                  style={styles.customImage}
                  resizeMode="contain"
                />
              ) : (
                <Ionicons
                  name={iconName}
                  size={135}
                  color={isVerifying ? '#002566' : '#002566'}
                />
              )}
            </Animated.View>

            {/* Checkmark Verde al Validar */}
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

            {/* X Roja de Error al Denegar */}
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
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

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
  badge: {
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
  centerArea: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  outerCircle: {
    width: DIAMETER,
    height: DIAMETER,
    borderRadius: RADIUS,
    backgroundColor: '#E2E8F0', // Color del carril/track inactivo
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  maskRight: {
    position: 'absolute',
    top: 0,
    left: RADIUS,
    width: RADIUS,
    height: DIAMETER,
    overflow: 'hidden',
  },
  rotatorRight: {
    position: 'absolute',
    top: 0,
    left: -RADIUS,
    width: DIAMETER,
    height: DIAMETER,
  },
  semicircleLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: RADIUS,
    height: DIAMETER,
    borderTopLeftRadius: RADIUS,
    borderBottomLeftRadius: RADIUS,
  },
  maskLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: RADIUS,
    height: DIAMETER,
    overflow: 'hidden',
  },
  rotatorLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: DIAMETER,
    height: DIAMETER,
  },
  semicircleRight: {
    position: 'absolute',
    top: 0,
    left: RADIUS,
    width: RADIUS,
    height: DIAMETER,
    borderTopRightRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
  },
  fillPrimary: {
    backgroundColor: '#002566',
  },
  fillSuccess: {
    backgroundColor: '#10B981',
  },
  fillError: {
    backgroundColor: '#EF4444',
  },
  innerCircle: {
    position: 'absolute',
    width: INNER_DIAMETER,
    height: INNER_DIAMETER,
    borderRadius: INNER_RADIUS,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  absoluteCenter: {
    position: 'absolute',
  },
  customImage: {
    width: 150,
    height: 150,
    tintColor: '#002566',
  },
});
