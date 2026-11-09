import { alumnoRepository } from '../repositories/AlumnoRepository';
import { planRepository } from '../repositories/PlanRepository';
import { membresiaService } from './MembresiaService';
import { Alumno, Plan } from '../models';

export class AlumnoService {
  async listarAlumnos(busqueda?: string): Promise<Alumno[]> {
    const { data, error } = await alumnoRepository.obtenerTodos(busqueda);
    if (error) {
      console.error('Error al listar alumnos:', error);
      throw error;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const alumnosFormateados: Alumno[] = (data || []).map((alumno: any) => {
      const membresias = alumno.membresias || [];
      // Ordenar por fecha_fin descendente
      membresias.sort((a: any, b: any) => new Date(b.fecha_fin).getTime() - new Date(a.fecha_fin).getTime());
      const ultimaMembresia = membresias[0];

      let plan_actual_nombre: string | null = null;
      let plan_actual_vencimiento: string | null = null;
      let plan_actual_estado: 'vigente' | 'por_vencer' | 'vencida' | 'sin_plan' = 'sin_plan';
      let dias_restantes: number | null = null;

      if (ultimaMembresia) {
        plan_actual_nombre = ultimaMembresia.planes?.nombre || 'Plan';
        plan_actual_vencimiento = ultimaMembresia.fecha_fin;

        const fin = new Date(ultimaMembresia.fecha_fin + 'T00:00:00');
        const diffDays = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        dias_restantes = diffDays;

        if (diffDays < 0) {
          plan_actual_estado = 'vencida';
        } else if (diffDays <= 3) {
          plan_actual_estado = 'por_vencer';
        } else {
          plan_actual_estado = 'vigente';
        }
      }

      return {
        ...alumno,
        plan_actual_nombre,
        plan_actual_vencimiento,
        plan_actual_estado,
        dias_restantes,
      };
    });

    return alumnosFormateados;
  }

  async registrarAlumno(datos: {
    ci: string;
    nombre_completo: string;
    telefono?: string;
    sexo?: 'M' | 'F' | 'Otro';
    fecha_nacimiento?: string;
    direccion?: string;
    contacto_emergencia_nombre?: string;
    contacto_emergencia_telefono?: string;
    notas_medicas?: string;
    peso_kg?: number;
    estatura_m?: number;
    peso_ideal_kg?: number;
    plan_id?: string;
  }): Promise<Alumno> {
    const ciLimpio = datos.ci.trim();
    if (!ciLimpio) throw new Error('El número de cédula es obligatorio.');
    if (!datos.nombre_completo.trim()) throw new Error('El nombre completo es obligatorio.');

    // Verificar si ya existe un alumno con ese C.I.
    const { data: existente } = await alumnoRepository.obtenerPorCi(ciLimpio);
    if (existente) {
      throw new Error();
    }

    const nuevoAlumno: Alumno = {
      ci: ciLimpio,
      nombre_completo: datos.nombre_completo.trim(),
      telefono: datos.telefono?.trim() || undefined,
      sexo: datos.sexo,
      fecha_nacimiento: datos.fecha_nacimiento,
      direccion: datos.direccion?.trim() || undefined,
      contacto_emergencia_nombre: datos.contacto_emergencia_nombre?.trim() || undefined,
      contacto_emergencia_telefono: datos.contacto_emergencia_telefono?.trim() || undefined,
      notas_medicas: datos.notas_medicas?.trim() || undefined,
      peso_kg: datos.peso_kg || null,
      estatura_m: datos.estatura_m || null,
      peso_ideal_kg: datos.peso_ideal_kg || null,
      activo: true,
    };

    const { data: alumnoCreado, error } = await alumnoRepository.crear(nuevoAlumno);
    if (error) {
      console.error('Error al crear alumno:', error);
      throw error;
    }

    // Si se seleccionó un plan inicial, creamos la membresía de inmediato
    if (datos.plan_id && alumnoCreado?.id) {
      const { data: planes } = await planRepository.obtenerActivos();
      const planSeleccionado = (planes || []).find((p: Plan) => p.id === datos.plan_id);
      if (planSeleccionado) {
        await membresiaService.asignarPlan(alumnoCreado.id, planSeleccionado);
      }
    }

    return alumnoCreado as Alumno;
  }
}

export const alumnoService = new AlumnoService();
