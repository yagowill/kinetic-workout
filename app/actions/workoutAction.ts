// Actions responsáveis pelas regras de negócio dos planos de treino.

import { useSupabaseClient } from '#imports';
import type {
  Database,
  WorkoutPlanWithItems,
} from '../types/database.types';

const DEFAULT_ACCESS_TOKEN_BYTES = 32;
const MIN_ACCESS_TOKEN_BYTES = 16;
const MAX_ACCESS_TOKEN_BYTES = 32;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(value: string, fieldName: string): void {
  if (!UUID_PATTERN.test(value.trim())) {
    throw new Error(`${fieldName} inválido.`);
  }
}

// Gera um token aleatório criptograficamente seguro.
// O valor padrão produz 64 caracteres hexadecimais, compatível com VARCHAR(64).
export function generateAccessToken(
  byteLength = DEFAULT_ACCESS_TOKEN_BYTES,
): string {
  if (
    !Number.isInteger(byteLength) ||
    byteLength < MIN_ACCESS_TOKEN_BYTES ||
    byteLength > MAX_ACCESS_TOKEN_BYTES
  ) {
    throw new Error(
      `O token deve ter entre ${MIN_ACCESS_TOKEN_BYTES} e ${MAX_ACCESS_TOKEN_BYTES} bytes.`,
    );
  }

  const cryptoApi = globalThis.crypto;

  if (!cryptoApi || typeof cryptoApi.getRandomValues !== 'function') {
    throw new Error('A API de criptografia segura não está disponível.');
  }

  const randomBytes = new Uint8Array(byteLength);
  cryptoApi.getRandomValues(randomBytes);

  return Array.from(randomBytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

// Duplica um plano de treino inteiro, com todos os seus itens, para outro aluno.
// A escrita é feita por uma RPC transacional no PostgreSQL para garantir que
// plano e itens sejam criados juntos ou revertidos juntos.
export async function duplicateWorkoutPlan(
  originalPlanId: string,
  targetStudentId: string,
  newTitle: string,
): Promise<WorkoutPlanWithItems> {
  assertUuid(originalPlanId, 'Plano original');
  assertUuid(targetStudentId, 'Aluno de destino');

  const normalizedTitle = newTitle.trim();

  if (normalizedTitle.length === 0 || normalizedTitle.length > 100) {
    throw new Error('O título do plano deve ter entre 1 e 100 caracteres.');
  }

  const client = useSupabaseClient<Database>();
  const accessToken = generateAccessToken();

  const { data: newPlanId, error: duplicationError } = await client.rpc(
    'duplicate_workout_plan',
    {
      p_original_plan_id: originalPlanId,
      p_target_student_id: targetStudentId,
      p_new_title: normalizedTitle,
      p_new_access_token: accessToken,
    },
  );

  if (duplicationError || !newPlanId) {
    throw new Error(
      `Não foi possível duplicar o plano de treino: ${
        duplicationError?.message ?? 'plano não retornado.'
      }`,
    );
  }

  const [planResponse, itemsResponse] = await Promise.all([
    client
      .from('workout_plans')
      .select('*')
      .eq('id', newPlanId)
      .single(),
    client
      .from('workout_items')
      .select('*')
      .eq('workout_plan_id', newPlanId)
      .order('session_label', { ascending: true })
      .order('order_index', { ascending: true }),
  ]);

  if (planResponse.error || !planResponse.data) {
    throw new Error(
      `Plano duplicado, mas não foi possível carregá-lo: ${
        planResponse.error?.message ?? 'plano não encontrado.'
      }`,
    );
  }

  if (itemsResponse.error) {
    throw new Error(
      `Plano duplicado, mas não foi possível carregar os itens: ${itemsResponse.error.message}`,
    );
  }

  return {
    ...planResponse.data,
    workout_items: itemsResponse.data ?? [],
  };
}
