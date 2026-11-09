import { Plan } from './Plan';
import { Membresia } from './Membresia';

export interface Alumno {
  id?: string;
  ci: string;
  nombre_completo: string;
  telefono?: string;
  sexo?: 'M' | 'F' | 'Otro';
  fecha_nacimiento?: string;
  direccion?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  notas_medicas?: string;
  peso_kg?: number | null;
  estatura_m?: number | null;
  peso_ideal_kg?: number | null;
  imc?: number | null;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;

  // Membresía activa / estado
  membresias?: (Membresia & { planes?: Plan })[];
  plan_actual_nombre?: string | null;
  plan_actual_vencimiento?: string | null;
  plan_actual_estado?: 'vigente' | 'por_vencer' | 'vencida' | 'sin_plan';
  dias_restantes?: number | null;
}
