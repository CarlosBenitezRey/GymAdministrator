import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CheckinResult } from '../../models';

interface Props {
  result: CheckinResult | null;
  onDismiss: () => void;
  autoCloseSeconds?: number;
}

export const CheckinResultCard: React.FC<Props> = ({
  result,
  onDismiss,
  autoCloseSeconds = 5,
}) => {
  const [countdown, setCountdown] = useState(autoCloseSeconds);

  useEffect(() => {
    if (!result) return;
    setCountdown(autoCloseSeconds);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [result]);

  if (!result) return null;

  const isVigente = result.estado === 'vigente';
  const isPorVencer = result.estado === 'por_vencer';
  const isVencida = result.estado === 'vencida';
  const isSinPlan = result.estado === 'sin_plan';

  // Configuración de temas según el estado
  let themeColor = '#10B981'; // Verde
  let iconName: any = 'checkmark-circle';
  let title = '¡BIENVENIDO!';
  let badgeText = 'AL DÍA';

  if (isPorVencer) {
    themeColor = '#F59E0B'; // Amarillo
    iconName = 'warning';
    title = '¡¡BIENVENIDO!';
    badgeText = `VENCE EN ${result.diasRestantes} DÍAS`;
  } else if (isVencida) {
    themeColor = '#EF4444'; // Rojo
    iconName = 'close-circle';
    title = 'ACCESO DENEGADO';
    badgeText = 'CUOTA VENCIDA';
  } else if (isSinPlan) {
    themeColor = '#F43F5E';
    iconName = 'alert-circle';
    title = 'ACCESO DENEGADO';
    badgeText = 'SIN PLAN ACTIVO';
  } else if (!result.encontrado) {
    themeColor = '#64748B'; // Gris
    iconName = 'help-circle';
    title = 'NO REGISTRADO';
    badgeText = 'NO ENCONTRADO';
  }

  return (
    <Modal visible={true} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { borderColor: themeColor }]}>
          {/* Badge superior */}
          <View style={[styles.badge, { backgroundColor: themeColor }]}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>

          {/* Icono animado */}
          <View style={[styles.iconContainer, { backgroundColor: themeColor + '20' }]}>
            <Ionicons name={iconName} size={90} color={themeColor} />
          </View>

          {/* Título principal */}
          <Text style={[styles.title, { color: themeColor }]}>{title}</Text>

          {/* Nombre del alumno */}
          {result.nombreCompleto && (
            <Text style={styles.studentName}>{result.nombreCompleto}</Text>
          )}

          {/* C.I. */}
          {result.ci && (
            <Text style={styles.ciText}>C.I.: {result.ci}</Text>
          )}

          {/* Fecha de vencimiento si aplica */}
          {result.fechaFin && (
            <Text style={styles.dateText}>
              Vencimiento del plan: <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>{result.fechaFin}</Text>
            </Text>
          )}

          {/* Detalles del plan 
          {result.nombrePlan && (
            <View style={styles.planBox}>
              <Ionicons name="fitness-outline" size={22} color="#38BDF8" />
              <Text style={styles.planText}>Plan: {result.nombrePlan}</Text>
            </View>
          )}*/}

          {/* Botón de cierre y contador */}
          <TouchableOpacity
            style={[styles.dismissButton, { backgroundColor: themeColor }]}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.dismissButtonText}>
              CONTINUAR ({countdown}s)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#0F172A',
    borderRadius: 28,
    borderWidth: 3,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  badge: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  iconContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginBottom: 8,
    textAlign: 'center',
  },
  studentName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  ciText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: -0.35,
    marginBottom: 16,
  },
  planBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  planText: {
    color: '#38BDF8',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginLeft: 8,
  },
  dateText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.35,
    marginBottom: 16,
  },
  messageBox: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderLeftWidth: 4,
    padding: 14,
    borderRadius: 8,
    marginBottom: 24,
  },
  messageText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
  },
  dismissButton: {
    width: '100%',
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
});
