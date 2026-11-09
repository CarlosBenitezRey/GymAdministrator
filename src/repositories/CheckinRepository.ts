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
