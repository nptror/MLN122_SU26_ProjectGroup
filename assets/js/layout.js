/**
 * ============================================================
 *  LAYOUT.JS — Reusable Component Loader
 *  Loads header.html & footer.html, sets active navigation,
 *  handles scroll progress, mobile menu, and page transitions.
 * ============================================================
 */
(function () {
    'use strict';

    // ============================================================
    // 1. CONFIGURATION
    // ============================================================
    const CONFIG = {
        headerPath: '../components/header.html',
        footerPath: '../components/footer.html',
        headerContainerId: 'header-container',
        footerContainerId: 'footer-container',
        scrollProgressId: 'scroll-progress-bar',
    };

    function resolveComponentPath(path) {
        const currentPath = window.location.pathname.toLowerCase();
        if (currentPath.includes('/web/')) {
            return '../' + path.replace(/^\.\.\//, '').replace(/^\//, '');
        }
        return path;
    }

    // ============================================================
    // 2. PAGE DETECTION
    // ============================================================
    function getCurrentPage() {
        const path = window.location.pathname.toLowerCase();
        const file = path.split('/').pop() || '';

        if (file.includes('game')) return 'game';
        if (file.includes('leaderboard')) return 'leaderboard';
        if (file.includes('register')) return 'register';
        if (file.includes('landing_page')) return 'game';
        // Default to home for home.html, index.html, or empty
        return 'home';
    }

    // ============================================================
    // 3. LOAD COMPONENT
    // ============================================================
    async function loadComponent(url, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`[Layout] Container #${containerId} not found.`);
            return false;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            container.innerHTML = html;
            return true;
        } catch (err) {
            console.error(`[Layout] Failed to load ${url}:`, err);
            return false;
        }
    }

    // ============================================================
    // 4. SET ACTIVE NAVIGATION
    // ============================================================
    function setActiveNav(page) {
        const links = document.querySelectorAll('[data-nav-link], .header-nav-link[data-page], .mobile-nav-link[data-page]');
        links.forEach(link => {
            const targetPage = link.dataset.page || link.dataset.navLink;
            if (targetPage === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // ============================================================
    // 5. MOBILE MENU LOGIC
    // ============================================================
    function initMobileMenu() {
        const hamburger = document.getElementById('header-hamburger');
        const mobileMenu = document.getElementById('mobile-menu');
        const overlay = document.getElementById('mobile-menu-overlay');
        const closeBtn = document.getElementById('mobile-menu-close');

        if (!hamburger || !mobileMenu || !overlay) return;

        function openMenu() {
            mobileMenu.classList.add('open');
            overlay.classList.add('open');
            hamburger.classList.add('open');
            document.body.style.overflow = 'hidden';
        }

        function closeMenu() {
            mobileMenu.classList.remove('open');
            overlay.classList.remove('open');
            hamburger.classList.remove('open');
            document.body.style.overflow = '';
        }

        hamburger.addEventListener('click', () => {
            if (mobileMenu.classList.contains('open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        if (overlay) overlay.addEventListener('click', closeMenu);
        if (closeBtn) closeBtn.addEventListener('click', closeMenu);

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
                closeMenu();
            }
        });
    }

    // ============================================================
    // 6. SCROLL PROGRESS INDICATOR
    // ============================================================
    function initScrollProgress() {
        const bar = document.getElementById(CONFIG.scrollProgressId);
        if (!bar) return;

        function updateProgress() {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            bar.style.width = progress + '%';
        }

        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }

    // ============================================================
    // 7. FADE-IN SECTIONS ON SCROLL
    // ============================================================
    function initScrollAnimations() {
        const sections = document.querySelectorAll('.fade-in-section');
        if (sections.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        sections.forEach(section => observer.observe(section));
    }

    // ============================================================
    // 8. PAGE TRANSITION
    // ============================================================
    function syncPlayerName() {
        const name = sessionStorage.getItem('playerName') || '';
        const pill = document.getElementById('header-player-pill');
        const nameEl = document.getElementById('header-player-name');

        if (name && name.trim()) {
            if (pill) pill.classList.remove('hidden');
            if (nameEl) nameEl.textContent = name.trim();
        } else {
            if (pill) pill.classList.add('hidden');
            if (nameEl) nameEl.textContent = 'Guest';
        }
    }

    function initPageTransition() {
        // Create transition overlay
        let overlay = document.getElementById('page-transition-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'page-transition-overlay';
            overlay.className = 'page-transition-overlay';
            document.body.appendChild(overlay);
        }

        // Fade in current page
        document.body.classList.add('page-loaded');

        // Intercept navigation links for smooth transition
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;

            const href = link.getAttribute('href');
            // Only intercept internal page links
            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;

            e.preventDefault();

            // Gate: if navigating to game.html, check game_state first
            const isGameLink = href.includes('game.html');
            if (isGameLink) {
                handleGameNavigation(overlay);
                return;
            }

            overlay.classList.add('active');
            document.body.classList.remove('page-loaded');

            setTimeout(() => {
                window.location.href = href;
            }, 350);
        });
    }

    /**
     * Check game_state before allowing navigation to game.html.
     * If admin hasn't opened round 1, redirect to register.html.
     */
    async function handleGameNavigation(overlay) {
        const playerName = (sessionStorage.getItem('playerName') || '').trim();

        // No name → always go to register
        if (!playerName) {
            navigateWithTransition(overlay, '/register.html');
            return;
        }

        // Check game_state via API
        try {
            const res = await fetch('/api/game-state');
            const json = await res.json();
            if (json.ok && json.state) {
                const state = json.state;
                if (state.is_active && state.max_question_index >= 1) {
                    // Admin đã mở → vào game
                    navigateWithTransition(overlay, '/game.html');
                } else {
                    // Admin chưa mở → về register (đã có tên, hiện waiting)
                    navigateWithTransition(overlay, '/register.html');
                }
                return;
            }
        } catch (_) {
            // Server không chạy → cho vào game (offline mode)
        }

        navigateWithTransition(overlay, '/game.html');
    }

    function navigateWithTransition(overlay, url) {
        if (overlay) {
            overlay.classList.add('active');
            document.body.classList.remove('page-loaded');
        }
        setTimeout(() => {
            window.location.href = url;
        }, 350);
    }

    // ============================================================
    // 9. FLOATING CTA BUTTON
    // ============================================================
    function initFloatingCTA() {
        const btn = document.getElementById('floating-cta');
        if (!btn) return;

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            if (scrollY > 400) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        }, { passive: true });
    }

    // ============================================================
    // 10. STICKY SECTION NAVIGATION
    // ============================================================
    function initStickyNav() {
        const stickyNav = document.getElementById('sticky-section-nav');
        if (!stickyNav) return;

        const sections = document.querySelectorAll('section[data-section-id]');
        const navLinks = stickyNav.querySelectorAll('a[data-target]');

        // Show/hide sticky nav based on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                stickyNav.classList.add('visible');
            } else {
                stickyNav.classList.remove('visible');
            }

            // Highlight current section
            let currentSection = '';
            sections.forEach(section => {
                const top = section.offsetTop - 120;
                if (window.scrollY >= top) {
                    currentSection = section.dataset.sectionId;
                }
            });

            navLinks.forEach(link => {
                if (link.dataset.target === currentSection) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }, { passive: true });

        // Smooth scroll on click
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(`[data-section-id="${link.dataset.target}"]`);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // ============================================================
    // 11. MAIN INIT
    // ============================================================
    async function init() {
        const currentPage = getCurrentPage();
        console.log(`[Layout] Current page: ${currentPage}`);

        // Load header and footer
        const [headerLoaded, footerLoaded] = await Promise.all([
            loadComponent(resolveComponentPath(CONFIG.headerPath), CONFIG.headerContainerId),
            loadComponent(resolveComponentPath(CONFIG.footerPath), CONFIG.footerContainerId),
        ]);

        if (headerLoaded) {
            setActiveNav(currentPage);
            syncPlayerName();
            initMobileMenu();
            console.log('[Layout] Header loaded ✓');
        }

        if (footerLoaded) {
            console.log('[Layout] Footer loaded ✓');
        }

        // Init page features
        initScrollProgress();
        initScrollAnimations();
        initPageTransition();
        initFloatingCTA();
        initStickyNav();

        window.addEventListener('storage', (event) => {
            if (event.key === 'playerName') {
                syncPlayerName();
            }
        });
        window.addEventListener('focus', syncPlayerName);

        console.log('[Layout] All systems initialized ✓');
    }

    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
