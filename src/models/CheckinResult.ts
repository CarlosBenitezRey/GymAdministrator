export type EstadoCheckin = 'vigente' | 'por_vencer' | 'vencida' | 'sin_plan' | 'no_encontrado';

export interface CheckinResult {
  encontrado: boolean;
  alumnoId?: string;
  nombreCompleto?: string;
  ci?: string;
  estado: EstadoCheckin;
  nombrePlan?: string;
  diasRestantes?: number;
  fechaFin?: string;
  mensaje: string;
  timestamp: Date;
}
