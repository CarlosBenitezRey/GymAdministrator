import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { checkinService } from '../services/CheckinService';
import { Asistencia } from '../models';
import colors, { POS_COLORS, POS_TYPOGRAPHY } from '../theme';
import { StudentsScreen } from './StudentsScreen';
import { PlansScreen } from './PlansScreen';

interface ReceptionScreenProps {
  onExitToAccess?: () => void;
  initialTab?: 'students' | 'live' | 'plans';
}

export const ReceptionScreen: React.FC<ReceptionScreenProps> = ({ onExitToAccess, initialTab = 'students' }) => {
  const [currentTab, setCurrentTab] = useState<'live' | 'students' | 'plans'>(initialTab);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarAsistencias = async () => {
    setLoading(true);
    try {
      // Obtenemos únicamente las entradas del día de hoy (desde las 00:00 hs)
      const data = await checkinService.obtenerIngresosDeHoy(100);
      setAsistencias(data);
    } catch (e) {
      console.error('Error al cargar asistencias:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAsistencias();

    // 1. Suscripción Realtime a Supabase: sólo agregar a la lista si corresponde al día de hoy
    const unsuscribe = checkinService.suscribirIngresosEnVivo((nuevaAsistencia) => {
      const now = new Date();
      const inicioHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const fechaAsistencia = nuevaAsistencia.fecha_hora ? new Date(nuevaAsistencia.fecha_hora) : new Date();

      if (fechaAsistencia >= inicioHoy) {
        setAsistencias((prev) => [nuevaAsistencia, ...prev]);
      }
    });

    // 2. Temporizador para reiniciar automáticamente a las 00:00 hs de cada día
    let midnightTimer: any;
    const programarLimpiezaMedianoche = () => {
      const now = new Date();
      // Próxima medianoche a las 00:00:00.100 hs
      const proximaMedianoche = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        100
      );
      const msHastaMedianoche = proximaMedianoche.getTime() - now.getTime();

      midnightTimer = setTimeout(() => {
        // Al llegar a las 00:00 se reinician los contadores y se recargan las entradas del nuevo día
        setAsistencias([]);
        cargarAsistencias();
        programarLimpiezaMedianoche();
      }, msHastaMedianoche);
    };

    programarLimpiezaMedianoche();

    return () => {
      unsuscribe();
      if (midnightTimer) clearTimeout(midnightTimer);
    };
  }, []);

  const handleLimpiarControl = () => {
    const mensaje = '¿Deseas vaciar el registro de entradas y reiniciar los contadores de hoy a cero?';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmado = window.confirm(mensaje);
      if (confirmado) {
        ejecutarLimpieza();
      }
    } else {
      Alert.alert(
        'Reiniciar Control Diario',
        mensaje,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Limpiar', style: 'destructive', onPress: ejecutarLimpieza },
        ]
      );
    }
  };

  const ejecutarLimpieza = async () => {
    setLoading(true);
    try {
      await checkinService.limpiarTodosLosRegistros();
      setAsistencias([]);
    } catch (err) {
      console.error('Error al limpiar registros de asistencias:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalHoy = asistencias.length;
  const permitidosHoy = asistencias.filter((a) =>
    a.estado_ingreso === 'permitido' || a.estado_ingreso === 'permitido_por_vencer'
  ).length;
  const morososHoy = asistencias.filter((a) =>
    a.estado_ingreso.startsWith('rechazado')
  ).length;

  const renderItem = ({ item }: { item: Asistencia }) => {
    const isPermitido = item.estado_ingreso === 'permitido';
    const isPorVencer = item.estado_ingreso === 'permitido_por_vencer';
    const isRechazado = item.estado_ingreso.startsWith('rechazado');

    let badgeColor = '#10B981';
    let badgeText = 'PERMITIDO';
    let iconName: any = 'checkmark-circle-outline';

    if (isPorVencer) {
      badgeColor = '#F59E0B';
      badgeText = 'POR VENCER';
      iconName = 'warning-outline';
    } else if (isRechazado) {
      badgeColor = '#EF4444';
      badgeText = 'DENEGADO';
      iconName = 'close-circle-outline';
    }

    const hora = item.fecha_hora
      ? new Date(item.fecha_hora).toLocaleTimeString('es-PY', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      : '--:--';

    return (
      <View style={styles.cardItem}>
        <View style={styles.timeBadge}>
          <Ionicons name="time-outline" size={16} color="#94A3B8" style={{ marginRight: 4 }} />
          <Text style={styles.timeText}>{hora}</Text>
        </View>

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {(item.alumno || item.alumnos)?.nombre_completo || 'Socio'}
          </Text>
          <Text style={styles.studentDetails}>
            C.I.: {(item.alumno || item.alumnos)?.ci || '---'} {(item.alumno || item.alumnos)?.telefono ? `| Tel: ${(item.alumno || item.alumnos)?.telefono}` : ''}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: badgeColor + '20', borderColor: badgeColor }]}>
          <Ionicons name={iconName} size={16} color={badgeColor} style={{ marginRight: 6 }} />
          <Text style={[styles.statusBadgeText, { color: badgeColor }]}>{badgeText}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Barra superior de administración y recepción */}
      <View style={styles.topAdminBar}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="barbell" size={30} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brandTitle}>SANSON GYM</Text>
            <Text style={styles.brandSubtitle}>PANEL DE ADMINISTRACIÓN</Text>
          </View>
        </View>

        {/* Pestañas internas de recepción */}
        <View style={styles.navTabs}>
          <TouchableOpacity
            style={[styles.tabBtn, currentTab === 'students' && styles.tabBtnActive]}
            onPress={() => setCurrentTab('students')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="people-outline"
              size={18}
              color={currentTab === 'students' ? '#ffffffff' : '#94a3b881'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, currentTab === 'students' && styles.tabBtnTextActive]}>
              Padrón de Socios
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, currentTab === 'live' && styles.tabBtnActive]}
            onPress={() => setCurrentTab('live')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="radio-outline"
              size={18}
              color={currentTab === 'live' ? '#ffffffff' : '#94a3b881'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, currentTab === 'live' && styles.tabBtnTextActive]}>
              Accesos en Vivo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, currentTab === 'plans' && styles.tabBtnActive]}
            onPress={() => setCurrentTab('plans')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="barbell-outline"
              size={18}
              color={currentTab === 'plans' ? '#ffffffff' : '#94a3b881'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, currentTab === 'plans' && styles.tabBtnTextActive]}>
              Planes y Tarifas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botón para regresar a la Terminal de Acceso */}
        {onExitToAccess && (
          <TouchableOpacity
            style={styles.exitToAccessBtn}
            onPress={onExitToAccess}
            activeOpacity={0.8}
          >
            <Ionicons name="keypad-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.exitToAccessText}>Terminal de Acceso</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contenido según la pestaña interna */}
      {currentTab === 'students' ? (
        <View style={{ flex: 1 }}>
          <StudentsScreen />
        </View>
      ) : currentTab === 'plans' ? (
        <View style={{ flex: 1 }}>
          <PlansScreen />
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <View style={styles.subHeader}>
            <View>
              <Text style={styles.title}>MONITOR DE ACCESOS</Text>
              <Text style={styles.subtitle}>
                Control diario de entradas • Se reinicia a las 00:00 hs
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.cleanButton}
                onPress={handleLimpiarControl}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.cleanText}>Limpiar Control</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={cargarAsistencias}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={18} color="#F8FAFC" style={{ marginRight: 6 }} />
                <Text style={styles.refreshText}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tarjetas de métricas rápidas */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderLeftColor: '#38BDF8' }]}>
              <Text style={styles.statLabel}>TOTAL INGRESOS HOY</Text>
              <Text style={styles.statValue}>{totalHoy}</Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
              <Text style={styles.statLabel}>PERMITIDO</Text>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{permitidosHoy}</Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#EF4444' }]}>
              <Text style={styles.statLabel}>DENEGADO</Text>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{morososHoy}</Text>
            </View>
          </View>

          {/* Lista de accesos en tiempo real */}
          <View style={styles.listContainer}>
            <View style={styles.listHeader}>
              <Ionicons name="radio-outline" size={20} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={styles.listTitle}>ACCESOS RECIENTES (TIEMPO REAL)</Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Cargando accesos...</Text>
              </View>
            ) : asistencias.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="person-remove-outline" size={54} color="#475569" />
                <Text style={styles.emptyText}>Aún no hay registros de acceso hoy.</Text>
                <Text style={styles.emptySubtext}>Los alumnos que digiten su C.I. en la Terminal de Acceso aparecerán aquí al instante.</Text>
              </View>
            ) : (
              <FlatList
                data={asistencias}
                keyExtractor={(item, index) => item.id || String(index)}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topAdminBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#002566',
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderBottomEndRadius: 12,
    borderBottomStartRadius: 12,
    borderBottomWidth: 1.2,
    borderBottomColor: '#ffffffff',
    shadowColor: '#ffffffff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  navTabs: {
    flexDirection: 'row',
    backgroundColor: '#0B0F19',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#1E293B',
  },
  tabBtnText: {
    color: '#94a3b881',
    fontSize: 13,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#ffffffff',
  },
  exitToAccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  exitToAccessText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: POS_COLORS.ink,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 13,
    color: POS_COLORS.muted,
    fontWeight: '600',
    letterSpacing: -0.35,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cleanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cleanText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  refreshText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderLeftWidth: 5,
    marginHorizontal: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: POS_COLORS.muted,
    letterSpacing: -0.35,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#002566',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: POS_COLORS.ink,
    letterSpacing: -0.4,
  },
  listContent: {
    paddingBottom: 20,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 14,
  },
  timeText: {
    color: POS_COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '900',
    color: POS_COLORS.ink,
    letterSpacing: -0.35,
    marginBottom: 2,
  },
  studentDetails: {
    fontSize: 12,
    color: POS_COLORS.muted,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: POS_COLORS.muted,
    fontWeight: '600',
    marginTop: 10,
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '900',
    color: POS_COLORS.ink,
    letterSpacing: -0.4,
    marginTop: 14,
  },
  emptySubtext: {
    fontSize: 13,
    color: POS_COLORS.muted,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});
