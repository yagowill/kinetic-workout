<script setup lang="ts">
interface Step {
  label: string
  shortLabel: string
}

defineProps<{
  steps: Step[]
  currentStep: number
}>()
</script>

<template>
  <ol class="flex items-start gap-1.5" aria-label="Etapas da anamnese">
    <li
      v-for="(step, index) in steps"
      :key="step.label"
      class="flex min-w-0 flex-1 items-start gap-1.5 last:flex-none"
      :aria-current="index === currentStep ? 'step' : undefined"
    >
      <div class="flex min-w-0 flex-col items-center gap-1.5">
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-colors"
          :class="
            index < currentStep
              ? 'bg-success-600 text-white'
              : index === currentStep
                ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                : 'bg-slate-200 text-slate-500'
          "
        >
          <BaseIcon
            v-if="index < currentStep"
            name="check"
            :size="16"
            :stroke-width="3"
          />
          <span v-else>{{ index + 1 }}</span>
        </div>
        <span
          class="max-w-[72px] text-center text-[10px] font-extrabold uppercase leading-3 tracking-wide"
          :class="index === currentStep ? 'text-brand-700' : 'text-slate-500'"
        >
          {{ step.shortLabel }}
        </span>
      </div>

      <div
        v-if="index < steps.length - 1"
        class="mt-4 h-0.5 min-w-3 flex-1 rounded-full"
        :class="index < currentStep ? 'bg-success-500' : 'bg-slate-200'"
        aria-hidden="true"
      />
    </li>
  </ol>
</template>
