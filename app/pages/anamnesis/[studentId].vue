<script setup lang="ts">
import type { PrototypeAnamnesis } from '~/composables/usePrototypeData'

const route = useRoute()
const {
  getStudent,
  getAnamnesis,
  saveAnamnesis,
  createStudent,
} = usePrototypeData()

const studentId = computed(() => String(route.params.studentId ?? ''))
const isNewStudent = computed(() => studentId.value === 'new')
const student = computed(() =>
  isNewStudent.value ? null : getStudent(studentId.value),
)
const existingAnamnesis = computed(() =>
  student.value ? getAnamnesis(student.value.id) : null,
)

const currentStep = ref(0)
const formError = ref('')
const showSuccess = ref(false)
const savedStudentId = ref('')

const newStudentName = ref('')
const newStudentPhone = ref('')

const primaryGoal = ref(
  existingAnamnesis.value?.primaryGoal ?? student.value?.goal ?? 'Hipertrofia',
)
const experienceLevel = ref(
  existingAnamnesis.value?.experienceLevel ??
    student.value?.experienceLevel ??
    'Iniciante',
)
const weeklyFrequency = ref(
  existingAnamnesis.value?.weeklyFrequency ??
    student.value?.weeklyFrequency ??
    3,
)
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

const steps = [
  { label: 'Objetivo', shortLabel: 'Objetivo' },
  { label: 'Rotina', shortLabel: 'Rotina' },
  { label: 'Saúde', shortLabel: 'Saúde' },
]

const goalOptions = [
  {
    value: 'Hipertrofia',
    label: 'Hipertrofia',
    description: 'Ganhar massa muscular',
    emoji: '💪',
  },
  {
    value: 'Emagrecimento',
    label: 'Emagrecimento',
    description: 'Reduzir gordura corporal',
    emoji: '🔥',
  },
  {
    value: 'Condicionamento',
    label: 'Condicionamento',
    description: 'Melhorar fôlego e energia',
    emoji: '🫀',
  },
  {
    value: 'Força',
    label: 'Força',
    description: 'Levantar mais carga',
    emoji: '🏋️',
  },
  {
    value: 'Saúde geral',
    label: 'Saúde geral',
    description: 'Movimentar com mais conforto',
    emoji: '🌱',
  },
]

const experienceOptions = [
  {
    value: 'Iniciante',
    label: 'Iniciante',
    description: 'Primeiros meses de treino',
  },
  {
    value: 'Intermediário',
    label: 'Intermediário',
    description: 'Já treina com frequência',
  },
  {
    value: 'Avançado',
    label: 'Avançado',
    description: 'Treina há mais de 1 ano',
  },
]

const frequencyOptions = [
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 4, label: '4x' },
  { value: 5, label: '5x+' },
]

const jointPainOptions = [
  'Ombro',
  'Joelho',
  'Coluna',
  'Quadril',
  'Tornozelo',
  'Nenhuma',
]

const medicalConditionOptions = [
  'Hipertensão',
  'Diabetes',
  'Problema cardíaco',
  'Cirurgia recente',
  'Nenhuma',
]

const hasJointPain = computed(() =>
  jointPains.value.some((pain) => pain !== 'Nenhuma'),
)

const selectedPainSummary = computed(() =>
  hasJointPain.value
    ? jointPains.value.filter((pain) => pain !== 'Nenhuma').join(', ')
    : 'Nenhuma dor relatada',
)

const studentDisplayName = computed(() => {
  if (isNewStudent.value) {
    return newStudentName.value.trim() || 'Novo aluno'
  }

  return student.value?.name ?? 'Aluno'
})

function toggleJointPain(pain: string) {
  if (pain === 'Nenhuma') {
    jointPains.value = ['Nenhuma']
    return
  }

  const selectedWithoutNone = jointPains.value.filter(
    (item) => item !== 'Nenhuma',
  )

  if (selectedWithoutNone.includes(pain)) {
    const nextPains = selectedWithoutNone.filter((item) => item !== pain)
    jointPains.value = nextPains.length > 0 ? nextPains : ['Nenhuma']
    return
  }

  jointPains.value = [...selectedWithoutNone, pain]
}

function toggleMedicalCondition(condition: string) {
  if (condition === 'Nenhuma') {
    medicalConditions.value = ['Nenhuma']
    return
  }

  const selectedWithoutNone = medicalConditions.value.filter(
    (item) => item !== 'Nenhuma',
  )

  if (selectedWithoutNone.includes(condition)) {
    const nextConditions = selectedWithoutNone.filter(
      (item) => item !== condition,
    )
    medicalConditions.value =
      nextConditions.length > 0 ? nextConditions : ['Nenhuma']
    return
  }

  medicalConditions.value = [...selectedWithoutNone, condition]
}

function validateNewStudent(): boolean {
  if (!isNewStudent.value) {
    return true
  }

  if (newStudentName.value.trim().length < 3) {
    formError.value = 'Digite o nome completo do aluno para continuar.'
    return false
  }

  const phoneDigits = newStudentPhone.value.replace(/\D/g, '')

  if (phoneDigits.length < 10) {
    formError.value = 'Digite um WhatsApp válido com DDD.'
    return false
  }

  formError.value = ''
  return true
}

function nextStep() {
  if (currentStep.value === 0 && !validateNewStudent()) {
    return
  }

  formError.value = ''
  currentStep.value = Math.min(2, currentStep.value + 1)
}

function previousStep() {
  formError.value = ''
  currentStep.value = Math.max(0, currentStep.value - 1)
}

function buildAnamnesis(): PrototypeAnamnesis {
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

function saveAnamnesisForm() {
  if (!validateNewStudent()) {
    currentStep.value = 0
    return
  }

  const anamnesis = buildAnamnesis()

  if (isNewStudent.value) {
    const createdStudent = createStudent({
      name: newStudentName.value,
      phone: newStudentPhone.value,
      anamnesis,
    })

    savedStudentId.value = createdStudent.id
  } else if (student.value) {
    saveAnamnesis(student.value.id, anamnesis)
    savedStudentId.value = student.value.id
  }

  showSuccess.value = true
}

function goToWorkout() {
  if (savedStudentId.value) {
    navigateTo(`/workout/${savedStudentId.value}`)
  }
}

function goToDashboard() {
  navigateTo('/')
}

useHead({
  title: isNewStudent.value ? 'Nova anamnese' : `Anamnese de ${studentDisplayName.value}`,
})
</script>

<template>
  <div class="min-h-dvh bg-slate-50 pb-32">
    <header class="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/90 backdrop-blur">
      <div class="mx-auto flex max-w-3xl items-center gap-2 px-3 py-3 pt-safe">
        <NuxtLink
          to="/"
          class="icon-button shrink-0"
          aria-label="Voltar para a lista de alunos"
        >
          <BaseIcon name="arrow-left" :size="22" />
        </NuxtLink>

        <div class="min-w-0 flex-1">
          <p class="eyebrow">Anamnese</p>
          <h1 class="truncate text-lg font-extrabold text-slate-900">
            {{ studentDisplayName }}
          </h1>
        </div>

        <span class="badge badge-neutral shrink-0">
          {{ currentStep + 1 }} de 3
        </span>
      </div>
    </header>

    <main class="mx-auto max-w-3xl px-4 py-5">
      <div
        v-if="!isNewStudent && !student"
        class="card p-6 text-center"
      >
        <BaseIcon name="warning" :size="32" class="mx-auto text-warning-500" />
        <h2 class="mt-3 text-xl font-extrabold">Aluno não encontrado</h2>
        <p class="mt-1 text-slate-600">
          Volte ao painel e selecione um aluno da sua carteira.
        </p>
        <NuxtLink to="/" class="btn btn-primary mt-5 w-full">
          Voltar ao painel
        </NuxtLink>
      </div>

      <template v-else>
        <section class="card p-4" aria-label="Progresso da anamnese">
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
          <section v-if="currentStep === 0" key="goal" class="mt-4 space-y-4">
            <div v-if="isNewStudent" class="card p-4">
              <p class="eyebrow">Novo aluno</p>
              <h2 class="mt-1 text-xl font-extrabold text-slate-900">
                Quem é o aluno?
              </h2>
              <p class="mt-1 text-sm text-slate-500">
                Preencha apenas o essencial. O restante é feito com toques.
              </p>

              <div class="mt-4 space-y-3">
                <div>
                  <label for="student-name" class="field-label">Nome completo</label>
                  <input
                    id="student-name"
                    v-model="newStudentName"
                    type="text"
                    class="input"
                    autocomplete="name"
                    placeholder="Ex.: Mariana Costa"
                  />
                </div>

                <div>
                  <label for="student-phone" class="field-label">WhatsApp</label>
                  <input
                    id="student-phone"
                    v-model="newStudentPhone"
                    type="tel"
                    inputmode="tel"
                    class="input"
                    autocomplete="tel"
                    placeholder="(11) 99999-9999"
                  />
                  <p class="mt-1 text-xs font-medium text-slate-500">
                    Usaremos este número para enviar o treino.
                  </p>
                </div>
              </div>
            </div>

            <div class="card p-4">
              <fieldset>
                <legend class="text-xl font-extrabold text-slate-900">
                  Qual é o objetivo principal?
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
                  Qual é a experiência do aluno?
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
                  Quantos dias por semana?
                </legend>
                <p class="mt-1 text-sm text-slate-500">
                  Escolha a rotina mais realista para o aluno.
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
                  O aluno sente dor em algum lugar?
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
                  Atenção: o treino será adaptado para proteger
                  {{ selectedPainSummary.toLowerCase() }}.
                </p>
              </div>
            </div>

            <div class="card p-4">
              <fieldset>
                <legend class="text-xl font-extrabold text-slate-900">
                  Alguma condição de saúde?
                </legend>
                <p class="mt-1 text-sm text-slate-500">
                  Marque o que o aluno já relatou.
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
              <label for="additional-notes" class="field-label">
                Observações importantes
                <span class="font-medium text-slate-500">(opcional)</span>
              </label>
              <textarea
                id="additional-notes"
                v-model="additionalNotes"
                rows="3"
                class="w-full rounded-xl border border-slate-300 bg-white p-3 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                placeholder="Ex.: prefere treinar pela manhã"
              />
            </div>

            <div class="card bg-slate-100 p-4">
              <p class="eyebrow">Resumo da anamnese</p>
              <dl class="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt class="font-semibold text-slate-500">Objetivo</dt>
                  <dd class="font-extrabold text-slate-900">{{ primaryGoal }}</dd>
                </div>
                <div>
                  <dt class="font-semibold text-slate-500">Experiência</dt>
                  <dd class="font-extrabold text-slate-900">{{ experienceLevel }}</dd>
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

    <div class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-4 pb-safe shadow-tier-3 backdrop-blur">
      <div class="mx-auto flex max-w-3xl gap-2">
        <button
          v-if="currentStep > 0"
          type="button"
          class="btn btn-secondary flex-1"
          @click="previousStep"
        >
          <BaseIcon name="arrow-left" :size="19" />
          Voltar
        </button>

        <NuxtLink v-else to="/" class="btn btn-secondary flex-1">
          Cancelar
        </NuxtLink>

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
          @click="saveAnamnesisForm"
        >
          <BaseIcon name="check" :size="20" :stroke-width="3" />
          Concluir anamnese
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showSuccess"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:items-center"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="anamnesis-success-title"
          class="w-full max-w-md rounded-3xl bg-white p-5 shadow-tier-3"
        >
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-success-700">
            <BaseIcon name="check-circle" :size="34" :stroke-width="2.5" />
          </div>

          <h2
            id="anamnesis-success-title"
            class="mt-4 text-center text-2xl font-extrabold text-slate-900"
          >
            Anamnese salva!
          </h2>
          <p class="mt-2 text-center text-sm font-medium text-slate-600">
            As informações de {{ studentDisplayName }} já estão prontas para
            orientar o próximo treino.
          </p>

          <div class="mt-5 grid gap-2">
            <button type="button" class="btn btn-primary w-full" @click="goToWorkout">
              Montar treino agora
              <BaseIcon name="chevron-right" :size="19" />
            </button>
            <button type="button" class="btn btn-secondary w-full" @click="goToDashboard">
              Voltar aos alunos
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
