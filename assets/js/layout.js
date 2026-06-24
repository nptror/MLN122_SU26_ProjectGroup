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
    // 1. CONFIGURATION — auto-resolve paths based on file location
    // ============================================================
    function resolveComponentPath(filename) {
        const path = window.location.pathname;
        const parts = path.split('/').filter(Boolean);
        const depth = parts.length > 0 ? parts.length - 1 : 0;
        const prefix = depth > 0 ? '../'.repeat(depth) : './';
        return `${prefix}components/${filename}`;
    }

    // Resolve path to a page file from any directory
    function resolvePagePath(page) {
        const path = window.location.pathname;
        const parts = path.split('/').filter(Boolean);
        const depth = parts.length > 0 ? parts.length - 1 : 0;
        const prefix = depth > 0 ? '../'.repeat(depth) : './';

        const PAGE_MAP = {
            home:        'web/home.html',
            game:        'web_game/game.html',
            leaderboard: 'web_game/leaderboard.html',
        };
        return prefix + (PAGE_MAP[page] || '#');
    }

    const CONFIG = {
        get headerPath() { return resolveComponentPath('header.html'); },
        get footerPath() { return resolveComponentPath('footer.html'); },
        headerContainerId: 'header-container',
        footerContainerId: 'footer-container',
        scrollProgressId: 'scroll-progress-bar',
    };

    // ============================================================
    // 2. PAGE DETECTION
    // ============================================================
    function getCurrentPage() {
        const path = window.location.pathname.toLowerCase();
        const file = path.split('/').pop() || '';

        if (file === '' || file === 'home.html' || file === 'index.html') return 'home';
        if (file.includes('landing')) return 'home';  // landing_page maps to home/theory
        if (file.includes('leaderboard')) return 'leaderboard';
        if (file.includes('game')) return 'game';
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
    // 4. RESOLVE NAV LINKS
    // ============================================================
    function resolveNavLinks() {
        // Logo link
        const logo = document.getElementById('header-logo');
        if (logo) logo.href = resolvePagePath('home');

        // All nav links with data-nav-link attribute
        document.querySelectorAll('[data-nav-link]').forEach(link => {
            const page = link.dataset.navLink;
            link.href = resolvePagePath(page);
        });
    }

    // ============================================================
    // 5. SET ACTIVE NAVIGATION
    // ============================================================
    function setActiveNav(page) {
        // Desktop nav links
        const desktopLinks = document.querySelectorAll('.header-nav-link[data-page]');
        desktopLinks.forEach(link => {
            if (link.dataset.page === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Mobile nav links
        const mobileLinks = document.querySelectorAll('.mobile-nav-link[data-page]');
        mobileLinks.forEach(link => {
            if (link.dataset.page === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // ============================================================
    // 5. FOOTER LINKS
    // ============================================================
    function resolveFooterLinks() {
        document.querySelectorAll('.footer-link[data-nav-link]').forEach(link => {
            const page = link.dataset.navLink;
            link.href = resolvePagePath(page);
        });
    }

    // ============================================================
    // 6. MOBILE MENU LOGIC
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
    // 7. SCROLL PROGRESS INDICATOR
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
    // 8. FADE-IN SECTIONS ON SCROLL
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
    // 9. PAGE TRANSITION
    // ============================================================
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
            overlay.classList.add('active');
            document.body.classList.remove('page-loaded');

            setTimeout(() => {
                window.location.href = href;
            }, 350);
        });
    }

    // ============================================================
    // 10. FLOATING CTA BUTTON
    // ============================================================
    function initFloatingCTA() {
        const btn = document.getElementById('floating-cta');
        if (!btn) return;

        let lastScrollY = 0;
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            if (scrollY > 400) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
            lastScrollY = scrollY;
        }, { passive: true });
    }

    // ============================================================
    // 11. STICKY SECTION NAVIGATION
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
            loadComponent(CONFIG.headerPath, CONFIG.headerContainerId),
            loadComponent(CONFIG.footerPath, CONFIG.footerContainerId),
        ]);

        if (headerLoaded) {
            resolveNavLinks();
            setActiveNav(currentPage);
            initMobileMenu();
            console.log('[Layout] Header loaded ✓');
        }

        if (footerLoaded) {
            resolveFooterLinks();
            console.log('[Layout] Footer loaded ✓');
        }

        // Init page features
        initScrollProgress();
        initScrollAnimations();
        initPageTransition();
        initFloatingCTA();
        initStickyNav();

        console.log('[Layout] All systems initialized ✓');
    }

    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
