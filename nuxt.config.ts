// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/supabase', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  supabase: {
    // Mantém a rota pública /t/:accessToken acessível sem exigir autenticação.
    redirect: false,
    // Fallback apenas para prévia visual do protótipo sem credenciais locais.
    // Em produção, configure NUXT_PUBLIC_SUPABASE_URL e NUXT_PUBLIC_SUPABASE_KEY.
    url:
      process.env.NUXT_PUBLIC_SUPABASE_URL ||
      'https://placeholder.supabase.co',
    key: process.env.NUXT_PUBLIC_SUPABASE_KEY || 'placeholder-anon-key',
  },
  runtimeConfig: {
    public: {
      // URL base da PWA utilizada na montagem dos links enviados pelo WhatsApp.
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  },
})
