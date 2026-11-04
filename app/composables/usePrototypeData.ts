// Dados de protótipo compartilhados entre as telas.
// Em produção, estes valores serão substituídos pelas consultas ao Supabase.

export type AnamnesisStatus = 'complete' | 'pending'

export interface PrototypeStudent {
  id: string
  name: string
  phone: string
  goal: string
  weeklyFrequency: number
  experienceLevel: string
  anamnesisStatus: AnamnesisStatus
  jointPains: string[]
  accessToken: string
  avatarColor: string
}

export interface PrototypeExercise {
  id: string
  name: string
  muscleGroup: string
  muscleLabel: string
  gifUrl: string
}

export interface PrototypeWorkoutItem extends PrototypeExercise {
  sets: number
  reps: string
  restSeconds: number
  notes?: string
}

export interface PrototypeDivision {
  id: string
  label: string
  focus: string
  items: PrototypeWorkoutItem[]
}

export interface PrototypeAnamnesis {
  primaryGoal: string
  experienceLevel: string
  weeklyFrequency: number
  jointPains: string[]
  medicalConditions: string[]
  additionalNotes: string
}

export interface MuscleFilter {
  value: string
  label: string
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
]

export const PROTOTYPE_EXERCISES: PrototypeExercise[] = [
  {
    id: 'pectorals/barbell-bench-press',
    name: 'Supino reto com barra',
    muscleGroup: 'chest',
    muscleLabel: 'Peito',
    gifUrl:
      'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif',
  },
  {
    id: 'lats/alternate-lateral-pulldown',
    name: 'Puxada lateral no pulley',
    muscleGroup: 'back',
    muscleLabel: 'Costas',
    gifUrl:
      'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/alternate-lateral-pulldown.gif',
  },
  {
    id: 'glutes/barbell-high-bar-squat',
    name: 'Agachamento livre',
    muscleGroup: 'legs',
    muscleLabel: 'Pernas',
    gifUrl:
      'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-high-bar-squat.gif',
  },
  {
    id: 'glutes/sled-45-leg-press-back-pov',
    name: 'Leg press 45°',
    muscleGroup: 'legs',
    muscleLabel: 'Pernas',
    gifUrl:
      'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/sled-45-leg-press-back-pov.gif',
  },
  {
    id: 'delts/cable-lateral-raise',
    name: 'Elevação lateral na polia',
    muscleGroup: 'shoulders',
    muscleLabel: 'Ombros',
    gifUrl:
      'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-lateral-raise.gif',
  },
  {
    id: 'biceps/barbell-alternate-biceps-curl',
    name: 'Rosca direta alternada',
    muscleGroup: 'biceps',
    muscleLabel: 'Bíceps',
    gifUrl:
      'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-alternate-biceps-curl.gif',
  },
  {
    id: 'triceps/cable-alternate-triceps-extension',
    name: 'Tríceps na polia',
    muscleGroup: 'triceps',
    muscleLabel: 'Tríceps',
    gifUrl:
      'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-alternate-triceps-extension.gif',
  },
  {
    id: 'abs/front-plank-with-twist',
    name: 'Prancha frontal com giro',
    muscleGroup: 'core',
    muscleLabel: 'Core',
    gifUrl:
      'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/front-plank-with-twist.gif',
  },
  {
    id: 'glutes/barbell-deadlift',
    name: 'Levantamento terra',
    muscleGroup: 'glutes',
    muscleLabel: 'Glúteos e posterior',
    gifUrl:
      'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
  },
  {
    id: 'hamstrings/barbell-straight-leg-deadlift',
    name: 'Stiff com barra',
    muscleGroup: 'hamstrings',
    muscleLabel: 'Posterior',
    gifUrl:
      'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/barbell-straight-leg-deadlift.gif',
  },
  {
    id: 'calves/band-single-leg-calf-raise',
    name: 'Elevação de panturrilha',
    muscleGroup: 'calves',
    muscleLabel: 'Panturrilha',
    gifUrl:
      'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/band-single-leg-calf-raise.gif',
  },
  {
    id: 'upper-back/dumbbell-reverse-grip-incline-bench-two-arm-row',
    name: 'Remo curvado com halteres',
    muscleGroup: 'back',
    muscleLabel: 'Costas',
    gifUrl:
      'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/dumbbell-reverse-grip-incline-bench-two-arm-row.gif',
  },
  {
    id: 'delts/barbell-standing-close-grip-military-press',
    name: 'Desenvolvimento militar',
    muscleGroup: 'shoulders',
    muscleLabel: 'Ombros',
    gifUrl:
      'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/barbell-standing-close-grip-military-press.gif',
  },
  {
    id: 'glutes/barbell-front-chest-squat',
    name: 'Agachamento frontal',
    muscleGroup: 'legs',
    muscleLabel: 'Pernas',
    gifUrl:
      'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-front-chest-squat.gif',
  },
]

const INITIAL_STUDENTS: PrototypeStudent[] = [
  {
    id: 'mariana-costa',
    name: 'Mariana Costa',
    phone: '5511999991111',
    goal: 'Hipertrofia',
    weeklyFrequency: 4,
    experienceLevel: 'Intermediário',
    anamnesisStatus: 'complete',
    jointPains: ['Joelho'],
    accessToken: 'demo-mariana',
    avatarColor: '#4f46e5',
  },
  {
    id: 'joao-pedro',
    name: 'João Pedro Lima',
    phone: '5511988882222',
    goal: 'Emagrecimento',
    weeklyFrequency: 3,
    experienceLevel: 'Iniciante',
    anamnesisStatus: 'pending',
    jointPains: [],
    accessToken: 'demo-joao',
    avatarColor: '#0284c7',
  },
  {
    id: 'ana-beatriz',
    name: 'Ana Beatriz Souza',
    phone: '5511977773333',
    goal: 'Condicionamento',
    weeklyFrequency: 3,
    experienceLevel: 'Avançado',
    anamnesisStatus: 'complete',
    jointPains: [],
    accessToken: 'demo-ana',
    avatarColor: '#16a34a',
  },
  {
    id: 'carlos-eduardo',
    name: 'Carlos Eduardo',
    phone: '5511966664444',
    goal: 'Força',
    weeklyFrequency: 5,
    experienceLevel: 'Avançado',
    anamnesisStatus: 'complete',
    jointPains: ['Ombro', 'Coluna'],
    accessToken: 'demo-carlos',
    avatarColor: '#d97706',
  },
]

const INITIAL_ANAMNESES: Record<string, PrototypeAnamnesis> = {
  'mariana-costa': {
    primaryGoal: 'Hipertrofia',
    experienceLevel: 'Intermediário',
    weeklyFrequency: 4,
    jointPains: ['Joelho'],
    medicalConditions: [],
    additionalNotes: 'Prefere treinar pela manhã.',
  },
  'ana-beatriz': {
    primaryGoal: 'Condicionamento',
    experienceLevel: 'Avançado',
    weeklyFrequency: 3,
    jointPains: [],
    medicalConditions: [],
    additionalNotes: '',
  },
  'carlos-eduardo': {
    primaryGoal: 'Força',
    experienceLevel: 'Avançado',
    weeklyFrequency: 5,
    jointPains: ['Ombro', 'Coluna'],
    medicalConditions: ['Hipertensão'],
    additionalNotes: 'Evitar cargas máximas no ombro.',
  },
}

function getExercise(id: string): PrototypeExercise {
  const exercise = PROTOTYPE_EXERCISES.find((item) => item.id === id)

  if (!exercise) {
    throw new Error(`Exercício de protótipo não encontrado: ${id}`)
  }

  return exercise
}

function createItem(
  exerciseId: string,
  sets: number,
  reps: string,
  restSeconds: number,
): PrototypeWorkoutItem {
  return {
    ...getExercise(exerciseId),
    sets,
    reps,
    restSeconds,
  }
}

function createStarterDivisions(): PrototypeDivision[] {
  return [
    {
      id: 'A',
      label: 'Treino A',
      focus: 'Peito, ombro e tríceps',
      items: [
        createItem('pectorals/barbell-bench-press', 4, '8-10', 90),
        createItem('delts/cable-lateral-raise', 3, '12-15', 60),
        createItem('triceps/cable-alternate-triceps-extension', 3, '10-12', 60),
      ],
    },
    {
      id: 'B',
      label: 'Treino B',
      focus: 'Costas e bíceps',
      items: [
        createItem('lats/alternate-lateral-pulldown', 4, '10-12', 75),
        createItem(
          'upper-back/dumbbell-reverse-grip-incline-bench-two-arm-row',
          3,
          '10-12',
          75,
        ),
        createItem('biceps/barbell-alternate-biceps-curl', 3, '10-12', 60),
      ],
    },
    {
      id: 'C',
      label: 'Treino C',
      focus: 'Pernas e core',
      items: [
        createItem('glutes/barbell-high-bar-squat', 4, '8-10', 120),
        createItem('glutes/sled-45-leg-press-back-pov', 3, '12-15', 90),
        createItem('hamstrings/barbell-straight-leg-deadlift', 3, '10-12', 90),
        createItem('calves/band-single-leg-calf-raise', 3, '15-20', 45),
        createItem('abs/front-plank-with-twist', 3, '30s', 45),
      ],
    },
  ]
}

function createEmptyDivisions(): PrototypeDivision[] {
  return [
    { id: 'A', label: 'Treino A', focus: 'Nova divisão', items: [] },
    { id: 'B', label: 'Treino B', focus: 'Nova divisão', items: [] },
    { id: 'C', label: 'Treino C', focus: 'Nova divisão', items: [] },
  ]
}

export function usePrototypeData() {
  const students = useState<PrototypeStudent[]>('prototype-students', () =>
    INITIAL_STUDENTS.map((student) => ({ ...student })),
  )

  const anamneses = useState<Record<string, PrototypeAnamnesis>>(
    'prototype-anamneses',
    () => ({ ...INITIAL_ANAMNESES }),
  )

  const workouts = useState<Record<string, PrototypeDivision[]>>(
    'prototype-workouts',
    () =>
      Object.fromEntries(
        INITIAL_STUDENTS.map((student) => [
          student.id,
          createStarterDivisions(),
        ]),
      ),
  )

  function getStudent(studentId: string): PrototypeStudent | null {
    return students.value.find((student) => student.id === studentId) ?? null
  }

  function getStudentByAccessToken(
    accessToken: string,
  ): PrototypeStudent | null {
    return (
      students.value.find((student) => student.accessToken === accessToken) ??
      students.value[0] ??
      null
    )
  }

  function getAnamnesis(studentId: string): PrototypeAnamnesis | null {
    return anamneses.value[studentId] ?? null
  }

  function getDivisions(studentId: string): PrototypeDivision[] {
    if (!workouts.value[studentId]) {
      workouts.value[studentId] = createEmptyDivisions()
    }

    return workouts.value[studentId]!
  }

  function saveAnamnesis(
    studentId: string,
    anamnesis: PrototypeAnamnesis,
  ): void {
    anamneses.value[studentId] = { ...anamnesis }

    const student = getStudent(studentId)

    if (student) {
      student.anamnesisStatus = 'complete'
      student.jointPains = [...anamnesis.jointPains]
      student.goal = anamnesis.primaryGoal
      student.weeklyFrequency = anamnesis.weeklyFrequency
      student.experienceLevel = anamnesis.experienceLevel
    }
  }

  function createStudent(input: {
    name: string
    phone: string
    anamnesis: PrototypeAnamnesis
  }): PrototypeStudent {
    const studentId = `student-${Date.now()}`

    const student: PrototypeStudent = {
      id: studentId,
      name: input.name.trim() || 'Novo aluno',
      phone: input.phone.trim(),
      goal: input.anamnesis.primaryGoal,
      weeklyFrequency: input.anamnesis.weeklyFrequency,
      experienceLevel: input.anamnesis.experienceLevel,
      anamnesisStatus: 'complete',
      jointPains: [...input.anamnesis.jointPains],
      accessToken: `demo-${studentId}`,
      avatarColor: '#4f46e5',
    }

    students.value.unshift(student)
    anamneses.value[studentId] = { ...input.anamnesis }
    workouts.value[studentId] = createEmptyDivisions()

    return student
  }

  function addWorkoutDivision(studentId: string): PrototypeDivision {
    const divisions = getDivisions(studentId)
    const nextIndex = divisions.length
    const nextLetter = String.fromCharCode(65 + nextIndex)

    const division: PrototypeDivision = {
      id: nextLetter,
      label: `Treino ${nextLetter}`,
      focus: 'Nova divisão',
      items: [],
    }

    divisions.push(division)
    return division
  }

  function addExerciseToDivision(
    studentId: string,
    divisionId: string,
    exercise: PrototypeExercise,
  ): boolean {
    const division = getDivisions(studentId).find(
      (item) => item.id === divisionId,
    )

    if (!division) {
      return false
    }

    if (division.items.some((item) => item.id === exercise.id)) {
      return false
    }

    division.items.push({
      ...exercise,
      sets: 3,
      reps: '10-12',
      restSeconds: 60,
    })

    return true
  }

  function removeExerciseFromDivision(
    studentId: string,
    divisionId: string,
    exerciseId: string,
  ): void {
    const division = getDivisions(studentId).find(
      (item) => item.id === divisionId,
    )

    if (!division) {
      return
    }

    division.items = division.items.filter((item) => item.id !== exerciseId)
  }

  function updateExerciseSets(
    studentId: string,
    divisionId: string,
    exerciseId: string,
    nextSets: number,
  ): void {
    const division = getDivisions(studentId).find(
      (item) => item.id === divisionId,
    )
    const item = division?.items.find((exercise) => exercise.id === exerciseId)

    if (!item) {
      return
    }

    item.sets = Math.min(10, Math.max(1, nextSets))
  }

  return {
    students,
    anamneses,
    workouts,
    getStudent,
    getStudentByAccessToken,
    getAnamnesis,
    getDivisions,
    saveAnamnesis,
    createStudent,
    addWorkoutDivision,
    addExerciseToDivision,
    removeExerciseFromDivision,
    updateExerciseSets,
  }
}
