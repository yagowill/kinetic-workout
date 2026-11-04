// Service do criador de treino e da leitura pública do plano.
// As divisões são derivadas do campo session_label dos itens.

import { useSupabaseClient } from '#imports'
import type { Database, WorkoutItem, WorkoutPlan } from '~/types/database.types'
import type {
  ExerciseGifOverride,
  ExerciseOption,
  PublicWorkoutPlanData,
  PublicWorkoutPlanPayload,
  WorkoutDivisionView,
  WorkoutEditorData,
  WorkoutItemView,
} from '~/types/app.types'
import { resolveMuscle } from '~/utils/muscles'
import { listExerciseGifOverrides } from './exerciseGifService'
import { getStudentDetail } from './studentService'

// Divisões mínimas exibidas mesmo quando o plano ainda está vazio.
const DEFAULT_SESSION_LABELS = ['A', 'B', 'C']

function mapWorkoutItem(
  row: WorkoutItem,
  overrideGifUrl?: string,
): WorkoutItemView {
  const muscle = resolveMuscle(row.target_muscle)

  return {
    id: row.id,
    exerciseId: row.external_exercise_id,
    name: row.exercise_name,
    muscleGroup: muscle.group,
    muscleLabel: muscle.label,
    gifUrl: overrideGifUrl ?? row.gif_url,
    sets: row.sets,
    reps: row.reps,
    restSeconds: row.rest_seconds,
  }
}

function sortSessionLabels(labels: string[]): string[] {
  return [...labels].sort((first, second) =>
    first.localeCompare(second, 'en', { numeric: true }),
  )
}

// Agrupa os itens por session_label e monta o resumo de foco de cada divisão.
// O mapa opcional aplica os GIFs personalizados do personal.
export function buildWorkoutDivisions(
  items: WorkoutItem[],
  overridesByExerciseId?: Map<string, string>,
): WorkoutDivisionView[] {
  const labels = new Set<string>(DEFAULT_SESSION_LABELS)

  for (const item of items) {
    labels.add(item.session_label)
  }

  return sortSessionLabels([...labels]).map((label) => {
    const divisionItems = items
      .filter((item) => item.session_label === label)
      .sort((first, second) => first.order_index - second.order_index)
      .map((item) =>
        mapWorkoutItem(
          item,
          overridesByExerciseId?.get(item.external_exercise_id),
        ),
      )

    const focus = [...new Set(divisionItems.map((item) => item.muscleLabel))]
      .slice(0, 3)
      .join(', ')

    return {
      id: label,
      label: `Treino ${label}`,
      focus: focus || 'Nova divisão',
      items: divisionItems,
    }
  })
}

// Retorna o plano ativo do aluno ou cria um novo com token gerado pelo banco.
export async function getOrCreateActivePlan(
  studentId: string,
): Promise<WorkoutPlan> {
  const client = useSupabaseClient<Database>()

  const { data: existingPlan, error: readError } = await client
    .from('workout_plans')
    .select('*')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (readError) {
    throw new Error(
      `Não foi possível carregar o plano: ${readError.message}`,
    )
  }

  if (existingPlan) {
    return existingPlan
  }

  const { data: createdPlan, error: createError } = await client
    .from('workout_plans')
    .insert({
      student_id: studentId,
      title: 'Plano de treino',
      is_active: true,
    })
    .select('*')
    .single()

  if (createError || !createdPlan) {
    throw new Error(
      `Não foi possível criar o plano: ${
        createError?.message ?? 'registro não retornado.'
      }`,
    )
  }

  return createdPlan
}

// Carrega tudo que o criador de treino precisa em uma única chamada.
// Os overrides podem ser passados pela página para evitar uma consulta extra.
export async function getWorkoutEditorData(
  studentId: string,
  providedOverrides?: ExerciseGifOverride[],
): Promise<WorkoutEditorData | null> {
  const detail = await getStudentDetail(studentId)

  if (!detail) {
    return null
  }

  const plan = await getOrCreateActivePlan(studentId)
  const client = useSupabaseClient<Database>()

  const overrides =
    providedOverrides ??
    (await listExerciseGifOverrides().catch(() => [] as ExerciseGifOverride[]))
  const overridesByExerciseId = new Map(
    overrides.map((override) => [override.exerciseId, override.gifUrl]),
  )

  const { data: items, error } = await client
    .from('workout_items')
    .select('*')
    .eq('workout_plan_id', plan.id)
    .order('session_label', { ascending: true })
    .order('order_index', { ascending: true })

  if (error) {
    throw new Error(
      `Não foi possível carregar os exercícios: ${error.message}`,
    )
  }

  return {
    student: detail.student,
    anamnesis: detail.anamnesis,
    plan,
    overrides,
    divisions: buildWorkoutDivisions(items ?? [], overridesByExerciseId),
  }
}

// Adiciona um exercício ao final da divisão escolhida.
export async function addWorkoutItem(
  planId: string,
  sessionLabel: string,
  exercise: ExerciseOption,
): Promise<void> {
  const client = useSupabaseClient<Database>()

  const { data: lastItem, error: orderError } = await client
    .from('workout_items')
    .select('order_index')
    .eq('workout_plan_id', planId)
    .eq('session_label', sessionLabel)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (orderError) {
    throw new Error(
      `Não foi possível calcular a ordem do exercício: ${orderError.message}`,
    )
  }

  const { error } = await client.from('workout_items').insert({
    workout_plan_id: planId,
    session_label: sessionLabel,
    external_exercise_id: exercise.id,
    exercise_name: exercise.name,
    gif_url: exercise.gifUrl,
    target_muscle: exercise.targetMuscle,
    sets: 3,
    reps: '10-12',
    rest_seconds: 60,
    order_index: (lastItem?.order_index ?? 0) + 1,
  })

  if (error) {
    throw new Error(`Não foi possível adicionar o exercício: ${error.message}`)
  }
}

export async function removeWorkoutItem(itemId: string): Promise<void> {
  const client = useSupabaseClient<Database>()

  const { error } = await client
    .from('workout_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    throw new Error(`Não foi possível remover o exercício: ${error.message}`)
  }
}

export async function updateWorkoutItemSets(
  itemId: string,
  sets: number,
): Promise<void> {
  const client = useSupabaseClient<Database>()
  const normalizedSets = Math.min(10, Math.max(1, sets))

  const { error } = await client
    .from('workout_items')
    .update({ sets: normalizedSets })
    .eq('id', itemId)

  if (error) {
    throw new Error(`Não foi possível atualizar as séries: ${error.message}`)
  }
}

// Lê o plano público pelo token usando a RPC SECURITY DEFINER.
// O token é a única credencial necessária para o aluno abrir a PWA.
export async function getPublicWorkoutPlan(
  accessToken: string,
): Promise<PublicWorkoutPlanData | null> {
  const client = useSupabaseClient<Database>()

  const { data, error } = await client.rpc('get_public_workout_plan', {
    p_access_token: accessToken,
  })

  if (error) {
    throw new Error(`Não foi possível carregar o treino: ${error.message}`)
  }

  if (!data) {
    return null
  }

  const payload = data as unknown as PublicWorkoutPlanPayload

  return {
    studentName: payload.student_name?.trim() || 'Aluno',
    plan: payload.plan,
    divisions: buildWorkoutDivisions(payload.items ?? []),
  }
}
