// Service de GIFs personalizados por exercício.
// O override é por personal e vale para todos os treinos e alunos dele.
// O GIF original da API continua como fallback em workout_items.gif_url.

import { useSupabaseClient, useSupabaseUser } from '#imports'
import type { Database, ExerciseGifOverrideRow } from '~/types/database.types'
import type { ExerciseGifOverride, ExerciseOption } from '~/types/app.types'
import { getExerciseOptions } from './exerciseService'

const STORAGE_BUCKET = 'exercise-gifs'
const MAX_FILE_SIZE_IN_BYTES = 8 * 1024 * 1024
const ALLOWED_MIME_TYPES = [
  'image/gif',
  'image/webp',
  'image/png',
  'image/jpeg',
]

const MIME_EXTENSIONS: Record<string, string> = {
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
}

function mapOverride(row: ExerciseGifOverrideRow): ExerciseGifOverride {
  return {
    exerciseId: row.external_exercise_id,
    exerciseName: row.exercise_name,
    gifUrl: row.gif_url,
    storagePath: row.storage_path,
    updatedAt: row.updated_at,
  }
}

function requireUserId(): string {
  const user = useSupabaseUser()
  const userId = user.value?.id

  if (!userId) {
    throw new Error(
      'Sua sessão expirou. Entre novamente para alterar o GIF do exercício.',
    )
  }

  return userId
}

// Valida o arquivo antes do upload para dar uma mensagem clara ao personal.
export function validateExerciseGifFile(file: File): void {
  if (file.size === 0) {
    throw new Error('O arquivo selecionado está vazio.')
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Envie um arquivo GIF, WebP, PNG ou JPG.')
  }

  if (file.size > MAX_FILE_SIZE_IN_BYTES) {
    throw new Error('O arquivo deve ter no máximo 8 MB.')
  }
}

// Aceita apenas URLs https para evitar conteúdo misto no navegador.
function normalizeGifUrl(value: string): string {
  const trimmed = value.trim()

  if (!trimmed) {
    throw new Error('Informe a URL do GIF.')
  }

  let url: URL

  try {
    url = new URL(trimmed)
  } catch {
    throw new Error('Informe uma URL válida.')
  }

  if (url.protocol !== 'https:') {
    throw new Error('A URL do GIF precisa começar com https://.')
  }

  return url.toString()
}

function buildStoragePath(
  userId: string,
  exerciseId: string,
  file: File,
): string {
  const extension = MIME_EXTENSIONS[file.type] ?? 'gif'
  const safeExerciseId =
    exerciseId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40) || 'exercise'
  const uniqueId = `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return `${userId}/${safeExerciseId}-${uniqueId}.${extension}`
}

// Lista os overrides do personal autenticado.
// As políticas de RLS restringem o resultado ao próprio usuário.
export async function listExerciseGifOverrides(): Promise<
  ExerciseGifOverride[]
> {
  const client = useSupabaseClient<Database>()

  const { data, error } = await client
    .from('exercise_gif_overrides')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(
      `Não foi possível carregar os GIFs personalizados: ${error.message}`,
    )
  }

  return (data ?? []).map(mapOverride)
}

// Aplica os overrides na lista de exercícios exibida no seletor.
export function applyExerciseGifOverrides(
  options: ExerciseOption[],
  overrides: ExerciseGifOverride[],
): ExerciseOption[] {
  if (overrides.length === 0) {
    return options
  }

  const overridesByExerciseId = new Map(
    overrides.map((override) => [override.exerciseId, override]),
  )

  return options.map((option) => {
    const override = overridesByExerciseId.get(option.id)

    return override ? { ...option, gifUrl: override.gifUrl } : option
  })
}

// Carrega a biblioteca já com os GIFs personalizados do personal.
export async function getExerciseOptionsWithOverrides(): Promise<
  ExerciseOption[]
> {
  const [options, overrides] = await Promise.all([
    getExerciseOptions(),
    listExerciseGifOverrides().catch(() => [] as ExerciseGifOverride[]),
  ])

  return applyExerciseGifOverrides(options, overrides)
}

// Envia o arquivo para o bucket e devolve a URL pública e o caminho salvo.
export async function uploadExerciseGif(
  file: File,
  exerciseId: string,
): Promise<{ gifUrl: string; storagePath: string }> {
  validateExerciseGifFile(file)

  const client = useSupabaseClient<Database>()
  const userId = requireUserId()
  const storagePath = buildStoragePath(userId, exerciseId, file)

  const { error } = await client.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    throw new Error(`Não foi possível enviar o GIF: ${error.message}`)
  }

  const { data } = client.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath)

  if (!data.publicUrl) {
    try {
      await client.storage.from(STORAGE_BUCKET).remove([storagePath])
    } catch {
      // A limpeza é best-effort; o erro principal é a URL não gerada.
    }

    throw new Error('Não foi possível gerar o endereço público do GIF.')
  }

  return { gifUrl: data.publicUrl, storagePath }
}

// Remove um arquivo enviado. Usado ao trocar ou restaurar o GIF.
export async function deleteExerciseGifFile(
  storagePath: string,
): Promise<void> {
  const client = useSupabaseClient<Database>()
  const { error } = await client.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath])

  if (error) {
    throw new Error(`Não foi possível remover o arquivo antigo: ${error.message}`)
  }
}

// Cria ou atualiza o override do exercício para o personal autenticado.
// Se havia um arquivo antigo no Storage, ele é removido após o upsert.
export async function saveExerciseGifOverride(input: {
  exerciseId: string
  exerciseName: string
  gifUrl: string
  storagePath?: string | null
}): Promise<ExerciseGifOverride> {
  const client = useSupabaseClient<Database>()
  const userId = requireUserId()
  const gifUrl = normalizeGifUrl(input.gifUrl)
  const storagePath = input.storagePath ?? null

  const { data: existingOverride } = await client
    .from('exercise_gif_overrides')
    .select('storage_path')
    .eq('external_exercise_id', input.exerciseId)
    .maybeSingle()

  const { data, error } = await client
    .from('exercise_gif_overrides')
    .upsert(
      {
        personal_id: userId,
        external_exercise_id: input.exerciseId,
        exercise_name: input.exerciseName.trim(),
        gif_url: gifUrl,
        storage_path: storagePath,
      },
      { onConflict: 'personal_id,external_exercise_id' },
    )
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(
      `Não foi possível salvar o GIF: ${
        error?.message ?? 'registro não retornado.'
      }`,
    )
  }

  if (
    existingOverride?.storage_path &&
    existingOverride.storage_path !== storagePath
  ) {
    try {
      await client.storage
        .from(STORAGE_BUCKET)
        .remove([existingOverride.storage_path])
    } catch {
      // A limpeza do arquivo antigo não deve impedir o salvamento do novo GIF.
    }
  }

  return mapOverride(data)
}

// Remove o override e volta ao GIF original da API.
export async function removeExerciseGifOverride(
  exerciseId: string,
): Promise<void> {
  const client = useSupabaseClient<Database>()

  const { data: existingOverride, error: readError } = await client
    .from('exercise_gif_overrides')
    .select('storage_path')
    .eq('external_exercise_id', exerciseId)
    .maybeSingle()

  if (readError) {
    throw new Error(
      `Não foi possível carregar o GIF personalizado: ${readError.message}`,
    )
  }

  const { error } = await client
    .from('exercise_gif_overrides')
    .delete()
    .eq('external_exercise_id', exerciseId)

  if (error) {
    throw new Error(
      `Não foi possível restaurar o GIF original: ${error.message}`,
    )
  }

  if (existingOverride?.storage_path) {
    try {
      await client.storage
        .from(STORAGE_BUCKET)
        .remove([existingOverride.storage_path])
    } catch {
      // O override já foi removido; a limpeza do arquivo é best-effort.
    }
  }
}
