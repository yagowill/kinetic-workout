<script setup lang="ts">
import type { StudentAnamnesisData } from '~/types/app.types'
import {
  getPublicAnamnesis,
  savePublicAnamnesis,
} from '~/services/publicAnamnesisService'
import {
  experienceOptions,
  frequencyOptions,
  goalOptions,
  jointPainOptions,
  medicalConditionOptions,
  toggleJointPainSelection,
  toggleMedicalConditionSelection,
} from '~/utils/anamnesis'

const route = useRoute()
const accessToken = String(route.params.accessToken ?? '')

const { data, pending, error, refresh } = await useAsyncData(
  `public-anamnesis-${accessToken}`,
  () => getPublicAnamnesis(accessToken),
)

const record = computed(() => data.value ?? null)
const existingAnamnesis = computed(() => record.value?.anamnesis ?? null)
const studentName = computed(() => record.value?.studentName ?? 'Aluno')
const alreadyAnswered = ref(Boolean(existingAnamnesis.value))

const steps = [
  { label: 'Objetivo', shortLabel: 'Objetivo' },
  { label: 'Rotina', shortLabel: 'Rotina' },
  { label: 'Saúde', shortLabel: 'Saúde' },
]

const currentStep = ref(0)
const formError = ref('')
const saving = ref(false)
const sent = ref(false)
const sentAt = ref<string | null>(null)

const primaryGoal = ref(existingAnamnesis.value?.primaryGoal ?? '')
const experienceLevel = ref(existingAnamnesis.value?.experienceLevel ?? '')
const weeklyFrequency = ref(existingAnamnesis.value?.weeklyFrequency ?? 0)
const jointPains = ref<string[]>(
  existingAnamnesis.value?.jointPains.length
    ? [...existingAnamnesis.value.jointPains]
    : ['Nenhuma'],
)
const medicalConditions = ref<string[]>(
  existingAnamnesis.value?.medicalConditions.length
    ? [...existingAnamnesis.value.medicalConditions]
    : ['Nenhuma'],
)
const additionalNotes = ref(existingAnamnesis.value?.additionalNotes ?? '')

const hasJointPain = computed(() =>
  jointPains.value.some((pain) => pain !== 'Nenhuma'),
)

const selectedPainSummary = computed(() =>
  hasJointPain.value
    ? jointPains.value.filter((pain) => pain !== 'Nenhuma').join(', ')
    : 'Nenhuma dor relatada',
)

const formattedUpdatedAt = computed(() => {
  const value = sentAt.value ?? record.value?.updatedAt

  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value))
})

const workoutUrl = computed(() => {
  const token = record.value?.workoutAccessToken

  return token ? `/t/${encodeURIComponent(token)}` : null
})

function toggleJointPain(pain: string) {
  jointPains.value = toggleJointPainSelection(jointPains.value, pain)
}

function toggleMedicalCondition(condition: string) {
  medicalConditions.value = toggleMedicalConditionSelection(
    medicalConditions.value,
    condition,
  )
}

function validateStep(): boolean {
  if (currentStep.value === 0 && !primaryGoal.value) {
    formError.value = 'Escolha seu objetivo principal para continuar.'
    return false
  }

  if (currentStep.value === 1) {
    if (!experienceLevel.value) {
      formError.value = 'Escolha seu nível de experiência para continuar.'
      return false
    }

    if (weeklyFrequency.value < 1) {
      formError.value = 'Escolha quantos dias por semana você pode treinar.'
      return false
    }
  }

  formError.value = ''
  return true
}

function nextStep() {
  if (!validateStep()) {
    return
  }

  currentStep.value = Math.min(2, currentStep.value + 1)
}

function previousStep() {
  formError.value = ''
  currentStep.value = Math.max(0, currentStep.value - 1)
}

function buildAnamnesis(): StudentAnamnesisData {
  return {
    primaryGoal: primaryGoal.value,
    experienceLevel: experienceLevel.value,
    weeklyFrequency: weeklyFrequency.value,
    jointPains: jointPains.value.filter((pain) => pain !== 'Nenhuma'),
    medicalConditions: medicalConditions.value.filter(
      (condition) => condition !== 'Nenhuma',
    ),
    additionalNotes: additionalNotes.value.trim(),
  }
}

async function submitAnamnesis() {
  if (!validateStep()) {
    return
  }

  saving.value = true
  formError.value = ''

  try {
    const updatedAt = await savePublicAnamnesis(accessToken, buildAnamnesis())
    sentAt.value = updatedAt
    alreadyAnswered.value = true
    sent.value = true

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } catch (saveError) {
    formError.value =
      saveError instanceof Error
        ? saveError.message
        : 'Não foi possível enviar suas respostas. Tente novamente.'
  } finally {
    saving.value = false
  }
}

function reviewAnswers() {
  sent.value = false
  formError.value = ''
  currentStep.value = 0

  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

useHead({
  title: computed(() =>
    record.value ? `Anamnese de ${studentName.value}` : 'Anamnese',
  ),
  meta: [{ name: 'robots', content: 'noindex' }],
})
</script>

<template>
  <div class="min-h-dvh bg-slate-50 pb-32">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 pt-safe">
        <div class="flex items-center gap-2.5">
          <span
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"
            aria-hidden="true"
          >
            <BaseIcon name="shield" :size="20" :stroke-width="2.5" />
          </span>
          <div>
            <p class="eyebrow">Anamnese</p>
            <p class="text-sm font-extrabold text-slate-900">Kinetic Workout</p>
          </div>
        </div>

        <span class="badge badge-neutral shrink-0">≈ 2 min</span>
      </div>
    </header>

    <main class="mx-auto max-w-2xl px-4 py-5">
      <div v-if="pending" class="card p-6 text-center">
        <p class="font-bold text-slate-700">Carregando sua anamnese...</p>
        <p class="mt-1 text-sm text-slate-500">Só um instante.</p>
      </div>

      <div v-else-if="error" class="card p-6 text-center">
        <BaseIcon name="warning" :size="32" class="mx-auto text-warning-500" />
        <h1 class="mt-3 text-xl font-extrabold text-slate-900">
          Não foi possível carregar
        </h1>
        <p class="mt-1 text-sm text-slate-600">{{ error.message }}</p>
        <button type="button" class="btn btn-secondary mt-5 w-full" @click="refresh()">
          Tentar novamente
        </button>
      </div>

      <div v-else-if="!record" class="card p-6 text-center">
        <BaseIcon name="warning" :size="32" class="mx-auto text-warning-500" />
        <h1 class="mt-3 text-xl font-extrabold text-slate-900">
          Link inválido ou expirado
        </h1>
        <p class="mt-1 text-sm text-slate-600">
          Peça um novo link de anamnese para o seu personal trainer.
        </p>
      </div>

      <template v-else-if="sent">
        <section class="card mt-2 p-6 text-center" aria-live="polite">
          <div
            class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-success-700"
          >
            <BaseIcon name="check-circle" :size="34" :stroke-width="2.5" />
          </div>

          <h1 class="mt-4 text-2xl font-extrabold text-slate-900">
            Respostas enviadas!
          </h1>
          <p class="mt-2 text-sm font-medium text-slate-600">
            Obrigado, {{ studentName }}. Seu personal já pode ver suas
            respostas e montar o treino.
          </p>

          <p
            v-if="formattedUpdatedAt"
            class="mt-3 text-xs font-semibold text-slate-500"
          >
            Atualizado em {{ formattedUpdatedAt }}
          </p>

          <div class="mt-6 grid gap-2">
            <NuxtLink v-if="workoutUrl" :to="workoutUrl" class="btn btn-primary w-full">
              <BaseIcon name="dumbbell" :size="19" />
              Ver meu treino
            </NuxtLink>
            <button
              type="button"
              class="btn btn-secondary w-full"
              @click="reviewAnswers"
            >
              Revisar minhas respostas
            </button>
          </div>
        </section>
      </template>

      <template v-else>
        <section class="mt-2">
          <p class="eyebrow">Olá, {{ studentName }}</p>
          <h1 class="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Vamos conhecer você
          </h1>
          <p class="mt-2 text-sm font-medium leading-6 text-slate-600">
            Seu personal precisa de algumas informações para montar um treino
            seguro e adequado ao seu objetivo. Suas respostas ficam visíveis
            apenas para ele.
          </p>
        </section>

        <div
          v-if="alreadyAnswered"
          class="mt-4 flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm font-semibold text-brand-900"
          role="status"
        >
          <BaseIcon name="info" :size="18" class="mt-0.5 shrink-0" />
          <p>
            Você já respondeu esta anamnese
            <template v-if="formattedUpdatedAt">
              em {{ formattedUpdatedAt }}
            </template>
            . Pode atualizar as respostas e enviar novamente.
          </p>
        </div>

        <section class="card mt-4 p-4" aria-label="Progresso da anamnese">
          <StepIndicator :steps="steps" :current-step="currentStep" />
        </section>

        <p
          v-if="formError"
          class="mt-4 rounded-xl border border-danger-300 bg-danger-50 p-3 text-sm font-bold text-danger-700"
          role="alert"
        >
          {{ formError }}
        </p>

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-2 opacity-0"
          enter-to-class="translate-y-0 opacity-100"
          mode="out-in"
        >
          <section v-if="currentStep === 0" key="goal" class="mt-4">
            <div class="card p-4">
              <fieldset>
                <legend class="text-xl font-extrabold text-slate-900">
                  Qual é o seu objetivo principal?
                </legend>
                <p class="mt-1 text-sm text-slate-500">
                  Toque em uma opção. Você pode alterar depois.
                </p>

                <div class="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    v-for="goal in goalOptions"
                    :key="goal.value"
                    type="button"
                    class="flex min-h-20 items-center gap-3 rounded-2xl border p-3 text-left transition-colors"
                    :class="
                      primaryGoal === goal.value
                        ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    "
                    :aria-pressed="primaryGoal === goal.value"
                    @click="primaryGoal = goal.value"
                  >
                    <span
                      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                      :class="
                        primaryGoal === goal.value
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100'
                      "
                      aria-hidden="true"
                    >
                      {{ goal.emoji }}
                    </span>
                    <span class="min-w-0">
                      <span class="block text-base font-bold text-slate-900">
                        {{ goal.label }}
                      </span>
                      <span class="block text-xs font-medium text-slate-500">
                        {{ goal.description }}
                      </span>
                    </span>
                  </button>
                </div>
              </fieldset>
            </div>
          </section>

          <section v-else-if="currentStep === 1" key="routine" class="mt-4 space-y-4">
            <div class="card p-4">
              <fieldset>
                <legend class="text-xl font-extrabold text-slate-900">
                  Qual seu nível de experiência?
                </legend>
                <p class="mt-1 text-sm text-slate-500">
                  Isso ajuda a escolher a intensidade certa.
                </p>

                <div class="mt-4 grid gap-2 sm:grid-cols-3">
                  <button
                    v-for="option in experienceOptions"
                    :key="option.value"
                    type="button"
                    class="min-h-24 rounded-2xl border p-3 text-left transition-colors"
                    :class="
                      experienceLevel === option.value
                        ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    "
                    :aria-pressed="experienceLevel === option.value"
                    @click="experienceLevel = option.value"
                  >
                    <span class="block text-base font-bold text-slate-900">
                      {{ option.label }}
                    </span>
                    <span class="mt-1 block text-xs font-medium leading-4 text-slate-500">
                      {{ option.description }}
                    </span>
                  </button>
                </div>
              </fieldset>
            </div>

            <div class="card p-4">
              <fieldset>
                <legend class="text-xl font-extrabold text-slate-900">
                  Quantos dias por semana você pode treinar?
                </legend>
                <p class="mt-1 text-sm text-slate-500">
                  Escolha a rotina mais realista para você.
                </p>

                <div class="mt-4 grid grid-cols-4 gap-2">
                  <button
                    v-for="frequency in frequencyOptions"
                    :key="frequency.value"
                    type="button"
                    class="flex min-h-14 items-center justify-center rounded-xl border text-lg font-extrabold transition-colors"
                    :class="
                      weeklyFrequency === frequency.value
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    "
                    :aria-pressed="weeklyFrequency === frequency.value"
                    @click="weeklyFrequency = frequency.value"
                  >
                    {{ frequency.label }}
                  </button>
                </div>
              </fieldset>
            </div>
          </section>

          <section v-else key="health" class="mt-4 space-y-4">
            <div class="card p-4">
              <fieldset>
                <legend class="text-xl font-extrabold text-slate-900">
                  Você sente dor em algum lugar?
                </legend>
                <p class="mt-1 text-sm text-slate-500">
                  Toque em todas as dores que se aplicam.
                </p>

                <div class="mt-4 flex flex-wrap gap-2">
                  <button
                    v-for="pain in jointPainOptions"
                    :key="pain"
                    type="button"
                    class="chip"
                    :class="
                      jointPains.includes(pain)
                        ? pain === 'Nenhuma'
                          ? 'chip-active'
                          : 'border-warning-500 bg-warning-50 text-warning-800 ring-1 ring-warning-500'
                        : ''
                    "
                    :aria-pressed="jointPains.includes(pain)"
                    @click="toggleJointPain(pain)"
                  >
                    <BaseIcon
                      v-if="pain !== 'Nenhuma'"
                      name="warning"
                      :size="15"
                    />
                    {{ pain === 'Nenhuma' ? 'Nenhuma dor' : pain }}
                  </button>
                </div>
              </fieldset>

              <div
                v-if="hasJointPain"
                class="mt-4 flex items-start gap-2 rounded-xl border border-warning-300 bg-warning-50 p-3 text-sm font-bold text-warning-900"
                role="status"
                aria-live="polite"
              >
                <BaseIcon name="warning" :size="19" class="mt-0.5 shrink-0" />
                <p>
                  O treino será adaptado para proteger
                  {{ selectedPainSummary.toLowerCase() }}.
                </p>
              </div>
            </div>

            <div class="card p-4">
              <fieldset>
                <legend class="text-xl font-extrabold text-slate-900">
                  Você tem alguma condição de saúde?
                </legend>
                <p class="mt-1 text-sm text-slate-500">
                  Marque o que já foi diagnosticado.
                </p>

                <div class="mt-4 flex flex-wrap gap-2">
                  <button
                    v-for="condition in medicalConditionOptions"
                    :key="condition"
                    type="button"
                    class="chip"
                    :class="
                      medicalConditions.includes(condition)
                        ? condition === 'Nenhuma'
                          ? 'chip-active'
                          : 'border-danger-400 bg-danger-50 text-danger-700 ring-1 ring-danger-400'
                        : ''
                    "
                    :aria-pressed="medicalConditions.includes(condition)"
                    @click="toggleMedicalCondition(condition)"
                  >
                    {{ condition === 'Nenhuma' ? 'Nenhuma' : condition }}
                  </button>
                </div>
              </fieldset>
            </div>

            <div class="card p-4">
              <label for="public-additional-notes" class="field-label">
                Algo mais que seu personal precisa saber?
                <span class="font-medium text-slate-500">(opcional)</span>
              </label>
              <textarea
                id="public-additional-notes"
                v-model="additionalNotes"
                rows="3"
                class="w-full rounded-xl border border-slate-300 bg-white p-3 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                placeholder="Ex.: prefiro treinar pela manhã"
              />
            </div>

            <div class="card bg-slate-100 p-4">
              <p class="eyebrow">Resumo das suas respostas</p>
              <dl class="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt class="font-semibold text-slate-500">Objetivo</dt>
                  <dd class="font-extrabold text-slate-900">
                    {{ primaryGoal || 'Não informado' }}
                  </dd>
                </div>
                <div>
                  <dt class="font-semibold text-slate-500">Experiência</dt>
                  <dd class="font-extrabold text-slate-900">
                    {{ experienceLevel || 'Não informado' }}
                  </dd>
                </div>
                <div>
                  <dt class="font-semibold text-slate-500">Frequência</dt>
                  <dd class="font-extrabold text-slate-900">
                    {{ weeklyFrequency }}x por semana
                  </dd>
                </div>
                <div>
                  <dt class="font-semibold text-slate-500">Dores</dt>
                  <dd class="font-extrabold text-slate-900">
                    {{ selectedPainSummary }}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </Transition>
      </template>
    </main>

    <div
      v-if="record && !sent"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-4 pb-safe shadow-tier-3 backdrop-blur"
    >
      <div class="mx-auto flex max-w-2xl gap-2">
        <button
          v-if="currentStep > 0"
          type="button"
          class="btn btn-secondary flex-1"
          :disabled="saving"
          @click="previousStep"
        >
          <BaseIcon name="arrow-left" :size="19" />
          Voltar
        </button>

        <button
          v-if="currentStep < 2"
          type="button"
          class="btn btn-primary flex-[1.5]"
          @click="nextStep"
        >
          Continuar
          <BaseIcon name="chevron-right" :size="19" />
        </button>

        <button
          v-else
          type="button"
          class="btn btn-success flex-[1.5] whitespace-nowrap px-3"
          :disabled="saving"
          @click="submitAnamnesis"
        >
          <BaseIcon name="check" :size="20" :stroke-width="3" />
          {{ saving ? 'Enviando...' : 'Enviar respostas' }}
        </button>
      </div>
    </div>
  </div>
</template>
