// Service responsável por consumir e filtrar a base pública de exercícios.
// O cache em memória evita requisições repetidas à API durante a sessão.

import type { ExerciseOption } from '~/types/app.types'
import { resolveMuscle } from '~/utils/muscles'

// Repositório oficial da API:
// https://github.com/JahelCuadrado/ExerciseGymGifsDB
//
// O arquivo db.json não existe mais na branch main. A API atual expõe os
// exercícios em api/<idioma>/exercises.json. A versão v1.1.0 é fixada no CDN
// para evitar mudanças inesperadas no formato dos dados.
const EXERCISES_API_LANGUAGE = 'es';
const EXERCISES_API_CDN_BASE_URL =
  'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0';

const PRIMARY_EXERCISES_API_URL =
  `${EXERCISES_API_CDN_BASE_URL}/api/${EXERCISES_API_LANGUAGE}/exercises.json`;

// Fallback direto pelo GitHub caso o CDN esteja indisponível.
const FALLBACK_EXERCISES_API_URL =
  `https://raw.githubusercontent.com/JahelCuadrado/ExerciseGymGifsDB/main/api/${EXERCISES_API_LANGUAGE}/exercises.json`;

const CACHE_TTL_IN_MILLISECONDS = 1000 * 60 * 30;

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: string;
  gifUrl: string;
  bodyPart: string | null;
  equipment: string | null;
  secondaryMuscles: string[];
  instructions: string[];
}

interface RawExercise {
  id?: unknown;
  slug?: unknown;
  name?: unknown;
  muscle?: unknown;
  target?: unknown;
  bodyPart?: unknown;
  equipment?: unknown;
  secondaryMuscles?: unknown;
  instructions?: unknown;
  gifUrl?: unknown;
  gif_url?: unknown;
  image?: unknown;
}

interface ExerciseCache {
  exercises: Exercise[];
  expiresAt: number;
}

let exerciseCache: ExerciseCache | null = null;
let pendingExercisesRequest: Promise<Exercise[]> | null = null;

// Normaliza o texto para que a busca ignore acentos, caixa e espaços extras.
function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => readString(item))
    .filter((item): item is string => item !== null);
}

// Aceita tanto o formato de array direto quanto os envelopes usados pela API.
function extractRawExercises(payload: unknown): RawExercise[] {
  if (Array.isArray(payload)) {
    return payload as RawExercise[];
  }

  if (!isRecord(payload)) {
    return [];
  }

  for (const key of ['exercises', 'data', 'results']) {
    const value = payload[key];

    if (Array.isArray(value)) {
      return value as RawExercise[];
    }
  }

  return [];
}

function normalizeExercise(rawExercise: RawExercise, index: number): Exercise | null {
  const name = readString(rawExercise.name);
  const gifUrl =
    readString(rawExercise.gifUrl) ??
    readString(rawExercise.gif_url) ??
    readString(rawExercise.image);

  // Exercícios sem nome ou sem GIF não podem ser usados na montagem do treino.
  if (!name || !gifUrl) {
    return null;
  }

  const id =
    readString(rawExercise.id) ??
    readString(rawExercise.slug) ??
    `exercise-${index + 1}`;

  const targetMuscle = (
    readString(rawExercise.muscle) ??
    readString(rawExercise.target) ??
    readString(rawExercise.bodyPart) ??
    'other'
  ).toLowerCase();

  return {
    id,
    name,
    targetMuscle,
    gifUrl,
    bodyPart: readString(rawExercise.bodyPart),
    equipment: readString(rawExercise.equipment),
    secondaryMuscles: readStringArray(rawExercise.secondaryMuscles),
    instructions: readStringArray(rawExercise.instructions),
  };
}

async function fetchExercisesFromUrl(url: string): Promise<Exercise[]> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar exercícios: HTTP ${response.status}.`);
  }

  const payload: unknown = await response.json();
  const exercises = extractRawExercises(payload)
    .map((rawExercise, index) => normalizeExercise(rawExercise, index))
    .filter((exercise): exercise is Exercise => exercise !== null);

  if (exercises.length === 0) {
    throw new Error('A API de exercícios retornou uma lista vazia.');
  }

  return exercises;
}

async function loadExercises(): Promise<Exercise[]> {
  try {
    return await fetchExercisesFromUrl(PRIMARY_EXERCISES_API_URL);
  } catch {
    // Mantém a aplicação funcional caso o CDN esteja temporariamente indisponível.
    return fetchExercisesFromUrl(FALLBACK_EXERCISES_API_URL);
  }
}

// Retorna a lista completa de exercícios usando cache em memória.
// Requisições simultâneas compartilham a mesma Promise para evitar duplicidade.
export async function getExercises(forceRefresh = false): Promise<Exercise[]> {
  if (
    !forceRefresh &&
    exerciseCache !== null &&
    exerciseCache.expiresAt > Date.now()
  ) {
    return exerciseCache.exercises;
  }

  if (pendingExercisesRequest !== null) {
    return pendingExercisesRequest;
  }

  pendingExercisesRequest = loadExercises()
    .then((exercises) => {
      exerciseCache = {
        exercises,
        expiresAt: Date.now() + CACHE_TTL_IN_MILLISECONDS,
      };

      return exercises;
    })
    .finally(() => {
      pendingExercisesRequest = null;
    });

  return pendingExercisesRequest;
}

// Busca exercícios por nome, músculo, equipamento e músculos secundários.
// Quando targetMuscle é informado, a lista é restringida ao grupo muscular.
export async function searchExercises(
  query: string,
  targetMuscle?: string,
): Promise<Exercise[]> {
  const exercises = await getExercises();
  const normalizedQuery = normalizeSearchText(query);
  const normalizedTargetMuscle = normalizeSearchText(targetMuscle ?? '');

  const filteredExercises = exercises.filter((exercise) => {
    const muscleTerms = [
      exercise.targetMuscle,
      exercise.bodyPart ?? '',
      ...exercise.secondaryMuscles,
    ]
      .map((term) => normalizeSearchText(term))
      .filter((term) => term.length > 0);

    const matchesTargetMuscle =
      normalizedTargetMuscle.length === 0 ||
      muscleTerms.some(
        (term) =>
          term === normalizedTargetMuscle ||
          term.includes(normalizedTargetMuscle) ||
          normalizedTargetMuscle.includes(term),
      );

    if (!matchesTargetMuscle) {
      return false;
    }

    if (normalizedQuery.length === 0) {
      return true;
    }

    const searchableContent = normalizeSearchText(
      [
        exercise.name,
        exercise.targetMuscle,
        exercise.bodyPart ?? '',
        exercise.equipment ?? '',
        ...exercise.secondaryMuscles,
      ].join(' '),
    );

    return searchableContent.includes(normalizedQuery);
  });

  // Coloca primeiro os exercícios cujo nome começa com o termo pesquisado.
  return filteredExercises
    .map((exercise) => {
      const normalizedName = normalizeSearchText(exercise.name);
      const relevance = normalizedQuery.length === 0
        ? 0
        : normalizedName.startsWith(normalizedQuery)
          ? 0
          : normalizedName.includes(normalizedQuery)
            ? 1
            : 2;

      return { exercise, relevance };
    })
    .sort(
      (first, second) =>
        first.relevance - second.relevance ||
        first.exercise.name.localeCompare(second.exercise.name, 'pt-BR'),
    )
    .map(({ exercise }) => exercise);
}

// Permite limpar o cache manualmente, por exemplo após trocar de ambiente.
export function clearExerciseCache(): void {
  exerciseCache = null;
  pendingExercisesRequest = null;
}

// Converte a lista da API para o formato enxuto usado pelo seletor de treino.
export async function getExerciseOptions(): Promise<ExerciseOption[]> {
  const exercises = await getExercises();

  return exercises.map((exercise) => {
    const muscle = resolveMuscle(exercise.targetMuscle);

    return {
      id: exercise.id,
      name: exercise.name,
      targetMuscle: exercise.targetMuscle,
      muscleGroup: muscle.group,
      muscleLabel: muscle.label,
      gifUrl: exercise.gifUrl,
    };
  });
}
