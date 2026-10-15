CREATE TABLE public.early_access_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
  mobile text NOT NULL CHECK (char_length(mobile) BETWEEN 6 AND 25),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX early_access_signups_email_key ON public.early_access_signups (lower(email));
GRANT SELECT ON public.early_access_signups TO authenticated;
GRANT ALL ON public.early_access_signups TO service_role;
ALTER TABLE public.early_access_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read early access signups" ON public.early_access_signups
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));