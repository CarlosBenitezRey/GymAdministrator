import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AccessHeader } from '../components/access/AccessHeader';
import { AdminLoginModal } from '../components/access/AdminLoginModal';
import {
  BiometricIndicator,
  BiometricStatus,
} from '../components/access/BiometricIndicator';
import { AttributionFooter } from '../components/access/AttributionFooter';
import { WelcomeResultCard } from '../components/access/WelcomeResultCard';
import { checkinService } from '../services/CheckinService';
import { checkinRepository } from '../repositories/CheckinRepository';
import { CheckinResult } from '../models';
import colors from '../theme';

interface AccessScreenProps {
  onOpenStaff?: () => void;
}

export const AccessScreen: React.FC<AccessScreenProps> = ({ onOpenStaff }) => {
  const [loading, setLoading] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus>('idle');
  const [activeResult, setActiveResult] = useState<CheckinResult | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Soporte para pruebas en Web: presionar ESPACIO o ENTER para simular lectura de huella
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (loading || showAdminLogin) return;

        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleBiometricScan();
        } else if (e.key === 'Escape') {
          setActiveResult(null);
          setBiometricStatus('idle');
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [loading, showAdminLogin]);

  const handleBiometricScan = async (scannedCi?: string) => {
    if (loading) return;

    setLoading(true);
    setActiveResult(null);
    setBiometricStatus('scanning');

    try {
      let targetCi = scannedCi;
      if (!targetCi) {
        // En entorno de pruebas/desarrollo, buscamos el primer alumno disponible en la base de datos
        const { data } = await checkinRepository.obtenerUltimasAsistencias(1);
        if (data && data.length > 0 && (data[0] as any).alumnos?.ci) {
          targetCi = (data[0] as any).alumnos.ci;
        } else {
          targetCi = '4567890';
        }
      }
      const ciFinal = targetCi || '4567890';

      // Tiempo suficiente para apreciar la animación de escaneo con el haz láser (~1100ms)
      const [res] = await Promise.all([
        checkinService.procesarCheckin(ciFinal),
        new Promise((resolve) => setTimeout(resolve, 1100)),
      ]);

      const esValido = res.estado === 'vigente' || res.estado === 'por_vencer';
      setBiometricStatus(esValido ? 'success' : 'error');

      setTimeout(() => {
        setActiveResult(res);
      }, esValido ? 250 : 350);
    } catch (error) {
      console.error('Error al procesar acceso biométrico:', error);
      setBiometricStatus('error');
      setTimeout(() => {
        setActiveResult({
          encontrado: false,
          ci: 'BIOMÉTRICO',
          estado: 'no_encontrado',
          mensaje: 'Error de comunicación con el sensor biométrico.',
          timestamp: new Date(),
        });
      }, 350);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AccessHeader onOpenStaff={() => setShowAdminLogin(true)} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContainer}>
          {/* Indicador Central Biométrico con Simulación de Escaneo (Láser y Anillo Giratorio) */}
          <BiometricIndicator
            status={biometricStatus}
            title="Control de Acceso"
            subtitle="Terminal de Identificación"
            onPress={handleBiometricScan}
          />

          {/* Resultado de Acceso o Tarjeta de Estado del Lector */}
          {activeResult ? (
            <WelcomeResultCard
              result={activeResult}
              durationSeconds={5}
              onDismiss={() => {
                setActiveResult(null);
                setBiometricStatus('idle');
              }}
            />
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleBiometricScan()}
              style={styles.biometricPromptCard}
            >
              <View style={styles.biometricIconBadge}>
                <Ionicons name="finger-print" size={26} color="#002566" />
              </View>
              <View style={styles.biometricTextContainer}>
                <Text style={styles.biometricPromptTitle}>LECTOR BIOMÉTRICO</Text>
                <Text style={styles.biometricPromptSubtitle}>
                  {loading
                    ? 'Escaneando y verificando huella dactilar...'
                    : 'Coloque su dedo sobre el sensor para ingresar'}
                </Text>
              </View>
              {/* {loading ? (
                <ActivityIndicator size="small" color="#002566" style={{ marginLeft: 8 }} />
              ) : (
                <View style={styles.statusDotContainer}>
                  <View style={styles.statusDot} />
                </View>
              )} */}
            </TouchableOpacity>
          )}

          {/* Footer de Atribución y Marca */}
          <View style={styles.footerContainer}>
            <AttributionFooter />
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
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  mainContainer: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricPromptCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  biometricIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 37, 102, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  biometricTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  biometricPromptTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#002566',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  biometricPromptSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 18,
  },
  statusDotContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  footerContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
});
