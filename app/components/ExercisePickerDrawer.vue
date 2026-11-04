<script setup lang="ts">
import type { PrototypeExercise } from '~/composables/usePrototypeData'
import { MUSCLE_FILTERS } from '~/composables/usePrototypeData'

const props = defineProps<{
  open: boolean
  exercises: PrototypeExercise[]
  selectedExerciseIds: string[]
}>()

const emit = defineEmits<{
  close: []
  select: [exercise: PrototypeExercise]
}>()

const search = ref('')
const activeMuscle = ref('all')
const searchInput = ref<HTMLInputElement | null>(null)

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const filteredExercises = computed(() => {
  const normalizedQuery = normalizeText(search.value)

  return props.exercises.filter((exercise) => {
    const matchesMuscle =
      activeMuscle.value === 'all' ||
      exercise.muscleGroup === activeMuscle.value

    const matchesQuery =
      normalizedQuery.length === 0 ||
      normalizeText(`${exercise.name} ${exercise.muscleLabel}`).includes(
        normalizedQuery,
      )

    return matchesMuscle && matchesQuery
  })
})

function isSelected(exerciseId: string): boolean {
  return props.selectedExerciseIds.includes(exerciseId)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

function setBodyScrollLock(locked: boolean) {
  if (typeof document === 'undefined') {
    return
  }

  document.body.style.overflow = locked ? 'hidden' : ''
}

watch(
  () => props.open,
  async (isOpen) => {
    setBodyScrollLock(isOpen)

    if (typeof window === 'undefined') {
      return
    }

    if (!isOpen) {
      window.removeEventListener('keydown', handleKeydown)
      return
    }

    search.value = ''
    activeMuscle.value = 'all'
    window.addEventListener('keydown', handleKeydown)

    await nextTick()
    searchInput.value?.focus()
  },
)

onBeforeUnmount(() => {
  setBodyScrollLock(false)

  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50">
        <div
          class="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
          aria-hidden="true"
          @click="emit('close')"
        />

        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="exercise-picker-title"
          class="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-tier-3 sm:inset-0 sm:m-auto sm:h-[720px] sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-3xl"
          @keydown.esc="emit('close')"
        >
          <header class="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
            <div>
              <p class="eyebrow">Biblioteca de exercícios</p>
              <h2 id="exercise-picker-title" class="mt-0.5 text-xl font-extrabold text-slate-900">
                Adicionar exercício
              </h2>
            </div>

            <button
              type="button"
              class="icon-button -mr-2 -mt-2 shrink-0"
              aria-label="Fechar seleção de exercícios"
              @click="emit('close')"
            >
              <BaseIcon name="close" :size="22" />
            </button>
          </header>

          <div class="border-b border-slate-200 p-4">
            <label for="exercise-search" class="sr-only">Buscar exercício</label>
            <div class="relative">
              <BaseIcon
                name="search"
                :size="20"
                class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="exercise-search"
                ref="searchInput"
                v-model="search"
                type="search"
                inputmode="search"
                autocomplete="off"
                placeholder="Buscar por nome..."
                class="input pl-12 pr-4"
              />
            </div>

            <div
              class="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1"
              role="group"
              aria-label="Filtrar por grupo muscular"
            >
              <button
                v-for="muscle in MUSCLE_FILTERS"
                :key="muscle.value"
                type="button"
                class="chip"
                :class="{ 'chip-active': activeMuscle === muscle.value }"
                :aria-pressed="activeMuscle === muscle.value"
                @click="activeMuscle = muscle.value"
              >
                {{ muscle.label }}
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto overscroll-contain p-4">
            <p class="mb-3 text-sm font-bold text-slate-500">
              {{ filteredExercises.length }}
              {{ filteredExercises.length === 1 ? 'exercício encontrado' : 'exercícios encontrados' }}
            </p>

            <ul v-if="filteredExercises.length > 0" class="space-y-2.5">
              <li
                v-for="exercise in filteredExercises"
                :key="exercise.id"
                class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2.5"
              >
                <div
                  class="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100"
                >
                  <img
                    :src="exercise.gifUrl"
                    :alt="`Demonstração do exercício ${exercise.name}`"
                    class="absolute inset-0 h-full w-full object-cover text-transparent"
                    loading="lazy"
                  />
                </div>

                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-bold leading-5 text-slate-900">
                    {{ exercise.name }}
                  </p>
                  <p class="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                    {{ exercise.muscleLabel }}
                  </p>
                </div>

                <button
                  type="button"
                  class="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl transition-colors"
                  :class="
                    isSelected(exercise.id)
                      ? 'bg-success-100 text-success-700'
                      : 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800'
                  "
                  :disabled="isSelected(exercise.id)"
                  :aria-label="
                    isSelected(exercise.id)
                      ? `${exercise.name} já está no treino`
                      : `Adicionar ${exercise.name} ao treino`
                  "
                  @click="emit('select', exercise)"
                >
                  <BaseIcon
                    :name="isSelected(exercise.id) ? 'check' : 'plus'"
                    :size="21"
                    :stroke-width="2.5"
                  />
                </button>
              </li>
            </ul>

            <div
              v-else
              class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"
            >
              <BaseIcon name="search" :size="32" class="text-slate-400" />
              <p class="mt-3 font-bold text-slate-700">Nenhum exercício encontrado</p>
              <p class="mt-1 text-sm text-slate-500">
                Tente outro nome ou selecione "Todos".
              </p>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
