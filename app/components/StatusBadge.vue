<script setup lang="ts">
import type { AnamnesisStatus } from '~/composables/usePrototypeData'

const props = defineProps<{
  status: AnamnesisStatus
}>()

const isComplete = computed(() => props.status === 'complete')
</script>

<template>
  <span
    class="badge"
    :class="isComplete ? 'badge-success' : 'badge-warning'"
    :aria-label="isComplete ? 'Anamnese preenchida' : 'Anamnese pendente'"
  >
    <BaseIcon
      :name="isComplete ? 'check-circle' : 'clock'"
      :size="14"
      :stroke-width="2.5"
    />
    {{ isComplete ? 'Preenchida' : 'Pendente' }}
  </span>
</template>
