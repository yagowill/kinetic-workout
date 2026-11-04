// Opções e regras de seleção compartilhadas pela anamnese do personal
// e pela anamnese pública preenchida pelo aluno.

export interface AnamnesisOption {
  value: string
  label: string
  description?: string
  emoji?: string
}

export const goalOptions: AnamnesisOption[] = [
  {
    value: 'Hipertrofia',
    label: 'Hipertrofia',
    description: 'Ganhar massa muscular',
    emoji: '💪',
  },
  {
    value: 'Emagrecimento',
    label: 'Emagrecimento',
    description: 'Reduzir gordura corporal',
    emoji: '🔥',
  },
  {
    value: 'Condicionamento',
    label: 'Condicionamento',
    description: 'Melhorar fôlego e energia',
    emoji: '🫀',
  },
  {
    value: 'Força',
    label: 'Força',
    description: 'Levantar mais carga',
    emoji: '🏋️',
  },
  {
    value: 'Saúde geral',
    label: 'Saúde geral',
    description: 'Movimentar com mais conforto',
    emoji: '🌱',
  },
]

export const experienceOptions: AnamnesisOption[] = [
  {
    value: 'Iniciante',
    label: 'Iniciante',
    description: 'Primeiros meses de treino',
  },
  {
    value: 'Intermediário',
    label: 'Intermediário',
    description: 'Já treina com frequência',
  },
  {
    value: 'Avançado',
    label: 'Avançado',
    description: 'Treina há mais de 1 ano',
  },
]

export const frequencyOptions = [
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 4, label: '4x' },
  { value: 5, label: '5x+' },
]

export const jointPainOptions = [
  'Ombro',
  'Joelho',
  'Coluna',
  'Quadril',
  'Tornozelo',
  'Nenhuma',
]

export const medicalConditionOptions = [
  'Hipertensão',
  'Diabetes',
  'Problema cardíaco',
  'Cirurgia recente',
  'Nenhuma',
]

// "Nenhuma" é exclusiva: ao marcá-la, as demais são limpas.
// Ao desmarcar a última opção, "Nenhuma" volta a ficar selecionada.
export function toggleJointPainSelection(
  current: string[],
  pain: string,
): string[] {
  if (pain === 'Nenhuma') {
    return ['Nenhuma']
  }

  const selectedWithoutNone = current.filter((item) => item !== 'Nenhuma')

  if (selectedWithoutNone.includes(pain)) {
    const nextPains = selectedWithoutNone.filter((item) => item !== pain)

    return nextPains.length > 0 ? nextPains : ['Nenhuma']
  }

  return [...selectedWithoutNone, pain]
}

export function toggleMedicalConditionSelection(
  current: string[],
  condition: string,
): string[] {
  if (condition === 'Nenhuma') {
    return ['Nenhuma']
  }

  const selectedWithoutNone = current.filter((item) => item !== 'Nenhuma')

  if (selectedWithoutNone.includes(condition)) {
    const nextConditions = selectedWithoutNone.filter(
      (item) => item !== condition,
    )

    return nextConditions.length > 0 ? nextConditions : ['Nenhuma']
  }

  return [...selectedWithoutNone, condition]
}
