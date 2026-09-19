import { Liveblocks } from "@liveblocks/node"

const CURSOR_COLORS = [
  "#00c8d4",
  "#6457f9",
  "#52A8FF",
  "#BF7AF0",
  "#FF990A",
  "#FF6166",
  "#F75F8F",
  "#62C073",
  "#0AC7B4",
  "#fbbf24",
] as const

function createLiveblocksClient() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set")
  }

  return new Liveblocks({ secret })
}

const globalForLiveblocks = globalThis as typeof globalThis & {
  liveblocks?: Liveblocks
}

/** Cached Liveblocks node client (process-lifetime singleton). */
export function getLiveblocksClient(): Liveblocks {
  if (!globalForLiveblocks.liveblocks) {
    globalForLiveblocks.liveblocks = createLiveblocksClient()
  }

  return globalForLiveblocks.liveblocks
}

/**
 * Map a user ID to a stable cursor color from a fixed palette.
 */
export function getCursorColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }

  return CURSOR_COLORS[hash % CURSOR_COLORS.length]!
}
