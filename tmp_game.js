
        document.addEventListener('DOMContentLoaded', async () => {

            // ============================================================
            // 0. SUPABASE CONFIGURATION — đọc từ .env.example
            // ============================================================
            const envConfig = await SupabaseEnv.load();
            const SUPABASE_URL = envConfig.url;
            const SUPABASE_ANON_KEY = envConfig.anonKey;
            let supabase = null;
            let adminMaxDay = 10; // Mặc định cho phép chơi hết nếu không có backend
            
            if (SupabaseEnv.isConfigured(envConfig)) {
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                initSupabase();
            }

            async function initSupabase() {
                // Fetch initial state
                const { data, error } = await supabase.from('game_state').select('max_question_index').eq('id', 1).single();
                if (data && !error) {
                    adminMaxDay = data.max_question_index;
                    checkWaitingStatus();
                }

                // Listen for changes
                supabase
                    .channel('game_state_changes')
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_state' }, payload => {
                        adminMaxDay = payload.new.max_question_index;
                        checkWaitingStatus();
                    })
                    .subscribe();
            }

            function checkWaitingStatus() {
                if (!G.isPlaying) return;
                
                const overlay = document.getElementById('waitingOverlay');

                if (G.day > adminMaxDay) {
                    // Vượt quá câu hỏi cho phép -> Hiển thị màn hình chờ
                    overlay.classList.remove('hidden');
                    overlay.classList.add('flex');
                } else {
                    // Đã được phép đi tiếp -> Tắt màn hình chờ
                    if (!overlay.classList.contains('hidden')) {
                        overlay.classList.add('hidden');
                        overlay.classList.remove('flex');
                        
                        // Resume game flow
                        if (G.day > G.maxDay) {
                            endGame();
                        } else {
                            setTimeout(() => {
                                loadScenario();
                            }, 300);
                        }
                    }
                }
            }

            /**
             * ============================================================
             *  HẠNH PHÚC HAY TIỀN BẠC? — Choice-Based Game
             * ============================================================
             */

            (function () {
                'use strict';

                // ============================================================
                // 1. SCENARIOS DATA
                // ============================================================
                const SCENARIOS = [{
                    id: 0,
                    text: 'GIAI ĐOẠN 1: BÍ MẬT CỦA TƯ BẢN & SỰ THA HÓA\nCâu 1: Ngày đầu đi làm tại xưởng may X. Chủ xưởng ra điều kiện: Làm việc 8 tiếng/ngày, lương 200k. Nhưng thực tế trong 4 tiếng đầu bạn đã làm ra số sản phẩm trị giá 200k rồi. 4 tiếng sau bạn làm gì?',
                    A: {
                        label: 'Đình công, đòi về vì đã làm đủ tiền lương.',
                        effects: { set: { money: 0 }, health: 10, alienation: 0 },
                        desc: 'Bị đuổi việc ngay lập tức — hồi sinh lại với sức khỏe tốt hơn nhưng ví tiền trống rỗng.'
                    },
                    B: {
                        label: 'Tiếp tục làm nốt 4 tiếng để chủ xưởng lấy phần giá trị thặng dư (m), chấp nhận luật chơi.',
                        effects: { money: 200, health: -20, alienation: 10 },
                        desc: 'Bạn nhận được tiền công, nhưng cảm thấy cơ thể rã rời và một chút lạc lõng.'
                    }
                }, {
                    id: 1,
                    text: 'Câu 2: Bạn được chuyển sang dây chuyền lắp ráp tự động cao cấp. Công việc của bạn là đứng đúng một chỗ và vặn một con ốc liên tục 10 tiếng/ngày. Bạn cảm thấy thế nào?',
                    A: {
                        label: 'Thấy mình như một robot, đầu óc trống rỗng, mệt mỏi nhưng vì tiền nên cắn răng làm.',
                        effects: { money: 250, health: -30, alienation: 25 },
                        desc: 'Ví tiền dày lên đáng kể, nhưng tâm trí bạn trống rỗng như một cỗ máy vô hồn.'
                    },
                    B: {
                        label: 'Xin chuyển sang bộ phận sáng tạo/thiết kế dù lương thấp hơn một nửa.',
                        effects: { money: 100, health: 10, alienation: -10 },
                        desc: 'Thu nhập giảm sút, bù lại bạn tìm thấy niềm vui và ý nghĩa trong công việc.'
                    }
                }, {
                    id: 2,
                    text: 'Câu 3: Cuối tháng, xưởng may đạt doanh thu kỷ lục nhờ xuất khẩu lô áo vest sang châu Âu trị giá hàng tỷ đồng. Bạn nhìn lại chiếc áo mình vừa may xong và nhận ra điều gì?',
                    A: {
                        label: 'Tự hào vì sản phẩm của mình quá đẹp, ước gì mình có tiền mua nó.',
                        effects: { face: 5, alienation: 15 },
                        desc: 'Bạn thấy hãnh diện, nhưng nhận ra mình đang khao khát thứ không thuộc về mình.'
                    },
                    B: {
                        label: 'Cay đắng nhận ra mình làm ra nó nhưng cả đời cũng không bao giờ đủ tiền mua chiếc áo này.',
                        effects: { health: -10, alienation: 20 },
                        desc: 'Sự thật phũ phàng khiến bạn mệt mỏi và cảm thấy xa lạ với chính công sức mình bỏ ra.'
                    }
                }, {
                    id: 3,
                    text: 'Câu 4: Công ty thông báo áp dụng hệ thống quản lý mới: Chia nhỏ KPI, các công nhân cùng tổ sẽ chấm điểm lẫn nhau, ai thấp điểm nhất sẽ bị trừ lương.',
                    A: {
                        label: 'Tập trung làm tốt việc của mình, chủ động cô lập, không giúp đỡ đồng nghiệp để giữ ghế.',
                        effects: { health: -10, alienation: 20 },
                        desc: 'Bạn an toàn giữ được vị trí, nhưng tình đồng nghiệp đổ vỡ khiến áp lực tăng cao.'
                    },
                    B: {
                        label: 'Rủ đồng nghiệp lập hội nhóm chia sẻ, chấp nhận KPI thấp hơn một chút.',
                        effects: { money: -20, health: 10, alienation: -10 },
                        desc: 'Bạn mất một khoản tiền, nhưng đổi lại là tinh thần thoải mái và tình người ấm áp.'
                    }
                }, {
                    id: 4,
                    text: 'Câu 5: (Câu hỏi bước ngoặt) Cơ thể bạn kiệt sức, bác sĩ cảnh báo cần nghỉ ngơi. Nhưng chủ xưởng bảo nếu tăng ca đêm nay (giai đoạn sản xuất m tuyệt đối), bạn sẽ được thưởng gấp đôi.',
                    A: {
                        label: 'Kiếm tiền là trên hết! Cày tiếp đêm nay.',
                        effects: { money: 400, health: -50, alienation: 10 },
                        desc: 'Tiền thưởng rất hậu hĩnh, nhưng cơ thể bạn đã chạm đến giới hạn nguy hiểm.'
                    },
                    B: {
                        label: 'Từ chối, giữ mạng quan trọng hơn.',
                        effects: { health: 20, face: -5 },
                        desc: 'Bạn bỏ qua cơ hội kiếm tiền và bị sếp đánh giá thấp, nhưng bù lại giữ được sức khỏe.'
                    }
                }, {
                    id: 5,
                    text: 'GIAI ĐOẠN 2: "BÓNG DÁNG" LÝ THUYẾT TẠI VIỆT NAM\nCâu 6: Lên mạng xã hội (Facebook/TikTok), bạn thấy bạn bè đua nhau "flex" đi xe sang, dùng iPhone đời mới nhất, check-in nhà hàng 5 sao.',
                    A: {
                        label: 'Thấy mình thật kém cỏi, quyết tâm phải mua bằng được món đồ hiệu để bằng bạn bằng bè.',
                        effects: { commodity: 25, face: 20 },
                        desc: 'Bạn thấy có động lực đua tranh, nhưng bắt đầu lún sâu vào vòng xoáy tiêu dùng vật chất.'
                    },
                    B: {
                        label: 'Bình thản lướt qua, hiểu rằng giá trị con người không nằm ở món đồ.',
                        effects: { face: -10, health: 10 },
                        desc: 'Bạn bớt chạy theo số đông, đầu óc thoáng hơn và không bận tâm ánh nhìn người khác.'
                    }
                }, {
                    id: 6,
                    text: 'Câu 7: iPhone 18 Pro Max vừa ra mắt. Tài khoản của bạn đang cạn túi nhưng bạn rất muốn có nó để người khác nể phục. Bạn sẽ làm gì?',
                    A: {
                        label: 'Vay "app" tín dụng đen hoặc mua trả góp lãi suất cao để mua ngay lập tức.',
                        effects: { money: -40, commodity: 30, face: 30 },
                        desc: 'Nợ nần bủa vây — sự ngưỡng mộ ảo mang lại niềm vui ngắn ngủi trước gánh nặng tài chính.'
                    },
                    B: {
                        label: 'Tiếp tục dùng máy cũ, tiền để dành ăn uống, học tập.',
                        effects: { health: 10, face: -15 },
                        desc: 'Bạn chấp nhận sự "thua thiệt", nhưng giữ được tiền và sự bình yên trong tâm trí.'
                    }
                }, {
                    id: 7,
                    text: 'Câu 8: Bạn ra trường và làm dân văn phòng (Designer/Coder) tại Việt Nam. Công ty vận hành theo văn hóa "996" (Làm từ 9h sáng đến 9h tối, 6 ngày/tuần). Bạn chọn:',
                    A: {
                        label: 'Chấp nhận "bán mình" cho tư bản, cống hiến thanh xuân để đổi lấy mức lương cao tại trung tâm Quận 1.',
                        effects: { money: 500, health: -40, alienation: 30 },
                        desc: 'Tài khoản tăng vọt, nhưng bạn đang đánh đổi thanh xuân và sức khỏe cho công việc.'
                    },
                    B: {
                        label: 'Chọn một công việc "Work-Life Balance" (Cân bằng), lương đủ sống nhưng có thời gian cho gia đình, sở thích.',
                        effects: { money: 200, health: 20, alienation: -20 },
                        desc: 'Thu nhập chỉ đủ sống, nhưng bạn tìm lại được quyền kiểm soát cuộc đời mình.'
                    }
                }, {
                    id: 8,
                    text: 'Câu 9: Nhà nước Việt Nam ban hành Luật Lao động sửa đổi, thắt chặt quy định về giờ làm thêm tối đa và tăng mức lương tối thiểu vùng nhằm bảo vệ người lao động.',
                    A: {
                        label: 'Ủng hộ chính sách này, tích cực tham gia các hoạt động Công đoàn để bảo vệ quyền lợi của mình.',
                        effects: { health: 15, alienation: -15 },
                        desc: 'Bạn được bảo vệ quyền lợi chính đáng, cảm thấy an tâm và gắn kết hơn với tập thể.'
                    },
                    B: {
                        label: 'Lờ đi, chấp nhận đi đêm với chủ doanh nghiệp để làm chui thêm giờ kiếm tiền mặt.',
                        effects: { money: 100, health: -25, alienation: 15 },
                        desc: 'Bạn kiếm thêm được chút tiền mặt, nhưng rủi ro cao và khiến bản thân kiệt quệ hơn.'
                    }
                }, {
                    id: 9,
                    isFinal: true,
                    text: 'Câu 10: (Câu hỏi tổng kết cuối game) Bạn nhận ra điều gì là quan trọng nhất sau một chuỗi ngày chạy theo guồng quay kinh tế?',
                    A: {
                        label: 'Tiền và địa vị vật chất là tất cả, con người sinh ra là để làm việc và tiêu xài.',
                        effects: {},
                        reflection: 'Kết cục: Bạn trở thành một "Cỗ máy bái vật giáo" chính hiệu.',
                        desc: 'Bạn chọn con đường vật chất tuyệt đối — điểm xếp hạng vẫn tính theo chỉ số sau 9 câu trước.'
                    },
                    B: {
                        label: 'Tiền là công cụ, lao động phải là sự sáng tạo và cần có sự điều tiết của xã hội để con người không bị tha hóa.',
                        effects: {},
                        reflection: 'Kết cục: Bạn hướng tới "Lao động tự do trong nền kinh tế định hướng XHCN".',
                        desc: 'Bạn chọn tư duy cân bằng — điểm xếp hạng vẫn tính theo chỉ số sau 9 câu trước.'
                    }
                }];

                // ============================================================
                // 2. GAME STATE
                // ============================================================
                window.G = {
                    money: 50,
                    health: 100,
                    alienation: 0,
                    commodity: 0,
                    face: 20,
                    connection: 0,
                    day: 1,
                    maxDay: 10,
                    isPlaying: true,
                    isWaitingResult: false,
                    usedScenarios: [],
                    currentScenarioIndex: 0,
                    totalHappiness: 0,
                    gameEnded: false,
                    scoreSaved: false,
                    scoreStats: null,
                    finalReflection: '',
                    pendingFinalEnd: false,
                };

                const MAX_STAT = 100;
                const MIN_STAT = 0;

                // ============================================================
                // 3. DOM REFS
                // ============================================================
                const $ = (id) => document.getElementById(id);

                const DOM = {
                    money: $('moneyValue'),
                    health: $('healthValue'),
                    alienation: $('alienationValue'),
                    commodity: $('commodityValue'),
                    face: $('faceValue'),
                    moneyBar: $('moneyBar'),
                    healthBar: $('healthBar'),
                    alienationBar: $('alienationBar'),
                    commodityBar: $('commodityBar'),
                    faceBar: $('faceBar'),
                    dayDisplay: $('dayDisplay'),
                    dayBadge: $('dayBadge'),
                    scenarioTitle: $('scenarioTitle'),
                    scenarioText: $('scenarioText'),
                    choiceA: $('choiceA'),
                    choiceB: $('choiceB'),
                    choiceC: $('choiceC'),
                    choiceATitle: $('choiceATitle'),
                    choiceBTitle: $('choiceBTitle'),
                    choiceCTitle: $('choiceCTitle'),
                    choiceAText: $('choiceAText'),
                    choiceBText: $('choiceBText'),
                    choiceCText: $('choiceCText'),
                    resultPopup: $('resultPopup'),
                    resultIcon: $('resultIcon'),
                    resultTitle: $('resultTitle'),
                    resultDesc: $('resultDesc'),
                    resultChanges: $('resultChanges'),
                    btnContinue: $('btnContinue'),
                    endingOverlay: $('endingOverlay'),
                    endingIcon: $('endingIcon'),
                    endingTitle: $('endingTitle'),
                    endingBadgeName: $('endingBadgeName'),
                    endingMeaning: $('endingMeaning'),
                    endingSub: $('endingSub'),
                    endingStats: $('endingStats'),
                    endingScore: $('endingScore'),
                    endingRank: $('endingRank'),
                    btnPlayAgain: $('btnPlayAgain'),
                    btnLeaderboard: $('btnLeaderboard'),
                    warningText: $('warningText'),
                    scenarioCard: $('scenarioCard'),
                    choiceRow: $('choiceRow'),
                };

                // ============================================================
                // 4. UTILITY
                // ============================================================
                function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

                function fmtNum(n) { return Math.floor(n); }

                function calcHappinessScore(s) {
                    // Điểm hạnh phúc — KHÔNG xếp theo tiền thuần (chỉ số sau câu 1–9)
                    let score = s.health * 2;
                    score -= s.alienation * 1.5;
                    score -= s.commodity * 2;
                    score -= Math.max(0, s.face - 20) * 0.4;

                    if (s.money >= 150 && s.money <= 700) {
                        score += 30;
                    } else if (s.money > 900) {
                        score -= Math.round((s.money - 900) * 0.08);
                    } else if (s.money < 100) {
                        score -= Math.round((100 - s.money) * 0.3);
                    }

                    return Math.round(score);
                }

                function snapshotScoreStats() {
                    G.scoreStats = {
                        money: G.money,
                        health: G.health,
                        alienation: G.alienation,
                        commodity: G.commodity,
                        face: G.face,
                    };
                }

                function getStatsForScoring() {
                    return G.scoreStats || G;
                }

                async function saveScoreToLeaderboard(score, rank, ending, stats) {
                    if (!supabase || G.scoreSaved) return;
                    const playerName = sessionStorage.getItem('playerName');
                    if (!playerName) return;

                    const { error } = await supabase.from('leaderboard').insert({
                        player_name: playerName,
                        happiness_score: score,
                        rank_badge: rank,
                        ending_type: ending.type,
                        ending_title: ending.title,
                        money: stats.money,
                        health: stats.health,
                        alienation: stats.alienation,
                        commodity: stats.commodity,
                        face: stats.face,
                        connection: 0,
                    });

                    if (error) {
                        console.error('Lỗi lưu điểm leaderboard:', error);
                    } else {
                        G.scoreSaved = true;
                    }
                }

                function getStatPercent(value, key) { 
                    const maxVal = key === 'money' ? 2000 : 100;
                    return clamp((value / maxVal) * 100, 0, 100); 
                }

                // ============================================================
                // 5. AUDIO — Web Audio API
                // ============================================================
                let audioCtx = null;

                function getAudioCtx() {
                    if (!audioCtx) {
                        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    }
                    return audioCtx;
                }

                function playTone(freq, duration, type, volume) {
                    try {
                        const ctx = getAudioCtx();
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = type || 'sine';
                        osc.frequency.value = freq;
                        gain.gain.setValueAtTime(volume || 0.10, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(ctx.currentTime);
                        osc.stop(ctx.currentTime + duration);
                    } catch (e) { /* ignore */ }
                }

                function sfxClick() { playTone(800, 0.06, 'sine', 0.08); }

                function sfxSuccess() {
                    playTone(600, 0.10, 'sine', 0.10);
                    setTimeout(() => playTone(900, 0.10, 'sine', 0.08), 120);
                }

                function sfxWarning() {
                    playTone(400, 0.15, 'sawtooth', 0.06);
                    setTimeout(() => playTone(300, 0.20, 'sawtooth', 0.05), 180);
                }

                function sfxGameOver() {
                    playTone(500, 0.20, 'sawtooth', 0.08);
                    setTimeout(() => playTone(400, 0.20, 'sawtooth', 0.07), 220);
                    setTimeout(() => playTone(300, 0.30, 'sawtooth', 0.06), 440);
                }

                // ============================================================
                // 6. UI UPDATE
                // ============================================================
                function updateStatsUI(animate = true) {
                    const s = G;
                    DOM.money.textContent = fmtNum(s.money);
                    DOM.health.textContent = fmtNum(s.health);
                    DOM.alienation.textContent = fmtNum(s.alienation);
                    DOM.commodity.textContent = fmtNum(s.commodity);
                    DOM.face.textContent = fmtNum(s.face);

                    DOM.moneyBar.style.width = getStatPercent(s.money, 'money') + '%';
                    DOM.healthBar.style.width = getStatPercent(s.health, 'health') + '%';
                    DOM.alienationBar.style.width = getStatPercent(s.alienation, 'alienation') + '%';
                    DOM.commodityBar.style.width = getStatPercent(s.commodity, 'commodity') + '%';
                    DOM.faceBar.style.width = getStatPercent(s.face, 'face') + '%';

                    DOM.dayDisplay.textContent = 'CÂU ' + s.day;

                    // Update warning card
                    const warnings = [];
                    if (s.health < 30) warnings.push('⚠️ Sức khỏe nguy kịch! Hãy nghỉ ngơi.');
                    if (s.alienation > 70) warnings.push('⚡ Tha hóa quá cao! Bạn đang đánh mất chính mình.');
                    if (s.commodity > 70) warnings.push('📱 Bái vật giáo! Bạn bị cuốn vào vòng xoáy tiêu dùng.');
                    if (s.money < 20) warnings.push('💰 Tiền bạc eo hẹp, hãy thận trọng với chi tiêu.');
                    if (s.face > 80) warnings.push('😎 Sĩ diện quá lớn, áp lực đè nặng.');

                    if (warnings.length > 0) {
                        DOM.warningText.textContent = warnings[0];
                        DOM.warningText.parentElement.style.display = 'block';
                    } else {
                        DOM.warningText.textContent = 'Mọi thứ đang cân bằng. Hãy tiếp tục đưa ra quyết định sáng suốt.';
                        DOM.warningText.parentElement.style.display = 'block';
                    }
                }

                // ============================================================
                // 8. APPLY EFFECTS
                // ============================================================
                function applyEffects(effects, choiceLabel, choiceDesc) {
                    const s = G;
                    const changes = [];

                    if (effects.set) {
                        for (const [key, value] of Object.entries(effects.set)) {
                            const oldVal = s[key];
                            const maxVal = key === 'money' ? 2000 : 100;
                            s[key] = clamp(value, 0, maxVal);
                            const delta = s[key] - oldVal;
                            if (delta !== 0) {
                                changes.push({ key, delta, label: key });
                            }
                        }
                    }

                    for (const [key, value] of Object.entries(effects)) {
                        if (key === 'set' || value === 0) continue;
                        const oldVal = s[key];
                        const maxVal = key === 'money' ? 2000 : 100;
                        const newVal = clamp(s[key] + value, 0, maxVal);
                        s[key] = newVal;
                        const delta = newVal - oldVal;
                        if (delta !== 0) {
                            changes.push({ key, delta, label: key });
                        }
                    }

                    updateStatsUI();
                    showResult(changes, choiceLabel, choiceDesc);
                }

                // ============================================================
                // 9. RESULT POPUP
                // ============================================================
                function showResult(changes, choiceLabel, choiceDesc) {
                    const popup = DOM.resultPopup;
                    DOM.resultIcon.textContent = changes.some(c => c.delta > 0) ? '✅' : '⚠️';
                    DOM.resultTitle.textContent = choiceLabel || 'Kết quả';

                    DOM.resultDesc.textContent = choiceDesc || 'Bạn đã đưa ra một lựa chọn quan trọng.';
                    DOM.resultChanges.innerHTML = '';
                    DOM.resultChanges.style.display = 'none';

                    popup.classList.add('active');

                    G.isWaitingResult = true;
                    DOM.btnContinue.disabled = false;

                    if (changes.some(c => c.delta < 0 && (c.key === 'health' || c.key === 'money'))) {
                        sfxWarning();
                    } else {
                        sfxSuccess();
                    }
                }

                // ============================================================
                // 16. NEXT DAY
                // ============================================================
                function nextDay() {
                    G.isWaitingResult = false;
                    DOM.resultPopup.classList.remove('active');

                    if (G.pendingFinalEnd) {
                        G.pendingFinalEnd = false;
                        endGame();
                        return;
                    }

                    G.day++;

                    if (G.day === 10) {
                        snapshotScoreStats();
                    }

                    if (G.day > G.maxDay) {
                        endGame();
                        return;
                    }

                    if (G.day > adminMaxDay) {
                        checkWaitingStatus();
                        return;
                    }

                    DOM.scenarioCard.classList.remove('active');
                    DOM.scenarioCard.style.transform = '';
                    DOM.scenarioCard.style.opacity = '0';

                    setTimeout(() => {
                        loadScenario();
                    }, 300);
                }

                // ============================================================
                // 10. DANH HIỆU — điều kiện & nội dung hiển thị
                // ============================================================
                const DANH_HIEU = [{
                    type: 'awakened',
                    rank: 'S',
                    icon: '🇻🇳',
                    name: 'ĐẤT NƯỚC CẦN BẠN',
                    badge: 'Chiến thần Tỉnh thức',
                    meaning: 'Người biết cân bằng cuộc sống, hiểu giá trị lao động và không bị vật chất thao túng. Hình mẫu lý tưởng của nền kinh tế định hướng XHCN.',
                    sub: 'Chúc mừng! Bạn đã xuất sắc vượt qua các cạm bẫy của thị trường. Bạn biết kiếm tiền đúng luật, bảo vệ sức khỏe, sống có gu và tỉnh táo trước áp lực đồng trang lứa!',
                    match: (s) => s.health >= 60 && s.alienation <= 30 && s.commodity <= 20,
                }, {
                    type: 'robot',
                    rank: 'A',
                    icon: '⚙️',
                    name: 'CỖ MÁY IN TIỀN CỦA TƯ BẢN',
                    badge: 'Chiến thần OT',
                    meaning: 'Kiếm được rất nhiều tiền nhưng đánh đổi bằng cả thể xác lẫn tinh thần, bị tha hóa hoàn toàn thành công cụ lao động.',
                    sub: 'Tài khoản của bạn rất nhiều số 0, nhưng bạn đang nhìn cuộc đời qua lăng kính của một robot vặn ốc. Sức khỏe cạn kiệt, mất hết niềm vui sống. Hãy dừng lại trước khi quá muộn!',
                    match: (s) => s.money >= 800 && s.health < 40 && s.alienation >= 50,
                }, {
                    type: 'debt',
                    rank: 'C',
                    icon: '📉',
                    name: 'CHÚA TỂ "FLEXING" – NÔ LỆ TIÊU SẢN',
                    badge: 'Nô lệ Tiêu sản',
                    meaning: 'Cuồng hàng hiệu, sĩ diện cao, dính bẫy nợ nần để đắp lên mình cái mác thành công ảo.',
                    sub: 'Trên Threads bạn là tổng tài, ngoài đời bạn là con nợ của các app tín dụng! Bạn đã bị "Bái vật giáo hàng hóa" nuốt chửng, biến những món tiêu sản thành lẽ sống để rồi còng lưng trả nợ.',
                    match: (s) => s.commodity >= 50 && s.face >= 50 && s.money < 300,
                }, {
                    type: 'normal',
                    rank: 'B',
                    icon: '🏠',
                    name: 'KẺ SINH TỒN VẬT VỜ',
                    badge: null,
                    meaning: 'Các trường hợp còn lại — mức trung bình, tiền không nhiều, sức khỏe yếu hoặc lơ lửng giữa dòng đời.',
                    sub: 'Bạn đang trôi dạt vô định giữa dòng đời kinh tế. Không quá giàu, không quá cuồng đồ hiệu nhưng cũng đang kiệt sức. Cần đọc lại Giáo trình Kinh tế chính trị ngay!',
                    match: () => true,
                }];

                function formatDanhHieuTitle(entry) {
                    return entry.badge ? `${entry.name} (${entry.badge})` : entry.name;
                }

                function getEnding(stats) {
                    for (const entry of DANH_HIEU) {
                        if (entry.type !== 'normal' && entry.match(stats)) {
                            return { ...entry, title: formatDanhHieuTitle(entry) };
                        }
                    }
                    const fallback = DANH_HIEU.find((e) => e.type === 'normal');
                    return { ...fallback, title: formatDanhHieuTitle(fallback) };
                }

                // ============================================================
                // 12. END GAME
                // ============================================================
                window.endGame = function(reason) {
                    if (G.gameEnded) return;
                    G.gameEnded = true;
                    G.isPlaying = false;

                    if (!G.scoreStats) {
                        snapshotScoreStats();
                    }

                    const stats = getStatsForScoring();
                    const ending = getEnding(stats);
                    const rank = ending.rank;

                    DOM.endingIcon.textContent = ending.icon;
                    DOM.endingTitle.textContent = ending.name;
                    DOM.endingBadgeName.textContent = ending.badge
                        ? `🏅 ${ending.badge.toUpperCase()}`
                        : '';
                    DOM.endingMeaning.textContent = ending.meaning;
                    DOM.endingSub.textContent = G.finalReflection
                        ? G.finalReflection + '\n\n' + ending.sub
                        : ending.sub;

                    DOM.endingStats.innerHTML = `
                        <div><div class="es-label">💰 Tiền</div><div class="es-value gold">${fmtNum(stats.money)}</div></div>
                        <div><div class="es-label">❤️ Sức khỏe</div><div class="es-value cyan">${fmtNum(stats.health)}</div></div>
                        <div><div class="es-label">⚡ Tha hóa</div><div class="es-value purple">${fmtNum(stats.alienation)}</div></div>
                        <div><div class="es-label">📱 Bái vật giáo</div><div class="es-value pink">${fmtNum(stats.commodity)}</div></div>
                        <div><div class="es-label">😎 Sĩ diện</div><div class="es-value orange">${fmtNum(stats.face)}</div></div>
                    `;

                    const score = calcHappinessScore(stats);
                    G.totalHappiness = score;
                    DOM.endingScore.textContent = 'ĐIỂM HẠNH PHÚC (Câu 1–9): ' + score;

                    DOM.endingRank.textContent = rank;
                    DOM.endingRank.className = 'ending-rank ' + rank;

                    DOM.endingOverlay.classList.add('active');

                    saveScoreToLeaderboard(score, rank, ending, stats);

                    if (rank === 'S' || rank === 'A') {
                        fireConfetti();
                    }
                    sfxGameOver();
                }

                // ============================================================
                // 13. CONFETTI
                // ============================================================
                function fireConfetti() {
                    const colors = ['#b20112', '#facc15', '#22d3ee', '#a855f7', '#ec4899', '#fb923c'];
                    const container = document.createElement('div');
                    container.style.cssText =
                        'position:fixed;inset:0;pointer-events:none;z-index:600;overflow:hidden;';
                    document.body.appendChild(container);
                    for (let i = 0; i < 80; i++) {
                        const el = document.createElement('div');
                        const size = 5 + Math.random() * 10;
                        el.style.cssText = `
                            position:absolute;
                            width:${size}px;
                            height:${size * 0.6}px;
                            background:${colors[Math.floor(Math.random() * colors.length)]};
                            left:${Math.random() * 100}%;
                            top:-20px;
                            border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
                            animation: confettiFall ${2 + Math.random() * 3}s linear forwards;
                            animation-delay:${Math.random() * 1.5}s;
                            transform:rotate(${Math.random() * 360}deg);
                        `;
                        container.appendChild(el);
                    }
                    if (!document.getElementById('confettiStyle')) {
                        const style = document.createElement('style');
                        style.id = 'confettiStyle';
                        style.textContent = `
                            @keyframes confettiFall {
                                0% { transform: translateY(0) rotate(0deg) scale(1); opacity:1; }
                                100% { transform: translateY(110vh) rotate(720deg) scale(0.2); opacity:0; }
                            }
                        `;
                        document.head.appendChild(style);
                    }
                    setTimeout(() => container.remove(), 5500);
                }

                // ============================================================
                // 14. LOAD SCENARIO
                // ============================================================
                window.loadScenario = function() {
                    if (!G.isPlaying) return;

                    const scenario = SCENARIOS[G.day - 1];
                    G.currentScenarioIndex = G.day - 1;

                    DOM.dayBadge.textContent = 'CÂU ' + G.day;
                    DOM.scenarioTitle.textContent = scenario.text.length > 60 ? scenario.text.substring(0, 60) + '...' : scenario.text;
                    DOM.scenarioText.textContent = scenario.text;

                    DOM.choiceATitle.textContent = scenario.A.label;
                    DOM.choiceBTitle.textContent = scenario.B.label;

                    DOM.choiceA.dataset.effects = JSON.stringify(scenario.A.effects);
                    DOM.choiceA.dataset.label = scenario.A.label;
                    DOM.choiceA.dataset.desc = scenario.A.desc;
                    DOM.choiceA.dataset.reflection = scenario.A.reflection || '';
                    DOM.choiceB.dataset.effects = JSON.stringify(scenario.B.effects);
                    DOM.choiceB.dataset.label = scenario.B.label;
                    DOM.choiceB.dataset.desc = scenario.B.desc;
                    DOM.choiceB.dataset.reflection = scenario.B.reflection || '';

                    DOM.choiceA.disabled = false;
                    DOM.choiceB.disabled = false;

                    DOM.scenarioCard.style.opacity = '1';
                    updateStatsUI();
                }

                // ============================================================
                // 15. HANDLE CHOICE
                // ============================================================
                function handleChoice(e) {
                    const btn = e.currentTarget;
                    if (btn.disabled || !G.isPlaying || G.isWaitingResult) return;

                    const scenario = SCENARIOS[G.day - 1];
                    const label = btn.dataset.label || 'Lựa chọn';
                    const desc = btn.dataset.desc || '';
                    const reflection = btn.dataset.reflection || '';

                    DOM.choiceA.disabled = true;
                    DOM.choiceB.disabled = true;

                    sfxClick();

                    if (scenario && scenario.isFinal) {
                        G.finalReflection = reflection;
                        G.pendingFinalEnd = true;
                        showResult([], label, desc);
                        return;
                    }

                    const effects = JSON.parse(btn.dataset.effects);
                    applyEffects(effects, label, desc);
                }

                // ============================================================
                // 16. RESTART
                // ============================================================
                function restartGame() {
                    G.money = 50;
                    G.health = 100;
                    G.alienation = 0;
                    G.commodity = 0;
                    G.face = 20;
                    G.connection = 0;
                    G.day = 1;
                    G.isPlaying = true;
                    G.isWaitingResult = false;
                    G.gameEnded = false;
                    G.scoreSaved = false;
                    G.scoreStats = null;
                    G.finalReflection = '';
                    G.pendingFinalEnd = false;

                    DOM.endingOverlay.classList.remove('active');
                    DOM.resultPopup.classList.remove('active');

                    DOM.choiceA.disabled = false;
                    DOM.choiceB.disabled = false;

                    updateStatsUI();
                    
                    if (G.day > adminMaxDay) {
                        checkWaitingStatus();
                    } else {
                        loadScenario();
                    }
                    sfxClick();
                }

                // ============================================================
                // 17. INIT
                // ============================================================
                function init() {
                    const playerName = sessionStorage.getItem('playerName');
                    if (!playerName) {
                        window.location.href = 'register.html';
                        return;
                    }

                    const nameBadge = document.getElementById('playerNameBadge');
                    if (nameBadge) {
                        nameBadge.textContent = '👤 ' + playerName;
                        nameBadge.classList.remove('hidden');
                    }

                    // Event listeners
                    DOM.choiceA.addEventListener('click', handleChoice);
                    DOM.choiceB.addEventListener('click', handleChoice);
                    DOM.btnContinue.addEventListener('click', nextDay);
                    DOM.btnPlayAgain.addEventListener('click', restartGame);
                    DOM.btnLeaderboard.addEventListener('click', () => {
                        window.location.href = 'leaderboard.html';
                    });

                    // Keyboard shortcuts
                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'a' || e.key === 'A') {
                            if (!DOM.choiceA.disabled) DOM.choiceA.click();
                        }
                        if (e.key === 'b' || e.key === 'B') {
                            if (!DOM.choiceB.disabled) DOM.choiceB.click();
                        }
                        if (e.key === 'c' || e.key === 'C') {
                            if (DOM.choiceC && !DOM.choiceC.classList.contains('hidden') && !DOM.choiceC.disabled) {
                                DOM.choiceC.click();
                            }
                        }
                        if (e.key === 'Enter' || e.key === ' ') {
                            if (DOM.resultPopup.classList.contains('active')) {
                                e.preventDefault();
                                DOM.btnContinue.click();
                            }
                        }
                    });

                    updateStatsUI();
                    loadScenario();

                    console.log('💎 Hạnh Phúc Hay Tiền Bạc? — Game loaded.');
                    console.log(`📚 ${SCENARIOS.length} scenarios available.`);
                }

                // Start game when DOM ready
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', init);
                } else {
                    init();
                }
            })();
    