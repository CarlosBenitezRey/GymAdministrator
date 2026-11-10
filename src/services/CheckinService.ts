import { checkinRepository } from '../repositories/CheckinRepository';
import { CheckinResult, EstadoIngreso, Asistencia } from '../models';

export class CheckinService {
  async procesarCheckin(ciIngresado: string): Promise<CheckinResult> {
    const ciLimpio = ciIngresado.trim();
    if (!ciLimpio) {
      return {
        encontrado: false,
        estado: 'no_encontrado',
        mensaje: 'Por favor ingrese un número de cédula válido.',
        timestamp: new Date(),
      };
    }

    try {
      const { data, error } = await checkinRepository.consultarVistaEstadoPorCi(ciLimpio);

      if (error) {
        console.error('Error al consultar vista_estado_alumnos:', error);
        throw new Error('Error al conectar con la base de datos.');
      }

      if (!data) {
        return {
          encontrado: false,
          ci: ciLimpio,
          estado: 'no_encontrado',
          mensaje: 'Socio no encontrado. Por favor acérquese a recepción.',
          timestamp: new Date(),
        };
      }

      const estadoActual = data.estado_actual;
      const diasRestantes = data.dias_restantes ?? 0;
      let estadoIngreso: EstadoIngreso = 'permitido';
      let mensaje = '';

      switch (estadoActual) {
        case 'vigente':
          estadoIngreso = 'permitido';
          mensaje = '¡Acceso Permitido! Que tengas un excelente entrenamiento 🏋️‍♂️';
          break;
        case 'por_vencer':
          estadoIngreso = 'permitido_por_vencer';
          mensaje = `¡Acceso Permitido! Tu plan vence en ${diasRestantes} día(s). Acércate a recepción para renovar con tiempo ⚠️`;
          break;
        case 'vencida':
          estadoIngreso = 'rechazado_vencido';
          mensaje = 'Acceso Denegado: Su cuota se encuentra vencida. Por favor regularice su pago en recepción ⛔';
          break;
        case 'sin_plan':
        default:
          estadoIngreso = 'rechazado_sin_plan';
          mensaje = 'Acceso Denegado: No posee un plan activo asignado. Consulte en recepción ⛔';
          break;
      }

      // Registrar la asistencia de forma asíncrona
      await checkinRepository.registrarAsistencia(
        data.alumno_id,
        data.membresia_id,
        estadoIngreso
      );

      return {
        encontrado: true,
        alumnoId: data.alumno_id,
        nombreCompleto: data.nombre_completo,
        ci: data.ci,
        estado: estadoActual,
        nombrePlan: data.nombre_plan || 'Sin plan asignado',
        diasRestantes: diasRestantes,
        fechaFin: data.fecha_fin,
        mensaje: mensaje,
        timestamp: new Date(),
      };
    } catch (err: any) {
      console.error('Error en procesarCheckin:', err);
      return {
        encontrado: false,
        ci: ciLimpio,
        estado: 'no_encontrado',
        mensaje: 'Ocurrió un error al verificar el acceso. Intente de nuevo o consulte a recepción.',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Obtiene exclusivamente los ingresos registrados en el día actual (desde las 00:00 hs)
   * y limpia en segundo plano los registros de días anteriores.
   */
  async obtenerIngresosDeHoy(limit: number = 100): Promise<Asistencia[]> {
    // Limpieza en segundo plano de registros de días anteriores
    this.limpiarRegistrosAnteriores().catch((err) =>
      console.warn('Aviso al limpiar asistencias anteriores:', err)
    );

    const { data, error } = await checkinRepository.obtenerAsistenciasDeHoy(limit);
    if (error) {
      console.error('Error al obtener asistencias de hoy:', error);
      return [];
    }
    return (data || []).map((a: any) => ({
      ...a,
      alumno: a.alumnos || a.alumno,
      alumnos: a.alumnos || a.alumno,
    })) as Asistencia[];
  }

  /**
   * Limpia de la base de datos las asistencias de días previos a hoy
   */
  async limpiarRegistrosAnteriores(): Promise<void> {
    try {
      await checkinRepository.limpiarAsistenciasDiasAnteriores();
    } catch (err) {
      console.error('Error al limpiar registros de días anteriores:', err);
    }
  }

  /**
   * Elimina todos los registros de asistencias (para reinicio manual de la pantalla de recepción)
   */
  async limpiarTodosLosRegistros(): Promise<void> {
    try {
      await checkinRepository.limpiarTodasLasAsistencias();
    } catch (err) {
      console.error('Error al limpiar todas las asistencias:', err);
      throw err;
    }
  }

  async obtenerUltimosIngresos(limit: number = 25): Promise<Asistencia[]> {
    const { data, error } = await checkinRepository.obtenerUltimasAsistencias(limit);
    if (error) {
      console.error('Error al obtener asistencias:', error);
      return [];
    }
    return (data || []).map((a: any) => ({
      ...a,
      alumno: a.alumnos || a.alumno,
      alumnos: a.alumnos || a.alumno,
    })) as Asistencia[];
  }

  suscribirIngresosEnVivo(callback: (asistencia: Asistencia) => void) {
    return checkinRepository.suscribirNuevasAsistencias(callback);
  }
}

export const checkinService = new CheckinService();
