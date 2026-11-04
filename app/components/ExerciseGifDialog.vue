<script setup lang="ts">
import {
  deleteExerciseGifFile,
  removeExerciseGifOverride,
  saveExerciseGifOverride,
  uploadExerciseGif,
  validateExerciseGifFile,
} from '~/services/exerciseGifService'

const props = defineProps<{
  open: boolean
  exerciseId: string
  exerciseName: string
  currentGifUrl: string
  hasOverride: boolean
}>()

const emit = defineEmits<{
  close: []
  saved: []
  removed: []
}>()

type InputMode = 'upload' | 'url'

const mode = ref<InputMode>('upload')
const selectedFile = ref<File | null>(null)
const filePreviewUrl = ref('')
const urlInput = ref('')
const saving = ref(false)
const errorMessage = ref('')
const confirmingRemove = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const previewUrl = computed(() => {
  if (mode.value === 'upload') {
    return filePreviewUrl.value || props.currentGifUrl
  }

  return urlInput.value.trim() || props.currentGifUrl
})

function clearFilePreview() {
  if (filePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(filePreviewUrl.value)
  }

  filePreviewUrl.value = ''
}

function resetState() {
  mode.value = 'upload'
  selectedFile.value = null
  clearFilePreview()
  urlInput.value = ''
  errorMessage.value = ''
  confirmingRemove.value = false
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  errorMessage.value = ''

  if (!file) {
    selectedFile.value = null
    clearFilePreview()
    input.value = ''
    return
  }

  try {
    validateExerciseGifFile(file)
    selectedFile.value = file
    clearFilePreview()
    filePreviewUrl.value = URL.createObjectURL(file)
    mode.value = 'upload'
  } catch (error) {
    selectedFile.value = null
    clearFilePreview()
    input.value = ''
    errorMessage.value =
      error instanceof Error ? error.message : 'Arquivo inválido.'
  }
}

function selectMode(nextMode: InputMode) {
  mode.value = nextMode
  errorMessage.value = ''
}

async function save() {
  errorMessage.value = ''
  saving.value = true
  let uploadedStoragePath: string | null = null

  try {
    if (mode.value === 'upload') {
      if (!selectedFile.value) {
        throw new Error('Escolha um arquivo GIF para enviar.')
      }

      const uploaded = await uploadExerciseGif(
        selectedFile.value,
        props.exerciseId,
      )
      uploadedStoragePath = uploaded.storagePath

      await saveExerciseGifOverride({
        exerciseId: props.exerciseId,
        exerciseName: props.exerciseName,
        gifUrl: uploaded.gifUrl,
        storagePath: uploaded.storagePath,
      })
    } else {
      await saveExerciseGifOverride({
        exerciseId: props.exerciseId,
        exerciseName: props.exerciseName,
        gifUrl: urlInput.value,
      })
    }

    emit('saved')
  } catch (error) {
    if (uploadedStoragePath) {
      try {
        await deleteExerciseGifFile(uploadedStoragePath)
      } catch {
        // A limpeza é best-effort; o erro principal já será exibido.
      }
    }

    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível salvar o GIF.'
  } finally {
    saving.value = false
  }
}

async function confirmRemove() {
  errorMessage.value = ''
  saving.value = true

  try {
    await removeExerciseGifOverride(props.exerciseId)
    emit('removed')
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível restaurar o GIF original.'
  } finally {
    saving.value = false
  }
}

function close() {
  if (saving.value) {
    return
  }

  emit('close')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) {
      return
    }

    resetState()

    await nextTick()
    fileInput.value?.focus()
  },
)

watch(
  () => props.open,
  (isOpen) => {
    if (typeof window === 'undefined') {
      return
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'hidden'
      return
    }

    window.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  },
)

onBeforeUnmount(() => {
  clearFilePreview()

  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
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
      <div v-if="open" class="fixed inset-0 z-[60]">
        <div
          class="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
          aria-hidden="true"
          @click="close"
        />

        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="exercise-gif-dialog-title"
          class="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-tier-3 sm:inset-0 sm:m-auto sm:h-auto sm:max-h-[90dvh] sm:max-w-lg sm:rounded-3xl"
          @keydown.esc="close"
        >
          <header class="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
            <div class="min-w-0">
              <p class="eyebrow">GIF do exercício</p>
              <h2
                id="exercise-gif-dialog-title"
                class="mt-0.5 truncate text-xl font-extrabold text-slate-900"
              >
                {{ exerciseName }}
              </h2>
            </div>

            <button
              type="button"
              class="icon-button -mr-2 -mt-2 shrink-0"
              aria-label="Fechar troca de GIF"
              @click="close"
            >
              <BaseIcon name="close" :size="22" />
            </button>
          </header>

          <div class="flex-1 overflow-y-auto overscroll-contain p-4">
            <p class="text-sm font-semibold leading-5 text-slate-600">
              Este GIF será usado em todos os treinos deste exercício.
            </p>

            <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <div class="relative h-56 w-full">
                <ExerciseGifPreview
                  :src="previewUrl"
                  :alt="`Prévia do exercício ${exerciseName}`"
                />
              </div>
            </div>

            <div
              class="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1"
              role="group"
              aria-label="Origem do novo GIF"
            >
              <button
                type="button"
                class="flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-extrabold transition-colors"
                :class="
                  mode === 'upload'
                    ? 'bg-white text-brand-700 shadow-tier-2'
                    : 'text-slate-600 hover:text-slate-900'
                "
                :aria-pressed="mode === 'upload'"
                @click="selectMode('upload')"
              >
                <BaseIcon name="plus" :size="17" />
                Enviar arquivo
              </button>

              <button
                type="button"
                class="flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-extrabold transition-colors"
                :class="
                  mode === 'url'
                    ? 'bg-white text-brand-700 shadow-tier-2'
                    : 'text-slate-600 hover:text-slate-900'
                "
                :aria-pressed="mode === 'url'"
                @click="selectMode('url')"
              >
                <BaseIcon name="edit" :size="17" />
                Colar URL
              </button>
            </div>

            <div v-if="mode === 'upload'" class="mt-4">
              <label for="exercise-gif-file" class="field-label">
                Arquivo GIF, WebP, PNG ou JPG
              </label>
              <input
                id="exercise-gif-file"
                ref="fileInput"
                type="file"
                accept="image/gif,image/webp,image/png,image/jpeg"
                class="sr-only"
                @change="handleFileChange"
              />

              <button
                type="button"
                class="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-sm font-extrabold text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-700"
                @click="fileInput?.click()"
              >
                <BaseIcon name="plus" :size="20" />
                {{ selectedFile ? 'Trocar arquivo' : 'Escolher arquivo' }}
              </button>

              <p
                v-if="selectedFile"
                class="mt-2 truncate text-xs font-semibold text-slate-500"
              >
                {{ selectedFile.name }} · {{ formatFileSize(selectedFile.size) }}
              </p>

              <p class="mt-2 text-xs font-medium leading-5 text-slate-500">
                Tamanho máximo de 8 MB. Prefira GIFs curtos e leves.
              </p>
            </div>

            <div v-else class="mt-4">
              <label for="exercise-gif-url" class="field-label">
                URL do GIF
              </label>
              <input
                id="exercise-gif-url"
                v-model="urlInput"
                type="url"
                inputmode="url"
                autocomplete="off"
                class="input"
                placeholder="https://exemplo.com/exercicio.gif"
              />
              <p class="mt-2 text-xs font-medium leading-5 text-slate-500">
                Use um link direto para o arquivo de imagem. A URL precisa
                começar com https://.
              </p>
            </div>

            <p
              v-if="errorMessage"
              class="mt-4 rounded-xl border border-danger-300 bg-danger-50 p-3 text-sm font-bold text-danger-700"
              role="alert"
            >
              {{ errorMessage }}
            </p>

            <div
              v-if="hasOverride"
              class="mt-4 rounded-xl border border-warning-300 bg-warning-50 p-3"
            >
              <p class="text-sm font-bold leading-5 text-warning-900">
                Este exercício está usando um GIF personalizado.
              </p>

              <div v-if="!confirmingRemove" class="mt-2">
                <button
                  type="button"
                  class="btn btn-secondary w-full"
                  :disabled="saving"
                  @click="confirmingRemove = true"
                >
                  <BaseIcon name="trash" :size="18" />
                  Restaurar GIF original
                </button>
              </div>

              <div v-else class="mt-2 grid gap-2">
                <p class="text-xs font-semibold leading-4 text-warning-800">
                  O GIF personalizado será removido de todos os treinos deste
                  exercício.
                </p>
                <button
                  type="button"
                  class="btn btn-danger w-full"
                  :disabled="saving"
                  @click="confirmRemove"
                >
                  Confirmar restauração
                </button>
                <button
                  type="button"
                  class="btn btn-ghost w-full"
                  :disabled="saving"
                  @click="confirmingRemove = false"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>

          <footer class="border-t border-slate-200 p-4">
            <div class="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                class="btn btn-primary w-full"
                :disabled="saving"
                @click="save"
              >
                <BaseIcon name="check" :size="20" :stroke-width="3" />
                {{ saving ? 'Salvando...' : 'Salvar GIF' }}
              </button>
              <button
                type="button"
                class="btn btn-ghost w-full"
                :disabled="saving"
                @click="close"
              >
                Cancelar
              </button>
            </div>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
