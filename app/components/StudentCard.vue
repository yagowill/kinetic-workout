<script setup lang="ts">
import type { StudentSummary } from '~/types/app.types'
import { buildAnamnesisWhatsAppUrl } from '~/services/whatsappService'

const props = defineProps<{
  student: StudentSummary
}>()

const initials = computed(() =>
  props.student.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join(''),
)

const anamnesisActionLabel = computed(() =>
  props.student.anamnesisStatus === 'complete'
    ? 'Ver anamnese'
    : 'Preencher anamnese',
)

// Link do WhatsApp para o aluno responder a própria anamnese.
const anamnesisWhatsAppUrl = computed(() => {
  if (!props.student.anamnesisToken) {
    return null
  }

  try {
    return buildAnamnesisWhatsAppUrl(
      props.student.phone,
      props.student.name,
      props.student.anamnesisToken,
    )
  } catch {
    return null
  }
})

const anamnesisWhatsAppLabel = computed(() =>
  props.student.anamnesisStatus === 'complete'
    ? 'Enviar anamnese no WhatsApp'
    : 'Pedir anamnese no WhatsApp',
)
</script>

<template>
  <article class="card flex flex-col gap-4 p-4 transition hover:border-slate-300 hover:shadow-tier-3">
    <div class="flex items-start gap-3">
      <div
        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold text-white shadow-sm"
        :style="{ backgroundColor: student.avatarColor }"
        aria-hidden="true"
      >
        {{ initials }}
      </div>

      <div class="min-w-0 flex-1">
        <h3 class="truncate text-lg font-bold leading-6 text-slate-900">
          {{ student.name }}
        </h3>
        <p class="mt-0.5 text-sm font-medium text-slate-600">
          <template v-if="student.anamnesisStatus === 'complete'">
            {{ student.goal }} · {{ student.weeklyFrequency }}x por semana
          </template>
          <template v-else>Anamnese pendente</template>
        </p>
        <div class="mt-2">
          <StatusBadge :status="student.anamnesisStatus" />
        </div>
      </div>
    </div>

    <div
      v-if="student.jointPains.length > 0"
      class="flex items-start gap-2 rounded-xl border border-warning-300 bg-warning-50 p-3 text-sm font-bold text-warning-900"
      role="note"
    >
      <BaseIcon name="warning" :size="18" :stroke-width="2.5" class="mt-0.5 shrink-0" />
      <span>Dor relatada: {{ student.jointPains.join(', ') }}</span>
    </div>

    <div class="mt-auto flex flex-col gap-2 sm:flex-row">
      <NuxtLink
        :to="`/anamnesis/${student.id}`"
        class="btn btn-secondary flex-1"
        :aria-label="`${anamnesisActionLabel} de ${student.name}`"
      >
        <BaseIcon name="shield" :size="18" />
        {{ anamnesisActionLabel }}
      </NuxtLink>

      <NuxtLink
        :to="`/workout/${student.id}`"
        class="btn btn-primary flex-1"
        :aria-label="`Criar ou ver treino de ${student.name}`"
      >
        <BaseIcon name="dumbbell" :size="18" />
        Criar/Ver treino
      </NuxtLink>
    </div>

    <a
      v-if="anamnesisWhatsAppUrl"
      :href="anamnesisWhatsAppUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="-mb-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold text-success-700 transition-colors hover:bg-success-50 active:bg-success-100"
      :aria-label="`${anamnesisWhatsAppLabel} de ${student.name}`"
    >
      <BaseIcon name="whatsapp" :size="18" />
      {{ anamnesisWhatsAppLabel }}
    </a>
  </article>
</template>
