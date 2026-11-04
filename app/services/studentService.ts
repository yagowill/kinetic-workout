// Service de alunos e anamneses.
// Centraliza leituras e gravações no Supabase para que as páginas não
// conheçam detalhes de tabelas, joins ou conversão de tipos.

import { useSupabaseClient, useSupabaseUser } from '#imports'
import type {
  Database,
  Json,
  Student,
  StudentAnamnesis,
  WorkoutPlan,
} from '~/types/database.types'
import type {
  StudentAnamnesisData,
  StudentDetail,
  StudentSummary,
} from '~/types/app.types'

// Paleta determinística para o avatar do aluno.
const AVATAR_COLORS = [
  '#4f46e5',
  '#0284c7',
  '#16a34a',
  '#d97706',
  '#db2777',
  '#7c3aed',
]

function hashString(value: string): number {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

function pickAvatarColor(id: string): string {
  const colorIndex = hashString(id) % AVATAR_COLORS.length

  return AVATAR_COLORS[colorIndex] ?? AVATAR_COLORS[0]!
}

function readStringArray(value: Json): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}

function mapAnamnesis(
  row: StudentAnamnesis | null,
): StudentAnamnesisData | null {
  if (!row) {
    return null
  }

  return {
    primaryGoal: row.primary_goal,
    experienceLevel: row.experience_level,
    weeklyFrequency: row.weekly_frequency,
    jointPains: readStringArray(row.joint_pains),
    medicalConditions: readStringArray(row.medical_conditions),
    additionalNotes: row.additional_notes ?? '',
  }
}

function mapStudentSummary(
  student: Student,
  anamnesis: StudentAnamnesis | null,
  plan: WorkoutPlan | null,
): StudentSummary {
  const anamnesisData = mapAnamnesis(anamnesis)

  return {
    id: student.id,
    name: student.name,
    phone: student.phone,
    goal: anamnesisData?.primaryGoal ?? 'Anamnese pendente',
    weeklyFrequency: anamnesisData?.weeklyFrequency ?? 0,
    experienceLevel: anamnesisData?.experienceLevel ?? 'Não informado',
    anamnesisStatus: anamnesisData ? 'complete' : 'pending',
    jointPains: anamnesisData?.jointPains ?? [],
    accessToken: plan?.access_token ?? null,
    anamnesisToken: student.anamnesis_token ?? null,
    avatarColor: pickAvatarColor(student.id),
  }
}

function toAnamnesisInsert(
  studentId: string,
  anamnesis: StudentAnamnesisData,
) {
  return {
    student_id: studentId,
    primary_goal: anamnesis.primaryGoal,
    experience_level: anamnesis.experienceLevel,
    weekly_frequency: anamnesis.weeklyFrequency,
    joint_pains: anamnesis.jointPains,
    medical_conditions: anamnesis.medicalConditions,
    additional_notes: anamnesis.additionalNotes.trim() || null,
  }
}

// Lista todos os alunos do personal autenticado com anamnese e plano ativo.
// As políticas de RLS já restringem o resultado ao usuário logado.
export async function listStudentSummaries(): Promise<StudentSummary[]> {
  const client = useSupabaseClient<Database>()

  const [studentsResponse, anamnesesResponse, plansResponse] = await Promise.all([
    client.from('students').select('*').order('created_at', { ascending: true }),
    client.from('student_anamneses').select('*'),
    client
      .from('workout_plans')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])

  if (studentsResponse.error) {
    throw new Error(
      `Não foi possível carregar os alunos: ${studentsResponse.error.message}`,
    )
  }

  if (anamnesesResponse.error) {
    throw new Error(
      `Não foi possível carregar as anamneses: ${anamnesesResponse.error.message}`,
    )
  }

  if (plansResponse.error) {
    throw new Error(
      `Não foi possível carregar os planos: ${plansResponse.error.message}`,
    )
  }

  const anamnesesByStudent = new Map<string, StudentAnamnesis>()

  for (const anamnesis of anamnesesResponse.data ?? []) {
    anamnesesByStudent.set(anamnesis.student_id, anamnesis)
  }

  const plansByStudent = new Map<string, WorkoutPlan>()

  for (const plan of plansResponse.data ?? []) {
    if (!plansByStudent.has(plan.student_id)) {
      plansByStudent.set(plan.student_id, plan)
    }
  }

  return (studentsResponse.data ?? []).map((student) =>
    mapStudentSummary(
      student,
      anamnesesByStudent.get(student.id) ?? null,
      plansByStudent.get(student.id) ?? null,
    ),
  )
}

// Carrega um aluno específico com anamnese e plano ativo.
export async function getStudentDetail(
  studentId: string,
): Promise<StudentDetail | null> {
  const client = useSupabaseClient<Database>()

  const [studentResponse, anamnesisResponse, planResponse] = await Promise.all([
    client.from('students').select('*').eq('id', studentId).maybeSingle(),
    client
      .from('student_anamneses')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle(),
    client
      .from('workout_plans')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (studentResponse.error) {
    throw new Error(
      `Não foi possível carregar o aluno: ${studentResponse.error.message}`,
    )
  }

  if (anamnesisResponse.error) {
    throw new Error(
      `Não foi possível carregar a anamnese: ${anamnesisResponse.error.message}`,
    )
  }

  if (planResponse.error) {
    throw new Error(
      `Não foi possível carregar o plano: ${planResponse.error.message}`,
    )
  }

  if (!studentResponse.data) {
    return null
  }

  return {
    student: mapStudentSummary(
      studentResponse.data,
      anamnesisResponse.data,
      planResponse.data,
    ),
    anamnesis: mapAnamnesis(anamnesisResponse.data),
  }
}

// Cria o aluno, a anamnese e um plano vazio em sequência.
// Se a anamnese falhar, o aluno recém-criado é removido para não deixar
// registros órfãos na carteira.
export async function createStudentWithAnamnesis(input: {
  name: string
  phone: string
  anamnesis: StudentAnamnesisData
}): Promise<StudentSummary> {
  const client = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const personalId = user.value?.id

  if (!personalId) {
    throw new Error('Sua sessão expirou. Entre novamente para cadastrar o aluno.')
  }

  const { data: student, error: studentError } = await client
    .from('students')
    .insert({
      personal_id: personalId,
      name: input.name.trim(),
      phone: input.phone.replace(/\D/g, ''),
    })
    .select('*')
    .single()

  if (studentError || !student) {
    throw new Error(
      `Não foi possível cadastrar o aluno: ${
        studentError?.message ?? 'registro não retornado.'
      }`,
    )
  }

  const { data: anamnesisRow, error: anamnesisError } = await client
    .from('student_anamneses')
    .insert(toAnamnesisInsert(student.id, input.anamnesis))
    .select('*')
    .single()

  if (anamnesisError || !anamnesisRow) {
    await client.from('students').delete().eq('id', student.id)

    throw new Error(
      `Não foi possível salvar a anamnese: ${
        anamnesisError?.message ?? 'registro não retornado.'
      }`,
    )
  }

  // O plano é opcional neste momento. Se falhar, o criador de treino
  // cria um novo plano quando o personal abrir a tela.
  const { data: plan } = await client
    .from('workout_plans')
    .insert({
      student_id: student.id,
      title: 'Plano de treino',
      is_active: true,
    })
    .select('*')
    .single()

  return mapStudentSummary(student, anamnesisRow, plan ?? null)
}

// Cria ou atualiza a anamnese de um aluno existente.
export async function saveStudentAnamnesis(
  studentId: string,
  anamnesis: StudentAnamnesisData,
): Promise<void> {
  const client = useSupabaseClient<Database>()

  const { error } = await client
    .from('student_anamneses')
    .upsert(toAnamnesisInsert(studentId, anamnesis), {
      onConflict: 'student_id',
    })

  if (error) {
    throw new Error(`Não foi possível salvar a anamnese: ${error.message}`)
  }
}
