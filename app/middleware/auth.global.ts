export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  // A PWA do aluno é pública: o token da URL é a credencial.
  if (to.path.startsWith('/t/')) {
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
