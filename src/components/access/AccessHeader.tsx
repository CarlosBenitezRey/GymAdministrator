import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AccessHeaderProps {
  onOpenStaff?: () => void;
}

export const AccessHeader: React.FC<AccessHeaderProps> = ({ onOpenStaff }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('es-PY', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateString = time.toLocaleDateString('es-PY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.header}>
      <View style={styles.logoRow}>
        <View style={styles.logoBadge}>
          <Ionicons name="barbell" size={32} color="#ffffffff" />
        </View>
        <View>
          <Text style={styles.brandTitle}>SANSON GYM</Text>
        </View>
      </View>

      {/* Banner de instrucciones
      <View style={styles.instructionsContainer}>
        <Ionicons name="finger-print-outline" size={36} color="#ffffffff" style={{ marginRight: 12 }} />
        <View>
          <Text style={styles.instructionsTitle}> Digite su número de C.I. en el teclado para validar su acceso</Text>
        </View>
      </View>
      */}

      <View style={styles.rightSection}>
        <View style={styles.clockContainer}>
          <Text style={styles.clockText}>{timeString}</Text>
          <Text style={styles.dateText}>{dateString.toUpperCase()}</Text>
        </View>

        {onOpenStaff && (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={onOpenStaff}
            activeOpacity={0.7}
          >
            <Ionicons name="log-in-outline" size={26} color="#ffffffff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 18,
    backgroundColor: '#002566',
    borderBottomEndRadius: 12,
    borderBottomStartRadius: 12,
    borderBottomWidth: 1.2,
    borderBottomColor: '#ffffffff',
    shadowColor: '#ffffffff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: -0.3,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButton: {
    marginLeft: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  clockContainer: {
    alignItems: 'flex-end',
  },
  clockText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffffff',
    letterSpacing: 1.5,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#002566',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 20,
  },
});
