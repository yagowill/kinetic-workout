<script setup lang="ts">
import type { WorkoutDivisionView } from '~/types/app.types'
import { getPublicWorkoutPlan } from '~/services/workoutService'

const route = useRoute()
const accessToken = String(route.params.accessToken ?? '')

const { data, pending, error } = await useAsyncData(
  `public-workout-${accessToken}`,
  () => getPublicWorkoutPlan(accessToken),
)

const studentName = computed(() => data.value?.studentName ?? 'Aluno')
const divisionList = computed<WorkoutDivisionView[]>(
  () => data.value?.divisions ?? [],
)

const activeDivisionId = ref('A')
const activeDivision = computed(
  () =>
    divisionList.value.find(
      (division) => division.id === activeDivisionId.value,
    ) ??
    divisionList.value[0] ??
    null,
)

watchEffect(() => {
  if (divisionList.value.length === 0) {
    return
  }

  if (
    !divisionList.value.some(
      (division) => division.id === activeDivisionId.value,
    )
  ) {
    activeDivisionId.value = divisionList.value[0]?.id ?? 'A'
  }
})

const completedByDivision = reactive<Record<string, string[]>>({})
const completionDialogOpen = ref(false)
const toast = reactive<{
  open: boolean
  message: string
  tone: 'success' | 'info'
}>({
  open: false,
  message: '',
  tone: 'success',
})

let toastTimer: ReturnType<typeof setTimeout> | null = null

const completedIds = computed(
  () => completedByDivision[activeDivisionId.value] ?? [],
)
const totalExercises = computed(() => activeDivision.value?.items.length ?? 0)
const completedCount = computed(
  () =>
    activeDivision.value?.items.filter((item) =>
      completedIds.value.includes(item.id),
    ).length ?? 0,
)
const remainingCount = computed(() =>
  Math.max(0, totalExercises.value - completedCount.value),
)
const allCompleted = computed(
  () => totalExercises.value > 0 && completedCount.value === totalExercises.value,
)
const progressPercentage = computed(() =>
  totalExercises.value === 0
    ? 0
    : Math.round((completedCount.value / totalExercises.value) * 100),
)

function showToast(message: string, tone: 'success' | 'info' = 'success') {
  toast.message = message
  toast.tone = tone
  toast.open = true

  if (toastTimer) {
    clearTimeout(toastTimer)
  }

  toastTimer = setTimeout(() => {
    toast.open = false
  }, 2600)
}

function isCompleted(exerciseId: string): boolean {
  return completedIds.value.includes(exerciseId)
}

function toggleExercise(exerciseId: string) {
  const currentIds = completedByDivision[activeDivisionId.value] ?? []

  completedByDivision[activeDivisionId.value] = currentIds.includes(exerciseId)
    ? currentIds.filter((id) => id !== exerciseId)
    : [...currentIds, exerciseId]
}

function selectDivision(divisionId: string) {
  activeDivisionId.value = divisionId
}

function handleTabKeydown(event: KeyboardEvent, currentIndex: number) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
    return
  }

  event.preventDefault()

  if (divisionList.value.length === 0) {
    return
  }

  const direction = event.key === 'ArrowRight' ? 1 : -1
  const nextIndex =
    (currentIndex + direction + divisionList.value.length) %
    divisionList.value.length
  const nextDivision = divisionList.value[nextIndex]

  if (!nextDivision) {
    return
  }

  activeDivisionId.value = nextDivision.id

  nextTick(() => {
    document.getElementById(`student-division-tab-${nextDivision.id}`)?.focus()
  })
}

function finishWorkout() {
  if (totalExercises.value === 0) {
    return
  }

  if (!allCompleted.value) {
    showToast(
      `Ainda faltam ${remainingCount.value} ${
        remainingCount.value === 1 ? 'exercício' : 'exercícios'
      }.`,
      'info',
    )
    return
  }

  completionDialogOpen.value = true
}

onBeforeUnmount(() => {
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
})

useHead({
  title: computed(() => `Treino de ${studentName.value}`),
  meta: [{ name: 'theme-color', content: '#0f172a' }],
})
</script>

<template>
  <div class="dark min-h-dvh bg-slate-950 pb-40 text-white" style="color-scheme: dark">
    <header class="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div class="mx-auto max-w-md px-4 py-3 pt-safe">
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2.5">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-tier-2">
              <BaseIcon name="bolt" :size="22" :stroke-width="2.5" />
            </span>
            <div class="min-w-0">
              <p class="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                Meu treino
              </p>
              <h1 class="truncate text-lg font-extrabold text-white">
                {{ studentName }}
              </h1>
            </div>
          </div>
        </div>

        <div class="mt-3 rounded-2xl border border-slate-800 bg-slate-900 p-3">
          <div class="flex items-center justify-between gap-2 text-sm">
            <span class="font-bold text-slate-300">Progresso de hoje</span>
            <span class="font-extrabold tabular-nums text-success-400" aria-live="polite">
              {{ completedCount }}/{{ totalExercises }}
            </span>
          </div>
          <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              class="h-full rounded-full bg-success-500 transition-all duration-300"
              :style="{ width: `${progressPercentage}%` }"
            />
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-md px-4 py-4">
      <div v-if="pending" class="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p class="font-bold text-slate-300">Carregando treino...</p>
        <p class="mt-1 text-sm text-slate-400">
          Buscando seu plano no servidor.
        </p>
      </div>

      <div v-else-if="error" class="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <BaseIcon name="warning" :size="32" class="mx-auto text-warning-400" />
        <h2 class="mt-3 text-xl font-extrabold text-white">
          Não foi possível carregar
        </h2>
        <p class="mt-1 text-sm text-slate-400">{{ error.message }}</p>
      </div>

      <div v-else-if="!data" class="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <BaseIcon name="warning" :size="32" class="mx-auto text-warning-400" />
        <h2 class="mt-3 text-xl font-extrabold text-white">Treino não encontrado</h2>
        <p class="mt-1 text-sm text-slate-400">
          Peça um novo link ao seu personal trainer.
        </p>
      </div>

      <template v-else>
        <div class="mb-4">
          <p class="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Divisões do plano
          </p>
          <div
            class="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Escolher divisão do treino"
          >
            <button
              v-for="(division, index) in divisionList"
              :id="`student-division-tab-${division.id}`"
              :key="division.id"
              type="button"
              role="tab"
              class="min-h-12 shrink-0 rounded-xl px-5 text-base font-extrabold transition-colors"
              :class="
                activeDivisionId === division.id
                  ? 'bg-brand-500 text-white shadow-tier-2'
                  : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
              "
              :aria-selected="activeDivisionId === division.id"
              :aria-controls="`student-division-panel-${division.id}`"
              :tabindex="activeDivisionId === division.id ? 0 : -1"
              @click="selectDivision(division.id)"
              @keydown="handleTabKeydown($event, index)"
            >
              {{ division.label }}
            </button>
          </div>
        </div>

        <section
          v-if="activeDivision"
          :id="`student-division-panel-${activeDivision.id}`"
          role="tabpanel"
          :aria-labelledby="`student-division-tab-${activeDivision.id}`"
        >
          <div class="mb-3 flex items-end justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                {{ activeDivision.label }}
              </p>
              <h2 class="truncate text-xl font-extrabold text-white">
                {{ activeDivision.focus }}
              </h2>
            </div>
            <span class="shrink-0 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-extrabold text-slate-300">
              {{ totalExercises }} exercícios
            </span>
          </div>

          <div class="space-y-3">
            <StudentExerciseCard
              v-for="item in activeDivision.items"
              :key="item.id"
              :item="item"
              :completed="isCompleted(item.id)"
              @toggle="toggleExercise(item.id)"
            />
          </div>

          <div
            v-if="activeDivision.items.length === 0"
            class="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-8 text-center"
          >
            <BaseIcon name="dumbbell" :size="32" class="mx-auto text-slate-500" />
            <p class="mt-3 font-extrabold text-white">Nenhum exercício nesta divisão</p>
            <p class="mt-1 text-sm text-slate-400">
              Seu personal ainda está montando este treino.
            </p>
          </div>
        </section>
      </template>
    </main>

    <div class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 p-4 pb-safe shadow-tier-3 backdrop-blur">
      <div class="mx-auto max-w-md">
        <div class="mb-2 flex items-center justify-between gap-2 text-xs font-bold">
          <span class="text-slate-400">
            {{ completedCount }} de {{ totalExercises }} concluídos
          </span>
          <span v-if="allCompleted" class="text-success-400">Tudo pronto!</span>
          <span v-else class="text-slate-500">
            Faltam {{ remainingCount }}
          </span>
        </div>

        <button
          type="button"
          class="btn btn-success w-full text-lg"
          :disabled="totalExercises === 0"
          @click="finishWorkout"
        >
          <BaseIcon name="check-circle" :size="23" :stroke-width="2.5" />
          Concluir treino
        </button>
      </div>
    </div>

    <AppToast :open="toast.open" :message="toast.message" :tone="toast.tone" />

    <Teleport to="body">
      <div
        v-if="completionDialogOpen"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/80 p-4 backdrop-blur-sm sm:items-center"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="workout-completion-title"
          class="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-5 text-white shadow-tier-3"
        >
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-500 text-slate-950">
            <BaseIcon name="check-circle" :size="34" :stroke-width="2.5" />
          </div>

          <h2
            id="workout-completion-title"
            class="mt-4 text-center text-2xl font-extrabold"
          >
            Treino concluído!
          </h2>
          <p class="mt-2 text-center text-sm font-medium text-slate-300">
            Você completou {{ totalExercises }} exercícios do
            {{ activeDivision?.label }}. Excelente trabalho!
          </p>

          <div class="mt-5">
            <button
              type="button"
              class="btn btn-success w-full"
              @click="completionDialogOpen = false"
            >
              Voltar ao treino
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
