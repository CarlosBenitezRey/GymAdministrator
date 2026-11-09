import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { planService } from '../services/PlanService';
import { Plan, Periodicidad } from '../models';
import { colors, POS_COLORS, POS_TYPOGRAPHY } from '../theme';

export const PlansScreen: React.FC = () => {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Nuevo Plan
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [periodicidad, setPeriodicidad] = useState<Periodicidad>('mensual');
  const [duracionDias, setDuracionDias] = useState('30');
  const [precio, setPrecio] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarPlanes = async () => {
    setLoading(true);
    try {
      const data = await planService.listarTodosLosPlanes();
      setPlanes(data);
    } catch (e) {
      console.error('Error al cargar planes:', e);
      Alert.alert('Error', 'No se pudieron cargar los planes de entrenamiento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPlanes();
  }, []);

  const handleSeleccionarPeriodicidad = (p: Periodicidad) => {
    setPeriodicidad(p);
    // Sugerencia de días estándar según periodicidad
    switch (p) {
      case 'diario':
        setDuracionDias('1');
        break;
      case 'semanal':
        setDuracionDias('7');
        break;
      case 'mensual':
        setDuracionDias('30');
        break;
      case 'semestral':
        setDuracionDias('180');
        break;
      case 'anual':
        setDuracionDias('365');
        break;
    }
  };

  const handleCrearPlan = async () => {
    const nombreLimpio = nombre.trim();
    const precioNum = parseFloat(precio.replace(/[^0-9]/g, ''));
    const diasNum = parseInt(duracionDias, 10);

    if (!nombreLimpio) {
      Alert.alert('Campo obligatorio', 'Por favor ingresa el nombre del plan.');
      return;
    }
    if (isNaN(precioNum) || precioNum <= 0) {
      Alert.alert('Precio inválido', 'Por favor ingresa un precio válido en Guaraníes.');
      return;
    }
    if (isNaN(diasNum) || diasNum <= 0) {
      Alert.alert('Duración inválida', 'La duración debe ser de al menos 1 día.');
      return;
    }

    setGuardando(true);
    try {
      await planService.crearPlan({
        nombre: nombreLimpio,
        periodicidad,
        duracion_dias: diasNum,
        precio: precioNum,
      });

      // Limpiar formulario y cerrar
      setNombre('');
      setPrecio('');
      setDuracionDias('30');
      setPeriodicidad('mensual');
      setModalVisible(false);

      await cargarPlanes();
      Alert.alert('Éxito', `El plan "${nombreLimpio}" ha sido creado y habilitado para ventas.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear el plan.');
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleEstado = async (plan: Plan) => {
    const nuevoEstado = !plan.activo;
    const accion = nuevoEstado ? 'habilitar' : 'desactivar';

    Alert.alert(
      `${nuevoEstado ? 'Habilitar' : 'Desactivar'} Plan`,
      `¿Deseas ${accion} el plan "${plan.nombre}"? ${!nuevoEstado
        ? '\n\nNo se mostrará para nuevos socios o renovaciones, pero los socios actuales lo conservarán hasta su vencimiento.'
        : ''
      }`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: nuevoEstado ? 'Habilitar' : 'Desactivar',
          style: nuevoEstado ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await planService.alternarEstadoPlan(plan.id!, nuevoEstado);
              await cargarPlanes();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo actualizar el estado del plan.');
            }
          },
        },
      ]
    );
  };

  const handleEliminarPlan = (plan: Plan) => {
    Alert.alert(
      'Eliminar Plan',
      `¿Estás seguro de que deseas eliminar permanentemente el plan "${plan.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await planService.eliminarPlan(plan.id!);
              await cargarPlanes();
              Alert.alert('Plan eliminado', `El plan "${plan.nombre}" ha sido eliminado.`);
            } catch (err: any) {
              Alert.alert('Atención', err.message || 'No se pudo eliminar el plan.');
            }
          },
        },
      ]
    );
  };

  const formatearMonto = (monto: number) => {
    return 'Gs. ' + Number(monto).toLocaleString('es-PY');
  };

  const totalActivos = planes.filter((p) => p.activo).length;
  const totalInactivos = planes.filter((p) => !p.activo).length;

  const renderPlan = ({ item }: { item: Plan }) => {
    const isActivo = item.activo;

    return (
      <View style={[styles.planCard, !isActivo && styles.planCardInactivo]}>
        <View style={styles.planCardHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={[styles.planNombre, !isActivo && styles.planNombreInactivo]}>
                {item.nombre}
              </Text>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={15} color="#94A3B8" style={{ marginRight: 5 }} />
                <Text style={styles.detailText}>{item.duracion_dias} días de duración</Text>
              </View>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={[styles.priceText, !isActivo && { color: '#64748B' }]}>
              {formatearMonto(item.precio)}
            </Text>
          </View>
        </View>

        {/* Barra inferior de acciones del plan */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={[
              styles.btnEstado,
              isActivo ? styles.btnEstadoActivo : styles.btnEstadoInactivo,
            ]}
            onPress={() => handleToggleEstado(item)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isActivo ? 'checkmark-circle' : 'pause-circle'}
              size={16}
              color={isActivo ? '#10B981' : '#94A3B8'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.btnEstadoText,
                { color: isActivo ? '#34D399' : '#94A3B8' },
              ]}
            >
              {isActivo ? 'ACTIVO (Para ventas)' : 'INACTIVO (Pausado)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnEliminar}
            onPress={() => handleEliminarPlan(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 0 }} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header con título y botón de agregar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>PLANES Y TARIFAS</Text>
          <Text style={styles.subtitle}>Catálogo de membresías, precios y periodicidad</Text>
        </View>

        <TouchableOpacity
          style={styles.btnNuevo}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.btnNuevoText}>NUEVO PLAN</Text>
        </TouchableOpacity>
      </View>

      {/* Tarjetas de métricas rápidas */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: '#0284C7' }]}>
          <Text style={styles.statLabel}>TOTAL DE PLANES</Text>
          <Text style={styles.statValue}>{planes.length}</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
          <Text style={styles.statLabel}>PLANES ACTIVOS</Text>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{totalActivos}</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#64748B' }]}>
          <Text style={styles.statLabel}>PLANES INACTIVOS</Text>
          <Text style={[styles.statValue, { color: '#94A3B8' }]}>{totalInactivos}</Text>
        </View>
      </View>

      {/* Lista de planes */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Cargando catálogo de planes...</Text>
        </View>
      ) : planes.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="barbell-outline" size={56} color="#475569" />
          <Text style={styles.emptyTitle}>No hay planes configurados</Text>
          <Text style={styles.emptyText}>Presiona el botón "Nuevo Plan" para agregar la primera membresía.</Text>
        </View>
      ) : (
        <FlatList
          data={planes}
          keyExtractor={(item) => item.id || item.nombre}
          renderItem={renderPlan}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* MODAL: CREAR NUEVO PLAN */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>CREAR PLAN DE ENTRENAMIENTO</Text>
                <Text style={styles.modalSubtitle}>Configura el nombre, tiempo y precio de la membresía</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.label}>Nombre del Plan *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Musculación + Funcional Mensual"
                placeholderTextColor={POS_COLORS.muted}
                value={nombre}
                onChangeText={setNombre}
              />

              <Text style={styles.label}>Periodicidad *</Text>
              <View style={styles.periodicidadGrid}>
                {(['diario', 'semanal', 'mensual', 'semestral', 'anual'] as Periodicidad[]).map((p) => {
                  const isSelected = periodicidad === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.periodicidadBtn, isSelected && styles.periodicidadBtnActive]}
                      onPress={() => handleSeleccionarPeriodicidad(p)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.periodicidadText, isSelected && styles.periodicidadTextActive]}>
                        {p.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Duración en días *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 30"
                    placeholderTextColor={POS_COLORS.muted}
                    value={duracionDias}
                    onChangeText={setDuracionDias}
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ flex: 1.3, marginLeft: 8 }}>
                  <Text style={styles.label}>Precio en Guaraníes (Gs.) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 180000"
                    placeholderTextColor={POS_COLORS.muted}
                    value={precio}
                    onChangeText={setPrecio}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.previewBox}>
                <Ionicons name="information-circle-outline" size={20} color="#0284C7" style={{ marginRight: 8 }} />
                <Text style={styles.previewText}>
                  El socio que contrate este plan tendrá acceso durante{' '}
                  <Text style={{ color: '#38BDF8', fontWeight: '800' }}>{duracionDias || '0'} días</Text> por un monto de{' '}
                  <Text style={{ color: POS_COLORS.primaryDark, fontWeight: '900' }}>
                    {precio ? formatearMonto(parseFloat(precio) || 0) : 'Gs. 0'}
                  </Text>.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.btnGuardar, guardando && styles.btnDisabled]}
                onPress={handleCrearPlan}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnGuardarText}>GUARDAR Y HABILITAR PLAN</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F19',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: 20,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: POS_COLORS.ink,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    color: POS_COLORS.muted,
    fontWeight: '600',
    letterSpacing: -0.35,
    marginTop: 4,
  },
  btnNuevo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnNuevoText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    borderLeftWidth: 5,
    marginHorizontal: 5,
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
    color: POS_COLORS.primaryDark,
    letterSpacing: -0.5,
  },
  listContainer: {
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  planCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  planCardInactivo: {
    opacity: 0.65,
    borderColor: '#334155',
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
    gap: 8,
  },
  planNombre: {
    fontSize: 19,
    fontWeight: '900',
    color: POS_COLORS.ink,
    letterSpacing: -0.4,
  },
  planNombreInactivo: {
    color: POS_COLORS.muted,
    fontWeight: '700',
  },
  badgePeriodicidad: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePeriodicidadText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: POS_COLORS.muted,
    fontWeight: '600',
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  priceText: {
    fontSize: 22,
    fontWeight: '900',
    color: POS_COLORS.primaryDark,
    letterSpacing: -0.5,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 14,
  },
  btnEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnEstadoActivo: {
    backgroundColor: '#064E3B20',
    borderColor: '#10B98150',
  },
  btnEstadoInactivo: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  btnEstadoText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnEliminar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF444415',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EF444440',
  },
  btnEliminarText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    color: POS_COLORS.muted,
    fontWeight: '600',
    marginTop: 12,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: POS_COLORS.ink,
    letterSpacing: -0.4,
    marginTop: 14,
    marginBottom: 6,
  },
  emptyText: {
    color: POS_COLORS.muted,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    backgroundColor: '#0F172A',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#334155',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: POS_COLORS.ink,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: POS_COLORS.muted,
    fontWeight: '600',
    letterSpacing: -0.35,
    marginTop: 2,
  },
  modalScroll: {
    flexGrow: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: POS_COLORS.muted,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 15,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodicidadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  periodicidadBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  periodicidadBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#FFFFFF',
  },
  periodicidadText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 12,
  },
  periodicidadTextActive: {
    color: '#FFFFFF',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C715',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0284C740',
    marginTop: 16,
    marginBottom: 20,
  },
  previewText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
  },
  btnGuardar: {
    backgroundColor: '#0284C7',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnDisabled: {
    backgroundColor: '#334155',
  },
  btnGuardarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
  },
});
