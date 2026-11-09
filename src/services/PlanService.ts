import { planRepository } from '../repositories/PlanRepository';
import { Plan, Periodicidad } from '../models';

export class PlanService {
  async listarTodosLosPlanes(): Promise<Plan[]> {
    const { data, error } = await planRepository.obtenerTodos();
    if (error) {
      console.error('Error al listar planes:', error);
      throw error;
    }
    return (data || []) as Plan[];
  }

  async listarPlanesActivos(): Promise<Plan[]> {
    const { data, error } = await planRepository.obtenerActivos();
    if (error) {
      console.error('Error al listar planes activos:', error);
      throw error;
    }
    return (data || []) as Plan[];
  }

  async crearPlan(datos: {
    nombre: string;
    periodicidad: Periodicidad;
    duracion_dias: number;
    precio: number;
  }): Promise<Plan> {
    const nombreLimpio = datos.nombre.trim();
    if (!nombreLimpio) throw new Error('El nombre del plan es obligatorio.');
    if (datos.precio <= 0) throw new Error('El precio debe ser mayor a 0 Gs.');
    if (datos.duracion_dias <= 0) throw new Error('La duración debe ser al menos de 1 día.');

    const nuevoPlan: Omit<Plan, 'id' | 'created_at'> = {
      nombre: nombreLimpio,
      periodicidad: datos.periodicidad,
      duracion_dias: datos.duracion_dias,
      precio: datos.precio,
      activo: true,
    };

    const { data, error } = await planRepository.crear(nuevoPlan);
    if (error) {
      console.error('Error al crear plan:', error);
      throw error;
    }
    return data as Plan;
  }

  async alternarEstadoPlan(id: string, nuevoEstadoActivo: boolean): Promise<Plan> {
    const { data, error } = await planRepository.actualizar(id, { activo: nuevoEstadoActivo });
    if (error) {
      console.error('Error al cambiar estado del plan:', error);
      throw error;
    }
    return data as Plan;
  }

  async eliminarPlan(id: string): Promise<void> {
    const { error } = await planRepository.eliminar(id);
    if (error) {
      if (error.code === '23503') {
        throw new Error(
          'No se puede eliminar este plan porque ya tiene socios o membresías registradas con él.\n\nPuedes desactivarlo para que no aparezca disponible en nuevas inscripciones.'
        );
      }
      throw error;
    }
  }
}

export const planService = new PlanService();
