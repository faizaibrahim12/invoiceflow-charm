
-- Profiles table (company info)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  address TEXT,
  logo_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users delete own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- Invoice status enum
CREATE TYPE public.invoice_status AS ENUM ('paid', 'unpaid', 'pending');

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.invoice_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, invoice_number)
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users delete own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- Invoice items
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own invoice items" ON public.invoice_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.user_id = auth.uid()));
CREATE POLICY "users insert own invoice items" ON public.invoice_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.user_id = auth.uid()));
CREATE POLICY "users update own invoice items" ON public.invoice_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.user_id = auth.uid()));
CREATE POLICY "users delete own invoice items" ON public.invoice_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.user_id = auth.uid()));

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
CREATE POLICY "logos public read" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "users upload own logos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users update own logos" ON storage.objects FOR UPDATE
  USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users delete own logos" ON storage.objects FOR DELETE
  USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
