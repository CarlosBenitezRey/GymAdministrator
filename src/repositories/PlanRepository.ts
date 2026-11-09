import { supabase } from '../config/supabase';
import { Plan } from '../models';

export class PlanRepository {
  async obtenerTodos() {
    return await supabase
      .from('planes')
      .select('*')
      .order('activo', { ascending: false })
      .order('precio', { ascending: true });
  }

  async obtenerActivos() {
    return await supabase
      .from('planes')
      .select('*')
      .eq('activo', true)
      .order('precio', { ascending: true });
  }

  async crear(plan: Omit<Plan, 'id' | 'created_at'>) {
    return await supabase
      .from('planes')
      .insert(plan)
      .select()
      .single();
  }

  async actualizar(id: string, campos: Partial<Plan>) {
    return await supabase
      .from('planes')
      .update(campos)
      .eq('id', id)
      .select()
      .single();
  }

  async eliminar(id: string) {
    return await supabase
      .from('planes')
      .delete()
      .eq('id', id);
  }
}

export const planRepository = new PlanRepository();
