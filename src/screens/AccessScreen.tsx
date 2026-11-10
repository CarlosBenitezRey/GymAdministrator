import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AccessHeader } from '../components/access/AccessHeader';
import { AdminLoginModal } from '../components/access/AdminLoginModal';
import {
  CiVerificationIndicator,
  CiVerificationStatus,
} from '../components/access/CiVerificationIndicator';
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

  const inputRef = useRef<any>(null);

  // Mantener siempre el foco en el input para recibir el keypad físico sin retraso
  useEffect(() => {
    if (!showAdminLogin) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showAdminLogin, activeResult]);

  // Soporte universal para teclado físico / keypad externo / lector de código de barras
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Si está cargando o el modal de login admin está abierto, ignorar
        if (loading || showAdminLogin) return;

        const target = e.target as HTMLElement | null;
        const isInputFocused =
          target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

        if (e.key === 'Enter') {
          e.preventDefault();
          handleCheckin();
          return;
        }

        if (e.key === 'Escape') {
          e.preventDefault();
          setCi('');
          setVerificationStatus('idle');
          setActiveResult(null);
          return;
        }

        // Si el usuario teclea mientras hay un resultado activo, cerramos el resultado para el siguiente
        if (activeResult !== null && e.key >= '0' && e.key <= '9') {
          setActiveResult(null);
          setVerificationStatus('idle');
        }

        // Si el TextInput no tenía el foco en Web (ej. click afuera), capturamos igualmente el dígito
        if (!isInputFocused) {
          if (e.key >= '0' && e.key <= '9') {
            setVerificationStatus('idle');
            if (ci.length < 10) {
              setCi((prev) => prev + e.key);
            }
            inputRef.current?.focus();
          } else if (e.key === 'Backspace') {
            setVerificationStatus('idle');
            setCi((prev) => prev.slice(0, -1));
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [ci, loading, activeResult, showAdminLogin]);

  const handleCheckin = async () => {
    const ciAEnviar = ci.trim();
    if (!ciAEnviar || loading) return;

    setLoading(true);
    setActiveResult(null);
    setVerificationStatus('verifying');

    try {
      // Tiempo suficiente para apreciar la animación progresiva (~1100ms)
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
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.mainContainer}
          onPress={() => inputRef.current?.focus()}
        >
          {/* Indicador Central de Verificación C.I. */}
          <CiVerificationIndicator status={verificationStatus} />

          {/* Resultado o Campo de Entrada optimizado para Keypad Físico */}
          {activeResult ? (
            <WelcomeResultCard
              result={activeResult}
              durationSeconds={5}
              onDismiss={() => {
                setActiveResult(null);
                setVerificationStatus('idle');
                inputRef.current?.focus();
              }}
            />
          ) : (
            <View style={styles.displayCard}>
              <Text style={styles.displayLabel}>DOCUMENTO DE IDENTIDAD</Text>
              <View style={styles.displayRow}>
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color="#002566"
                    style={{ marginRight: 14, width: 32, height: 32 }}
                  />
                ) : (
                  <Ionicons
                    name="card-outline"
                    size={30}
                    color="#002566"
                    style={{ marginRight: 14 }}
                  />
                )}
                <TextInput
                  ref={inputRef}
                  value={ci}
                  onChangeText={(text) => {
                    if (activeResult) {
                      setActiveResult(null);
                    }
                    if (verificationStatus !== 'idle') {
                      setVerificationStatus('idle');
                    }
                    const numeric = text.replace(/[^0-9]/g, '').slice(0, 10);
                    setCi(numeric);
                  }}
                  placeholder="Ingrese su C.I"
                  placeholderTextColor="#94A3B8"
                  style={styles.textInput}
                  keyboardType="numeric"
                  maxLength={10}
                  autoFocus={true}
                  showSoftInputOnFocus={false}
                  blurOnSubmit={false}
                  onSubmitEditing={handleCheckin}
                  editable={!loading}
                />
                {ci.length > 0 && !loading && (
                  <TouchableOpacity
                    onPress={() => {
                      setCi('');
                      setVerificationStatus('idle');
                      inputRef.current?.focus();
                    }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.clearButton}
                  >
                    <Ionicons name="close-circle" size={24} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Indicador sutil de keypad numérico conectado */}
              <View style={styles.keypadHintRow}>
                <Ionicons name="keypad-outline" size={16} color="#64748B" />
                <Text style={styles.keypadHintText}>
                  Escriba su C.I. y presione ENTER en el teclado numérico
                </Text>
              </View>
            </View>
          )}

          {/* Footer de Atribución y Marca */}
          <View style={styles.footerContainer}>
            <AttributionFooter />
          </View>
        </TouchableOpacity>
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
  displayCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 22,
    paddingVertical: 18,
    marginTop: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
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
  textInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '900',
    color: '#002566',
    letterSpacing: -0.5,
    padding: 0,
    margin: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  clearButton: {
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  keypadHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  footerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});
