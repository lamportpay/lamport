# src/routes/api rules

- Ask AI uses no AI model (zero credits): answers are built-in FAQs (`src/lib/ask-ai-faq.ts`) run in the browser; `ask-ai.ts` only saves chats to `support_chats` (admin-only RLS) and flags complaints by keyword.
