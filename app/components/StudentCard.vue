<script setup lang="ts">
import type { PrototypeStudent } from '~/composables/usePrototypeData'

const props = defineProps<{
  student: PrototypeStudent
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
          {{ student.goal }} · {{ student.weeklyFrequency }}x por semana
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
  </article>
</template>
