-- ========================================================
-- POLÍTICAS DE ACCESO RLS PARA SANSON GYM
-- Ejecutar en Supabase -> SQL Editor
-- ========================================================

-- Permitir lectura y escritura a las tablas del sistema interno
CREATE POLICY "Acceso total publico disciplinas" ON disciplinas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total publico planes" ON planes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total publico plan_disciplinas" ON plan_disciplinas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total publico alumnos" ON alumnos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total publico membresias" ON membresias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total publico asistencias" ON asistencias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total publico pagos" ON pagos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total publico cajas_sesion" ON cajas_sesion FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total publico usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);

-- Semilla de disciplinas y planes iniciales
INSERT INTO disciplinas (nombre, descripcion) VALUES
  ('Musculación', 'Área de pesas y musculación general'),
  ('Funcional', 'Entrenamiento funcional y cross')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO planes (nombre, periodicidad, duracion_dias, precio) VALUES
  ('Musculación Mensual', 'mensual', 30, 150000),
  ('Combo Musculación + Funcional', 'mensual', 30, 220000),
  ('Pase Semanal', 'semanal', 7, 60000),
  ('Pase Diario', 'diario', 1, 25000)
ON CONFLICT DO NOTHING;
