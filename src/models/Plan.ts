import { Disciplina } from './Disciplina';

export type Periodicidad = 'diario' | 'semanal' | 'mensual' | 'semestral' | 'anual';

export interface Plan {
  id?: string;
  nombre: string;
  periodicidad: Periodicidad;
  duracion_dias: number;
  precio: number;
  activo?: boolean;
  disciplinas?: Disciplina[];
  created_at?: string;
}
