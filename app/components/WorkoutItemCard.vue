<script setup lang="ts">
import type { WorkoutItemView } from '~/types/app.types'

const props = defineProps<{
  item: WorkoutItemView
  index: number
}>()

const emit = defineEmits<{
  remove: []
  updateSets: [nextSets: number]
}>()

function changeSets(amount: number) {
  emit('updateSets', props.item.sets + amount)
}
</script>

<template>
  <article class="rounded-2xl border border-slate-200 bg-white p-3 shadow-tier-2">
    <div class="flex gap-3">
      <div
        class="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100"
      >
        <img
          :src="item.gifUrl"
          :alt="`Demonstração do exercício ${item.name}`"
          class="absolute inset-0 h-full w-full object-cover text-transparent"
          loading="lazy"
        />
        <span
          class="absolute left-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-lg bg-slate-950/80 px-1 text-xs font-extrabold text-white"
          aria-hidden="true"
        >
          {{ index + 1 }}
        </span>
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-1">
          <div class="min-w-0">
            <p class="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
              {{ item.muscleLabel }}
            </p>
            <h3 class="mt-0.5 text-base font-bold leading-5 text-slate-900">
              {{ item.name }}
            </h3>
          </div>

          <button
            type="button"
            class="icon-button -mr-1 -mt-1 shrink-0 text-slate-400 hover:bg-danger-50 hover:text-danger-600"
            :aria-label="`Remover ${item.name} do treino`"
            @click="emit('remove')"
          >
            <BaseIcon name="trash" :size="19" />
          </button>
        </div>

        <div class="mt-2 flex flex-wrap gap-1.5">
          <span class="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
            {{ item.sets }} séries
          </span>
          <span class="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
            {{ item.reps }} reps
          </span>
          <span class="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
            {{ item.restSeconds }}s
          </span>
        </div>
      </div>
    </div>

    <div class="mt-3 flex min-h-12 items-center justify-between gap-2 rounded-xl bg-slate-50 p-1.5 pl-3">
      <div>
        <p class="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
          Séries
        </p>
        <p class="text-xs font-semibold text-slate-500">Ajuste sem digitar</p>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl font-extrabold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
          :disabled="item.sets <= 1"
          :aria-label="`Diminuir séries de ${item.name}`"
          @click="changeSets(-1)"
        >
          −
        </button>
        <span class="w-9 text-center text-xl font-extrabold tabular-nums text-slate-900">
          {{ item.sets }}
        </span>
        <button
          type="button"
          class="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl font-extrabold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
          :disabled="item.sets >= 10"
          :aria-label="`Aumentar séries de ${item.name}`"
          @click="changeSets(1)"
        >
          +
        </button>
      </div>
    </div>
  </article>
</template>
