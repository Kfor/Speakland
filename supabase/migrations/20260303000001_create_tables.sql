-- Speakland Database Schema
-- Creates all core tables for the RPG language learning platform

-- ============================================================
-- user_profiles: Extended user data beyond Supabase auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  onboarding_data JSONB DEFAULT '{}',
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- characters: NPC character definitions
-- ============================================================
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  localized_name TEXT,
  portraits JSONB NOT NULL DEFAULT '{}',
  voice_config JSONB,
  personality TEXT,
  speaking_style TEXT,
  vocabulary TEXT[],
  backstory TEXT,
  target_language_usage TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- stories: Story/world definitions
-- ============================================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  localized_title TEXT,
  description TEXT,
  background_image TEXT,
  difficulty SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
  target_language TEXT NOT NULL,
  estimated_minutes INT,
  tags TEXT[],
  character_ids UUID[],
  root_segment_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- chapters (story segments): Scene nodes within a story
-- ============================================================
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  background_image TEXT,
  active_character_ids UUID[],
  narrative_intro TEXT,
  system_prompt_fragment TEXT NOT NULL,
  suggested_topics TEXT[],
  branches JSONB DEFAULT '[]',
  max_turns INT,
  min_turns INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK for stories.root_segment_id -> chapters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stories_root_segment_id_fkey'
  ) THEN
    ALTER TABLE stories
      ADD CONSTRAINT stories_root_segment_id_fkey
      FOREIGN KEY (root_segment_id) REFERENCES chapters(id);
  END IF;
END $$;

-- ============================================================
-- game_states: Per-user progress in a story
-- ============================================================
CREATE TABLE IF NOT EXISTS game_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  current_segment_id UUID REFERENCES chapters(id),
  completed_segment_ids UUID[] DEFAULT '{}',
  relationships JSONB DEFAULT '{}',
  inventory TEXT[] DEFAULT '{}',
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  words_encountered INT DEFAULT 0,
  words_learned INT DEFAULT 0,
  total_turns INT DEFAULT 0,
  session_duration INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_played_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, story_id)
);

-- ============================================================
-- user_word_books: Per-user vocabulary entries
-- ============================================================
CREATE TABLE IF NOT EXISTS user_word_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  language TEXT NOT NULL,
  translation TEXT,
  context_sentence TEXT,
  learned BOOLEAN DEFAULT false,
  learned_at TIMESTAMPTZ,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, word, language)
);

-- ============================================================
-- dialogue_history: Conversation log per scene
-- ============================================================
CREATE TABLE IF NOT EXISTS dialogue_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES chapters(id),
  speaker TEXT NOT NULL,
  content TEXT NOT NULL,
  translation TEXT,
  expression TEXT,
  turn_number INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_game_states_user_id ON game_states(user_id);
CREATE INDEX IF NOT EXISTS idx_game_states_story_id ON game_states(story_id);
CREATE INDEX IF NOT EXISTS idx_user_word_books_user_id ON user_word_books(user_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_history_user_story ON dialogue_history(user_id, story_id);
CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id);

-- ============================================================
-- Triggers: auto-create user_profile on auth.users insert
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Trigger: auto-update updated_at columns
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
