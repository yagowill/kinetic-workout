// Tradução dos grupos musculares retornados pela API de exercícios
// para os rótulos e filtros usados na interface em português.

export interface MuscleMeta {
  group: string
  label: string
}

export interface MuscleFilter {
  value: string
  label: string
}

export const MUSCLE_META: Record<string, MuscleMeta> = {
  abductors: { group: 'legs', label: 'Pernas' },
  abs: { group: 'core', label: 'Core' },
  adductors: { group: 'legs', label: 'Pernas' },
  back: { group: 'back', label: 'Costas' },
  biceps: { group: 'biceps', label: 'Bíceps' },
  calves: { group: 'calves', label: 'Panturrilha' },
  cardio: { group: 'cardio', label: 'Cardio' },
  chest: { group: 'chest', label: 'Peito' },
  core: { group: 'core', label: 'Core' },
  delts: { group: 'shoulders', label: 'Ombros' },
  forearms: { group: 'biceps', label: 'Antebraço' },
  glutes: { group: 'glutes', label: 'Glúteos' },
  hamstrings: { group: 'hamstrings', label: 'Posterior' },
  lats: { group: 'back', label: 'Costas' },
  'levator-scapulae': { group: 'back', label: 'Costas' },
  neck: { group: 'back', label: 'Pescoço' },
  pectorals: { group: 'chest', label: 'Peito' },
  quads: { group: 'legs', label: 'Pernas' },
  shoulders: { group: 'shoulders', label: 'Ombros' },
  traps: { group: 'back', label: 'Trapézio' },
  triceps: { group: 'triceps', label: 'Tríceps' },
  'upper-back': { group: 'back', label: 'Costas' },
  legs: { group: 'legs', label: 'Pernas' },
  'full-body': { group: 'legs', label: 'Corpo inteiro' },
}

export const MUSCLE_FILTERS: MuscleFilter[] = [
  { value: 'all', label: 'Todos' },
  { value: 'chest', label: 'Peito' },
  { value: 'back', label: 'Costas' },
  { value: 'legs', label: 'Pernas' },
  { value: 'shoulders', label: 'Ombros' },
  { value: 'biceps', label: 'Bíceps' },
  { value: 'triceps', label: 'Tríceps' },
  { value: 'core', label: 'Core' },
  { value: 'glutes', label: 'Glúteos' },
  { value: 'hamstrings', label: 'Posterior' },
  { value: 'calves', label: 'Panturrilha' },
  { value: 'cardio', label: 'Cardio' },
]

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

// Resolve o grupo e o rótulo de um músculo bruto da API.
// Valores desconhecidos continuam utilizáveis, apenas sem tradução.
export function resolveMuscle(rawMuscle: string): MuscleMeta {
  const normalized = rawMuscle.trim().toLowerCase()

  return (
    MUSCLE_META[normalized] ?? {
      group: 'other',
      label: capitalize(normalized || 'Outro'),
    }
  )
}
