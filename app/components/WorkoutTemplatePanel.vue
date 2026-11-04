<script setup lang="ts">
import type { WorkoutTemplate } from '~/types/app.types'
import {
  applyWorkoutTemplate,
  deleteWorkoutTemplate,
  listWorkoutTemplates,
  saveWorkoutTemplate,
} from '~/services/workoutService'

const props = defineProps<{
  planId: string
  exerciseCount: number
}>()

const emit = defineEmits<{
  applied: []
}>()

const isOpen = ref(false)
const saveFormOpen = ref(false)
const title = ref('')
const templates = ref<WorkoutTemplate[]>([])
const loading = ref(false)
const busy = ref(false)
const message = ref('')
const errorMessage = ref('')

async function loadTemplates() {
  loading.value = true
  errorMessage.value = ''

  try {
    templates.value = await listWorkoutTemplates()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Não foi possível carregar os modelos.'
  } finally {
    loading.value = false
  }
}

async function togglePanel() {
  isOpen.value = !isOpen.value

  if (isOpen.value) {
    message.value = ''
    await loadTemplates()
  }
}

async function toggleSaveForm() {
  saveFormOpen.value = !saveFormOpen.value

  if (!isOpen.value) {
    isOpen.value = true
    await loadTemplates()
  }
}

async function saveTemplate() {
  const normalizedTitle = title.value.trim()

  if (!normalizedTitle) {
    errorMessage.value = 'Informe um nome para o modelo.'
    return
  }

  busy.value = true
  errorMessage.value = ''
  message.value = ''

  try {
    await saveWorkoutTemplate(props.planId, normalizedTitle)
    title.value = ''
    saveFormOpen.value = false
    message.value = 'Modelo salvo com todos os exercícios e divisões.'
    await loadTemplates()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Não foi possível salvar o modelo.'
  } finally {
    busy.value = false
  }
}

async function applyTemplate(template: WorkoutTemplate) {
  if (
    props.exerciseCount > 0 &&
    !window.confirm(
      `Aplicar “${template.title}” vai substituir os ${props.exerciseCount} exercícios deste treino. Deseja continuar?`,
    )
  ) {
    return
  }

  busy.value = true
  errorMessage.value = ''
  message.value = ''

  try {
    await applyWorkoutTemplate(template.id, props.planId)
    message.value = `Modelo “${template.title}” aplicado ao aluno.`
    emit('applied')
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Não foi possível aplicar o modelo.'
  } finally {
    busy.value = false
  }
}

async function removeTemplate(template: WorkoutTemplate) {
  if (!window.confirm(`Excluir o modelo “${template.title}”?`)) {
    return
  }

  busy.value = true
  errorMessage.value = ''

  try {
    await deleteWorkoutTemplate(template.id)
    templates.value = templates.value.filter((item) => item.id !== template.id)
    message.value = `Modelo “${template.title}” excluído.`
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Não foi possível excluir o modelo.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="card mb-4 p-3" aria-label="Modelos de treino">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <BaseIcon name="list" :size="19" class="text-brand-700" />
        <h2 class="font-extrabold text-slate-900">Modelos de treino</h2>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          class="btn btn-secondary min-h-10 px-3 text-sm"
          :disabled="exerciseCount === 0 || busy"
          @click="toggleSaveForm"
        >
          Salvar treino atual
        </button>
        <button
          type="button"
          class="btn btn-secondary min-h-10 px-3 text-sm"
          @click="togglePanel"
        >
          {{ isOpen ? 'Fechar' : 'Usar modelo' }}
        </button>
      </div>
    </div>

    <form
      v-if="saveFormOpen"
      class="mt-3 flex flex-col gap-2 sm:flex-row"
      @submit.prevent="saveTemplate"
    >
      <label for="template-name" class="sr-only">Nome do modelo</label>
      <input
        id="template-name"
        v-model="title"
        type="text"
        maxlength="100"
        class="input min-w-0 flex-1"
        placeholder="Ex.: Iniciante · 3 dias"
        required
      />
      <button type="submit" class="btn btn-primary" :disabled="busy">
        {{ busy ? 'Salvando...' : 'Salvar modelo' }}
      </button>
    </form>

    <div v-if="isOpen" class="mt-3 border-t border-slate-200 pt-3">
      <p
        v-if="errorMessage"
        class="mb-2 rounded-lg bg-danger-50 p-2 text-sm font-semibold text-danger-700"
        role="alert"
      >
        {{ errorMessage }}
      </p>
      <p
        v-else-if="message"
        class="mb-2 rounded-lg bg-success-50 p-2 text-sm font-semibold text-success-700"
        role="status"
      >
        {{ message }}
      </p>

      <p v-if="loading" class="py-3 text-sm font-medium text-slate-500">
        Carregando modelos...
      </p>
      <p v-else-if="templates.length === 0" class="py-3 text-sm font-medium text-slate-500">
        Nenhum modelo salvo ainda.
      </p>
      <ul v-else class="divide-y divide-slate-200">
        <li
          v-for="template in templates"
          :key="template.id"
          class="flex items-center gap-2 py-2"
        >
          <span class="min-w-0 flex-1 truncate font-bold text-slate-800">
            {{ template.title }}
          </span>
          <button
            type="button"
            class="btn btn-primary min-h-10 px-3 text-sm"
            :disabled="busy"
            @click="applyTemplate(template)"
          >
            Aplicar
          </button>
          <button
            type="button"
            class="icon-button min-h-10 min-w-10 text-danger-700"
            :disabled="busy"
            :aria-label="`Excluir modelo ${template.title}`"
            title="Excluir modelo"
            @click="removeTemplate(template)"
          >
            <BaseIcon name="trash" :size="18" />
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>
