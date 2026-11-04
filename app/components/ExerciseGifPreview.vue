<script setup lang="ts">
// Miniatura de GIF com fallback visual quando a imagem não carrega.
// O estado é resetado automaticamente quando a URL muda.

const props = defineProps<{
  src: string
  alt: string
  dark?: boolean
}>()

const emit = defineEmits<{
  loaded: []
  error: []
}>()

const failed = ref(false)

watch(
  () => props.src,
  () => {
    failed.value = false
  },
)

function handleError() {
  failed.value = true
  emit('error')
}

function handleLoad() {
  failed.value = false
  emit('loaded')
}
</script>

<template>
  <img
    v-if="!failed"
    :src="src"
    :alt="alt"
    class="absolute inset-0 h-full w-full object-cover text-transparent"
    loading="lazy"
    @error="handleError"
    @load="handleLoad"
  />
  <div
    v-else
    class="absolute inset-0 flex flex-col items-center justify-center gap-1 p-1 text-center"
    :class="dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'"
  >
    <BaseIcon name="warning" :size="18" />
    <span class="text-[9px] font-extrabold uppercase leading-3">
      GIF indisponível
    </span>
  </div>
</template>
