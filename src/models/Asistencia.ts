import { Alumno } from './Alumno';

export type EstadoIngreso = 'permitido' | 'permitido_por_vencer' | 'rechazado_vencido' | 'rechazado_sin_plan';

export interface Asistencia {
  id?: string;
  alumno_id: string;
  membresia_id?: string | null;
  fecha_hora?: string;
  estado_ingreso: EstadoIngreso;
  alumno?: Alumno;
  alumnos?: Alumno;
}
