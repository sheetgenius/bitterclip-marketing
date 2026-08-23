import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

const description =
  'Footage in, episode out: BitterClip turns raw session footage into the finished episode and the short cuts from that same edit — an agent that watched the whole session, directed and revised by you.'
// One title for the tab, the og card, and the twitter card. Keep them identical:
// a share card that disagrees with the page it links to reads as a stale mirror.
const siteTitle = 'BitterClip — Footage in, Episode out'
const gaMeasurementId = 'G-JRVVJM49G7'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  features: {
    inlineStyles: true,
  },

  modules: [
    '@nuxt/content',
    // Local module: generates the machine-readable surfaces (.md twins, llms.txt,
    // llms-full.txt, sitemap.xml, changelog RSS) from the content collection at build
    // time so they are never hand-maintained. See modules/generated-surfaces.ts.
    fileURLToPath(new URL('./modules/generated-surfaces', import.meta.url)),
  ],

  css: ['~/assets/css/main.css'],

  // @nuxt/content: dark Shiki theme so fenced code blocks read against the dark
  // docs surface, with the handful of languages our docs actually use.
  content: {
    build: {
      markdown: {
        toc: { depth: 3, searchDepth: 3 },
        highlight: {
          theme: 'github-dark-dimmed',
          langs: ['bash', 'json', 'js', 'ts', 'yaml', 'md', 'vue', 'html', 'ruby'],
        },
      },
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  nitro: {
    preset: 'static',
    // Emit immutable gzip/brotli sidecars for the production nginx/CDN path.
    // Lighthouse against an uncompressed toy server materially understates
    // the actual static delivery contract.
    compressPublicAssets: true,
  },

  app: {
    head: {
      title: siteTitle,
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#111111' },
        { name: 'description', content: description },
        { property: 'og:title', content: siteTitle },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        // -iso4 filename: social scrapers cache by URL, so the hero-true card
        // reshoot (machine at t=24) ships under a new name to bust old cards.
        { property: 'og:image', content: 'https://bitterclip.com/images/bitterclip-og-iso4.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: siteTitle },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: 'https://bitterclip.com/images/bitterclip-og-iso4.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', href: '/icon.png' },
        { rel: 'apple-touch-icon', href: '/icon.png' },
        { rel: 'alternate', type: 'text/plain', href: 'https://bitterclip.com/llms.txt', title: 'BitterClip agent index' },
        { rel: 'alternate', type: 'text/plain', href: 'https://bitterclip.com/llms-full.txt', title: 'BitterClip full Markdown context' },
      ],
      script: [
        {
          innerHTML: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('set', 'linker', {
  domains: ['bitterclip.com', 'app.bitterclip.com'],
  decorate_forms: true,
});
gtag('js', new Date());
gtag('config', '${gaMeasurementId}');
function loadBitterClipAnalytics(){
  if (document.querySelector('script[data-bitterclip-analytics]')) return;
  var script = document.createElement('script');
  script.async = true;
  script.dataset.bitterclipAnalytics = 'true';
  script.src = 'https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}';
  document.head.appendChild(script);
}
window.addEventListener('load', function(){
  if ('requestIdleCallback' in window) requestIdleCallback(loadBitterClipAnalytics, { timeout: 2000 });
  else setTimeout(loadBitterClipAnalytics, 500);
}, { once: true });`,
        },
      ],
    },
  },
})
