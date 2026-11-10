import { supabase } from '../config/supabase';
import { Asistencia, EstadoIngreso } from '../models';

export class CheckinRepository {
  async consultarVistaEstadoPorCi(ci: string) {
    return await supabase
      .from('vista_estado_alumnos')
      .select('*')
      .eq('ci', ci)
      .maybeSingle();
  }

  async registrarAsistencia(
    alumnoId: string,
    membresiaId: string | null | undefined,
    estadoIngreso: EstadoIngreso
  ) {
    return await supabase
      .from('asistencias')
      .insert({
        alumno_id: alumnoId,
        membresia_id: membresiaId || null,
        estado_ingreso: estadoIngreso,
      })
      .select()
      .single();
  }

  async obtenerUltimasAsistencias(limit: number = 15) {
    return await supabase
      .from('asistencias')
      .select('*, alumnos(nombre_completo, ci, telefono)')
      .order('fecha_hora', { ascending: false })
      .limit(limit);
  }

  /**
   * Obtiene exclusivamente las asistencias registradas desde las 00:00:00 hs de hoy
   */
  async obtenerAsistenciasDeHoy(limit: number = 100) {
    const now = new Date();
    const inicioDelDia = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    return await supabase
      .from('asistencias')
      .select('*, alumnos(nombre_completo, ci, telefono)')
      .gte('fecha_hora', inicioDelDia.toISOString())
      .order('fecha_hora', { ascending: false })
      .limit(limit);
  }

  /**
   * Elimina de la base de datos las entradas de días anteriores a hoy (anteriores a las 00:00 hs)
   */
  async limpiarAsistenciasDiasAnteriores() {
    const now = new Date();
    const inicioDelDia = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    return await supabase
      .from('asistencias')
      .delete()
      .lt('fecha_hora', inicioDelDia.toISOString());
  }

  /**
   * Elimina todos los registros de asistencias (para reinicio manual del control)
   */
  async limpiarTodasLasAsistencias() {
    return await supabase
      .from('asistencias')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
  }

  suscribirNuevasAsistencias(callback: (asistencia: Asistencia) => void) {
    const channel = supabase
      .channel('asistencias_acceso')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'asistencias' },
        async (payload) => {
          // Obtener los datos del alumno para enriquecer la asistencia en vivo
          const { data: alumnoData } = await supabase
            .from('alumnos')
            .select('nombre_completo, ci, telefono')
            .eq('id', payload.new.alumno_id)
            .maybeSingle();

          const nueva = payload.new as Asistencia;
          callback({
            ...nueva,
            alumno: alumnoData || undefined,
            alumnos: alumnoData || undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const checkinRepository = new CheckinRepository();
