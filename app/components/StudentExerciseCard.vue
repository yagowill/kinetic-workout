<script setup lang="ts">
import type { WorkoutItemView } from '~/types/app.types'

defineProps<{
  item: WorkoutItemView
  completed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <article
    class="rounded-2xl border bg-slate-900 p-4 transition-colors"
    :class="completed ? 'border-success-500/70 bg-success-900/20' : 'border-slate-800'"
  >
    <div class="flex gap-4">
      <div
        class="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-800"
      >
        <ExerciseGifPreview
          :src="item.gifUrl"
          :alt="`Demonstração do exercício ${item.name}`"
          dark
        />
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
          {{ item.muscleLabel }}
        </p>
        <h3 class="mt-1 text-lg font-extrabold leading-6 text-white">
          {{ item.name }}
        </h3>

        <div class="mt-3 flex flex-wrap gap-2">
          <span class="rounded-lg bg-slate-800 px-2.5 py-1 text-sm font-bold tabular-nums text-slate-200">
            {{ item.sets }} × {{ item.reps }}
          </span>
          <span class="rounded-lg bg-slate-800 px-2.5 py-1 text-sm font-bold tabular-nums text-slate-200">
            {{ item.restSeconds }}s descanso
          </span>
        </div>
      </div>
    </div>

    <button
      type="button"
      role="checkbox"
      :aria-checked="completed"
      :aria-label="`Marcar ${item.name} como concluído`"
      class="mt-4 flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border-2 px-4 text-base font-extrabold transition-colors"
      :class="
        completed
          ? 'border-success-500 bg-success-500 text-slate-950'
          : 'border-slate-700 bg-slate-800 text-white hover:border-slate-500 hover:bg-slate-700 active:bg-slate-600'
      "
      @click="emit('toggle')"
    >
      <span
        class="flex h-8 w-8 items-center justify-center rounded-lg border-2"
        :class="
          completed
            ? 'border-slate-950 bg-slate-950 text-success-400'
            : 'border-slate-500 text-transparent'
        "
      >
        <BaseIcon v-if="completed" name="check" :size="20" :stroke-width="3" />
      </span>
      {{ completed ? 'Concluído' : 'Marcar como concluído' }}
    </button>
  </article>
</template>
