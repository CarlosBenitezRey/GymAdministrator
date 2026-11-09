import { supabase } from '../config/supabase';
import { Alumno } from '../models';

export class AlumnoRepository {
  async obtenerTodos(busqueda?: string) {
    let query = supabase
      .from('alumnos')
      .select('*, membresias(*, planes(*))')
      .order('nombre_completo', { ascending: true });

    if (busqueda && busqueda.trim().length > 0) {
      query = query.or(`nombre_completo.ilike.%${busqueda}%,ci.ilike.%${busqueda}%`);
    }

    return await query;
  }

  async obtenerPorCi(ci: string) {
    return await supabase
      .from('alumnos')
      .select('*')
      .eq('ci', ci)
      .maybeSingle();
  }

  async obtenerPorId(id: string) {
    return await supabase
      .from('alumnos')
      .select('*')
      .eq('id', id)
      .maybeSingle();
  }

  async crear(alumno: Alumno) {
    // Excluir la columna generada 'imc', PostgreSQL la calcula automáticamente
    const { imc, id, created_at, updated_at, ...datosParaInsertar } = alumno;
    return await supabase
      .from('alumnos')
      .insert(datosParaInsertar)
      .select()
      .single();
  }

  async actualizar(id: string, alumno: Partial<Alumno>) {
    // Excluir la columna generada 'imc', PostgreSQL la calcula automáticamente
    const { imc, id: _id, created_at, updated_at, ...datosParaActualizar } = alumno;
    return await supabase
      .from('alumnos')
      .update(datosParaActualizar)
      .eq('id', id)
      .select()
      .single();
  }
}

export const alumnoRepository = new AlumnoRepository();
