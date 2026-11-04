<script setup lang="ts">
// Configuração global de idioma, título e cor de tema da PWA.
useHead({
  htmlAttrs: { lang: 'pt-BR' },
  titleTemplate: (title) =>
    title ? `${title} · Kinetic` : 'Kinetic · Treinos que cabem na rotina',
  meta: [
    {
      name: 'description',
      content:
        'Plataforma simples para personal trainers montarem e compartilharem treinos.',
    },
    { name: 'theme-color', content: '#f8fafc' },
  ],
})
</script>

<template>
  <div class="min-h-dvh bg-slate-50 text-slate-900">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
