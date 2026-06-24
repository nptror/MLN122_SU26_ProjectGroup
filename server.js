/**
 * Backend API — Điều phối game_state qua Supabase
 *
 * Player (game.html) vẫn subscribe Realtime trực tiếp từ Supabase.
 * Admin có thể gọi API này thay vì ghi trực tiếp (bảo mật hơn với service role).
 *
 * Chạy: npm install && copy .env.example .env  (điền Secret key)  && npm start
 *
 * Frontend đọc Publishable key từ .env.example qua assets/js/supabase-env.js
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong file .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/** Cấu hình lượt — khớp logic game.html & admin.html */
const ROUNDS = [
    { round: 1, maxIndex: 1, questions: [1], label: 'Câu 1' },
    { round: 2, maxIndex: 5, questions: [2, 3, 4, 5], label: 'Câu 2, 3, 4, 5' },
    { round: 3, maxIndex: 7, questions: [6, 7], label: 'Câu 6, 7' },
    { round: 4, maxIndex: 9, questions: [8, 9], label: 'Câu 8, 9' },
    { round: 5, maxIndex: 10, questions: [10], label: 'Câu 10 (Kết thúc)' },
];

const LOCKED_STATE = { current_round: 0, max_question_index: 0, is_active: false };

const app = express();
app.use(cors());
app.use(express.json());

function roundConfig(round) {
    return ROUNDS.find((r) => r.round === round) || null;
}

async function getState() {
    const { data, error } = await supabase
        .from('game_state')
        .select('*')
        .eq('id', 1)
        .single();
    if (error) throw error;
    return data;
}

async function setState({ round, maxIndex, isActive }) {
    const payload = {
        current_round: round,
        max_question_index: maxIndex,
        is_active: isActive,
        updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
        .from('game_state')
        .update(payload)
        .eq('id', 1)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// GET /api/game-state — Lấy trạng thái hiện tại
app.get('/api/game-state', async (_req, res) => {
    try {
        const state = await getState();
        res.json({ ok: true, state, rounds: ROUNDS });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// PUT /api/game-state — Đặt lượt cụ thể { round: 1..5 } hoặc khóa { round: 0 }
app.put('/api/game-state', async (req, res) => {
    try {
        const round = Number(req.body.round);
        if (!Number.isInteger(round) || round < 0 || round > 5) {
            return res.status(400).json({ ok: false, error: 'round phải từ 0 đến 5' });
        }

        if (round === 0) {
            const state = await setState({ ...LOCKED_STATE, isActive: false });
            return res.json({ ok: true, state });
        }

        const cfg = roundConfig(round);
        if (!cfg) {
            return res.status(400).json({ ok: false, error: 'Lượt không hợp lệ' });
        }

        const state = await setState({
            round: cfg.round,
            maxIndex: cfg.maxIndex,
            isActive: true,
        });
        res.json({ ok: true, state });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// POST /api/game-state/next — Mở lượt tiếp theo
app.post('/api/game-state/next', async (_req, res) => {
    try {
        const current = await getState();
        const nextRound = current.is_active ? current.current_round + 1 : 1;

        if (nextRound > 5) {
            return res.status(400).json({ ok: false, error: 'Đã ở lượt cuối (Lượt 5)' });
        }

        const cfg = roundConfig(nextRound);
        const state = await setState({
            round: cfg.round,
            maxIndex: cfg.maxIndex,
            isActive: true,
        });
        res.json({ ok: true, state });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// POST /api/game-state/lock — Khóa tất cả câu hỏi
app.post('/api/game-state/lock', async (_req, res) => {
    try {
        const state = await setState({ ...LOCKED_STATE, isActive: false });
        res.json({ ok: true, state });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'mln-quiz-game', rounds: ROUNDS.length });
});

app.listen(PORT, () => {
    console.log(`✅ Game server chạy tại http://localhost:${PORT}`);
    console.log(`   GET  /api/game-state`);
    console.log(`   PUT  /api/game-state       { "round": 1 }`);
    console.log(`   POST /api/game-state/next`);
    console.log(`   POST /api/game-state/lock`);
});
