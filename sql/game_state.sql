-- =============================================================================
-- Bảng game_state — Lưu trạng thái điều phối lượt câu hỏi (Realtime)
-- Chạy toàn bộ script này trong Supabase SQL Editor
-- =============================================================================

-- 1. Tạo bảng
CREATE TABLE IF NOT EXISTS public.game_state (
    id                  INTEGER PRIMARY KEY DEFAULT 1,
    current_round       INTEGER NOT NULL DEFAULT 0 CHECK (current_round BETWEEN 0 AND 5),
  -- max_question_index: câu hỏi cao nhất được phép chơi (tích lũy theo lượt)
  -- Lượt 1 → 1 | Lượt 2 → 5 | Lượt 3 → 7 | Lượt 4 → 9 | Lượt 5 → 10 (kết thúc)
    max_question_index  INTEGER NOT NULL DEFAULT 0 CHECK (max_question_index BETWEEN 0 AND 10),
    is_active           BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT game_state_single_row CHECK (id = 1)
);

-- 2. Seed dữ liệu ban đầu (khóa toàn bộ — chờ Admin mở lượt)
INSERT INTO public.game_state (id, current_round, max_question_index, is_active)
VALUES (1, 0, 0, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 3. Bật Realtime cho bảng (Player & Admin nhận cập nhật tức thì)
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_state;

-- 4. Row Level Security
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;

-- Cho phép mọi client ĐỌC trạng thái (Player cần đọc)
CREATE POLICY "game_state_select_anon"
    ON public.game_state FOR SELECT
    TO anon, authenticated
    USING (true);

-- Cho phép Admin cập nhật trực tiếp từ trình duyệt (anon key)
-- ⚠️ Chỉ dùng cho môi trường demo/lớp học. Production nên dùng server.js + service role.
CREATE POLICY "game_state_update_anon"
    ON public.game_state FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Trigger tự cập nhật updated_at
CREATE OR REPLACE FUNCTION public.set_game_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_game_state_updated_at ON public.game_state;
CREATE TRIGGER trg_game_state_updated_at
    BEFORE UPDATE ON public.game_state
    FOR EACH ROW
    EXECUTE FUNCTION public.set_game_state_updated_at();
