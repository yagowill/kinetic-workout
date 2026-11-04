<script setup lang="ts">
import type { StudentSummary } from '~/types/app.types'
import { listStudentSummaries } from '~/services/studentService'

const user = useSupabaseUser()
const client = useSupabaseClient()

const { data, pending, error, refresh } = await useAsyncData(
  'student-summaries',
  () => listStudentSummaries(),
)

const students = computed<StudentSummary[]>(() => data.value ?? [])

const pendingAnamneses = computed(
  () =>
    students.value.filter(
      (student) => student.anamnesisStatus === 'pending',
    ).length,
)

const studentsWithPain = computed(
  () =>
    students.value.filter((student) => student.jointPains.length > 0).length,
)

const displayName = computed(() => {
  const metadataName = user.value?.user_metadata?.name

  if (typeof metadataName === 'string' && metadataName.trim().length > 0) {
    return metadataName.trim()
  }

  const email = user.value?.email ?? ''
  const prefix = email.split('@')[0] ?? ''

  return prefix
    ? prefix.charAt(0).toUpperCase() + prefix.slice(1)
    : 'Personal'
})

const userInitial = computed(() => displayName.value.charAt(0).toUpperCase())

const previewToken = computed(
  () =>
    students.value.find((student) => student.accessToken)?.accessToken ?? null,
)

async function logout() {
  await client.auth.signOut()
  await navigateTo('/login')
}

useHead({
  title: 'Painel do personal',
})
</script>

<template>
  <div class="min-h-dvh bg-slate-50 pb-32">
    <header class="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/90 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 pt-safe">
        <AppBrand />

        <div class="flex items-center gap-1.5">
          <NuxtLink
            v-if="previewToken"
            :to="`/t/${previewToken}`"
            class="icon-button sm:hidden"
            aria-label="Abrir prévia da visão do aluno"
          >
            <BaseIcon name="play" :size="20" />
          </NuxtLink>

          <NuxtLink
            v-if="previewToken"
            :to="`/t/${previewToken}`"
            class="btn btn-secondary hidden sm:inline-flex"
            aria-label="Abrir prévia da visão do aluno"
          >
            <BaseIcon name="play" :size="18" />
            Prévia do aluno
          </NuxtLink>

          <button
            type="button"
            class="icon-button"
            aria-label="Sair da conta"
            @click="logout"
          >
            <BaseIcon name="logout" :size="20" />
          </button>

          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-extrabold text-white"
            aria-hidden="true"
          >
            {{ userInitial }}
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-5">
      <section>
        <p class="eyebrow">Seu painel de treinos</p>
        <h1 class="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Olá, {{ displayName }}
        </h1>
        <p class="mt-2 max-w-2xl text-base font-medium text-slate-600">
          Escolha um aluno para montar o treino ou atualizar a anamnese.
        </p>
      </section>

      <section class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Resumo da carteira">
        <div class="card p-4">
          <div class="flex items-center gap-2 text-slate-500">
            <BaseIcon name="users" :size="18" />
            <span class="eyebrow">Alunos</span>
          </div>
          <p class="mt-2 text-3xl font-extrabold tabular-nums text-slate-900">
            {{ students.length }}
          </p>
          <p class="mt-0.5 text-xs font-semibold text-slate-500">ativos na carteira</p>
        </div>

        <div class="card p-4">
          <div class="flex items-center gap-2 text-warning-600">
            <BaseIcon name="clock" :size="18" />
            <span class="eyebrow text-warning-700">Pendências</span>
          </div>
          <p class="mt-2 text-3xl font-extrabold tabular-nums text-slate-900">
            {{ pendingAnamneses }}
          </p>
          <p class="mt-0.5 text-xs font-semibold text-slate-500">
            {{ pendingAnamneses === 1 ? 'anamnese pendente' : 'anamneses pendentes' }}
          </p>
        </div>

        <div class="card col-span-2 p-4 sm:col-span-1">
          <div class="flex items-center gap-2 text-warning-600">
            <BaseIcon name="warning" :size="18" />
            <span class="eyebrow text-warning-700">Atenção</span>
          </div>
          <p class="mt-2 text-3xl font-extrabold tabular-nums text-slate-900">
            {{ studentsWithPain }}
          </p>
          <p class="mt-0.5 text-xs font-semibold text-slate-500">
            {{ studentsWithPain === 1 ? 'aluno com dor relatada' : 'alunos com dor relatada' }}
          </p>
        </div>
      </section>

      <section class="mt-6" aria-labelledby="students-heading">
        <div class="flex items-end justify-between gap-3">
          <div>
            <p class="eyebrow">Sua carteira</p>
            <h2 id="students-heading" class="text-xl font-extrabold text-slate-900">
              Alunos
            </h2>
          </div>
          <span class="badge badge-neutral">{{ students.length }} ativos</span>
        </div>

        <div v-if="pending" class="card mt-3 p-6 text-center">
          <p class="font-bold text-slate-700">Carregando alunos...</p>
          <p class="mt-1 text-sm text-slate-500">
            Buscando sua carteira no Supabase.
          </p>
        </div>

        <div v-else-if="error" class="card mt-3 p-6 text-center">
          <BaseIcon name="warning" :size="32" class="mx-auto text-warning-500" />
          <p class="mt-3 font-bold text-slate-700">
            Não foi possível carregar seus alunos
          </p>
          <p class="mt-1 text-sm text-slate-500">{{ error.message }}</p>
          <button type="button" class="btn btn-secondary mt-4" @click="refresh()">
            Tentar novamente
          </button>
        </div>

        <div v-else-if="students.length === 0" class="card mt-3 p-6 text-center">
          <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <BaseIcon name="users" :size="26" />
          </span>
          <p class="mt-3 text-lg font-extrabold text-slate-900">
            Nenhum aluno cadastrado
          </p>
          <p class="mt-1 text-sm text-slate-500">
            Toque em “Cadastrar Novo Aluno” para começar.
          </p>
        </div>

        <div v-else class="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <StudentCard
            v-for="student in students"
            :key="student.id"
            :student="student"
          />
        </div>
      </section>
    </main>

    <div class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-4 pb-safe shadow-tier-3 backdrop-blur">
      <div class="mx-auto max-w-6xl">
        <NuxtLink
          to="/students/new"
          class="btn btn-primary w-full text-lg sm:mx-auto sm:max-w-md"
        >
          <BaseIcon name="plus" :size="24" :stroke-width="2.5" />
          Cadastrar Novo Aluno
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
