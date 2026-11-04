<script setup lang="ts">
import type { PrototypeExercise } from '~/composables/usePrototypeData'
import { PROTOTYPE_EXERCISES } from '~/composables/usePrototypeData'
import { buildWorkoutWhatsAppUrl } from '~/services/whatsappService'

const route = useRoute()
const {
  getStudent,
  getDivisions,
  addWorkoutDivision,
  addExerciseToDivision,
  removeExerciseFromDivision,
  updateExerciseSets,
} = usePrototypeData()

const studentId = String(route.params.studentId ?? '')
const student = getStudent(studentId)
const divisionList = student ? getDivisions(studentId) : []

const activeDivisionId = ref(divisionList[0]?.id ?? 'A')
const activeDivision = computed(
  () =>
    divisionList.find((division) => division.id === activeDivisionId.value) ??
    divisionList[0] ??
    null,
)

const pickerOpen = ref(false)
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

const hasJointPain = computed(
  () => (student?.jointPains.length ?? 0) > 0,
)
const painSummary = computed(
  () => student?.jointPains.join(' e ').toLowerCase() ?? '',
)
const selectedExerciseIds = computed(
  () => activeDivision.value?.items.map((item) => item.id) ?? [],
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
  }, 2800)
}

function selectDivision(divisionId: string) {
  activeDivisionId.value = divisionId
}

function handleTabKeydown(event: KeyboardEvent, currentIndex: number) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
    return
  }

  event.preventDefault()

  if (divisionList.length === 0) {
    return
  }

  const direction = event.key === 'ArrowRight' ? 1 : -1
  const nextIndex =
    (currentIndex + direction + divisionList.length) % divisionList.length
  const nextDivision = divisionList[nextIndex]

  if (!nextDivision) {
    return
  }

  activeDivisionId.value = nextDivision.id

  nextTick(() => {
    document.getElementById(`division-tab-${nextDivision.id}`)?.focus()
  })
}

function createDivision() {
  const division = addWorkoutDivision(studentId)
  activeDivisionId.value = division.id
  showToast(`${division.label} criada. Adicione os exercícios.`, 'info')
}

function handleSelectExercise(exercise: PrototypeExercise) {
  if (!activeDivision.value) {
    return
  }

  const added = addExerciseToDivision(
    studentId,
    activeDivision.value.id,
    exercise,
  )

  if (!added) {
    showToast(`${exercise.name} já está neste treino.`, 'info')
    return
  }

  showToast(`${exercise.name} adicionado ao ${activeDivision.value.label}.`)
}

function handleRemoveExercise(exerciseId: string) {
  if (!activeDivision.value) {
    return
  }

  removeExerciseFromDivision(studentId, activeDivision.value.id, exerciseId)
  showToast('Exercício removido do treino.', 'info')
}

function handleUpdateSets(exerciseId: string, nextSets: number) {
  if (!activeDivision.value) {
    return
  }

  updateExerciseSets(
    studentId,
    activeDivision.value.id,
    exerciseId,
    nextSets,
  )
}

function sendWhatsApp() {
  if (!student || !activeDivision.value) {
    return
  }

  try {
    const planTitle = `${activeDivision.value.label} · ${student.goal}`
    const whatsappUrl = buildWorkoutWhatsAppUrl(
      student.phone,
      student.name,
      planTitle,
      student.accessToken,
    )

    showToast('Link do WhatsApp gerado com sucesso.')

    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    }
  } catch (error) {
    showToast(
      error instanceof Error
        ? error.message
        : 'Não foi possível gerar o link do WhatsApp.',
      'info',
    )
  }
}

onBeforeUnmount(() => {
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
})

useHead({
  title: student ? `Treino de ${student.name}` : 'Criador de treino',
})
</script>

<template>
  <div class="min-h-dvh bg-slate-50 pb-40">
    <header class="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
      <div class="mx-auto max-w-4xl px-3 py-3 pt-safe">
        <div class="flex items-center gap-2">
          <NuxtLink
            to="/"
            class="icon-button shrink-0"
            aria-label="Voltar para a lista de alunos"
          >
            <BaseIcon name="arrow-left" :size="22" />
          </NuxtLink>

          <div class="min-w-0 flex-1">
            <p class="eyebrow">Criador de treino</p>
            <h1 class="truncate text-lg font-extrabold text-slate-900">
              {{ student?.name ?? 'Aluno não encontrado' }}
            </h1>
          </div>

          <span v-if="student" class="badge badge-neutral shrink-0">
            {{ divisionList.length }} divisões
          </span>
        </div>

        <div
          v-if="student && hasJointPain"
          class="mt-3 flex items-start gap-2 rounded-xl border border-warning-300 bg-warning-50 p-3 text-warning-900"
          role="alert"
        >
          <BaseIcon name="warning" :size="20" :stroke-width="2.5" class="mt-0.5 shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-extrabold leading-5">
              ⚠️ Aluno relata dor: {{ painSummary }}
            </p>
            <p class="mt-0.5 text-xs font-semibold leading-4 text-warning-800">
              Ajuste os exercícios para proteger a articulação.
            </p>
          </div>
          <NuxtLink
            :to="`/anamnesis/${student.id}`"
            class="flex min-h-10 shrink-0 items-center rounded-lg border border-warning-400 bg-white px-3 text-xs font-extrabold text-warning-800"
            :aria-label="`Ver anamnese de ${student.name}`"
          >
            Ver
          </NuxtLink>
        </div>

        <div v-if="student" class="mt-3 flex items-center gap-2">
          <div
            class="no-scrollbar flex flex-1 gap-1 overflow-x-auto rounded-2xl bg-slate-200/80 p-1"
            role="tablist"
            aria-label="Divisões do treino"
          >
            <button
              v-for="(division, index) in divisionList"
              :id="`division-tab-${division.id}`"
              :key="division.id"
              type="button"
              role="tab"
              class="min-h-10 shrink-0 rounded-xl px-4 text-sm font-extrabold transition-colors"
              :class="
                activeDivisionId === division.id
                  ? 'bg-white text-brand-700 shadow-tier-2'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
              "
              :aria-selected="activeDivisionId === division.id"
              :aria-controls="`division-panel-${division.id}`"
              :tabindex="activeDivisionId === division.id ? 0 : -1"
              @click="selectDivision(division.id)"
              @keydown="handleTabKeydown($event, index)"
            >
              {{ division.label }}
            </button>
          </div>

          <button
            type="button"
            class="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-700 transition-colors hover:bg-brand-100"
            aria-label="Criar nova divisão de treino"
            @click="createDivision"
          >
            <BaseIcon name="plus" :size="20" :stroke-width="2.5" />
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-4 py-4">
      <div v-if="!student" class="card p-6 text-center">
        <BaseIcon name="warning" :size="32" class="mx-auto text-warning-500" />
        <h2 class="mt-3 text-xl font-extrabold">Aluno não encontrado</h2>
        <p class="mt-1 text-slate-600">
          Volte ao painel e selecione um aluno da sua carteira.
        </p>
        <NuxtLink to="/" class="btn btn-primary mt-5 w-full">
          Voltar ao painel
        </NuxtLink>
      </div>

      <template v-else-if="activeDivision">
        <section class="mb-4 flex items-end justify-between gap-3">
          <div class="min-w-0">
            <p class="eyebrow">{{ activeDivision.label }}</p>
            <h2 class="line-clamp-2 text-xl font-extrabold leading-6 text-slate-900">
              {{ activeDivision.focus }}
            </h2>
            <p class="mt-0.5 text-sm font-medium text-slate-500">
              {{ activeDivision.items.length }}
              {{ activeDivision.items.length === 1 ? 'exercício' : 'exercícios' }}
            </p>
          </div>

          <button
            type="button"
            class="btn btn-secondary shrink-0 px-4"
            @click="pickerOpen = true"
          >
            <BaseIcon name="plus" :size="19" />
            Adicionar
          </button>
        </section>

        <div
          :id="`division-panel-${activeDivision.id}`"
          role="tabpanel"
          :aria-labelledby="`division-tab-${activeDivision.id}`"
          class="space-y-3"
        >
          <WorkoutItemCard
            v-for="(item, index) in activeDivision.items"
            :key="item.id"
            :item="item"
            :index="index"
            @remove="handleRemoveExercise(item.id)"
            @update-sets="handleUpdateSets(item.id, $event)"
          />

          <button
            v-if="activeDivision.items.length === 0"
            type="button"
            class="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-10 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40"
            @click="pickerOpen = true"
          >
            <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <BaseIcon name="dumbbell" :size="26" />
            </span>
            <span class="mt-3 text-lg font-extrabold text-slate-900">
              Nenhum exercício ainda
            </span>
            <span class="mt-1 text-sm font-medium text-slate-500">
              Toque para escolher o primeiro exercício.
            </span>
          </button>

          <button
            v-else
            type="button"
            class="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 text-base font-extrabold text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-700"
            @click="pickerOpen = true"
          >
            <BaseIcon name="plus" :size="21" />
            Adicionar exercício
          </button>
        </div>
      </template>
    </main>

    <div class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-4 pb-safe shadow-tier-3 backdrop-blur">
      <div class="mx-auto max-w-4xl">
        <button
          type="button"
          class="btn btn-success w-full text-lg"
          :disabled="!student || !activeDivision"
          @click="sendWhatsApp"
        >
          <BaseIcon name="whatsapp" :size="23" />
          Enviar Treino no WhatsApp
        </button>
        <p class="mt-1.5 text-center text-xs font-semibold text-slate-500">
          O aluno recebe um link seguro para abrir no celular.
        </p>
      </div>
    </div>

    <ExercisePickerDrawer
      :open="pickerOpen"
      :exercises="PROTOTYPE_EXERCISES"
      :selected-exercise-ids="selectedExerciseIds"
      @close="pickerOpen = false"
      @select="handleSelectExercise"
    />

    <AppToast :open="toast.open" :message="toast.message" :tone="toast.tone" />
  </div>
</template>
