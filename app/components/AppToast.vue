<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean
    message: string
    tone?: 'success' | 'info'
  }>(),
  {
    tone: 'success',
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-3 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-3 opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-x-4 top-4 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-2xl border p-4 shadow-tier-3"
        :class="
          tone === 'success'
            ? 'border-success-300 bg-success-50 text-success-900'
            : 'border-brand-200 bg-brand-50 text-brand-900'
        "
        role="status"
        aria-live="polite"
      >
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
          :class="tone === 'success' ? 'bg-success-600' : 'bg-brand-600'"
        >
          <BaseIcon
            :name="tone === 'success' ? 'check' : 'info'"
            :size="20"
            :stroke-width="3"
          />
        </span>
        <p class="text-sm font-bold leading-5">{{ message }}</p>
      </div>
    </Transition>
  </Teleport>
</template>
