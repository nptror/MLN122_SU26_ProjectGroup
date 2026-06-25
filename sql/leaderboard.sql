-- =============================================================================

-- Bảng leaderboard — Lưu điểm & huy hiệu sau khi người chơi kết thúc game

-- Chạy toàn bộ script này trong Supabase SQL Editor

-- =============================================================================

--

-- CÁCH TÍNH ĐIỂM (happiness_score) — khớp game.html:

--   • Chỉ số lấy sau Câu 1–9 (Câu 10 không ảnh hưởng điểm)

--   • Không xếp theo tiền thuần — ưu tiên sức khỏe, phạt tha hóa & bái vật giáo

--   • Danh hiệu: S=Đất nước cần bạn · A=Cỗ máy OT · C=Nô lệ Flexing · B=Sinh tồn vật vờ

--

-- Chỉ số ban đầu: Tiền=50, SK=100, TH=0, BV=0, SD=20



CREATE TABLE IF NOT EXISTS public.leaderboard (

    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    player_name     TEXT NOT NULL,

    happiness_score INTEGER NOT NULL,

    rank_badge      TEXT NOT NULL CHECK (rank_badge IN ('S', 'A', 'B', 'C', 'D')),

    ending_type     TEXT NOT NULL,

    ending_title    TEXT NOT NULL,

    money           INTEGER NOT NULL DEFAULT 0,

    health          INTEGER NOT NULL DEFAULT 0,

    alienation      INTEGER NOT NULL DEFAULT 0,

    commodity       INTEGER NOT NULL DEFAULT 0,

    face            INTEGER NOT NULL DEFAULT 0,

    connection      INTEGER NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()

);



CREATE INDEX IF NOT EXISTS idx_leaderboard_score

    ON public.leaderboard (happiness_score DESC, created_at ASC);



-- Bật Realtime (bỏ qua nếu đã thêm bảng vào publication)

ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;



ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;



CREATE POLICY "leaderboard_insert_anon"

    ON public.leaderboard FOR INSERT

    TO anon, authenticated

    WITH CHECK (true);



CREATE POLICY "leaderboard_select_anon"

    ON public.leaderboard FOR SELECT

    TO anon, authenticated

    USING (true);



-- Cho phép UPDATE (dùng khi cập nhật điểm cuối mỗi lượt)
CREATE POLICY "leaderboard_update_anon"

    ON public.leaderboard FOR UPDATE

    TO anon, authenticated

    USING (true)

    WITH CHECK (true);



-- =============================================================================

-- Migration (nếu bảng đã tồn tại từ trước — chạy riêng khi cần)

-- =============================================================================

-- Không cần đổi schema; chỉ cập nhật logic tính điểm phía client (game.html).

-- Xóa dữ liệu test cũ (tùy chọn):

-- TRUNCATE public.leaderboard;

