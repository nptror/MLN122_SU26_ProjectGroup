/**
 * Đọc cấu hình Supabase từ .env.example (hoặc .env khi chạy local có serve file).
 * Dùng chung cho game.html, admin.html, leaderboard.html
 */
(function (global) {
    'use strict';

    function parseEnv(text) {
        const out = {};
        for (const line of text.split(/\r?\n/)) {
            const t = line.trim();
            if (!t || t.startsWith('#')) continue;
            const eq = t.indexOf('=');
            if (eq === -1) continue;
            const key = t.slice(0, eq).trim();
            let val = t.slice(eq + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            out[key] = val;
        }
        return out;
    }

    function fromEnvObject(env) {
        return {
            url: env.SUPABASE_URL || '',
            anonKey: env.SUPABASE_ANON_KEY || '',
            apiUrl: env.API_URL || '',
        };
    }

    function isConfigured(cfg) {
        if (!cfg || !cfg.url || !cfg.anonKey) return false;
        if (cfg.url.includes('xxxxxxxxxxxx')) return false;
        if (cfg.anonKey.includes('your-publishable-anon-key')) return false;
        return true;
    }

    /**
     * @param {string[]} [paths] — đường dẫn tương đối từ trang HTML (mặc định ../.env.example)
     */
    async function load(paths) {
        const candidates = paths || ['../.env.example', '../.env'];
        for (const path of candidates) {
            try {
                const res = await fetch(path, { cache: 'no-store' });
                if (!res.ok) continue;
                const cfg = fromEnvObject(parseEnv(await res.text()));
                if (cfg.url && cfg.anonKey) return cfg;
            } catch (_) {
                /* file:// hoặc không có static server */
            }
        }
        return fromEnvObject({});
    }

    global.SupabaseEnv = { load, isConfigured, parseEnv, fromEnvObject };
})(window);
