import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PRODUCT_CONFIG, APP_VERSION_LABEL } from '../../config';
import { ASSETS } from '../../theme';

interface AttributionFooterProps {
  onPress?: () => void;
  version?: string;
  dark?: boolean;
}

export const AttributionFooter: React.FC<AttributionFooterProps> = ({
  onPress,
  version = APP_VERSION_LABEL,
  dark = false,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (PRODUCT_CONFIG.attribution.url) {
      Linking.openURL(PRODUCT_CONFIG.attribution.url).catch((err) => {
        console.warn('No se pudo abrir el enlace de atribución:', err);
      });
    }
  };

  const prefix = PRODUCT_CONFIG.attribution.prefix || 'DESARROLLADO POR';
  const label = PRODUCT_CONFIG.attribution.label || 'Manageopy';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.contentRow}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Logo en squircle blanco con la imagen Manageopy */}
        <View style={styles.logoSquircle}>
          <Image
            source={ASSETS.manageopyLogo}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Textos: Desarrollado por + Marca + Flecha ↗ + Versión */}
        <View style={styles.textContainer}>
          <Text style={[styles.prefixText, dark && styles.prefixTextDark]}>
            {prefix.toUpperCase()}
          </Text>
          <View style={styles.brandRow}>
            <Text style={[styles.brandText, dark && styles.brandTextDark]}>
              {label}
            </Text>
            <Feather
              name="arrow-up-right"
              size={13}
              color={dark ? '#FFFFFF' : '#002566'}
              style={styles.arrowIcon}
            />
            <View style={[styles.versionPill, dark && styles.versionPillDark]}>
              <Text style={[styles.versionText, dark && styles.versionTextDark]}>
                {version}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSquircle: {
    width: 25,
    height: 25,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  logoImage: {
    width: 19,
    height: 19,
  },
  textContainer: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  prefixText: {
    fontSize: 6.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  prefixTextDark: {
    color: '#8E9B93',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#002566',
    letterSpacing: -0.4,
  },
  brandTextDark: {
    color: '#FFFFFF',
  },
  arrowIcon: {
    marginLeft: 2,
    marginRight: 4,
  },
  versionPill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 999,
  },
  versionPillDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'transparent',
  },
  versionText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: -0.2,
  },
  versionTextDark: {
    color: '#A3B899',
  },
});
