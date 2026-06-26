# Backend

This is a minimal Express backend that fetches commits from GitHub and summarizes them into release notes.

API
- POST `/api/generate-notes` body: `{ owner, repo, base, head, format, language }`

Environment
- Copy `.env.example` to `.env` and set `GITHUB_TOKEN` (recommended) to increase rate limits.
- For real AI summarization, set `AI_PROVIDER=deepseek` (or `openai`), `AI_BASE_URL`, `AI_MODEL`, and `AI_API_KEY`.

Notes
- The summarizer uses the OpenAI SDK with an OpenAI-compatible endpoint, so it works with DeepSeek and OpenAI.
