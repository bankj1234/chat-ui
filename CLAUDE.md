# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start development server (http://localhost:3000)
npm run build     # production build
npm run start     # start production server
npm run lint      # ESLint check
```

## Architecture

**Next.js 15 App Router** with TypeScript and Tailwind CSS.

### Data flow

1. User fills in LiteLLM credentials on `/config` → saved to `localStorage` via `src/lib/config.ts`
2. Chat page (`/`) reads config from `localStorage` and POSTs to `/api/chat`
3. `/api/chat` proxies the request to `{endpoint}/chat/completions` with Bearer auth, streams SSE back
4. Client reads SSE chunks and appends `delta.content` token-by-token to the assistant message

### Key files

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Chat UI — message history, streaming handler, send logic |
| `src/app/config/page.tsx` | Config form — saves model/apiKey/endpoint to localStorage |
| `src/app/api/chat/route.ts` | API route — proxies to LiteLLM, streams SSE response |
| `src/lib/config.ts` | localStorage helpers: `getConfig`, `saveConfig`, `clearConfig`, `isConfigured` |
| `src/lib/types.ts` | Shared types: `Message`, `ChatRequest` |
| `src/components/` | `Sidebar`, `ChatMessage`, `ChatInput`, `TypingIndicator` |

### LiteLLM integration

The API route calls `POST {LITELLM_END_POINT}/chat/completions` with `stream: true` using the OpenAI-compatible format. The response is piped directly to the browser as SSE. The client parses `data: {...}` lines and extracts `choices[0].delta.content`.

Config is stored client-side only (localStorage) — nothing is sent to any server except the LiteLLM endpoint itself.
