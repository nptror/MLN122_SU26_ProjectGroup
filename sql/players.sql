-- =============================================================================
-- Bảng players — Lưu người chơi khi đăng ký, với chỉ số ban đầu
-- Chạy toàn bộ script này trong Supabase SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.players (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name     TEXT NOT NULL,

    -- Chỉ số ban đầu khi đăng ký
    money           INTEGER NOT NULL DEFAULT 50,
    health          INTEGER NOT NULL DEFAULT 100,
    alienation      INTEGER NOT NULL DEFAULT 0,
    commodity       INTEGER NOT NULL DEFAULT 0,
    face            INTEGER NOT NULL DEFAULT 20,

    -- Trạng thái game
    current_day     INTEGER NOT NULL DEFAULT 1,
    game_finished   BOOLEAN NOT NULL DEFAULT FALSE,
    happiness_score INTEGER,

    registered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index để tìm theo tên
CREATE INDEX IF NOT EXISTS idx_players_name ON public.players (player_name);

-- Bật Realtime (tùy chọn)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.players;

-- Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Cho phép mọi client INSERT (đăng ký)
CREATE POLICY "players_insert_anon"
    ON public.players FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Cho phép mọi client SELECT
CREATE POLICY "players_select_anon"
    ON public.players FOR SELECT
    TO anon, authenticated
    USING (true);

-- Cho phép cập nhật (chỉ số thay đổi, game_finished, ...)
CREATE POLICY "players_update_anon"
    ON public.players FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Trigger tự cập nhật updated_at
CREATE OR REPLACE FUNCTION public.set_players_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_players_updated_at ON public.players;
CREATE TRIGGER trg_players_updated_at
    BEFORE UPDATE ON public.players
    FOR EACH ROW
    EXECUTE FUNCTION public.set_players_updated_at();
