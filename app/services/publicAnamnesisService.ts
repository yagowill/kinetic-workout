// Service da anamnese pública preenchida pelo aluno.
// O token da URL é a única credencial: não há login para o aluno.
// As RPCs SECURITY DEFINER validam o token e gravam apenas a anamnese.

import { useSupabaseClient } from '#imports'
import type { Database, Json } from '~/types/database.types'
import type {
  PublicAnamnesisData,
  PublicAnamnesisPayload,
  StudentAnamnesisData,
} from '~/types/app.types'

function readStringArray(value: Json | undefined): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}

function mapAnamnesis(
  payload: PublicAnamnesisPayload['anamnesis'],
): StudentAnamnesisData | null {
  if (!payload) {
    return null
  }

  return {
    primaryGoal: payload.primary_goal,
    experienceLevel: payload.experience_level,
    weeklyFrequency: payload.weekly_frequency,
    jointPains: readStringArray(payload.joint_pains),
    medicalConditions: readStringArray(payload.medical_conditions),
    additionalNotes: payload.additional_notes ?? '',
  }
}

// Carrega a anamnese pelo token. Retorna null quando o link não existe.
export async function getPublicAnamnesis(
  token: string,
): Promise<PublicAnamnesisData | null> {
  const client = useSupabaseClient<Database>()

  const { data, error } = await client.rpc('get_public_anamnesis', {
    p_token: token,
  })

  if (error) {
    throw new Error(
      `Não foi possível carregar a anamnese: ${error.message}`,
    )
  }

  if (!data) {
    return null
  }

  const payload = data as unknown as PublicAnamnesisPayload

  return {
    studentName: payload.student_name?.trim() || 'Aluno',
    updatedAt: payload.updated_at,
    workoutAccessToken: payload.workout_access_token,
    anamnesis: mapAnamnesis(payload.anamnesis),
  }
}

// Cria ou atualiza as respostas do aluno. Devolve a data da atualização.
export async function savePublicAnamnesis(
  token: string,
  anamnesis: StudentAnamnesisData,
): Promise<string | null> {
  const client = useSupabaseClient<Database>()

  const { data, error } = await client.rpc('save_public_anamnesis', {
    p_token: token,
    p_primary_goal: anamnesis.primaryGoal,
    p_experience_level: anamnesis.experienceLevel,
    p_weekly_frequency: anamnesis.weeklyFrequency,
    p_joint_pains: anamnesis.jointPains,
    p_medical_conditions: anamnesis.medicalConditions,
    p_additional_notes: anamnesis.additionalNotes.trim() || null,
  })

  if (error) {
    throw new Error(
      error.message.includes('Link de anamnese')
        ? error.message
        : `Não foi possível enviar suas respostas: ${error.message}`,
    )
  }

  const payload = data as unknown as { updated_at?: string } | null

  return payload?.updated_at ?? null
}
