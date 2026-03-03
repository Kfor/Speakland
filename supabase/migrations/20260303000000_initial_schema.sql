-- ============================================================
-- Speakland Initial Database Schema
-- Tables: users, stories, chapters, characters, story_characters,
--         user_progress, vocabularies, chat_histories, subscriptions
-- ============================================================

SET search_path TO speakland, public;

-- ============================================================
-- Create schema
-- ============================================================
CREATE SCHEMA IF NOT EXISTS speakland;

-- ============================================================
-- Users (extends auth.users)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  native_language TEXT NOT NULL DEFAULT 'zh',
  target_language TEXT NOT NULL DEFAULT 'en' CHECK (target_language IN ('en', 'es')),
  proficiency_level TEXT NOT NULL DEFAULT 'beginner'
    CHECK (proficiency_level IN ('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced')),
  learning_goals TEXT[] DEFAULT '{}',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO speakland.users (id, email, display_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Characters
-- ============================================================
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_localized JSONB DEFAULT '{}',
  bio TEXT NOT NULL DEFAULT '',
  bio_localized JSONB DEFAULT '{}',
  avatar_url TEXT,
  portrait_url TEXT,
  personality_traits TEXT[] DEFAULT '{}',
  speaking_style TEXT NOT NULL DEFAULT '',
  system_prompt TEXT NOT NULL DEFAULT '',
  voice_id TEXT,
  is_mascot BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Characters are readable by all authenticated users
CREATE POLICY "Characters are viewable by authenticated users"
  ON characters FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- Stories
-- ============================================================
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_localized JSONB DEFAULT '{}',
  description TEXT NOT NULL DEFAULT '',
  description_localized JSONB DEFAULT '{}',
  cover_image_url TEXT,
  genre TEXT NOT NULL CHECK (genre IN ('workplace', 'romance', 'adventure', 'historical', 'daily_life')),
  difficulty TEXT NOT NULL DEFAULT 'beginner'
    CHECK (difficulty IN ('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced')),
  target_language TEXT NOT NULL DEFAULT 'en' CHECK (target_language IN ('en', 'es')),
  estimated_duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories are viewable by authenticated users"
  ON stories FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- Chapters
-- ============================================================
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  title_localized JSONB DEFAULT '{}',
  scene_description TEXT NOT NULL DEFAULT '',
  scene_image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chapters are viewable by authenticated users"
  ON chapters FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_chapters_story_id ON chapters(story_id);

-- ============================================================
-- Story-Character relationship
-- ============================================================
CREATE TABLE story_characters (
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'supporting' CHECK (role IN ('main_npc', 'supporting', 'background')),
  PRIMARY KEY (story_id, character_id)
);

ALTER TABLE story_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story characters are viewable by authenticated users"
  ON story_characters FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- User Progress
-- ============================================================
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  current_chapter_id UUID REFERENCES chapters(id),
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  choices JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, story_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_story_id ON user_progress(story_id);

-- ============================================================
-- Vocabularies (user word bank)
-- ============================================================
CREATE TABLE vocabularies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT NOT NULL DEFAULT '',
  context_sentence TEXT,
  context_translation TEXT,
  source_story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  source_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  target_language TEXT NOT NULL DEFAULT 'en' CHECK (target_language IN ('en', 'es')),
  mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  next_review_at TIMESTAMPTZ,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, word, target_language)
);

ALTER TABLE vocabularies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vocabularies"
  ON vocabularies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vocabularies"
  ON vocabularies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vocabularies"
  ON vocabularies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vocabularies"
  ON vocabularies FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_vocabularies_user_id ON vocabularies(user_id);
CREATE INDEX idx_vocabularies_next_review ON vocabularies(user_id, next_review_at)
  WHERE next_review_at IS NOT NULL;

-- ============================================================
-- Chat Histories
-- ============================================================
CREATE TABLE chat_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chat_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat histories"
  ON chat_histories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat histories"
  ON chat_histories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat histories"
  ON chat_histories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat histories"
  ON chat_histories FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_chat_histories_user_id ON chat_histories(user_id);

-- ============================================================
-- Subscriptions
-- ============================================================
CREATE TABLE subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'none'
    CHECK (status IN ('active', 'cancelled', 'expired', 'none')),
  product_id TEXT,
  platform TEXT CHECK (platform IN ('ios', 'android')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only server (service_role) can insert/update subscriptions (via webhooks)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vocabularies_updated_at
  BEFORE UPDATE ON vocabularies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_histories_updated_at
  BEFORE UPDATE ON chat_histories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
