<template>
  <NuxtLink
    to="/"
    class="inline-flex min-h-12 items-center gap-2 rounded-xl pr-2 text-slate-900 transition-opacity hover:opacity-80"
    aria-label="Ir para o painel de alunos"
  >
    <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-tier-2">
      <BaseIcon name="bolt" :size="22" :stroke-width="2.5" />
    </span>
    <span class="text-lg font-extrabold tracking-tight">Kinetic</span>
  </NuxtLink>
</template>
