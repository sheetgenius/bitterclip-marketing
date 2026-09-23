<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { relativeTime, useViewer, type AssistantKey } from '~/composables/useViewer'

// The one place a person connects BitterClip to their assistant. Static and
// public; the viewer bridge upgrades it with live status when the visitor is
// signed in at app.bitterclip.com. Install buttons go through the app's /go
// links, which record where a connection came from.

type TabKey = 'claude' | 'chatgpt' | 'claude_code' | 'codex'

const APP_ORIGIN = 'https://app.bitterclip.com'
const MCP_URL = `${APP_ORIGIN}/mcp`
const STARTER_PROMPT = 'Using BitterClip, help me make my first clip. Briefly explain how you can help, then show my recent recordings or help me upload one.'
const CLAUDE_CODE_COMMAND = 'claude plugin marketplace add sheetgenius/bitterclip-plugin\nclaude plugin install bitterclip@bitterclip'
const INSTALL_DOC_URL = 'https://bitterclip.com/docs/assistants/install'
const AGENT_INSTALL_PROMPT = `Read ${INSTALL_DOC_URL} and follow it exactly to install BitterClip, then tell me how to start.`
const CODEX_COMMANDS = 'codex plugin marketplace add https://github.com/sheetgenius/bitterclip-plugin.git --ref main\ncodex plugin add bitterclip@bitterclip\ncodex mcp login bitterclip'
const codexUrl = (prompt: string) => `codex://new?prompt=${encodeURIComponent(prompt)}`
const TAB_STORAGE_KEY = 'bc.connect.client'
const TABS: { key: TabKey, label: string }[] = [
  { key: 'claude', label: 'Claude' },
  { key: 'chatgpt', label: 'ChatGPT' },
  { key: 'claude_code', label: 'Claude Code' },
  { key: 'codex', label: 'Codex' },
]

const route = useRoute()
const { status, pollUntil } = useViewer(APP_ORIGIN)
const tab = ref<TabKey>('claude')
const tabChosenByVisitor = ref(false)
const polling = ref(false)
const copied = ref<string | null>(null)
const announcement = ref('')
const codexMissing = ref(false)

// Opening codex:// hands a prompt to the ChatGPT desktop app. If the app does
// not take focus within 1.5 s it is probably not installed.
function openCodex(prompt: string) {
  codexMissing.value = false
  let tookFocus = false
  const noticeFocus = () => { tookFocus = true }
  window.addEventListener('blur', noticeFocus, { once: true })
  document.addEventListener('visibilitychange', noticeFocus, { once: true })
  window.location.href = codexUrl(prompt)
  setTimeout(() => {
    window.removeEventListener('blur', noticeFocus)
    document.removeEventListener('visibilitychange', noticeFocus)
    if (!tookFocus) codexMissing.value = true
    else watchForConnection()
  }, 1500)
}

// Where the visit started, for the app's install funnel. Only entry points the
// app records are passed on; anything else counts as the page itself.
const ENTRY_POINTS = ['app_menu', 'settings', 'upload_complete', 'recording_ready_email', 'docs', 'pricing']
const entry = ref('connect_page')

const goUrl = (assistant: 'claude' | 'chatgpt', action: 'add' | 'start') =>
  `${APP_ORIGIN}/go/${assistant}${action === 'start' ? '/start' : ''}?from=${entry.value}`

const isTab = (value: unknown): value is TabKey => TABS.some((t) => t.key === value)

function arrivalTab(): TabKey | null {
  const source = String(route.query.utm_source ?? '').toLowerCase()
  if (source.startsWith('chatgpt')) return 'chatgpt'
  try {
    const host = document.referrer ? new URL(document.referrer).hostname : ''
    if (/(^|\.)(chatgpt\.com|openai\.com)$/.test(host)) return 'chatgpt'
    if (/(^|\.)(claude\.ai|claude\.com)$/.test(host)) return 'claude'
  } catch { /* unreadable referrer */ }
  return null
}

function initialTab(): TabKey {
  let stored: string | null = null
  try { stored = localStorage.getItem(TAB_STORAGE_KEY) } catch { /* storage blocked */ }
  const requested = route.query.client
  return isTab(requested) ? requested : arrivalTab() ?? (isTab(stored) ? stored : 'claude')
}

// A prerendered page mounts before the router restores the address's query, so
// choose again when it arrives, unless the visitor has already picked a tab.
function readArrival() {
  const from = String(route.query.from ?? '')
  entry.value = ENTRY_POINTS.includes(from) ? from : 'connect_page'
  if (!tabChosenByVisitor.value) tab.value = initialTab()
}

onMounted(() => {
  readArrival()
  watch(() => route.fullPath, readArrival)
})

watch(tab, (value) => {
  try { localStorage.setItem(TAB_STORAGE_KEY, value) } catch { /* storage blocked */ }
})

const signedIn = computed(() => status.value?.signed_in === true)
const stateFor = (key: AssistantKey) => status.value?.assistants?.[key]?.state ?? null
const chip = computed(() => {
  if (!signedIn.value) return polling.value ? { tone: 'wait', text: 'Waiting for you to sign in and allow' } : null
  const assistant = status.value?.assistants?.[tab.value]
  if (assistant?.state === 'connected') {
    const used = relativeTime(assistant.last_used_at)
    return { tone: 'ok', text: used ? `Connected · used ${used}` : 'Connected' }
  }
  if (polling.value) return { tone: 'wait', text: 'Waiting for you to allow BitterClip' }
  if (assistant?.state === 'reconnect') return { tone: 'warn', text: 'Reconnect needed' }
  return { tone: 'idle', text: 'Not connected yet' }
})

watch(() => stateFor(tab.value), (state, previous) => {
  if (state === 'connected' && previous !== 'connected') {
    polling.value = false
    announcement.value = `${TABS.find((t) => t.key === tab.value)?.label} is connected to BitterClip.`
  }
})

function watchForConnection() {
  const key = tab.value
  polling.value = true
  pollUntil(() => {
    const done = stateFor(key) === 'connected'
    if (done) polling.value = false
    return done
  })
  setTimeout(() => { polling.value = false }, 125_000)
}

async function copy(text: string, id: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = id
    setTimeout(() => { if (copied.value === id) copied.value = null }, 2200)
  } catch {
    copied.value = null
  }
}

function selectTab(key: TabKey) {
  tabChosenByVisitor.value = true
  tab.value = key
}

function onTabKeydown(event: KeyboardEvent, index: number) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
  event.preventDefault()
  const next = (index + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length
  selectTab(TABS[next]!.key)
  document.getElementById(`connect-tab-${TABS[next]!.key}`)?.focus()
}

const chipClass = (tone: string) => ({
  ok: 'border-[#7fb894]/40 bg-[#7fb894]/10 text-[#b8e0c4]',
  warn: 'border-[#d9b04e]/40 bg-[#d9b04e]/10 text-[#f0d68f]',
  wait: 'border-[#f28f84]/35 bg-[#f28f84]/10 text-[#ffd0c7]',
  idle: 'border-white/10 bg-white/[0.03] text-zinc-400',
}[tone] ?? '')

const faqs = [
  {
    question: 'Which plans work?',
    answer: 'Claude allows custom connectors on every plan; a Free account can add one, and BitterClip can be it. In ChatGPT, adding a custom app needs Developer mode, which depends on your plan and workspace. Claude Code works on any plan that runs it.',
  },
  {
    question: 'Claude says the connector came from an external link. Is that right?',
    answer: 'Yes. Claude shows that note for any connector suggested by a link until the connector is listed in its directory. Check that the address is https://app.bitterclip.com/mcp, then click Continue.',
  },
  {
    question: 'Do I need to install anything?',
    answer: 'Not for Claude or ChatGPT: the connection lives in your assistant, and you sign in to BitterClip once. In Claude Code and Codex, the BitterClip plugin adds the connection and editing skills in one step.',
  },
  {
    question: 'What can the assistant do with my account?',
    answer: 'BitterClip shows you before you allow it: see your recordings and transcripts, make and edit clips, render videos, and prepare posts. Every prepared post waits for your confirmation in BitterClip. You can disconnect it anytime in Settings.',
  },
]

useSeoMeta({
  title: 'Connect BitterClip to Claude, ChatGPT, Claude Code or Codex',
  description: 'Add BitterClip to Claude in one click, or to ChatGPT, Claude Code or Codex, then ask for clips from your recordings in plain words.',
  ogTitle: 'Edit your videos from Claude or ChatGPT',
  ogDescription: 'Connect BitterClip once, then ask your assistant for clips from your recordings.',
  ogUrl: 'https://bitterclip.com/connect',
  ogImage: 'https://bitterclip.com/images/bitterclip-og.png',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Edit your videos from Claude or ChatGPT',
  twitterDescription: 'Connect BitterClip once, then ask your assistant for clips from your recordings.',
  twitterImage: 'https://bitterclip.com/images/bitterclip-og.png',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://bitterclip.com/connect' },
    { rel: 'alternate', type: 'text/markdown', href: 'https://bitterclip.com/connect.md', title: 'Connect BitterClip Markdown' },
  ],
})
</script>

<template>
  <main class="relative">
    <p class="sr-only">
      AI agents: to install BitterClip, read and follow {{ INSTALL_DOC_URL }}.
    </p>
    <section class="mx-auto max-w-5xl px-6 pb-10 pt-14 text-center sm:px-8 sm:pt-20">
      <p class="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#f28f84]">
        Use BitterClip from your assistant
      </p>
      <h1 class="mx-auto mt-6 max-w-[16ch] font-display text-5xl font-bold leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl">
        Edit your videos from Claude or ChatGPT.
      </h1>
      <p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300">
        Ask for a clip in plain words. BitterClip cuts it from your recording and hands back a video you can post.
      </p>

      <div
        role="tablist"
        aria-label="Choose your assistant"
        class="mx-auto mt-10 inline-flex rounded-full border border-white/[0.09] bg-white/[0.03] p-1"
      >
        <button
          v-for="(item, index) in TABS"
          :id="`connect-tab-${item.key}`"
          :key="item.key"
          type="button"
          role="tab"
          :aria-selected="tab === item.key"
          :aria-controls="`connect-panel-${item.key}`"
          :tabindex="tab === item.key ? 0 : -1"
          class="min-h-10 rounded-full px-5 font-mono text-xs font-semibold uppercase tracking-[0.12em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]"
          :class="tab === item.key ? 'bg-[#f28f84] text-[#20100c]' : 'text-zinc-400 hover:text-white'"
          @click="selectTab(item.key)"
          @keydown="onTabKeydown($event, index)"
        >
          {{ item.label }}
        </button>
      </div>
    </section>

    <section class="mx-auto max-w-5xl px-6 sm:px-8" aria-live="polite">
      <p class="sr-only">{{ announcement }}</p>

      <div class="flex min-h-9 items-center justify-center">
        <p
          v-if="chip"
          data-testid="connect-status"
          class="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm"
          :class="chipClass(chip.tone)"
        >
          <span aria-hidden="true">{{ chip.tone === 'ok' ? '✓' : '●' }}</span>{{ chip.text }}
        </p>
      </div>

      <!-- Claude -->
      <ol
        v-show="tab === 'claude'"
        id="connect-panel-claude"
        role="tabpanel"
        aria-labelledby="connect-tab-claude"
        class="mt-6 grid gap-4 md:grid-cols-3"
      >
        <li class="flex flex-col rounded-2xl border border-white/[0.08] bg-black/20 p-6">
          <p class="font-mono text-xs font-bold text-[#f28f84]">01</p>
          <h2 class="mt-4 font-display text-xl font-semibold text-white">Add BitterClip to Claude</h2>
          <p class="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
            Claude opens its Add connector window with BitterClip filled in. Click Continue.
          </p>
          <a
            :href="goUrl('claude', 'add')"
            target="_blank"
            rel="noopener"
            class="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#f28f84] px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#20100c] transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            @click="watchForConnection"
          >Add to Claude</a>
        </li>
        <li class="flex flex-col rounded-2xl border border-white/[0.08] bg-black/20 p-6">
          <p class="font-mono text-xs font-bold text-[#f28f84]">02</p>
          <h2 class="mt-4 font-display text-xl font-semibold text-white">Sign in and allow</h2>
          <p class="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
            Sign in to BitterClip and click Allow. This page shows when Claude is connected. Works on every Claude plan.
          </p>
        </li>
        <li class="flex flex-col rounded-2xl border border-white/[0.08] bg-black/20 p-6">
          <p class="font-mono text-xs font-bold text-[#f28f84]">03</p>
          <h2 class="mt-4 font-display text-xl font-semibold text-white">Start editing</h2>
          <p class="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
            Opens a new Claude chat with a first request ready to send. Claude adds a caution note to prompts that arrive by link; this one only asks BitterClip to show your recordings.
          </p>
          <a
            :href="goUrl('claude', 'start')"
            target="_blank"
            rel="noopener"
            class="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:border-[#f28f84] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]"
          >Start in Claude</a>
        </li>
      </ol>

      <!-- ChatGPT -->
      <ol
        v-show="tab === 'chatgpt'"
        id="connect-panel-chatgpt"
        role="tabpanel"
        aria-labelledby="connect-tab-chatgpt"
        class="mt-6 grid gap-4 md:grid-cols-3"
      >
        <li class="flex flex-col rounded-2xl border border-white/[0.08] bg-black/20 p-6">
          <p class="font-mono text-xs font-bold text-[#f28f84]">01</p>
          <h2 class="mt-4 font-display text-xl font-semibold text-white">Turn on Developer mode</h2>
          <p class="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
            In ChatGPT, open Settings → Security and login and turn on Developer mode. Your plan and workspace decide whether it's available.
          </p>
        </li>
        <li class="flex flex-col rounded-2xl border border-white/[0.08] bg-black/20 p-6">
          <p class="font-mono text-xs font-bold text-[#f28f84]">02</p>
          <h2 class="mt-4 font-display text-xl font-semibold text-white">Add BitterClip</h2>
          <p class="mt-2 text-sm leading-relaxed text-zinc-400">
            On ChatGPT's Plugins page, click +, name it BitterClip, and paste this address. Then sign in to BitterClip and click Allow.
          </p>
          <div class="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <code class="min-w-0 flex-1 truncate text-xs text-zinc-300">{{ MCP_URL }}</code>
            <button type="button" class="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#f28f84]" @click="copy(MCP_URL, 'chatgpt-url')">
              {{ copied === 'chatgpt-url' ? 'Copied' : 'Copy' }}
            </button>
          </div>
          <a
            :href="goUrl('chatgpt', 'add')"
            target="_blank"
            rel="noopener"
            class="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#f28f84] px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#20100c] transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            @click="watchForConnection"
          >Open ChatGPT Plugins</a>
        </li>
        <li class="flex flex-col rounded-2xl border border-white/[0.08] bg-black/20 p-6">
          <p class="font-mono text-xs font-bold text-[#f28f84]">03</p>
          <h2 class="mt-4 font-display text-xl font-semibold text-white">Start editing</h2>
          <p class="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
            Open a new chat, choose BitterClip, and paste the first request.
          </p>
          <div class="mt-5 flex flex-wrap gap-2">
            <a
              :href="goUrl('chatgpt', 'start')"
              target="_blank"
              rel="noopener"
              class="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-white/15 px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:border-[#f28f84] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]"
            >Open ChatGPT</a>
            <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-4 font-mono text-xs font-bold uppercase tracking-[0.12em] text-zinc-300 transition hover:border-[#f28f84]"
              @click="copy(STARTER_PROMPT, 'chatgpt-prompt')"
            >{{ copied === 'chatgpt-prompt' ? 'Copied' : 'Copy prompt' }}</button>
          </div>
        </li>
      </ol>

      <!-- Claude Code -->
      <ol
        v-show="tab === 'claude_code'"
        id="connect-panel-claude_code"
        role="tabpanel"
        aria-labelledby="connect-tab-claude_code"
        class="mt-6 grid gap-4 md:grid-cols-3"
      >
        <li class="flex flex-col rounded-2xl border border-white/[0.08] bg-black/20 p-6 md:col-span-2">
          <p class="font-mono text-xs font-bold text-[#f28f84]">01</p>
          <h2 class="mt-4 font-display text-xl font-semibold text-white">Install the plugin</h2>
          <p class="mt-2 text-sm leading-relaxed text-zinc-400">In your terminal. It adds the connection and BitterClip's editing skills.</p>
          <div class="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
            <code class="min-w-0 flex-1 whitespace-pre-line break-all text-xs leading-relaxed text-zinc-200">{{ CLAUDE_CODE_COMMAND }}</code>
            <button
              type="button"
              class="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#f28f84]"
              @click="copy(CLAUDE_CODE_COMMAND, 'claude-code-command'); watchForConnection()"
            >{{ copied === 'claude-code-command' ? 'Copied' : 'Copy' }}</button>
          </div>
        </li>
        <li class="flex flex-col rounded-2xl border border-white/[0.08] bg-black/20 p-6">
          <p class="font-mono text-xs font-bold text-[#f28f84]">02</p>
          <h2 class="mt-4 font-display text-xl font-semibold text-white">Sign in</h2>
          <p class="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
            In a new Claude Code session, run <code class="text-zinc-200">/mcp</code>, choose BitterClip, then Authenticate. Your browser opens BitterClip; click Allow.
          </p>
        </li>
        <li class="flex flex-col rounded-2xl border border-white/[0.08] bg-black/20 p-6 md:col-span-3">
          <h2 class="font-display text-lg font-semibold text-white">Or let Claude Code do it</h2>
          <p class="mt-2 text-sm leading-relaxed text-zinc-400">Send Claude Code this message. It installs BitterClip, asks you to sign in, and checks the connection.</p>
          <div class="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
            <code class="min-w-0 flex-1 text-xs leading-relaxed text-zinc-200">{{ AGENT_INSTALL_PROMPT }}</code>
            <button type="button" class="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#f28f84]" @click="copy(AGENT_INSTALL_PROMPT, 'claude-code-agent'); watchForConnection()">
              {{ copied === 'claude-code-agent' ? 'Copied' : 'Copy' }}
            </button>
          </div>
        </li>
      </ol>

      <!-- Codex -->
      <ol
        v-show="tab === 'codex'"
        id="connect-panel-codex"
        role="tabpanel"
        aria-labelledby="connect-tab-codex"
        class="mt-6 grid gap-4 md:grid-cols-3"
      >
        <li class="flex flex-col rounded-2xl border border-white/[0.08] bg-black/20 p-6">
          <p class="font-mono text-xs font-bold text-[#f28f84]">01</p>
          <h2 class="mt-4 font-display text-xl font-semibold text-white">Install in Codex</h2>
          <p class="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
            Opens Codex in the ChatGPT desktop app with an install request ready. Codex installs the BitterClip plugin and checks it.
          </p>
          <button
            type="button"
            class="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#f28f84] px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#20100c] transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            @click="openCodex(`/goal ${AGENT_INSTALL_PROMPT}`)"
          >Install in Codex</button>
          <p v-if="codexMissing" data-testid="codex-missing" class="mt-3 text-sm text-[#f0d68f]">
            Couldn't open Codex. Install the ChatGPT desktop app, or run the commands under step 2.
          </p>
        </li>
        <li class="flex flex-col rounded-2xl border border-white/[0.08] bg-black/20 p-6">
          <p class="font-mono text-xs font-bold text-[#f28f84]">02</p>
          <h2 class="mt-4 font-display text-xl font-semibold text-white">Sign in</h2>
          <p class="mt-2 text-sm leading-relaxed text-zinc-400">
            Codex opens your browser; sign in to BitterClip and click Allow. Prefer the terminal? This installs the plugin and signs in:
          </p>
          <div class="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
            <code class="min-w-0 flex-1 whitespace-pre-line break-all text-xs leading-relaxed text-zinc-200">{{ CODEX_COMMANDS }}</code>
            <button type="button" class="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#f28f84]" @click="copy(CODEX_COMMANDS, 'codex-commands'); watchForConnection()">
              {{ copied === 'codex-commands' ? 'Copied' : 'Copy' }}
            </button>
          </div>
        </li>
        <li class="flex flex-col rounded-2xl border border-white/[0.08] bg-black/20 p-6">
          <p class="font-mono text-xs font-bold text-[#f28f84]">03</p>
          <h2 class="mt-4 font-display text-xl font-semibold text-white">Start editing</h2>
          <p class="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
            Opens a new Codex task with a first request ready to send.
          </p>
          <button
            type="button"
            class="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:border-[#f28f84] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]"
            @click="openCodex(STARTER_PROMPT)"
          >Start in Codex</button>
        </li>
      </ol>

      <p class="mt-6 text-center text-sm text-zinc-500">
        <template v-if="signedIn">Signed in to BitterClip.</template>
        <template v-else>
          Already use BitterClip?
          <a :href="`${APP_ORIGIN}/sign_in`" class="text-[#f28f84] hover:underline">Sign in</a>
          to see what's connected.
        </template>
      </p>
    </section>

    <section aria-labelledby="connect-first-request" class="mx-auto mt-16 max-w-3xl px-6 sm:px-8">
      <h2 id="connect-first-request" class="font-display text-2xl font-bold tracking-[-0.03em] text-white sm:text-3xl">A first request to try</h2>
      <div class="mt-5 flex items-start gap-3 rounded-2xl border border-[#f28f84]/20 bg-[#f28f84]/[0.05] p-5">
        <p class="flex-1 leading-relaxed text-zinc-200">&ldquo;{{ STARTER_PROMPT }}&rdquo;</p>
        <button
          type="button"
          class="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#f28f84]"
          @click="copy(STARTER_PROMPT, 'starter-prompt')"
        >{{ copied === 'starter-prompt' ? 'Copied' : 'Copy' }}</button>
      </div>
      <p class="mt-4 text-sm leading-relaxed text-zinc-500">
        Then ask for the clip you want in your own words: &ldquo;cut the part where she explains pricing,&rdquo; &ldquo;find three moments worth posting.&rdquo;
      </p>
    </section>

    <section aria-labelledby="connect-faq" class="mx-auto mt-16 max-w-3xl px-6 sm:px-8">
      <h2 id="connect-faq" class="font-display text-2xl font-bold tracking-[-0.03em] text-white sm:text-3xl">Questions</h2>
      <div class="mt-6 divide-y divide-white/[0.08] border-y border-white/[0.08]">
        <details v-for="item in faqs" :key="item.question" class="group py-5">
          <summary class="flex cursor-pointer list-none items-center justify-between gap-6 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]">
            {{ item.question }}
            <span class="text-[#f28f84] transition group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <p class="mt-3 leading-relaxed text-zinc-400">{{ item.answer }}</p>
        </details>
      </div>
    </section>

    <section class="mx-auto mt-12 max-w-3xl px-6 pb-20 sm:px-8">
      <details class="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <summary class="cursor-pointer font-semibold text-white">Advanced setup</summary>
        <div class="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">
          <p>
            Server address for any MCP client: <code class="text-zinc-200">{{ MCP_URL }}</code>.
            It signs in with OAuth; never paste a token.
          </p>
          <p>
            The <a href="https://github.com/sheetgenius/bitterclip-plugin" class="text-[#f28f84] hover:underline">BitterClip plugin</a>
            adds editing skills in Claude Code and Codex. For the connection alone:
            <code class="text-zinc-200">claude mcp add --scope user --transport http bitterclip {{ MCP_URL }}</code> or
            <code class="text-zinc-200">codex mcp add bitterclip --url {{ MCP_URL }}</code>.
          </p>
          <p>
            Setting up with an AI agent: <a :href="INSTALL_DOC_URL" class="text-[#f28f84] hover:underline">installation instructions for agents</a>.
          </p>
          <p>
            Step-by-step guides with screenshots:
            <NuxtLink to="/docs/assistants/connect-claude" class="text-[#f28f84] hover:underline">Claude</NuxtLink> ·
            <NuxtLink to="/docs/assistants/connect-chatgpt" class="text-[#f28f84] hover:underline">ChatGPT</NuxtLink>
          </p>
        </div>
      </details>
    </section>
  </main>
</template>
