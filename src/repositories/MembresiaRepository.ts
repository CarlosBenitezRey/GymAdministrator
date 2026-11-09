import { supabase } from '../config/supabase';
import { Membresia } from '../models';

export class MembresiaRepository {
  async crear(membresia: Membresia) {
    const { plan, id, created_at, ...datosParaInsertar } = membresia;
    return await supabase
      .from('membresias')
      .insert(datosParaInsertar)
      .select()
      .single();
  }

  async obtenerPorAlumno(alumnoId: string) {
    return await supabase
      .from('membresias')
      .select('*, planes(*)')
      .eq('alumno_id', alumnoId)
      .order('fecha_fin', { ascending: false });
  }
}

export const membresiaRepository = new MembresiaRepository();
