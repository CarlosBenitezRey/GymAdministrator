import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme';

interface Props {
  onKeyPress: (char: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  canSubmit?: boolean;
}

export const NumericKeypad: React.FC<Props> = ({
  onKeyPress,
  onDelete,
  onClear,
  onSubmit,
  disabled = false,
  canSubmit = true,
}) => {
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['CLEAR', '0', 'DEL'],
  ];

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((btn) => {
            if (btn === 'CLEAR') {
              return (
                <TouchableOpacity
                  key={btn}
                  style={[styles.keyButton, styles.auxButton]}
                  onPress={onClear}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <Text style={styles.auxButtonText}>C</Text>
                </TouchableOpacity>
              );
            }
            if (btn === 'DEL') {
              return (
                <TouchableOpacity
                  key={btn}
                  style={[styles.keyButton, styles.auxButton]}
                  onPress={onDelete}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <Ionicons name="backspace-outline" size={28} color="#CBD5E1" />
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={btn}
                style={styles.keyButton}
                onPress={() => onKeyPress(btn)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Text style={styles.keyText}>{btn}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <TouchableOpacity
        style={[styles.submitButton, (disabled || !canSubmit) && styles.submitDisabled]}
        onPress={onSubmit}
        disabled={disabled || !canSubmit}
        activeOpacity={0.8}
      >
        <Text style={styles.submitText}>VERIFICAR</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  keyButton: {
    flex: 1,
    height: 70,
    marginHorizontal: 5,
    backgroundColor: colors.primaryButton || '#002566',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#001A47',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 3,
  },
  auxButton: {
    backgroundColor: '#0F172A',
    borderColor: '#001A47',
  },
  keyText: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  auxButtonText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F87171',
  },
  submitButton: {
    flexDirection: 'row',
    height: 68,
    backgroundColor: colors.primaryButton || '#002566',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#001A47',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  submitDisabled: {
    backgroundColor: '#94A3B8',
    borderColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
});
