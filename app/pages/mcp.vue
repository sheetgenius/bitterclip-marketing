<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const activeTab = ref<'methods' | 'tools' | 'bridge' | 'setup'>('methods')
const signupUrl = 'https://app.bitterclip.com/sign_up'

useHead({
  title: 'BitterClip - MCP and AI assistant workflow',
  meta: [
    {
      name: 'description',
      content: 'How ChatGPT, Claude, and other MCP hosts can open the BitterClip transcript editor, call tools, verify Moments, and export clips.',
    },
    { property: 'og:title', content: 'BitterClip - MCP and AI assistant workflow' },
    {
      property: 'og:description',
      content: 'How ChatGPT, Claude, and other MCP hosts can open the BitterClip transcript editor, call tools, verify Moments, and export clips.',
    },
    { property: 'og:url', content: 'https://bitterclip.com/mcp' },
    { name: 'twitter:title', content: 'BitterClip - MCP and AI assistant workflow' },
    {
      name: 'twitter:description',
      content: 'How ChatGPT, Claude, and other MCP hosts can open the BitterClip transcript editor, call tools, verify Moments, and export clips.',
    },
  ],
  link: [
    { rel: 'canonical', href: 'https://bitterclip.com/mcp' },
    { rel: 'alternate', type: 'text/markdown', href: 'https://bitterclip.com/mcp.md', title: 'BitterClip MCP Markdown' },
  ],
})

const selectTab = (tab: 'methods' | 'tools' | 'bridge' | 'setup') => {
  activeTab.value = tab
}

// The live embed points at the real app's bare editor.
// Override with ?embed=<url> for local testing against a dev server, e.g.
// /mcp?embed=http://localhost:3000/embed/clip-demo?bare=1 (read on the client
// so it works on the statically-generated page too).
const embedUrl = ref('https://app.bitterclip.com/embed/clip-demo?bare=1')

// States for the live embed
const iframeHeight = ref(540)
const isIframeLoading = ref(true)
const demoActivated = ref(true)

const onIframeLoad = () => {
  isIframeLoading.value = false
}

const activateDemo = () => {
  demoActivated.value = true
}

const handleMessage = (event: MessageEvent) => {
  // Handle auto-resizing postMessage messages sent by the embed
  if (event.data && typeof event.data === 'object' && 'height' in event.data) {
    const height = Number(event.data.height)
    if (!isNaN(height) && height > 200 && height < 1500) {
      iframeHeight.value = height
    }
  }
}

onMounted(() => {
  // Build the embed URL: base (overridable via ?embed= for local dev) + the
  // bare editor + a real demo clip the site hosts, so Export plays + downloads it.
  const base = (new URLSearchParams(window.location.search).get('embed') || 'https://app.bitterclip.com/embed/clip-demo').split('?')[0]
  const clip = `${window.location.origin}/clips/day-1-opening.mp4`
  embedUrl.value = `${base}?bare=1&clip=${encodeURIComponent(clip)}`
  
  // Mobile load gate: on small viewports, deactivate by default to preserve bandwidth
  if (window.innerWidth < 768) {
    demoActivated.value = false
  }

  window.addEventListener('message', handleMessage)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 pt-12 pb-24 relative animate-fade-in">
    
    <!-- Top Glowing Gradient Accent -->
    <div class="absolute top-0 right-1/4 -z-10 w-[400px] h-[400px] rounded-full bg-[#f28f84]/5 blur-[100px] pointer-events-none" />

    <!-- Title Block -->
    <div class="mb-16 border-b border-zinc-900 pb-10">
      <p class="font-mono text-xs uppercase tracking-widest text-[#f28f84] mb-3">Model Context Protocol</p>
      <h2 class="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6">
        How ChatGPT and Claude open the editor.
      </h2>
      <div class="max-w-3xl space-y-5">
        <p class="text-zinc-400 text-sm sm:text-base leading-relaxed font-sans">
          Ask your assistant to find a moment. BitterClip pulls up the transcript, opens the editor in the conversation, renders the MP4, and keeps the timing tied to the audio.
        </p>
        <p class="text-zinc-400 text-sm sm:text-base leading-relaxed font-sans">
          The assistant picks words. BitterClip handles the cut, captions, export, and final approval without guessed timestamps.
        </p>
        <a
          :href="signupUrl"
          class="inline-flex items-center justify-center gap-2 bg-[#f28f84] text-zinc-950 font-mono text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#ffa89e] transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Start with one recording
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </a>
      </div>
    </div>

    <!-- LIVE: the real editor, embedded as just another host -->
    <section class="mb-20">
      <p class="font-mono text-[11px] uppercase tracking-widest text-[#f28f84] mb-3 flex items-center gap-2 font-bold">
        <span class="w-1.5 h-1.5 rounded-full bg-[#f28f84] animate-pulse"></span> Live · running below
      </p>
      <h3 class="font-display text-2xl sm:text-3xl font-bold text-white mb-4 tracking-tight">
        This is the editor ChatGPT and Claude open.
      </h3>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl font-sans mb-5">
        The transcript editor below is the <span class="text-zinc-100 font-semibold">exact</span> BitterClip
        editor that opens inside ChatGPT and Claude. It is mounted here so you can try the same review surface:
        drag across the words to cut a clip; press play and watch the cursor land on the word.
      </p>
      <p class="font-display text-xl sm:text-2xl font-bold text-white mb-7 tracking-tight">
        One editor. Wherever you are already working.
      </p>

      <div class="glass-panel-accented glass-reflection rounded-2xl overflow-hidden corner-ticks relative min-h-[300px]">
        <div class="flex items-center justify-between px-4 py-2.5 bg-zinc-950 font-mono text-[10px] text-zinc-500 border-b border-zinc-900/60 relative z-10">
          <span class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-[#f28f84] animate-pulse"></span>
            Live editor · demo mode
          </span>
          <span class="text-[#f28f84] font-mono text-[9px] font-bold tracking-wider uppercase">try it</span>
        </div>

        <!-- Mobile Activation Gate -->
        <div v-if="!demoActivated" class="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center z-20">
          <p class="font-mono text-[8px] text-[#f28f84] uppercase tracking-widest mb-3">Live editor</p>
          <h4 class="font-display text-base font-bold text-white mb-2">Same editor. Same chat surface.</h4>
          <p class="text-zinc-500 text-xs max-w-sm mb-6 leading-relaxed">
            This is the editor ChatGPT and Claude open for review. Drag across the words to cut a clip. Tap to load it.
          </p>
          <button 
            @click="activateDemo"
            class="px-5 py-2.5 font-mono text-xs font-bold bg-[#f28f84] text-zinc-950 rounded-xl shadow-lg shadow-[#f28f84]/10 hover:bg-[#ffa89e] hover:scale-102 active:scale-98 transition duration-200 cursor-pointer min-h-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Load the editor
          </button>
        </div>

        <!-- Skeleton loader -->
        <div v-if="demoActivated && isIframeLoading" class="absolute inset-0 bg-[#060608]/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 pointer-events-none transition-opacity duration-300">
          <div class="flex flex-col items-center gap-4 text-center p-6">
            <!-- Glowing Spinner -->
            <div class="relative w-8 h-8">
              <div class="absolute inset-0 rounded-full border-2 border-[#f28f84]/20"></div>
              <div class="absolute inset-0 rounded-full border-2 border-t-[#f28f84] animate-spin"></div>
            </div>
            <span class="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Loading the editor…</span>
          </div>
        </div>

        <iframe
          v-if="demoActivated"
          :src="embedUrl"
          title="BitterClip — the live transcript editor"
          loading="lazy"
          @load="onIframeLoad"
          @mouseenter="$event.target.contentWindow?.focus()"
          class="w-full block transition-[height] duration-200"
          :style="{ height: `${iframeHeight}px`, border: 0, background: 'transparent' }"
        />
      </div>
      <p class="text-zinc-600 text-[11px] font-mono mt-3">
        Fixtures only — every edit is stubbed, no backend, no account, no render cost. Point the same component at a live backend and it does the real work.
      </p>
    </section>

    <!-- Interactive Tabs Header -->
    <div class="flex items-center gap-2.5 overflow-x-auto pb-4 mb-8 custom-scrollbar border-b border-zinc-900/60">
      <button 
        v-for="tab in [
          { id: 'methods', label: 'Endpoint & methods' },
          { id: 'tools', label: 'Tools' },
          { id: 'bridge', label: 'The bridge' },
          { id: 'setup', label: 'Connect it' }
        ]"
        :key="tab.id"
        @click="selectTab(tab.id as any)"
        :class="[
          'px-4 py-2 font-mono text-[11px] font-semibold whitespace-nowrap border rounded-lg transition-all duration-200 focus-visible:outline-none flex items-center gap-2 cursor-pointer',
          activeTab === tab.id 
            ? 'border-[#f28f84]/50 bg-[#f28f84]/10 text-[#f28f84] shadow-[0_0_12px_rgba(242,143,132,0.15)]'
            : 'border-zinc-800/80 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900/30'
        ]"
      >
        <span class="w-1.5 h-1.5 rounded-full transition-colors duration-200 shrink-0" :class="activeTab === tab.id ? 'bg-[#f28f84] animate-pulse' : 'bg-zinc-800'"></span>
        {{ tab.label }}
      </button>
    </div>

    <!-- TAB 1: METHODS -->
    <div v-if="activeTab === 'methods'" class="space-y-8 animate-fade-in">
      <div class="max-w-3xl">
        <h3 class="font-display text-xl font-bold text-white mb-4">
          The MCP Endpoint (<code class="text-[#f28f84] text-base">POST /mcp</code>)
        </h3>
        <p class="text-zinc-400 text-sm leading-relaxed mb-6 font-sans">
          The BitterClip backend speaks JSON-RPC 2.0 over HTTP — CORS, origin checks, and bearer-token auth. Tool calls route to your workspace.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <!-- Schema description -->
        <div class="space-y-4 font-sans text-sm text-zinc-400">
          <div class="glass-panel-accented glass-reflection p-4 rounded-xl">
            <h4 class="font-mono text-xs font-bold text-white mb-2 uppercase tracking-wider">Protocol Version</h4>
            <p class="text-xs">MCP over JSON-RPC 2.0, plus the <strong>MCP Apps</strong> UI extension (stable spec <code>2026-01-26</code>) that mounts interactive widgets inside the chat.</p>
          </div>
          <div class="glass-panel-accented glass-reflection p-4 rounded-xl">
            <h4 class="font-mono text-xs font-bold text-white mb-2 uppercase tracking-wider">Supported Methods</h4>
            <ul class="list-disc list-inside space-y-1 text-xs">
              <li><code>initialize</code> &mdash; Handshake and exchange capabilities</li>
              <li><code>ping</code> &mdash; Connection heartbeat verification</li>
              <li><code>tools/list</code> &mdash; Expose available editor capabilities</li>
              <li><code>tools/call</code> &mdash; run a tool — find moments, create or export a clip</li>
              <li><code>resources/list</code> &mdash; Ingested audio/video resources</li>
              <li><code>resources/read</code> &mdash; read a recording's transcript and clips</li>
            </ul>
          </div>
        </div>

        <!-- Sample RPC Console -->
        <div class="glass-panel-accented glass-reflection rounded-2xl overflow-hidden">
          <div class="flex items-center justify-between px-4 py-2.5 bg-zinc-950 font-mono text-[10px] text-zinc-500 border-b border-zinc-900/60">
            <span>JSON-RPC Request</span>
            <span class="text-[#f28f84] font-bold">tools/list</span>
          </div>
          <pre class="p-5 font-mono text-[11px] text-zinc-400 bg-zinc-950/20 overflow-x-auto custom-scrollbar"><code>{
  <span class="text-[#f28f84]">"jsonrpc"</span>: <span class="text-emerald-400">"2.0"</span>,
  <span class="text-[#f28f84]">"method"</span>: <span class="text-emerald-400">"tools/list"</span>,
  <span class="text-[#f28f84]">"params"</span>: {},
  <span class="text-[#f28f84]">"id"</span>: <span class="text-[#f28f84]">1</span>
}</code></pre>
        </div>
      </div>
    </div>

    <!-- TAB 2: TOOLS CATALOG -->
    <div v-if="activeTab === 'tools'" class="space-y-8 animate-fade-in">
      <div class="max-w-3xl">
        <h3 class="font-display text-xl font-bold text-white mb-4">
          The tools your AI can call
        </h3>
        <p class="text-zinc-400 text-sm leading-relaxed mb-6 font-sans">
          BitterClip exposes a small, named set of tools. They give your AI control over recordings, clips, and exports — picking the words, never inventing the timing.
        </p>
      </div>

      <div class="glass-panel-accented glass-reflection overflow-x-auto rounded-2xl custom-scrollbar corner-ticks">
        <table class="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr class="bg-zinc-900/60 border-b border-zinc-800/80 text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
              <th class="p-4 border-r border-zinc-900/60">ID</th>
              <th class="p-4 border-r border-zinc-900/60">Tool Name</th>
              <th class="p-4 border-r border-zinc-900/60">Purpose / Action</th>
              <th class="p-4">Inputs / Arguments</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-900 text-zinc-400">
            <tr class="hover:bg-zinc-900/20 transition-colors">
              <td class="p-4 border-r border-zinc-900/60 text-zinc-600 font-bold">[01]</td>
              <td class="p-4 border-r border-zinc-900/60 font-semibold text-[#f28f84]">recordings_list</td>
              <td class="p-4 border-r border-zinc-900/60 font-sans text-xs">Retrieve ingested recordings list for selection.</td>
              <td class="p-4 text-[10px] text-zinc-500 font-medium">{}</td>
            </tr>
            <tr class="hover:bg-zinc-900/20 transition-colors">
              <td class="p-4 border-r border-zinc-900/60 text-zinc-600 font-bold">[02]</td>
              <td class="p-4 border-r border-zinc-900/60 font-semibold text-[#f28f84]">clips_suggest</td>
              <td class="p-4 border-r border-zinc-900/60 font-sans text-xs">Reads the transcript and proposes moments worth clipping for a given goal.</td>
              <td class="p-4 text-[10px] text-zinc-500 font-medium">{ recording_id, goal }</td>
            </tr>
            <tr class="hover:bg-zinc-900/20 transition-colors">
              <td class="p-4 border-r border-zinc-900/60 text-zinc-600 font-bold">[03]</td>
              <td class="p-4 border-r border-zinc-900/60 font-semibold text-[#f28f84]">clips_render_candidate_editor</td>
              <td class="p-4 border-r border-zinc-900/60 font-sans text-xs">Mounts the interactive <code>ui://bitterclip/candidate-editor-v4</code> widget in the chat.</td>
              <td class="p-4 text-[10px] text-zinc-500 font-medium">{ recording_id, candidates }</td>
            </tr>
            <tr class="hover:bg-zinc-900/20 transition-colors">
              <td class="p-4 border-r border-zinc-900/60 text-zinc-600 font-bold">[04]</td>
              <td class="p-4 border-r border-zinc-900/60 font-semibold text-[#f28f84]">clips_create</td>
              <td class="p-4 border-r border-zinc-900/60 font-sans text-xs">Commits a chosen moment as a durable clip. Timing is derived from the audio — never invented by the model.</td>
              <td class="p-4 text-[10px] text-zinc-500 font-medium">{ recording_id, start/end (derived from the words picked), title }</td>
            </tr>
            <tr class="hover:bg-zinc-900/20 transition-colors">
              <td class="p-4 border-r border-zinc-900/60 text-zinc-600 font-bold">[05]</td>
              <td class="p-4 border-r border-zinc-900/60 font-semibold text-[#f28f84]">clips_export</td>
              <td class="p-4 border-r border-zinc-900/60 font-sans text-xs">Triggers background render queue to export captioned MP4 media asset.</td>
              <td class="p-4 text-[10px] text-zinc-500 font-medium">{ clip_id }</td>
            </tr>
            <tr class="hover:bg-zinc-900/20 transition-colors">
              <td class="p-4 border-r border-zinc-900/60 text-zinc-600 font-bold">[06]</td>
              <td class="p-4 border-r border-zinc-900/60 font-semibold text-[#f28f84]">clips_compose</td>
              <td class="p-4 border-r border-zinc-900/60 font-sans text-xs">Stitch spans from one or more recordings into a single clip, then render.</td>
              <td class="p-4 text-[10px] text-zinc-500 font-medium">{ segments[] }</td>
            </tr>
            <tr class="hover:bg-zinc-900/20 transition-colors">
              <td class="p-4 border-r border-zinc-900/60 text-zinc-600 font-bold">[07]</td>
              <td class="p-4 border-r border-zinc-900/60 font-semibold text-[#f28f84]">account_get_credit_balance</td>
              <td class="p-4 border-r border-zinc-900/60 font-sans text-xs">Check plan credit counts and subscription limits.</td>
              <td class="p-4 text-[10px] text-zinc-500 font-medium">{}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 3: LIFECYCLE BRIDGE -->
    <div v-if="activeTab === 'bridge'" class="space-y-8 animate-fade-in">
      <div class="max-w-3xl">
        <h3 class="font-display text-xl font-bold text-white mb-4">
          How the editor talks to its host
        </h3>
        <p class="text-zinc-400 text-sm leading-relaxed mb-6 font-sans">
          BitterClip renders rich custom elements (Lit-based composites) inside sandboxed iframes (e.g. Claude's MCP Apps containers). The widget establishes communication with the host via a standardized API contract, named <code>hostActions</code>.
        </p>
        <p class="text-zinc-400 text-sm leading-relaxed mb-6 font-sans max-w-3xl">
          The same editor can run in the web app, in ChatGPT and Claude, and in the read-only demo above. The bridge changes by host; the editing surface stays familiar.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        <!-- Details & Steps -->
        <div class="space-y-6">
          <div class="glass-panel-accented glass-reflection p-6 rounded-2xl">
            <h4 class="font-display font-semibold text-white text-sm mb-3">One contract</h4>
            <p class="text-zinc-400 text-xs leading-relaxed font-sans">
              Every component speaks only <code>hostActions</code> — never <code>window.openai</code>, raw <code>postMessage</code>, or <code>fetch</code>. Swap the bridge, not the component.
            </p>
          </div>

          <div class="glass-panel-accented glass-reflection p-6 rounded-2xl">
            <h4 class="font-display font-semibold text-white text-sm mb-3">The Canonical Event Chain</h4>
            <ol class="list-decimal list-inside space-y-2.5 text-zinc-400 text-xs font-sans">
              <li><strong>State change</strong> — the component updates its own view first.</li>
              <li><strong>Event</strong> — it announces what happened (e.g. <code>bitterclip.project_focused</code>).</li>
              <li><strong>Tell the model</strong> — <code>hostActions.updateModelContext</code> keeps the AI in the loop.</li>
              <li><strong>Call the tool</strong> — <code>hostActions.callTool</code> does the real work on the backend.</li>
              <li><strong>Or just say it</strong> — <code>hostActions.sendMessage</code> starts a new turn when that's simpler.</li>
            </ol>
          </div>
        </div>

        <!-- hostActions Contract Interface Code -->
        <div class="glass-panel-accented glass-reflection rounded-2xl overflow-hidden">
          <div class="flex items-center justify-between px-4 py-2.5 bg-zinc-950 font-mono text-[10px] text-zinc-500 border-b border-zinc-900/60">
            <span>app/javascript/host_actions/contract.js</span>
            <span class="text-[#f28f84] font-bold">API CONTRACT</span>
          </div>
          <pre class="p-5 font-mono text-[10px] sm:text-xs leading-relaxed text-zinc-400 bg-zinc-950/20 overflow-x-auto custom-scrollbar"><code><span class="text-zinc-500">// The one vocabulary every component is allowed to speak.</span>
<span class="text-zinc-500">// Never window.openai, postMessage, or fetch directly.</span>
export const HOST_ACTION_METHODS = [
  <span class="text-zinc-500">// Lifecycle</span>
  'connect', 'notifyReady', 'notifySizeChanged', 'onTeardown',
  <span class="text-zinc-500">// Host context</span>
  'getHostContext', 'onHostContextChanged', 'getCapabilities',
  <span class="text-zinc-500">// BitterClip domain actions</span>
  'createClip', 'updateMomentLabel', 'adjustMomentRange',
  'exportMp4', 'focusProject', 'focusRecording',
  <span class="text-zinc-500">// Generic MCP / app bridge</span>
  'callTool', 'openExternal', 'downloadFile',
  'requestDisplayMode', 'sendMessage', 'updateModelContext',
  <span class="text-zinc-500">// Tool data events (chat-host originated)</span>
  'onToolInput', 'onToolResult', 'onToolCancelled',
  <span class="text-zinc-500">// Telemetry</span>
  'log', 'notifyError',
]</code></pre>
        </div>

      </div>
    </div>

    <!-- TAB 4: SETUP GUIDE -->
    <div v-if="activeTab === 'setup'" class="space-y-8 animate-fade-in">
      <div class="max-w-3xl">
        <h3 class="font-display text-xl font-bold text-white mb-4">
          Connecting BitterClip
        </h3>
        <p class="text-zinc-400 text-sm leading-relaxed mb-6 font-sans">
          BitterClip connects as a remote MCP server — a hosted endpoint with sign-in. No local setup, no config files, no processes to run.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <!-- Claude -->
        <div class="glass-panel-accented glass-reflection p-6 rounded-2xl space-y-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2.5 h-2.5 rounded-full bg-orange-400/80"></span>
            <h4 class="font-display font-semibold text-white text-sm">Claude</h4>
          </div>
          <p class="text-zinc-400 text-sm font-sans leading-relaxed">
            Add BitterClip as a Connector and sign in. The tools — and the live editor — appear right in the conversation.
          </p>
        </div>

        <!-- ChatGPT -->
        <div class="glass-panel-accented glass-reflection p-6 rounded-2xl space-y-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            <h4 class="font-display font-semibold text-white text-sm">ChatGPT</h4>
          </div>
          <p class="text-zinc-400 text-sm font-sans leading-relaxed">
            Enable the BitterClip app. Same tools, same editor — it's an MCP App, so it works the same way.
          </p>
        </div>

      </div>

      <p class="text-zinc-500 text-sm font-sans mt-3">
        Launch access is $99/month. Create an account, then checkout unlocks uploads, renders, publishing, and connector use.
      </p>
    </div>

  </div>
</template>
