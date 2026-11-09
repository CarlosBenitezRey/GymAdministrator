const appManifest = require('../../app.json');

const expoConfig = appManifest?.expo || {};

export interface ProductBranding {
  primary: string;
  primaryDark: string;
  primaryBright: string;
  background: string;
}

export interface ProductAttribution {
  prefix: string;
  label: string;
  logo: any;
  url: string;
}

export interface ProductConfig {
  id: string;
  name: string;
  logo: any;
  subtitle: string;
  tagline: string;
  version: string;
  branding: ProductBranding;
  attribution: ProductAttribution;
}

/**
 * Identidad y metadatos visibles del producto.
 * Mantener este archivo como única fuente para el login y futuras pantallas
 * de soporte. La versión se obtiene de app.json para evitar duplicaciones.
 */
export const PRODUCT_CONFIG: ProductConfig = {
  id: expoConfig.slug || 'takeordersks',
  name: expoConfig.name || 'TakeOrdersKS',
  logo: require('../../assets/branding/takeorders-logo.png'),
  subtitle: 'Sistema de gestión gastronómica',
  tagline: 'Gestión gastronómica profesional',
  version: expoConfig.version || '0.0.0',
  branding: {
    primary: '#356A4B',
    primaryDark: '#183B2A',
    primaryBright: '#5A9870',
    background: '#07130D',
  },
  attribution: {
    prefix: 'Desarrollado por',
    label: 'Manageopy',
    logo: require('../../assets/branding/manageopy-logo.png'),
    url: 'https://manageopy.com',
  },
};

export const APP_VERSION_LABEL = `v${PRODUCT_CONFIG.version}`;

