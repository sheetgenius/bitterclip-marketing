import tailwindcss from '@tailwindcss/vite'

const description =
  'BitterClip turns long recordings into speaker-aware, source-linked clips your AI can find, you can verify, and export ready to post.'
const gaMeasurementId = 'G-JRVVJM49G7'

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
      title: 'BitterClip - Speaker-aware clipping for recordings',
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#111111' },
        { name: 'description', content: description },
        { property: 'og:title', content: 'BitterClip - Speaker-aware clipping for recordings' },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: 'BitterClip - Speaker-aware clipping for recordings' },
        { name: 'twitter:description', content: description },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
      script: [
        {
          src: `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`,
          async: true,
        },
        {
          innerHTML: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaMeasurementId}');`,
        },
      ],
    },
  },
})
