import { onBeforeUnmount, onMounted, ref } from 'vue'

// Signed-in status from app.bitterclip.com. bitterclip.com is the same site, so
// a credentialed fetch carries the app session. The page renders signed out and
// upgrades when this resolves; a failed check is a missing observation, never an
// error the visitor sees.

export type AssistantKey = 'claude' | 'chatgpt' | 'claude_code' | 'codex'
export type AssistantState = 'connected' | 'reconnect' | 'not_connected'
export interface AssistantStatus {
  state: AssistantState
  last_used_at?: string | null
}
export interface ViewerStatus {
  signed_in: boolean
  assistants?: Partial<Record<AssistantKey, AssistantStatus>>
}

const APP_ORIGIN = 'https://app.bitterclip.com'
const REQUEST_TIMEOUT_MS = 4000

// One status for the whole page: the site header and /connect read the same
// answer, and a page load asks the app once. Only the browser fetches, so the
// prerendered HTML always carries the signed-out rendering.
const status = ref<ViewerStatus | null>(null)
let firstCheck: Promise<void> | null = null

async function refresh() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(`${APP_ORIGIN}/viewer`, {
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    })
    if (response.ok) status.value = await response.json()
  } catch {
    // Network, CORS, or timeout: keep the signed-out rendering.
  } finally {
    clearTimeout(timeout)
  }
}

export function useViewer() {
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let pollDeadline = 0

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = null
  }

  // After an Add click, watch for the new connection: every 3 s for two
  // minutes while the page is visible, stopping as soon as `done` is true.
  function pollUntil(done: () => boolean, everyMs = 3000, forMs = 120_000) {
    stopPolling()
    pollDeadline = Date.now() + forMs
    pollTimer = setInterval(async () => {
      if (Date.now() > pollDeadline) return stopPolling()
      if (document.visibilityState !== 'visible') return
      await refresh()
      if (done()) stopPolling()
    }, everyMs)
  }

  onMounted(() => {
    firstCheck ??= refresh()
  })
  onBeforeUnmount(stopPolling)

  return { status, refresh, pollUntil, stopPolling }
}

export function relativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return null
  const seconds = Math.round((then - Date.now()) / 1000)
  const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86_400], ['hour', 3600], ['minute', 60],
  ]
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}
