import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CheckinResult } from '../../models';

interface WelcomeResultCardProps {
  result: CheckinResult;
  onDismiss: () => void;
  durationSeconds?: number;
}

export const formatFechaDDMMAAAA = (fechaStr?: string): string => {
  if (!fechaStr) return '--/--/----';
  const clean = fechaStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return clean;
};

export const WelcomeResultCard: React.FC<WelcomeResultCardProps> = ({
  result,
  onDismiss,
  durationSeconds = 5,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const progressBarAnim = useRef(new Animated.Value(1)).current;

  const isVigente = result.estado === 'vigente';
  const isPorVencer = result.estado === 'por_vencer';
  const isVencida = result.estado === 'vencida';
  const isSinPlan = result.estado === 'sin_plan';
  const isNoEncontrado = result.estado === 'no_encontrado' || !result.encontrado;
  const isSuccess = isVigente || isPorVencer;

  useEffect(() => {
    // 1. Animación de entrada suave
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Barra de progreso que disminuye durante los segundos estipulados
    Animated.timing(progressBarAnim, {
      toValue: 0,
      duration: durationSeconds * 1000,
      useNativeDriver: false,
    }).start();

    // 3. Temporizador de cuenta regresiva
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const fechaFinFormateada = formatFechaDDMMAAAA(result.fechaFin);

  const progressWidth = progressBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Configuración de textos y colores según el estado
  let badgeIcon: any = 'checkmark-circle';
  let badgeBg = 'rgba(16, 185, 129, 0.12)';
  let badgeBorder = '#6EE7B7';
  let badgeTextColor = '#059669';
  let badgeText = 'AL DÍA';

  let title = '¡BIENVENIDO!';
  let titleColor = '#059669';
  let progressColor = '#10B981';

  if (isPorVencer) {
    badgeIcon = 'warning';
    badgeBg = 'rgba(245, 158, 11, 0.12)';
    badgeBorder = '#FCD34D';
    badgeTextColor = '#D97706';
    badgeText = `POR VENCER (QUEDAN ${result.diasRestantes ?? 0} DÍAS)`;
    title = '¡BIENVENIDO!';
    titleColor = '#D97706';
    progressColor = '#F59E0B';
  } else if (isVencida) {
    badgeIcon = 'close-circle';
    badgeBg = 'rgba(239, 68, 68, 0.12)';
    badgeBorder = '#FCA5A5';
    badgeTextColor = '#DC2626';
    badgeText = 'CUOTA VENCIDA';
    title = 'ACCESO DENEGADO';
    titleColor = '#DC2626';
    progressColor = '#EF4444';
  } else if (isSinPlan) {
    badgeIcon = 'alert-circle';
    badgeBg = 'rgba(239, 68, 68, 0.12)';
    badgeBorder = '#FCA5A5';
    badgeTextColor = '#DC2626';
    badgeText = 'SIN PLAN ACTIVO';
    title = 'ACCESO DENEGADO';
    titleColor = '#DC2626';
    progressColor = '#EF4444';
  } else if (isNoEncontrado) {
    badgeIcon = 'help-circle';
    badgeBg = 'rgba(100, 116, 139, 0.12)';
    badgeBorder = '#CBD5E1';
    badgeTextColor = '#64748B';
    badgeText = 'NO REGISTRADO';
    title = 'ACCESO DENEGADO';
    titleColor = '#DC2626';
    progressColor = '#EF4444';
  }

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchableArea}
        activeOpacity={0.9}
        onPress={handleClose}
      >
        {/* Línea 1: "Al día o no" (Badge de Estado) */}
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: badgeBg, borderColor: badgeBorder },
            ]}
          >
            <Ionicons
              name={badgeIcon}
              size={15}
              color={badgeTextColor}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.badgeText, { color: badgeTextColor }]}>
              {badgeText}
            </Text>
          </View>
        </View>

        {/* Línea 2: "BIENVENIDO" o "ACCESO DENEGADO" */}
        <Text style={[styles.welcomeTitle, { color: titleColor }]}>
          {title}
        </Text>

        {/* Línea 3: (NOMBRE DEL ALUMNO o IDENTIFICADOR) */}
        <Text
          style={[
            styles.studentName,
            isNoEncontrado && { color: '#475569', fontSize: 22 },
          ]}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {result.nombreCompleto
            ? result.nombreCompleto.toUpperCase()
            : result.ci
            ? `C.I. N° ${result.ci}`
            : 'SOCIO NO ENCONTRADO'}
        </Text>

        {/* Línea 4: Fecha de vencimiento si aplica */}
        {result.fechaFin ? (
          <View
            style={[
              styles.dateContainer,
              !isSuccess && styles.dateContainerError,
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={isSuccess ? '#64748B' : '#DC2626'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.dateLabel,
                !isSuccess && { color: '#DC2626' },
              ]}
            >
              {isSuccess ? 'Vencimiento del plan: ' : 'Venció el: '}
            </Text>
            <Text
              style={[
                styles.dateValue,
                !isSuccess && { color: '#DC2626' },
              ]}
            >
              {fechaFinFormateada}
            </Text>
          </View>
        ) : null}

        {/* Notificación de Recepción cuando el acceso es denegado */}
        {!isSuccess && (
          <View style={styles.noticeContainer}>
            <Ionicons
              name={
                isSinPlan
                  ? 'alert-circle-outline'
                  : isNoEncontrado
                  ? 'help-circle-outline'
                  : 'information-circle-outline'
              }
              size={15}
              color="#DC2626"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.noticeText}>
              {isVencida
                ? 'Por favor pase por recepción para regularizar su cuota'
                : isSinPlan
                ? 'No posee un plan activo. Consulte en recepción'
                : 'Socio no registrado en el sistema. Consulte en recepción'}
            </Text>
          </View>
        )}

        {/* Barra de progreso inferior de 5 segundos */}
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressWidth,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    overflow: 'hidden',
  },
  touchableArea: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeRow: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 4,
    textAlign: 'center',
  },
  studentName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#002566',
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 32,
    width: '100%',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  dateContainerError: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: '#FECACA',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: -0.2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#002566',
    letterSpacing: -0.2,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginTop: 4,
    marginBottom: 6,
    maxWidth: '96%',
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  progressBarTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#F1F5F9',
  },
  progressBarFill: {
    height: '100%',
  },
});
