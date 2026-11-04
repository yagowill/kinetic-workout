// Service responsável por montar o link de compartilhamento do treino no WhatsApp.

import { useRuntimeConfig } from '#imports';

const WHATSAPP_BASE_URL = 'https://wa.me';
const BRAZIL_COUNTRY_CODE = '55';
const DEFAULT_APP_BASE_URL = 'http://localhost:3000';

// Remove caracteres não numéricos e garante o formato internacional brasileiro.
function normalizeBrazilianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^0+/, '');

  if (digits.length === 0) {
    throw new Error('O telefone do aluno não foi informado.');
  }

  // Já está no formato 55 + DDD + número.
  if (
    digits.startsWith(BRAZIL_COUNTRY_CODE) &&
    (digits.length === 12 || digits.length === 13)
  ) {
    return digits;
  }

  // Formato nacional: DDD + número fixo (10) ou celular (11).
  if (digits.length === 10 || digits.length === 11) {
    return `${BRAZIL_COUNTRY_CODE}${digits}`;
  }

  throw new Error('Telefone do aluno inválido. Informe o DDD e o número.');
}

// Resolve a URL base da PWA a partir do runtime config do Nuxt.
// O fallback permite reutilizar a função fora do contexto da aplicação.
function resolveAppBaseUrl(): string {
  try {
    const runtimeConfig = useRuntimeConfig();
    const configuredAppUrl = runtimeConfig.public.appUrl;

    if (typeof configuredAppUrl === 'string' && configuredAppUrl.trim().length > 0) {
      return configuredAppUrl.trim().replace(/\/+$/, '');
    }
  } catch {
    // O contexto do Nuxt não está disponível (ex.: testes unitários).
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return DEFAULT_APP_BASE_URL;
}

// Gera a URL do WhatsApp com a mensagem e o link público do plano de treino.
export function buildWorkoutWhatsAppUrl(
  studentPhone: string,
  studentName: string,
  planTitle: string,
  accessToken: string,
): string {
  const normalizedPhone = normalizeBrazilianPhone(studentPhone);
  const normalizedAccessToken = accessToken.trim();

  if (normalizedAccessToken.length === 0) {
    throw new Error('O token de acesso do plano não foi informado.');
  }

  const appBaseUrl = resolveAppBaseUrl();
  const workoutUrl = `${appBaseUrl}/t/${encodeURIComponent(normalizedAccessToken)}`;
  const studentDisplayName = studentName.trim() || 'aluno';
  const planDisplayTitle = planTitle.trim() || 'Treino';

  const message = [
    `Olá, ${studentDisplayName}!`,
    `Seu treino "${planDisplayTitle}" está pronto.`,
    `Acesse o link: ${workoutUrl}`,
  ].join('\n');

  return `${WHATSAPP_BASE_URL}/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

// Gera a URL do WhatsApp com o link público da anamnese.
// O aluno pode reabrir o mesmo link para atualizar as respostas.
export function buildAnamnesisWhatsAppUrl(
  studentPhone: string,
  studentName: string,
  anamnesisToken: string,
): string {
  const normalizedPhone = normalizeBrazilianPhone(studentPhone);
  const normalizedToken = anamnesisToken.trim();

  if (normalizedToken.length === 0) {
    throw new Error('O token da anamnese não foi informado.');
  }

  const appBaseUrl = resolveAppBaseUrl();
  const anamnesisUrl = `${appBaseUrl}/a/${encodeURIComponent(normalizedToken)}`;
  const studentDisplayName = studentName.trim() || 'aluno';

  const message = [
    `Olá, ${studentDisplayName}!`,
    'Para montar seu treino, preciso de algumas informações sobre você.',
    `Responda sua anamnese aqui: ${anamnesisUrl}`,
    'Leva menos de 2 minutos e você pode atualizar as respostas depois pelo mesmo link.',
  ].join('\n');

  return `${WHATSAPP_BASE_URL}/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
