<script setup lang="ts">
import type {
  ExerciseGifOverride,
  ExerciseOption,
  WorkoutDivisionView,
} from '~/types/app.types'
import { getExerciseOptions } from '~/services/exerciseService'
import {
  applyExerciseGifOverrides,
  listExerciseGifOverrides,
} from '~/services/exerciseGifService'
import {
  addWorkoutItem,
  getWorkoutEditorData,
  removeWorkoutItem,
  updateWorkoutItemSets,
} from '~/services/workoutService'
import { buildWorkoutWhatsAppUrl } from '~/services/whatsappService'

const route = useRoute()
const studentId = String(route.params.studentId ?? '')

const { data, pending, error, refresh } = await useAsyncData(
  `workout-editor-${studentId}`,
  async () => {
    const overrides = await listExerciseGifOverrides().catch(
      () => [] as ExerciseGifOverride[],
    )

    const [editor, exercises] = await Promise.all([
      getWorkoutEditorData(studentId, overrides),
      getExerciseOptions().catch(() => [] as ExerciseOption[]),
    ])

    return {
      editor,
      exercises: applyExerciseGifOverrides(exercises, overrides),
      overrides,
    }
  },
)

const editor = computed(() => data.value?.editor ?? null)
const student = computed(() => editor.value?.student ?? null)
const anamnesis = computed(() => editor.value?.anamnesis ?? null)
const plan = computed(() => editor.value?.plan ?? null)
const exerciseOptions = computed<ExerciseOption[]>(
  () => data.value?.exercises ?? [],
)
const gifOverrides = computed<ExerciseGifOverride[]>(
  () => data.value?.overrides ?? [],
)

const divisions = ref<WorkoutDivisionView[]>([])
const activeDivisionId = ref('A')

watchEffect(() => {
  if (!editor.value) {
    return
  }

  divisions.value = editor.value.divisions.map((division) => ({
    ...division,
    items: [...division.items],
  }))

  if (
    !divisions.value.some((division) => division.id === activeDivisionId.value)
  ) {
    activeDivisionId.value = divisions.value[0]?.id ?? 'A'
  }
})

const activeDivision = computed(
  () =>
    divisions.value.find(
      (division) => division.id === activeDivisionId.value,
    ) ??
    divisions.value[0] ??
    null,
)

const pickerOpen = ref(false)
const gifDialogOpen = ref(false)
const gifDialogExercise = ref<{
  id: string
  name: string
  gifUrl: string
  hasOverride: boolean
} | null>(null)
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
  () => (anamnesis.value?.jointPains.length ?? 0) > 0,
)
const painSummary = computed(
  () => anamnesis.value?.jointPains.join(' e ').toLowerCase() ?? '',
)
const selectedExerciseIds = computed(
  () => activeDivision.value?.items.map((item) => item.exerciseId) ?? [],
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

function openGifDialog(exercise: {
  id: string
  name: string
  gifUrl: string
}) {
  const override = gifOverrides.value.find(
    (item) => item.exerciseId === exercise.id,
  )

  gifDialogExercise.value = {
    id: exercise.id,
    name: exercise.name,
    gifUrl: override?.gifUrl ?? exercise.gifUrl,
    hasOverride: Boolean(override),
  }
  gifDialogOpen.value = true
}

function closeGifDialog() {
  gifDialogOpen.value = false
}

async function handleGifSaved() {
  closeGifDialog()
  showToast('GIF atualizado em todos os treinos deste exercício.')
  await refresh()
}

async function handleGifRemoved() {
  closeGifDialog()
  showToast('GIF original restaurado.', 'info')
  await refresh()
}

function selectDivision(divisionId: string) {
  activeDivisionId.value = divisionId
}

function handleTabKeydown(event: KeyboardEvent, currentIndex: number) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
    return
  }

  event.preventDefault()

  if (divisions.value.length === 0) {
    return
  }

  const direction = event.key === 'ArrowRight' ? 1 : -1
  const nextIndex =
    (currentIndex + direction + divisions.value.length) %
    divisions.value.length
  const nextDivision = divisions.value[nextIndex]

  if (!nextDivision) {
    return
  }

  activeDivisionId.value = nextDivision.id

  nextTick(() => {
    document.getElementById(`division-tab-${nextDivision.id}`)?.focus()
  })
}

function nextSessionLabel(existingLabels: string[]): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  for (const letter of alphabet) {
    if (!existingLabels.includes(letter)) {
      return letter
    }
  }

  return `S${existingLabels.length + 1}`
}

function createDivision() {
  const nextLabel = nextSessionLabel(
    divisions.value.map((division) => division.id),
  )

  divisions.value.push({
    id: nextLabel,
    label: `Treino ${nextLabel}`,
    focus: 'Nova divisão',
    items: [],
  })
  activeDivisionId.value = nextLabel
  showToast(`Treino ${nextLabel} criado. Adicione os exercícios.`, 'info')
}

async function handleSelectExercise(exercise: ExerciseOption) {
  if (!activeDivision.value || !plan.value) {
    return
  }

  const divisionLabel = activeDivision.value.label

  try {
    await addWorkoutItem(plan.value.id, activeDivision.value.id, exercise)
    showToast(`${exercise.name} adicionado ao ${divisionLabel}.`)
    await refresh()
  } catch (selectError) {
    showToast(
      selectError instanceof Error
        ? selectError.message
        : 'Não foi possível adicionar o exercício.',
      'info',
    )
  }
}

async function handleRemoveExercise(itemId: string) {
  try {
    await removeWorkoutItem(itemId)
    showToast('Exercício removido do treino.', 'info')
    await refresh()
  } catch (removeError) {
    showToast(
      removeError instanceof Error
        ? removeError.message
        : 'Não foi possível remover o exercício.',
      'info',
    )
  }
}

async function handleUpdateSets(itemId: string, nextSets: number) {
  const item = activeDivision.value?.items.find(
    (exercise) => exercise.id === itemId,
  )

  if (!item) {
    return
  }

  const previousSets = item.sets
  item.sets = Math.min(10, Math.max(1, nextSets))

  try {
    await updateWorkoutItemSets(itemId, item.sets)
  } catch (updateError) {
    item.sets = previousSets
    showToast(
      updateError instanceof Error
        ? updateError.message
        : 'Não foi possível atualizar as séries.',
      'info',
    )
  }
}

function sendWhatsApp() {
  if (!student.value || !activeDivision.value || !plan.value) {
    return
  }

  try {
    const planTitle = `${activeDivision.value.label} · ${student.value.goal}`
    const whatsappUrl = buildWorkoutWhatsAppUrl(
      student.value.phone,
      student.value.name,
      planTitle,
      plan.value.access_token,
    )

    showToast('Link do WhatsApp gerado com sucesso.')

    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    }
  } catch (whatsappError) {
    showToast(
      whatsappError instanceof Error
        ? whatsappError.message
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
  title: computed(() =>
    student.value ? `Treino de ${student.value.name}` : 'Criador de treino',
  ),
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
            {{ divisions.length }} divisões
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
              v-for="(division, index) in divisions"
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
      <div v-if="pending" class="card p-6 text-center">
        <p class="font-bold text-slate-700">Carregando treino...</p>
        <p class="mt-1 text-sm text-slate-500">
          Buscando aluno, anamnese e exercícios.
        </p>
      </div>

      <div v-else-if="error" class="card p-6 text-center">
        <BaseIcon name="warning" :size="32" class="mx-auto text-warning-500" />
        <h2 class="mt-3 text-xl font-extrabold">
          Não foi possível carregar o treino
        </h2>
        <p class="mt-1 text-slate-600">{{ error.message }}</p>
        <button type="button" class="btn btn-secondary mt-5 w-full" @click="refresh()">
          Tentar novamente
        </button>
      </div>

      <div v-else-if="!student" class="card p-6 text-center">
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
            @edit-gif="
              openGifDialog({
                id: item.exerciseId,
                name: item.name,
                gifUrl: item.gifUrl,
              })
            "
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
          :disabled="!student || !activeDivision || !plan"
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
      :exercises="exerciseOptions"
      :selected-exercise-ids="selectedExerciseIds"
      @close="pickerOpen = false"
      @select="handleSelectExercise"
      @edit-gif="openGifDialog($event)"
    />

    <ExerciseGifDialog
      :open="gifDialogOpen"
      :exercise-id="gifDialogExercise?.id ?? ''"
      :exercise-name="gifDialogExercise?.name ?? ''"
      :current-gif-url="gifDialogExercise?.gifUrl ?? ''"
      :has-override="gifDialogExercise?.hasOverride ?? false"
      @close="closeGifDialog"
      @saved="handleGifSaved"
      @removed="handleGifRemoved"
    />

    <AppToast :open="toast.open" :message="toast.message" :tone="toast.tone" />
  </div>
</template>
