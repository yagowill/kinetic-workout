<script setup lang="ts">
import type { StudentSummary } from '~/types/app.types'
import { createStudent } from '~/services/studentService'
import { buildAnamnesisWhatsAppUrl } from '~/services/whatsappService'

const config = useRuntimeConfig()
const name = ref('')
const phone = ref('')
const errorMessage = ref('')
const saving = ref(false)
const createdStudent = ref<StudentSummary | null>(null)
const copied = ref(false)

const anamnesisUrl = computed(() => {
  const token = createdStudent.value?.anamnesisToken

  if (!token) {
    return null
  }

  return new URL(
    `/a/${encodeURIComponent(token)}`,
    String(config.public.appUrl),
  ).toString()
})

const whatsappUrl = computed(() => {
  if (!createdStudent.value?.anamnesisToken) {
    return null
  }

  try {
    return buildAnamnesisWhatsAppUrl(
      createdStudent.value.phone,
      createdStudent.value.name,
      createdStudent.value.anamnesisToken,
    )
  } catch {
    return null
  }
})

async function submit() {
  errorMessage.value = ''

  if (name.value.trim().length < 3) {
    errorMessage.value = 'Informe o nome do aluno.'
    return
  }

  const phoneDigits = phone.value.replace(/\D/g, '')

  if (phoneDigits.length < 10 || phoneDigits.length > 13) {
    errorMessage.value = 'Informe um WhatsApp válido com DDD.'
    return
  }

  saving.value = true

  try {
    createdStudent.value = await createStudent({
      name: name.value,
      phone: phone.value,
    })
    await refreshNuxtData('student-summaries')
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível cadastrar o aluno. Tente novamente.'
  } finally {
    saving.value = false
  }
}

async function copyAnamnesisLink() {
  if (!anamnesisUrl.value || !navigator.clipboard) {
    errorMessage.value = 'Não foi possível copiar o link neste navegador.'
    return
  }

  try {
    await navigator.clipboard.writeText(anamnesisUrl.value)
    copied.value = true
  } catch {
    errorMessage.value = 'Não foi possível copiar o link neste navegador.'
  }
}

function goToWorkout() {
  if (createdStudent.value) {
    navigateTo(`/workout/${createdStudent.value.id}`)
  }
}

useHead({ title: 'Novo aluno' })
</script>

<template>
  <div class="min-h-dvh bg-slate-50 pb-28">
    <header class="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/90 backdrop-blur">
      <div class="mx-auto flex max-w-2xl items-center gap-2 px-3 py-3 pt-safe">
        <NuxtLink to="/" class="icon-button shrink-0" aria-label="Voltar ao painel">
          <BaseIcon name="arrow-left" :size="22" />
        </NuxtLink>
        <div class="min-w-0 flex-1">
          <p class="eyebrow">Alunos</p>
          <h1 class="truncate text-lg font-extrabold text-slate-900">
            {{ createdStudent ? 'Aluno cadastrado' : 'Novo aluno' }}
          </h1>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-2xl px-4 py-5">
      <p
        v-if="errorMessage"
        class="mb-4 rounded-xl border border-danger-300 bg-danger-50 p-3 text-sm font-bold text-danger-700"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <form v-if="!createdStudent" class="card space-y-4 p-5" @submit.prevent="submit">
        <div>
          <label for="student-name" class="field-label">Nome completo</label>
          <input
            id="student-name"
            v-model="name"
            type="text"
            class="input"
            autocomplete="name"
            placeholder="Ex.: Mariana Costa"
            required
          />
        </div>

        <div>
          <label for="student-phone" class="field-label">WhatsApp</label>
          <input
            id="student-phone"
            v-model="phone"
            type="tel"
            inputmode="tel"
            class="input"
            autocomplete="tel"
            placeholder="(11) 99999-9999"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary w-full" :disabled="saving">
          <BaseIcon name="check" :size="20" />
          {{ saving ? 'Cadastrando...' : 'Cadastrar aluno' }}
        </button>
      </form>

      <section v-else class="card space-y-4 p-5">
        <div>
          <p class="eyebrow">{{ createdStudent.name }}</p>
          <h2 class="mt-1 text-xl font-extrabold text-slate-900">
            Anamnese pendente
          </h2>
        </div>

        <div v-if="anamnesisUrl" class="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p class="field-label">Link da anamnese</p>
          <a
            :href="anamnesisUrl"
            class="mt-1 block break-all text-sm font-semibold text-brand-700 underline"
          >
            {{ anamnesisUrl }}
          </a>
          <button
            type="button"
            class="btn btn-secondary mt-3 w-full"
            @click="copyAnamnesisLink"
          >
            {{ copied ? 'Link copiado' : 'Copiar link' }}
          </button>
        </div>

        <a
          v-if="whatsappUrl"
          :href="whatsappUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-success w-full"
        >
          <BaseIcon name="whatsapp" :size="20" />
          Enviar anamnese no WhatsApp
        </a>

        <button type="button" class="btn btn-primary w-full" @click="goToWorkout">
          <BaseIcon name="dumbbell" :size="20" />
          Montar treino
        </button>

        <NuxtLink to="/" class="btn btn-secondary w-full">
          Voltar aos alunos
        </NuxtLink>
      </section>
    </main>
  </div>
</template>