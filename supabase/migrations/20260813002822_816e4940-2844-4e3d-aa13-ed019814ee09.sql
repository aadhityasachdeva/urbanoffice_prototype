-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an admin? SECURITY DEFINER avoids recursive RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Workspaces
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Desk Space','Meeting Room','Event Space')),
  location text NOT NULL,
  capacity integer NOT NULL DEFAULT 1,
  price_per_hour numeric NOT NULL DEFAULT 0,
  amenities text DEFAULT '',
  image_url text,
  description text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT SELECT ON public.workspaces TO anon;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view workspaces" ON public.workspaces FOR SELECT USING (true);
CREATE POLICY "Admins can insert workspaces" ON public.workspaces
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update workspaces" ON public.workspaces
  FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete workspaces" ON public.workspaces
  FOR DELETE TO authenticated USING (public.is_admin());

-- Bookings
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Everyone signed in can read bookings for conflict checking is handled by a
-- dedicated policy: own bookings, or any booking if admin.
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- Auto-create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Demo workspaces
INSERT INTO public.workspaces (name, category, location, capacity, price_per_hour, amenities, image_url, description) VALUES
('Pera Desk Hub','Desk Space','Jing''an, Shanghai',12,35,'Wi-Fi, Coffee, Charging Station','https://images.unsplash.com/photo-1497366216548-37526070297c?w=800','Bright open-plan hot desks with ergonomic chairs and all-day coffee.'),
('Kebabs on the Grille - Co-work Corner','Desk Space','Xuhui, Shanghai',8,28,'Wi-Fi, Tea, Charging Station','https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800','A relaxed cafe-style corner for focused solo work.'),
('Cotton''s Desk Space','Desk Space','Former French Concession, Shanghai',10,32,'Wi-Fi, Coffee, Garden Terrace','https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800','Quiet garden-side desks in a heritage villa.'),
('1001 Nights Meeting Room','Meeting Room','Pudong, Shanghai',10,85,'Wi-Fi, Projector, Coffee, Whiteboard','https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800','Private meeting room with a large screen and city views.'),
('El Bodegon Private Room','Meeting Room','Hongkou, Shanghai',6,70,'Wi-Fi, Projector, Tea, Charging Station','https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800','Warm private room ideal for client meetings and interviews.'),
('Pot Stills Meeting Room','Meeting Room','Changning, Shanghai',14,95,'Wi-Fi, Projector, Coffee, Video Conferencing','https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800','Boardroom-style space with full video conferencing kit.'),
('UP Shanghai Event Hall','Event Space','Pudong, Shanghai',120,240,'Wi-Fi, Projector, Stage, Catering, Sound System','https://images.unsplash.com/photo-1511578314322-379afb476865?w=800','Large hall for launches, panels and company all-hands.'),
('The Beach House Event Space','Event Space','Lingang, Shanghai',80,180,'Wi-Fi, Projector, Sound System, Coffee, Outdoor Deck','https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800','Seaside venue with an outdoor deck for receptions and workshops.');