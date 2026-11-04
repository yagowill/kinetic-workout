<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()

const mode = ref<'signin' | 'signup'>('signin')
const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const isSignUp = computed(() => mode.value === 'signup')

function switchMode() {
  mode.value = isSignUp.value ? 'signin' : 'signup'
  errorMessage.value = ''
  successMessage.value = ''
}

async function submit() {
  errorMessage.value = ''
  successMessage.value = ''

  if (isSignUp.value && name.value.trim().length < 2) {
    errorMessage.value = 'Informe seu nome para criar a conta.'
    return
  }

  if (!email.value.includes('@')) {
    errorMessage.value = 'Informe um e-mail válido.'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'A senha precisa ter pelo menos 6 caracteres.'
    return
  }

  loading.value = true

  try {
    if (isSignUp.value) {
      const { data, error } = await client.auth.signUp({
        email: email.value.trim(),
        password: password.value,
        options: {
          data: {
            name: name.value.trim(),
          },
        },
      })

      if (error) {
        throw error
      }

      if (data.session) {
        await navigateTo('/')
        return
      }

      successMessage.value =
        'Conta criada! Confirme seu e-mail e depois entre para acessar o painel.'
      mode.value = 'signin'
      password.value = ''
      return
    }

    const { error } = await client.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value,
    })

    if (error) {
      throw error
    }

    await navigateTo('/')
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível concluir. Tente novamente.'
  } finally {
    loading.value = false
  }
}

if (user.value) {
  await navigateTo('/')
}

useHead({
  title: computed(() => (isSignUp.value ? 'Criar conta' : 'Entrar')),
})
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-slate-50">
    <header class="mx-auto w-full max-w-md px-4 py-6 pt-safe">
      <AppBrand />
    </header>

    <main class="mx-auto w-full max-w-md flex-1 px-4 pb-10">
      <div class="card p-5">
        <p class="eyebrow">
          {{ isSignUp ? 'Primeiro acesso' : 'Bem-vindo de volta' }}
        </p>
        <h1 class="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
          {{ isSignUp ? 'Crie sua conta' : 'Acesse seu painel' }}
        </h1>
        <p class="mt-1 text-sm font-medium text-slate-600">
          {{
            isSignUp
              ? 'Leva menos de um minuto para começar.'
              : 'Entre para gerenciar seus alunos e treinos.'
          }}
        </p>

        <form class="mt-5 space-y-4" @submit.prevent="submit">
          <div v-if="isSignUp">
            <label for="name" class="field-label">Seu nome</label>
            <input
              id="name"
              v-model="name"
              type="text"
              class="input"
              autocomplete="name"
              placeholder="Ex.: Rafael"
            />
          </div>

          <div>
            <label for="email" class="field-label">E-mail</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="input"
              autocomplete="email"
              inputmode="email"
              placeholder="voce@exemplo.com"
            />
          </div>

          <div>
            <label for="password" class="field-label">Senha</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="input"
              :autocomplete="isSignUp ? 'new-password' : 'current-password'"
              placeholder="Mínimo de 6 caracteres"
            />
          </div>

          <p
            v-if="errorMessage"
            class="rounded-xl border border-danger-300 bg-danger-50 p-3 text-sm font-bold text-danger-700"
            role="alert"
          >
            {{ errorMessage }}
          </p>

          <p
            v-if="successMessage"
            class="rounded-xl border border-success-300 bg-success-50 p-3 text-sm font-bold text-success-700"
            role="status"
          >
            {{ successMessage }}
          </p>

          <button
            type="submit"
            class="btn btn-primary w-full text-lg"
            :disabled="loading"
          >
            <BaseIcon
              :name="isSignUp ? 'user' : 'shield'"
              :size="20"
              :stroke-width="2.5"
            />
            {{ loading ? 'Aguarde...' : isSignUp ? 'Criar conta' : 'Entrar' }}
          </button>
        </form>

        <button
          type="button"
          class="btn btn-ghost mt-2 w-full"
          @click="switchMode"
        >
          {{ isSignUp ? 'Já tenho conta' : 'Ainda não tenho conta' }}
        </button>
      </div>

      <p class="mt-4 text-center text-xs font-medium leading-5 text-slate-500">
        Seus dados e os dados dos alunos ficam protegidos por autenticação e
        políticas de acesso no Supabase.
      </p>
    </main>
  </div>
</template>
