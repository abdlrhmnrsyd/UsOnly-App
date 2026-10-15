-- ====================================================================
-- OUR SPACE (Ruang Kita) - Complete Production Database Schema & RLS
-- Tailored for Abdul Rahman Rasyid (Asit) & Anisya (Nisya)
-- ====================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- TABLE DEFINITIONS
-- ====================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar_path TEXT,
  avatar_url TEXT,
  bio TEXT DEFAULT 'Menyayangimu setiap hari ❤️',
  theme_preference TEXT DEFAULT 'dark',
  status_text TEXT DEFAULT 'Online',
  battery_level INT,
  space_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Couple Spaces Table (Exclusively for 2 partners)
CREATE TABLE IF NOT EXISTS public.couple_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Ruang Kita',
  relationship_start_date DATE DEFAULT '2023-08-14',
  cover_photo_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign key linking profiles to couple_spaces
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS fk_profiles_space;
ALTER TABLE public.profiles 
  ADD CONSTRAINT fk_profiles_space 
  FOREIGN KEY (space_id) REFERENCES public.couple_spaces(id) ON DELETE SET NULL;

-- 3. Couple Members Table (Strictly max 2 members per space)
CREATE TABLE IF NOT EXISTS public.couple_members (
  couple_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (couple_id, user_id)
);

-- Database-safe enforcement: trigger preventing 3rd member from joining
CREATE OR REPLACE FUNCTION public.check_couple_max_two_members()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.couple_members WHERE couple_id = NEW.couple_id) >= 2 THEN
    RAISE EXCEPTION 'Ruang pasangan sudah lengkap berdua (maksimal 2 anggota). Akses ditolak!';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_couple_max_two_members ON public.couple_members;
CREATE TRIGGER trg_enforce_couple_max_two_members
BEFORE INSERT ON public.couple_members
FOR EACH ROW EXECUTE FUNCTION public.check_couple_max_two_members();

-- 4. Single-Use Invitations Table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'poke', 'system', 'location')),
  content TEXT,
  storage_path TEXT,
  media_url TEXT,
  reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  reaction TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Message Receipts
CREATE TABLE IF NOT EXISTS public.message_receipts (
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

-- 7. Memories & Scrapbook
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  story TEXT,
  memory_date DATE NOT NULL,
  category TEXT DEFAULT 'sweet_moment' CHECK (category IN ('first_date', 'trip', 'sweet_moment', 'anniversary', 'culinary', 'milestone')),
  location_name TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Mutual Locations Table (Validated lat/lng ranges)
CREATE TABLE IF NOT EXISTS public.locations (
  couple_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
  accuracy_meters DOUBLE PRECISION,
  address_label TEXT,
  status_note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (couple_id, user_id)
);

-- 9. Location Sharing Consent Table (Independently controllable & revocable)
CREATE TABLE IF NOT EXISTS public.location_sharing (
  couple_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (couple_id, user_id)
);

-- 10. User Presence Table
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, message_id)
);

-- 12. Special Dates & Milestones
CREATE TABLE IF NOT EXISTS public.special_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  is_recurring_yearly BOOLEAN DEFAULT true,
  icon TEXT DEFAULT 'heart',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_couple_members_user ON public.couple_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_couple_created ON public.messages(couple_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.invitations(code_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON public.invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_locations_couple ON public.locations(couple_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_space_date ON public.memories(space_id, memory_date DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_dates ENABLE ROW LEVEL SECURITY;

-- Helper security function: Check couple membership
CREATE OR REPLACE FUNCTION public.is_couple_member(target_couple_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.couple_members 
    WHERE couple_id = target_couple_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: Own profile or partner in the same couple
CREATE POLICY "View own profile or couple partner"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.couple_members cm1
      JOIN public.couple_members cm2 ON cm1.couple_id = cm2.couple_id
      WHERE cm1.user_id = auth.uid() AND cm2.user_id = profiles.id
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Couple Spaces: Viewable and updatable only by members
CREATE POLICY "View couple space if member"
  ON public.couple_spaces FOR SELECT
  USING (public.is_couple_member(id) OR created_by = auth.uid());

CREATE POLICY "Members can update couple space"
  ON public.couple_spaces FOR UPDATE
  USING (public.is_couple_member(id));

CREATE POLICY "Authenticated users can create space"
  ON public.couple_spaces FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Couple Members
CREATE POLICY "View members of own couple"
  ON public.couple_members FOR SELECT
  USING (public.is_couple_member(couple_id));
  
CREATE POLICY "Insert couple member via invitation verification"
  ON public.couple_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Invitations: Creator can view, others can lookup active unexpired code
CREATE POLICY "View invitations if creator or active lookup"
  ON public.invitations FOR SELECT
  USING (created_by = auth.uid() OR (used_at IS NULL AND expires_at > now()));

CREATE POLICY "Insert invitation if creator and member"
  ON public.invitations FOR INSERT
  WITH CHECK (created_by = auth.uid() AND public.is_couple_member(couple_id));

-- Messages: Strictly isolated to couple space
CREATE POLICY "View messages in own couple"
  ON public.messages FOR SELECT
  USING (public.is_couple_member(couple_id));

CREATE POLICY "Send message as self in own couple"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND public.is_couple_member(couple_id));

CREATE POLICY "Edit own message in couple"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid() AND public.is_couple_member(couple_id));

CREATE POLICY "Delete own message in couple"
  ON public.messages FOR DELETE
  USING (sender_id = auth.uid() AND public.is_couple_member(couple_id));

-- Message Receipts
CREATE POLICY "View message receipts in own couple"
  ON public.message_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_receipts.message_id AND public.is_couple_member(m.couple_id)
    )
  );

CREATE POLICY "Insert or update own receipt"
  ON public.message_receipts FOR ALL
  USING (user_id = auth.uid());

-- Memories
CREATE POLICY "View memories in own couple"
  ON public.memories FOR SELECT
  USING (public.is_couple_member(space_id));

CREATE POLICY "Insert memories in own couple"
  ON public.memories FOR INSERT
  WITH CHECK (created_by = auth.uid() AND public.is_couple_member(space_id));

CREATE POLICY "Update memories in own couple"
  ON public.memories FOR UPDATE
  USING (public.is_couple_member(space_id));

CREATE POLICY "Delete own memories in own couple"
  ON public.memories FOR DELETE
  USING (created_by = auth.uid() AND public.is_couple_member(space_id));

-- Location Sharing & Consent:
-- User can view partner's location ONLY IF partner has active location_sharing enabled!
CREATE POLICY "View location if owner or if partner sharing enabled"
  ON public.locations FOR SELECT
  USING (
    user_id = auth.uid() OR 
    (
      public.is_couple_member(couple_id) AND
      EXISTS (
        SELECT 1 FROM public.location_sharing ls
        WHERE ls.couple_id = locations.couple_id 
          AND ls.user_id = locations.user_id 
          AND ls.enabled = true
          AND (ls.expires_at IS NULL OR ls.expires_at > now())
      )
    )
  );

CREATE POLICY "Users can update own location"
  ON public.locations FOR ALL
  USING (user_id = auth.uid());

-- Location Sharing settings
CREATE POLICY "View location sharing settings in own couple"
  ON public.location_sharing FOR SELECT
  USING (public.is_couple_member(couple_id));

CREATE POLICY "Update own location sharing consent"
  ON public.location_sharing FOR ALL
  USING (user_id = auth.uid());

-- User Presence
CREATE POLICY "View presence of self or partner"
  ON public.user_presence FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.couple_members cm1
      JOIN public.couple_members cm2 ON cm1.couple_id = cm2.couple_id
      WHERE cm1.user_id = auth.uid() AND cm2.user_id = user_presence.user_id
    )
  );

CREATE POLICY "Update own presence"
  ON public.user_presence FOR ALL
  USING (user_id = auth.uid());

-- Special Dates
CREATE POLICY "View special dates in own space"
  ON public.special_dates FOR SELECT
  USING (public.is_couple_member(space_id));

CREATE POLICY "Manage special dates in own space"
  ON public.special_dates FOR ALL
  USING (public.is_couple_member(space_id));

-- ====================================================================
-- SUPABASE STORAGE BUCKET INSTRUCTIONS
-- ====================================================================
-- Bucket Name: 'our-space-media' (public: false)
-- 
-- Storage RLS Policy (SQL in Supabase SQL editor):
-- 
-- CREATE POLICY "Allow couple members to download their media"
-- ON storage.objects FOR SELECT TO authenticated
-- USING (
--   bucket_id = 'our-space-media' AND
--   (storage.foldername(name))[1] IN (
--     SELECT couple_id::text FROM public.couple_members WHERE user_id = auth.uid()
--   )
-- );
--
-- CREATE POLICY "Allow authenticated users to upload to their couple folder"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (
--   bucket_id = 'our-space-media' AND
--   (storage.foldername(name))[1] IN (
--     SELECT couple_id::text FROM public.couple_members WHERE user_id = auth.uid()
--   )
-- );
