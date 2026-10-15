# src/routes/api rules

- Ask AI chats are saved server-side only (`ask-ai.ts` onFinish → `support_chats`, admin-only RLS); the model files complaints via its `file_complaint` tool, so the browser never writes chat rows.
