# src/routes/api rules

- Ask AI uses no AI model (zero credits): answers are built-in FAQs (`src/lib/ask-ai-faq.ts`) run in the browser; `ask-ai.ts` only saves chats to `support_chats` (admin-only RLS) and flags complaints by keyword.
- `support/updates.ts` (19 Nov 2026) returns only the answers the admin published for the chat session IDs a browser kept; the chat shows them as updates. Signed-in customers also see their requests at `/requests`.
