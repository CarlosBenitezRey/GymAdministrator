import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme';

interface AdminLoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Códigos válidos de administración
const VALID_PINS = ['1234', 'admin', 'sanson'];

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      setPin('');
      setShowPin(false);
      setError(null);
      setIsSuccess(false);
      // Auto-focus al abrir
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  // Manejo de teclado físico en Web
  useEffect(() => {
    if (!visible || isSuccess) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'Enter') {
          handleValidate();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, pin, isSuccess]);

  const handleValidate = () => {
    if (!pin.trim()) return;

    const code = pin.trim().toLowerCase();
    if (VALID_PINS.includes(code)) {
      setError(null);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 500);
    } else {
      setError('Código incorrecto. Intente nuevamente.');
      setPin('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (num: string) => {
    if (isSuccess) return;
    setError(null);
    if (pin.length < 12) {
      setPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    if (isSuccess) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isSuccess) return;
    setError(null);
    setPin('');
  };

  const numpadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', 'DEL'],
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop para cerrar al hacer clic afuera */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Panel compacto posicionado justo debajo del botón de login */}
        <View style={styles.popoverContainer}>
          {/* Caret / flecha indicadora hacia el botón superior */}
          <View style={styles.caret} />

          <View style={styles.card}>
            {/* Encabezado compacto */}
            <View style={styles.headerRow}>
              <View style={styles.titleBadge}>
                <Ionicons
                  name={isSuccess ? 'checkmark-circle' : 'shield-checkmark'}
                  size={22}
                  color={isSuccess ? '#10B981' : '#000000ff'}
                />
                <Text style={styles.title}>Panel de Administracion</Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Mensajes de error o éxito */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={15} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {isSuccess ? (
              <View style={styles.successBox}>
                <ActivityIndicator size="small" color="#10B981" style={{ marginRight: 6 }} />
                <Text style={styles.successText}>Acceso Autorizado...</Text>
              </View>
            ) : null}

            {/* Campo de PIN / Input */}
            <View style={[styles.inputContainer, error ? styles.inputError : null, isSuccess ? styles.inputSuccess : null]}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                value={pin}
                onChangeText={(text) => {
                  setError(null);
                  setPin(text);
                }}
                placeholder=""
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPin}
                keyboardType="default"
                autoCapitalize="none"
                onSubmitEditing={handleValidate}
                editable={!isSuccess}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => {
                  setShowPin(!showPin);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPin ? 'eye-outline' : 'eye-off-outline'}
                  size={19}
                  color={showPin ? '#FFFFFF' : '#94A3B8'}
                />
              </TouchableOpacity>
            </View>

            {/* Botonera Numérica Compacta */}
            <View style={styles.keypad}>
              {numpadRows.map((row, rIdx) => (
                <View key={rIdx} style={styles.keypadRow}>
                  {row.map((btn) => {
                    if (btn === 'C') {
                      return (
                        <TouchableOpacity
                          key={btn}
                          style={[styles.keyButton, styles.auxKey]}
                          onPress={handleClear}
                          disabled={isSuccess}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.clearKeyText}>C</Text>
                        </TouchableOpacity>
                      );
                    }
                    if (btn === 'DEL') {
                      return (
                        <TouchableOpacity
                          key={btn}
                          style={[styles.keyButton, styles.auxKey]}
                          onPress={handleDelete}
                          disabled={isSuccess}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="backspace-outline" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                      );
                    }
                    return (
                      <TouchableOpacity
                        key={btn}
                        style={styles.keyButton}
                        onPress={() => handleKeyPress(btn)}
                        disabled={isSuccess}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.keyText}>{btn}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Botón Ingresar */}
            <TouchableOpacity
              style={[styles.loginBtn, (!pin.trim() || isSuccess) && styles.loginBtnDisabled]}
              onPress={handleValidate}
              disabled={!pin.trim() || isSuccess}
              activeOpacity={0.8}
            >
              {isSuccess ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>ACCEDER</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  popoverContainer: {
    position: 'absolute',
    top: 86,
    right: 20,
    width: 290,
    zIndex: 1000,
  },
  caret: {
    position: 'absolute',
    top: -6,
    right: 26,
    width: 13,
    height: 13,
    backgroundColor: colors.background,
    borderColor: '#334155',
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    transform: [{ rotate: '45deg' }],
    zIndex: 10,
  },
  card: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.backgroundHeader,
    letterSpacing: -0.35,
    marginLeft: 6,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  successText: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 42,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#475569',
    paddingHorizontal: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputSuccess: {
    borderColor: '#10B981',
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    height: '100%',
    paddingVertical: 0,
    paddingHorizontal: 4,
    textAlign: 'left',
  },
  eyeButton: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypad: {
    width: '100%',
    marginBottom: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  keyButton: {
    flex: 1,
    height: 36,
    marginHorizontal: 3,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  auxKey: {
    backgroundColor: '#162032',
  },
  keyText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  clearKeyText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#EF4444',
  },
  loginBtn: {
    flexDirection: 'row',
    width: '100%',
    height: 38,
    backgroundColor: colors.backgroundHeader,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  loginBtnDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.35,
  },
  hintContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  hintCode: {
    color: '#10B981',
    fontWeight: '900',
  },
});
