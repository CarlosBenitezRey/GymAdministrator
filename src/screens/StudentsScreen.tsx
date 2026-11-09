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
import { alumnoService } from '../services/AlumnoService';
import { planRepository } from '../repositories/PlanRepository';
import { membresiaService } from '../services/MembresiaService';
import { Alumno, Plan } from '../models';
import { POS_COLORS, POS_TYPOGRAPHY } from '../theme';

export const StudentsScreen: React.FC = () => {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [busquedaInput, setBusquedaInput] = useState('');
  const [criterioActual, setCriterioActual] = useState<string | null>(null);
  const [haBuscado, setHaBuscado] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal Nuevo Alumno
  const [modalNuevoVisible, setModalNuevoVisible] = useState(false);
  const [ci, setCi] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [sexo, setSexo] = useState<'M' | 'F' | 'Otro'>('M');
  const [direccion, setDireccion] = useState('');
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoTelefono, setContactoTelefono] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [estaturaM, setEstaturaM] = useState('');
  const [pesoIdealKg, setPesoIdealKg] = useState('');
  const [planIdSeleccionado, setPlanIdSeleccionado] = useState<string>('');
  const [guardando, setGuardando] = useState(false);

  // Modal Asignar/Renovar Plan a Alumno Existente
  const [modalAsignarVisible, setModalAsignarVisible] = useState(false);
  const [alumnoParaAsignar, setAlumnoParaAsignar] = useState<Alumno | null>(null);
  const [planParaAsignarId, setPlanParaAsignarId] = useState<string>('');
  const [asignandoPlan, setAsignandoPlan] = useState(false);

  // Precargar solo los planes al montar para que los modales estén listos
  useEffect(() => {
    const cargarPlanesIniciales = async () => {
      try {
        const dataPlanes = await planRepository.obtenerActivos();
        const planesActivos = (dataPlanes.data || []) as Plan[];
        setPlanes(planesActivos);
        if (planesActivos.length > 0 && !planIdSeleccionado) {
          setPlanIdSeleccionado(planesActivos[0].id || '');
        }
      } catch (e) {
        console.error('Error al precargar planes:', e);
      }
    };

    cargarPlanesIniciales();
  }, []);

  const ejecutarBusqueda = async (termino?: string) => {
    const query = termino !== undefined ? termino.trim() : busquedaInput.trim();
    setLoading(true);
    setHaBuscado(true);
    setCriterioActual(query);

    try {
      const dataAlumnos = await alumnoService.listarAlumnos(query || undefined);
      setAlumnos(dataAlumnos);
    } catch (e) {
      console.error('Error al buscar socios:', e);
      Alert.alert('Error', 'No se pudo consultar el padrón de socios.');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiarBusqueda = () => {
    setBusquedaInput('');
    setHaBuscado(false);
    setCriterioActual(null);
    setAlumnos([]);
  };

  const imcCalculado = (() => {
    const p = parseFloat(pesoKg);
    const e = parseFloat(estaturaM);
    if (!isNaN(p) && !isNaN(e) && e > 0) {
      return (p / (e * e)).toFixed(2);
    }
    return null;
  })();

  const handleCrearAlumno = async () => {
    if (!ci.trim() || !nombreCompleto.trim()) {
      Alert.alert('Datos requeridos', 'El C.I. y el Nombre completo son obligatorios.');
      return;
    }

    setGuardando(true);
    const ciGuardada = ci.trim();
    try {
      await alumnoService.registrarAlumno({
        ci: ciGuardada,
        nombre_completo: nombreCompleto,
        telefono,
        sexo,
        direccion,
        contacto_emergencia_nombre: contactoNombre,
        contacto_emergencia_telefono: contactoTelefono,
        peso_kg: pesoKg ? parseFloat(pesoKg) : undefined,
        estatura_m: estaturaM ? parseFloat(estaturaM) : undefined,
        peso_ideal_kg: pesoIdealKg ? parseFloat(pesoIdealKg) : undefined,
        plan_id: planIdSeleccionado || undefined,
      });

      // Limpiar formulario y cerrar modal
      setCi('');
      setNombreCompleto('');
      setTelefono('');
      setDireccion('');
      setContactoNombre('');
      setContactoTelefono('');
      setPesoKg('');
      setEstaturaM('');
      setPesoIdealKg('');
      setModalNuevoVisible(false);

      // Buscar directamente al alumno recién creado
      setBusquedaInput(ciGuardada);
      await ejecutarBusqueda(ciGuardada);
      Alert.alert('Éxito', '¡Socio y membresía registrados correctamente!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo registrar el socio.');
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalAsignarPlan = (alumno: Alumno) => {
    setAlumnoParaAsignar(alumno);
    if (planes.length > 0) {
      setPlanParaAsignarId(planes[0].id || '');
    }
    setModalAsignarVisible(true);
  };

  const handleAsignarPlanExistente = async () => {
    if (!alumnoParaAsignar?.id || !planParaAsignarId) {
      Alert.alert('Error', 'Seleccione un plan válido.');
      return;
    }

    const planElegido = planes.find((p) => p.id === planParaAsignarId);
    if (!planElegido) {
      Alert.alert('Error', 'Plan no encontrado.');
      return;
    }

    setAsignandoPlan(true);
    try {
      await membresiaService.asignarPlan(alumnoParaAsignar.id, planElegido);
      setModalAsignarVisible(false);
      setAlumnoParaAsignar(null);

      // Refrescar la búsqueda actual
      await ejecutarBusqueda(criterioActual || undefined);
      Alert.alert('Éxito', `Plan "${planElegido.nombre}" activado correctamente.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo asignar el plan.');
    } finally {
      setAsignandoPlan(false);
    }
  };

  const formatearMonto = (monto: number) => {
    return 'Gs. ' + Number(monto).toLocaleString('es-PY');
  };

  const renderAlumno = ({ item }: { item: Alumno }) => {
    const estado = item.plan_actual_estado || 'sin_plan';

    let badgeColor = '#64748B';
    let badgeText = 'SIN PLAN';
    let iconName: any = 'help-circle-outline';

    if (estado === 'vigente') {
      badgeColor = '#10B981';
      badgeText = `AL DÍA (${item.dias_restantes} d)`;
      iconName = 'checkmark-circle-outline';
    } else if (estado === 'por_vencer') {
      badgeColor = '#F59E0B';
      badgeText = `VENCE EN ${item.dias_restantes} D`;
      iconName = 'warning-outline';
    } else if (estado === 'vencida') {
      badgeColor = '#EF4444';
      badgeText = 'VENCIDA';
      iconName = 'close-circle-outline';
    }

    return (
      <View style={styles.alumnoCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={26} color="#10B981" />
        </View>

        <View style={styles.alumnoInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.alumnoNombre}>{item.nombre_completo}</Text>
            <View style={[styles.badgeEstado, { borderColor: badgeColor, backgroundColor: badgeColor + '15' }]}>
              <Ionicons name={iconName} size={14} color={badgeColor} style={{ marginRight: 4 }} />
              <Text style={[styles.badgeEstadoText, { color: badgeColor }]}>{badgeText}</Text>
            </View>
          </View>

          <Text style={styles.alumnoSub}>
            C.I.: <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>{item.ci}</Text>
            {item.telefono ? ` | Tel: ${item.telefono}` : ''}
          </Text>

          {/* Ficha de plan activo */}
          <View style={styles.planInfoRow}>
            <Ionicons name="barbell-outline" size={16} color="#38BDF8" style={{ marginRight: 6 }} />
            <Text style={styles.planInfoText}>
              {item.plan_actual_nombre ? (
                <>Plan: <Text style={{ color: '#38BDF8', fontWeight: '700' }}>{item.plan_actual_nombre}</Text> (Vence: {item.plan_actual_vencimiento})</>
              ) : (
                <Text style={{ color: '#EF4444' }}>Sin plan de entrenamiento activo</Text>
              )}
            </Text>
          </View>

          {item.imc && (
            <Text style={styles.alumnoImc}>
              IMC: <Text style={{ color: '#10B981', fontWeight: '700' }}>{item.imc}</Text> ({item.peso_kg} kg / {item.estatura_m} m)
            </Text>
          )}
        </View>

        {/* Botón rápido Asignar/Renovar Plan */}
        <TouchableOpacity
          style={styles.btnAsignarPlan}
          onPress={() => abrirModalAsignarPlan(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="card-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.btnAsignarPlanText}>
            {item.plan_actual_nombre ? 'Renovar' : 'Asignar Plan'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Barra de Búsqueda a Demanda (No dispara queries por letra) */}
      <View style={styles.searchContainerRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={22} color="#94A3B8" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ingrese número de C.I. o nombre..."
            placeholderTextColor={POS_COLORS.muted}
            value={busquedaInput}
            onChangeText={setBusquedaInput}
            onSubmitEditing={() => ejecutarBusqueda(busquedaInput)}
            returnKeyType="search"
          />
          {busquedaInput.length > 0 && (
            <TouchableOpacity onPress={handleLimpiarBusqueda} style={{ marginRight: 6 }}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.btnBuscar}
          onPress={() => ejecutarBusqueda(busquedaInput)}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.btnBuscarText}>Buscar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnNuevo}
          onPress={() => setModalNuevoVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.btnNuevoText}>NUEVO SOCIO</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido: Inicial (sin búsqueda) / Cargando / Resultados / Vacío */}
      {!haBuscado ? (
        <View style={styles.initialContainer}>
          <View style={styles.initialIconBox}>
            <Ionicons name="id-card-outline" size={60} color="#38BDF8" />
          </View>
          <Text style={styles.initialTitle}>Búsqueda de Socios</Text>
          <Text style={styles.initialSubtitle}>
            Ingresa un número de C.I. o nombre y pulsa <Text style={{ color: '#ffffffff', fontWeight: '700' }}>Buscar</Text> para consultar la ficha del alumno, o consulta el padrón completo.
          </Text>
          <TouchableOpacity
            style={styles.btnInitialVerTodos}
            onPress={() => ejecutarBusqueda('')}
            activeOpacity={0.8}
          >
            <Ionicons name="people-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.btnInitialVerTodosText}>Cargar Todos los Socios</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Consultando base de datos...</Text>
        </View>
      ) : alumnos.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="person-remove-outline" size={54} color="#EF4444" />
          <Text style={styles.emptyTitle}>Socio no encontrado</Text>
          <Text style={styles.emptyText}>
            No se encontraron socios con el criterio: "{criterioActual || '...'}"
          </Text>
          <TouchableOpacity
            style={[styles.btnNuevo, { marginTop: 18 }]}
            onPress={() => setModalNuevoVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.btnNuevoText}>REGISTRAR NUEVO SOCIO</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.resultsInfoRow}>
            <Text style={styles.resultsCountText}>
              {criterioActual ? `Resultados para "${criterioActual}": ` : 'Total de socios: '}
              <Text style={{ color: '#ffffffff', fontWeight: '800' }}>{alumnos.length} socio(s)</Text>
            </Text>
            <TouchableOpacity onPress={handleLimpiarBusqueda}>
              <Text style={styles.btnLimpiarText}>Limpiar búsqueda</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={alumnos}
            keyExtractor={(item) => item.id || item.ci}
            renderItem={renderAlumno}
            contentContainerStyle={styles.listContainer}
          />
        </View>
      )}

      {/* MODAL 1: REGISTRAR NUEVO SOCIO (Con selector de plan) */}
      <Modal visible={modalNuevoVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>REGISTRAR NUEVO SOCIO</Text>
              <TouchableOpacity onPress={() => setModalNuevoVisible(false)}>
                <Ionicons name="close" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.sectionTitle}>1. DATOS PERSONALES OBLIGATORIOS</Text>

              <Text style={styles.label}>Cédula de Identidad (C.I.) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 4567890"
                placeholderTextColor={POS_COLORS.muted}
                value={ci}
                onChangeText={setCi}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Nombre y Apellido *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Juan Pérez"
                placeholderTextColor={POS_COLORS.muted}
                value={nombreCompleto}
                onChangeText={setNombreCompleto}
              />

              <Text style={styles.label}>Teléfono WhatsApp</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 0981 123456"
                placeholderTextColor={POS_COLORS.muted}
                value={telefono}
                onChangeText={setTelefono}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Sexo</Text>
              <View style={styles.sexoRow}>
                {(['M', 'F', 'Otro'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sexoBtn, sexo === s && styles.sexoBtnActive]}
                    onPress={() => setSexo(s)}
                  >
                    <Text style={[styles.sexoText, sexo === s && styles.sexoTextActive]}>
                      {s === 'M' ? 'Masculino' : s === 'F' ? 'Femenino' : 'Otro'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>2. PLAN DE ENTRENAMIENTO INICIAL</Text>
              <Text style={styles.sublabel}>Selecciona el plan que contratará el socio al ingresar:</Text>

              <View style={styles.planesGrid}>
                {planes.map((p) => {
                  const isSelected = planIdSeleccionado === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.planCardOption, isSelected && styles.planCardSelected]}
                      onPress={() => setPlanIdSeleccionado(p.id!)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.planCardHeader}>
                        <Text style={[styles.planCardTitle, isSelected && styles.planCardTitleSelected]}>
                          {p.nombre}
                        </Text>
                        <Ionicons
                          name={isSelected ? "radio-button-on" : "radio-button-off"}
                          size={20}
                          color={isSelected ? "#0284C7" : "#64748B"}
                        />
                      </View>
                      <Text style={styles.planCardPrice}>{formatearMonto(p.precio)}</Text>
                      <Text style={styles.planCardDuration}>Duración: {p.duracion_dias} días ({p.periodicidad})</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sectionTitle}>3. FICHA FÍSICA Y NUTRICIONAL (OPCIONAL)</Text>

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Peso (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 78.5"
                    placeholderTextColor={POS_COLORS.muted}
                    value={pesoKg}
                    onChangeText={setPesoKg}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.label}>Estatura (m)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 1.75"
                    placeholderTextColor={POS_COLORS.muted}
                    value={estaturaM}
                    onChangeText={setEstaturaM}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {imcCalculado && (
                <View style={styles.imcBox}>
                  <Ionicons name="calculator-outline" size={20} color="#0284C7" style={{ marginRight: 8 }} />
                  <Text style={styles.imcText}>
                    IMC Calculado: <Text style={{ color: "#0284C7", fontWeight: '900' }}>{imcCalculado}</Text>
                  </Text>
                </View>
              )}

              <Text style={styles.label}>Peso Ideal Deseado (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 72.0"
                placeholderTextColor={POS_COLORS.muted}
                value={pesoIdealKg}
                onChangeText={setPesoIdealKg}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={styles.input}
                placeholder="Barrio, Ciudad"
                placeholderTextColor={POS_COLORS.muted}
                value={direccion}
                onChangeText={setDireccion}
              />

              <TouchableOpacity
                style={[styles.btnGuardar, guardando && styles.btnDisabled]}
                onPress={handleCrearAlumno}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnGuardarText}>GUARDAR Y ACTIVAR MEMBRESÍA</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: ASIGNAR / RENOVAR PLAN A ALUMNO EXISTENTE */}
      <Modal visible={modalAsignarVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 480 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>ASIGNAR / RENOVAR PLAN</Text>
                <Text style={styles.subtitleModal}>Socio: {alumnoParaAsignar?.nombre_completo}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalAsignarVisible(false)}>
                <Ionicons name="close" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380, marginBottom: 16 }}>
              <Text style={styles.sublabel}>Elige el plan a activar:</Text>
              {planes.map((p) => {
                const isSelected = planParaAsignarId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.planCardOption, isSelected && styles.planCardSelected]}
                    onPress={() => setPlanParaAsignarId(p.id!)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.planCardHeader}>
                      <Text style={[styles.planCardTitle, isSelected && styles.planCardTitleSelected]}>
                        {p.nombre}
                      </Text>
                      <Ionicons
                        name={isSelected ? "radio-button-on" : "radio-button-off"}
                        size={20}
                        color={isSelected ? "#0284C7" : "#64748B"}
                      />
                    </View>
                    <Text style={styles.planCardPrice}>{formatearMonto(p.precio)}</Text>
                    <Text style={styles.planCardDuration}>Duración: {p.duracion_dias} días ({p.periodicidad})</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.btnGuardar, asignandoPlan && styles.btnDisabled]}
              onPress={handleAsignarPlanExistente}
              disabled={asignandoPlan}
            >
              {asignandoPlan ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.btnGuardarText}>CONFIRMAR Y ACTIVAR PLAN</Text>
              )}
            </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: 20,
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
  subtitleModal: {
    fontSize: 14,
    color: POS_COLORS.primary,
    fontWeight: '700',
    letterSpacing: -0.35,
    marginTop: 2,
  },
  btnNuevo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  btnNuevoText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  btnBuscar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  btnBuscarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  searchContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
    paddingHorizontal: 20,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
  },
  btnVerTodos: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  btnVerTodosText: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 14,
  },
  initialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginVertical: 10,
    marginHorizontal: 20,
  },
  initialIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0284C720',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#38BDF840',
  },
  initialTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: POS_COLORS.ink,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  initialSubtitle: {
    fontSize: 15,
    color: POS_COLORS.muted,
    fontWeight: '600',
    letterSpacing: -0.35,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 480,
    marginBottom: 24,
  },
  initialActionsRow: {
    flexDirection: 'row',
  },
  btnInitialVerTodos: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnInitialVerTodosText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  resultsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  resultsCountText: {
    color: POS_COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.35,
  },
  btnLimpiarText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  alumnoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  alumnoInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  alumnoNombre: {
    fontSize: 18,
    fontWeight: '900',
    color: POS_COLORS.ink,
    letterSpacing: -0.4,
  },
  badgeEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeEstadoText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  alumnoSub: {
    fontSize: 13,
    color: POS_COLORS.muted,
    fontWeight: '600',
    letterSpacing: -0.35,
    marginBottom: 4,
  },
  planInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  planInfoText: {
    fontSize: 13,
    color: POS_COLORS.muted,
    fontWeight: '600',
  },
  alumnoImc: {
    fontSize: 12,
    color: POS_COLORS.muted,
    fontWeight: '600',
  },
  btnAsignarPlan: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginLeft: 12,
  },
  btnAsignarPlanText: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 12,
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
    marginBottom: 16,
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
  modalScroll: {
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: POS_COLORS.ink,
    letterSpacing: -0.4,
    marginTop: 16,
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 12,
    color: POS_COLORS.muted,
    fontWeight: '600',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: POS_COLORS.muted,
    marginBottom: 6,
    marginTop: 8,
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
  sexoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
  },
  sexoBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sexoBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#ffffffff',
  },
  sexoText: {
    color: POS_COLORS.muted,
    fontWeight: '700',
    fontSize: 13,
  },
  sexoTextActive: {
    color: '#FFFFFF',
  },
  planesGrid: {
    marginBottom: 10,
  },
  planCardOption: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  planCardSelected: {
    borderColor: '#0284C7',
    backgroundColor: '#064E3B25',
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: POS_COLORS.ink,
    letterSpacing: -0.35,
  },
  planCardTitleSelected: {
    color: POS_COLORS.primaryDark,
  },
  planCardPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: POS_COLORS.primaryDark,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  planCardDuration: {
    fontSize: 12,
    color: POS_COLORS.muted,
    fontWeight: '600',
  },
  imcBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B20',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B98140',
    marginTop: 10,
  },
  imcText: {
    color: POS_COLORS.muted,
    fontWeight: '600',
    fontSize: 14,
  },
  btnGuardar: {
    backgroundColor: '#0284C7',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
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
