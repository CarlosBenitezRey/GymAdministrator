import { Plan } from './Plan';

export type EstadoMembresia = 'vigente' | 'por_vencer' | 'vencida' | 'cancelada';

export interface Membresia {
  id?: string;
  alumno_id: string;
  plan_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  precio_pactado: number;
  estado: EstadoMembresia;
  created_at?: string;
  plan?: Plan;
}
