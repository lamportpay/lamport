-- Complaints to Stables and back (owner request 19 Nov 2026). Stables has no support-ticket API
-- (docs.stables.money: support is team@stables.money, formal complaints compliance@stables.money),
-- so the admin tracks each escalation here: the message sent to Stables, Stables' reply as pasted
-- by the admin, and the answer the admin publishes to the customer, who then sees it in the app.
-- Additive only; existing rows and older code are unaffected. Admin-only RLS stays as it is:
-- customers read their own published answers through server functions, never directly.

alter table public.support_chats
  add column if not exists payment_id uuid references public.payments(id) on delete set null,
  add column if not exists stables_status text
    check (stables_status in ('waiting_for_stables', 'stables_answered')),
  add column if not exists stables_message text check (length(stables_message) <= 5000),
  add column if not exists stables_reference text check (length(stables_reference) <= 200),
  add column if not exists stables_sent_at timestamptz,
  add column if not exists stables_reply text check (length(stables_reply) <= 10000),
  add column if not exists stables_replied_at timestamptz,
  add column if not exists customer_answer text check (length(customer_answer) <= 5000),
  add column if not exists customer_answer_published_at timestamptz;

-- "My requests": a signed-in customer's own complaints.
create index if not exists support_chats_user_idx on public.support_chats (user_id, created_at desc)
  where user_id is not null;
