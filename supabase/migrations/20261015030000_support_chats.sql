CREATE TABLE public.support_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  user_id uuid,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  message_count integer NOT NULL DEFAULT 0,
  last_question text,
  is_complaint boolean NOT NULL DEFAULT false,
  complaint_summary text,
  complaint_category text,
  contact_email text,
  status text NOT NULL DEFAULT 'open',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.support_chats TO authenticated;
GRANT ALL ON public.support_chats TO service_role;
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read support chats" ON public.support_chats
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update support chats" ON public.support_chats
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX support_chats_updated_idx ON public.support_chats (updated_at DESC);