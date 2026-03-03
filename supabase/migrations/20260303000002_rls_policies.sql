-- RLS Policies for Speakland
-- Enforces row-level security to isolate user data

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- user_profiles: Users can only access their own profile
-- ============================================================
CREATE POLICY "user_profiles_select_own"
  ON user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "user_profiles_insert_own"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- Public read-only tables: Any authenticated user can read
-- ============================================================
CREATE POLICY "characters_select_authenticated"
  ON characters FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "stories_select_authenticated"
  ON stories FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "chapters_select_authenticated"
  ON chapters FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- game_states: Users can only manage their own game states
-- ============================================================
CREATE POLICY "game_states_select_own"
  ON game_states FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "game_states_insert_own"
  ON game_states FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "game_states_update_own"
  ON game_states FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "game_states_delete_own"
  ON game_states FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- user_word_books: Users can only manage their own word book
-- ============================================================
CREATE POLICY "user_word_books_select_own"
  ON user_word_books FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_word_books_insert_own"
  ON user_word_books FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_word_books_update_own"
  ON user_word_books FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_word_books_delete_own"
  ON user_word_books FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- dialogue_history: Users can only access their own dialogues
-- ============================================================
CREATE POLICY "dialogue_history_select_own"
  ON dialogue_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "dialogue_history_insert_own"
  ON dialogue_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dialogue_history_delete_own"
  ON dialogue_history FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
