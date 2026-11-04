export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  // A PWA do aluno e a anamnese pública são acessadas por token.
  if (to.path.startsWith('/t/') || to.path.startsWith('/a/')) {
    return
  }

  if (to.path === '/login') {
    if (user.value) {
      return navigateTo('/')
    }

    return
  }

  if (!user.value) {
    return navigateTo('/login')
  }
})
