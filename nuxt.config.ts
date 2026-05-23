import tailwindcss from '@tailwindcss/vite'

const siteUrl = 'https://bitterclip.com/'
const description =
  'BitterClip is a coming-soon clip vending machine: drop a video, hit Zap, and get clips out.'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  nitro: {
    preset: 'static',
  },

  app: {
    head: {
      title: 'BitterClip - Drop a video. Hit Zap. Clips jump out.',
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#111111' },
        { name: 'description', content: description },
        { property: 'og:title', content: 'BitterClip - Drop a video. Hit Zap. Clips jump out.' },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: siteUrl },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: 'BitterClip - Drop a video. Hit Zap. Clips jump out.' },
        { name: 'twitter:description', content: description },
      ],
      link: [
        { rel: 'canonical', href: siteUrl },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },
})
