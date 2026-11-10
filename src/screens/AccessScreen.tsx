import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AccessHeader } from '../components/access/AccessHeader';
import { NumericKeypad } from '../components/access/NumericKeypad';
import { AdminLoginModal } from '../components/access/AdminLoginModal';
import {
  CiVerificationIndicator,
  CiVerificationStatus,
} from '../components/access/CiVerificationIndicator';
import {
  BiometricIndicator,
  BiometricStatus,
} from '../components/access/BiometricIndicator';
import { AttributionFooter } from '../components/access/AttributionFooter';
import { WelcomeResultCard } from '../components/access/WelcomeResultCard';
import { checkinService } from '../services/CheckinService';
import { CheckinResult } from '../models';
import colors from '../theme';

interface AccessScreenProps {
  onOpenStaff?: () => void;
}

export const AccessScreen: React.FC<AccessScreenProps> = ({ onOpenStaff }) => {
  const [ci, setCi] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<CiVerificationStatus>('idle');
  const [activeResult, setActiveResult] = useState<CheckinResult | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const { width } = useWindowDimensions();
  const isWide = width >= 820;

  // Soporte para teclado físico / lector de código de barras en Web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Si está cargando o el modal de login admin está abierto, ignorar
        if (loading || showAdminLogin) return;

        // Si hay un card de resultado activo y el usuario teclea, lo cerramos para el siguiente
        if (activeResult !== null) {
          setActiveResult(null);
          setVerificationStatus('idle');
        }

        if (e.key >= '0' && e.key <= '9') {
          setVerificationStatus('idle');
          if (ci.length < 10) setCi((prev) => prev + e.key);
        } else if (e.key === 'Backspace') {
          setVerificationStatus('idle');
          setCi((prev) => prev.slice(0, -1));
        } else if (e.key === 'Enter') {
          handleCheckin();
        } else if (e.key === 'Escape') {
          setVerificationStatus('idle');
          setCi('');
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [ci, loading, activeResult, showAdminLogin]);

  const handleKeyPress = (char: string) => {
    if (activeResult) setActiveResult(null);
    if (verificationStatus !== 'idle') setVerificationStatus('idle');
    if (ci.length < 10) {
      setCi((prev) => prev + char);
    }
  };

  const handleDelete = () => {
    if (activeResult) setActiveResult(null);
    if (verificationStatus !== 'idle') setVerificationStatus('idle');
    setCi((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (activeResult) setActiveResult(null);
    if (verificationStatus !== 'idle') setVerificationStatus('idle');
    setCi('');
  };

  const handleCheckin = async () => {
    const ciAEnviar = ci.trim();
    if (!ciAEnviar || loading) return;

    setLoading(true);
    setActiveResult(null);
    setVerificationStatus('verifying');

    try {
      // Tiempo suficiente para apreciar cómo el círculo se va completando progresivamente (~1100ms)
      const [res] = await Promise.all([
        checkinService.procesarCheckin(ciAEnviar),
        new Promise((resolve) => setTimeout(resolve, 1100)),
      ]);

      const esValido = res.estado === 'vigente' || res.estado === 'por_vencer';
      setVerificationStatus(esValido ? 'success' : 'error');

      // Mostramos el card de resultado debajo de CiVerificationIndicator por 5 segundos
      setTimeout(() => {
        setActiveResult(res);
        setCi('');
      }, esValido ? 250 : 350);
    } catch (error) {
      console.error('Error al procesar checkin:', error);
      setVerificationStatus('error');
      setTimeout(() => {
        setActiveResult({
          encontrado: false,
          ci: ciAEnviar,
          estado: 'no_encontrado',
          mensaje: 'Error de conexión al verificar el acceso.',
          timestamp: new Date(),
        });
        setCi('');
      }, 350);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AccessHeader onOpenStaff={() => setShowAdminLogin(true)} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          isWide && styles.scrollContainerWide,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.mainContainer,
            { flexDirection: isWide ? 'row' : 'column' },
          ]}
        >
          {/* Panel Izquierdo: Control de Acceso con Círculo de Verificación Animado + Card de Resultado */}
          <View style={styles.iconsIndicatorContainer}>
            <CiVerificationIndicator status={verificationStatus} />
            {activeResult && (
              <WelcomeResultCard
                result={activeResult}
                durationSeconds={5}
                onDismiss={() => {
                  setActiveResult(null);
                  setVerificationStatus('idle');
                }}
              />
            )}
          </View>

          {/* Panel Derecho: Display del C.I. y Teclado Numérico */}
          <View style={styles.displayCardContainer}>
            {/* Display del C.I. ingresado */}
            <View style={styles.displayCard}>
              <Text style={styles.displayLabel}>DOCUMENTO DE IDENTIDAD</Text>
              <View style={styles.displayRow}>
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color="#002566"
                    style={{ marginRight: 14, width: 34, height: 34 }}
                  />
                ) : (
                  <Ionicons
                    name="card-outline"
                    size={32}
                    color="#002566"
                    style={{ marginRight: 14 }}
                  />
                )}
                <Text style={[styles.displayText, !ci && styles.placeholderText]}>
                  {ci || 'Ingrese su C.I'}
                </Text>
              </View>
            </View>

            {/* Teclado numérico táctil */}
            <NumericKeypad
              onKeyPress={handleKeyPress}
              onDelete={handleDelete}
              onClear={handleClear}
              onSubmit={handleCheckin}
              disabled={loading}
              canSubmit={!loading && !!ci.trim()}
            />

            {/* Footer de Atribución y Marca */}
            <View style={{ marginTop: 10 }}>
              <AttributionFooter />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal de Login / PIN de Administrador */}
      <AdminLoginModal
        visible={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onSuccess={() => {
          setShowAdminLogin(false);
          onOpenStaff?.();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  scrollContainerWide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    width: '100%',
    maxWidth: 1100,
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 32,
  },
  iconsIndicatorContainer: {
    flex: 1,
    maxWidth: 500,
    width: '100%',
    height: '100%',
  },
  displayCardContainer: {
    flex: 1,
    maxWidth: 440,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 24,
    paddingVertical: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  displayLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  displayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#002566',
    letterSpacing: -0.5,
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.35,
  },
});
