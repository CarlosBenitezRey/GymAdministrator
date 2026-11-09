import { membresiaRepository } from '../repositories/MembresiaRepository';
import { Plan, Membresia } from '../models';

export class MembresiaService {
  async asignarPlan(
    alumnoId: string,
    plan: Plan,
    precioPactado?: number
  ): Promise<Membresia> {
    const hoy = new Date();
    const fechaInicio = hoy.toISOString().split('T')[0];

    const fin = new Date(hoy);
    fin.setDate(fin.getDate() + plan.duracion_dias);
    const fechaFin = fin.toISOString().split('T')[0];

    const nuevaMembresia: Membresia = {
      alumno_id: alumnoId,
      plan_id: plan.id!,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      precio_pactado: precioPactado !== undefined ? precioPactado : plan.precio,
      estado: 'vigente',
    };

    const { data, error } = await membresiaRepository.crear(nuevaMembresia);
    if (error) {
      console.error('Error al asignar membresía:', error);
      throw error;
    }

    return data as Membresia;
  }
}

export const membresiaService = new MembresiaService();
