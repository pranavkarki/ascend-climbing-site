document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    // Reveal body and pre-set entrance initial states in the same sync task so
    // the browser paints only once — with body visible but elements at their
    // animated-from positions, preventing the flash-then-disappear effect.
    document.body.style.opacity = '1';
    gsap.set('header',               { yPercent: -100, opacity: 0 });
    gsap.set('.menu-toggle',         { y: 30, opacity: 0 });
    gsap.set('.landing-geo',         { y: 20, opacity: 0 });
    gsap.set('.landing-brand',       { y: 50, opacity: 0 });
    gsap.set('.landing-climbing-sub',{ y: 20, opacity: 0 });
    gsap.set('.landing-tagline',     { y: 15, opacity: 0 });
    if (window.matchMedia('(min-width: 993px)').matches) {
        // xPercent: -50 preserves CSS translate(-50%, ...) horizontal centering
        // (avoids end-of-tween horizontal snap). yPercent: -250 = -50 (CSS center)
        // + -200 extra: 200% of the pill's own ~40px height ≈ header's 72px travel,
        // so per-pixel velocity matches the header at the same 0.7s duration.
        gsap.set('.nav-links', { xPercent: -50, yPercent: -250, opacity: 0 });
    }

    const ST_PLAY_REVERSE = (trigger) => ({ trigger, start: 'top 85%', toggleActions: 'play none none reverse' });
    const ST_PLAY_RESET   = (trigger) => ({ trigger, start: 'top 85%', toggleActions: 'play none none reset' });

    const ACCENT = '#39FF14';
    const CONFIG = {
        SCRAMBLE_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+',
        STAGGER: 0.15,
        SCROLL_THRESHOLD: 200,
        MOBILE_BREAKPOINT: 992,
        TIMEZONE: 'Asia/Kathmandu',
    };

    const lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('.scroll-section').forEach(section => {
        const animates = section.querySelectorAll('.animate-up');
        if (animates.length > 0) {
            gsap.fromTo(animates,
                { y: 40, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 0.8,
                    ease: 'power3.out', stagger: CONFIG.STAGGER,
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        }
    });

    // Membership rows: clip-path stagger reveal (each row wipes in from bottom)
    const membershipRow = document.querySelector('.pricing-membership-row');
    if (membershipRow) {
        gsap.fromTo(membershipRow.querySelectorAll('.membership-row-item'),
            { clipPath: 'inset(0 0 100% 0)' },
            {
                clipPath: 'inset(0 0 0% 0)',
                duration: 0.35,
                ease: 'power2.out',
                stagger: 0.07,
                scrollTrigger: {
                    trigger: membershipRow,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    }

    // Day pass prices: flash neon green then settle to white on scroll-in
    document.querySelectorAll('.scroll-section').forEach(section => {
        section.querySelectorAll('.pass-price').forEach((el, i) => {
            gsap.fromTo(el,
                { color: ACCENT, immediateRender: false },
                {
                    color: '#FAFAFA',
                    duration: 0.7,
                    ease: 'power2.out',
                    delay: 0.45 + i * 0.15,
                    scrollTrigger: ST_PLAY_RESET(section)
                }
            );
        });
    });

    // Feature image/placeholder reveal: wipes up from blue background
    document.querySelectorAll('.feature-img-wrap').forEach(wrap => {
        const img = wrap.querySelector('img');
        const trigger = wrap.closest('.feature-item') || wrap.closest('.grid-row') || wrap;
        const scrollTriggerConfig = ST_PLAY_REVERSE(trigger);

        if (img) {
            gsap.set(img, { clipPath: 'inset(100% 0% 0% 0%)', filter: 'blur(2px)', scale: 1.03, opacity: 1 });
            const setupAnim = () => {
                gsap.timeline({ scrollTrigger: scrollTriggerConfig })
                    .to(img, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'power3.out' })
                    .to(img, { filter: 'blur(0px)', scale: 1.01, duration: 0.2, ease: 'power2.out', clearProps: 'filter' });
            };
            if (img.complete) {
                setupAnim();
            } else {
                img.addEventListener('load', setupAnim, { once: true });
            }
        } else {
            gsap.set(wrap, { clipPath: 'inset(100% 0% 0% 0%)' });
            gsap.to(wrap, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'power3.out', scrollTrigger: scrollTriggerConfig });
        }
    });

    ScrollTrigger.refresh();

    const updateNavDateTime = () => {
        const el = document.getElementById('nav-datetime');
        if (!el) return;
        const now = new Date();
        const date = new Intl.DateTimeFormat('en-GB', {
            timeZone: CONFIG.TIMEZONE,
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(now);
        const time = new Intl.DateTimeFormat('en-GB', {
            timeZone: CONFIG.TIMEZONE,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).format(now);
        el.textContent = `${date} ${time}`;
        el.setAttribute('datetime', now.toISOString());
    };

    updateNavDateTime();
    let clockInterval;
    const startClock = () => { clockInterval = setInterval(updateNavDateTime, 1000); };
    const stopClock  = () => clearInterval(clockInterval);
    document.addEventListener('visibilitychange', () => document.hidden ? stopClock() : startClock());
    startClock();

    const updateHeaderHeight = () => {
        const header = document.querySelector('header');
        if (header) {
            document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
        }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('load', updateHeaderHeight);

    const updateNavLinksLeft = () => {
        const brand = document.querySelector('.nav-brand');
        const meta = document.querySelector('.nav-meta');
        const navLinks = document.querySelector('.nav-links');
        if (!brand || !meta || !navLinks) return;
        const mid = (brand.getBoundingClientRect().right + meta.getBoundingClientRect().left) / 2;
        navLinks.style.left = mid + 'px';
    };
    updateNavLinksLeft();
    window.addEventListener('resize', updateNavLinksLeft);
    window.addEventListener('load', updateNavLinksLeft);

    const header = document.querySelector('header');
    const navLinksEl = document.querySelector('.nav-links');
    const landingEl = document.getElementById('landing');
    let lastScrollY = window.scrollY;
    let navIsHidden = false;
    let navPeakY = 0;
    let entranceDone = false;

    const onScroll = () => {
        const scrollY = window.scrollY;
        const menuIsOpen = document.body.classList.contains('menu-open');
        // True while the mobile overlay is open OR in the middle of its close wipe
        // (mobile-active is only removed in the close tween's onComplete). Used to
        // prevent the scroll-hide tween's overwrite:true from killing the in-flight
        // close clip-path animation when an anchor link triggers an immediate scroll.
        const overlayBusy = navLinksEl && navLinksEl.classList.contains('mobile-active');

        if (!menuIsOpen) {
            const scrolled = scrollY > CONFIG.SCROLL_THRESHOLD;
            header.classList.toggle('scrolled', scrolled);
            document.body.classList.toggle('header-scrolled', scrolled);
        }

        // Skip hide/reveal until the entrance animation completes — otherwise
        // the browser's async scroll-position restoration on mid-page refresh
        // fires onScroll while yPercent is still animating, and overwrite:true
        // kills the entrance tween, leaving yPercent stuck at a partial value.
        if (landingEl && !menuIsOpen && !overlayBusy && entranceDone) {
            const pastLanding = scrollY > landingEl.offsetTop + landingEl.offsetHeight;

            if (!navIsHidden && pastLanding && scrollY > lastScrollY) {
                navIsHidden = true;
                navPeakY = scrollY;
                gsap.to([header, navLinksEl], { y: -120, duration: 0.4, ease: 'power3.in', overwrite: true });
            } else if (navIsHidden) {
                if (scrollY > navPeakY) navPeakY = scrollY;
                if (!pastLanding || navPeakY - scrollY > 30) {
                    navIsHidden = false;
                    gsap.to([header, navLinksEl], { y: 0, duration: 0.45, ease: 'power3.out', overwrite: true });
                }
            }
        }
        lastScrollY = scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Gate the entire entrance on the hero image being ready so elements
    // don't animate in over a blank dark screen. window.load is the fallback
    // so it never hangs on a failed/slow image.
    const landingBg = document.querySelector('.landing-bg');
    gsap.set(landingBg, { clipPath: 'inset(100% 0% 0% 0%)' });

    let entranceStarted = false;
    const startEntrance = () => {
        if (entranceStarted) return;
        entranceStarted = true;

        gsap.to(landingBg, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.0, ease: 'power3.out' });

        // Header + nav-links share a single timeline so both tween on identical frames.
        // Standalone tweens with the same delay can drift by a frame; the timeline locks them together.
        const navEntrance = gsap.timeline({
            delay: 0.1,
            onComplete: () => {
                entranceDone = true;
                lastScrollY = window.scrollY;

                // Snap scroll classes to their correct state after entrance.
                const scrolled = window.scrollY > CONFIG.SCROLL_THRESHOLD;
                header.classList.toggle('scrolled', scrolled);
                document.body.classList.toggle('header-scrolled', scrolled);
            }
        });
        navEntrance.to(header, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity' }, 0);
        if (window.matchMedia(`(min-width: ${CONFIG.MOBILE_BREAKPOINT + 1}px)`).matches) {
            navEntrance.to('.nav-links', { xPercent: -50, yPercent: -50, opacity: 1, duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity' }, 0);
        }
        gsap.to('.menu-toggle', { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', delay: 0.8, clearProps: 'transform' });

        gsap.timeline({ delay: 0.5, onComplete: startHeroIdleAnimations })
            .to('.landing-geo',          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
            .to('.landing-brand',        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, '-=0.3')
            .to('.landing-climbing-sub', { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.4')
            .to('.landing-tagline',      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, '-=0.3');
    };

    if (landingBg.complete) {
        startEntrance();
    } else {
        landingBg.addEventListener('load', startEntrance, { once: true });
        window.addEventListener('load', startEntrance, { once: true });
    }

    const scrambleChars = CONFIG.SCRAMBLE_CHARS;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    document.querySelectorAll('a').forEach(link => {
        if (link.children.length > 0) return;
        if (!link.hasAttribute('data-original-text')) {
            link.setAttribute('data-original-text', link.innerText);
        }
        if (!canHover) return;
        link.addEventListener('mouseenter', () => {
            const originalText = link.getAttribute('data-original-text');
            let obj = { value: 0 };
            let frames = 0;
            let currentScrambled = [];
            if (link.scrambleTween) link.scrambleTween.kill();
            link.scrambleTween = gsap.to(obj, {
                value: originalText.length,
                duration: 0.7,
                ease: 'none',
                onUpdate: () => {
                    let currentStr = '';
                    const progress = Math.floor(obj.value);
                    const shouldUpdateScramble = frames % 8 === 0;
                    for (let i = 0; i < originalText.length; i++) {
                        if (i < progress) {
                            currentStr += originalText[i];
                        } else if (originalText[i] === ' ' || originalText[i] === '\n') {
                            currentStr += originalText[i];
                        } else {
                            if (shouldUpdateScramble || !currentScrambled[i]) {
                                currentScrambled[i] = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                            }
                            currentStr += currentScrambled[i];
                        }
                    }
                    link.innerText = currentStr;
                    frames++;
                },
                onComplete: () => { link.innerText = originalText; }
            });
        });
    });

    // Cinematic character reveal — shared logic
    function cinematicCharReveal(el) {
        if (!el || typeof SplitType === 'undefined') return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const splitTarget = el.querySelector('.section-heading-text') || el;
        const split = new SplitType(splitTarget, { types: 'chars' });
        const flashColor = ACCENT;

        split.chars.forEach(char => {
            gsap.timeline({ scrollTrigger: ST_PLAY_REVERSE(el) })
            .fromTo(char,
                { opacity: 0, y: 10, filter: 'blur(20px)' },
                { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.4, ease: 'power2.out', delay: 0.4 * Math.random() }
            )
            .to(char, { opacity: 0.1, color: flashColor, textShadow: `0 0 10px ${flashColor}`, duration: 0.03 })
            .to(char, { opacity: 1,   color: flashColor, textShadow: `0 0 40px ${flashColor}`, duration: 0.05 })
            .to(char, { opacity: 1,   color: 'inherit',  textShadow: 'none',                   duration: 0.1 });
        });
    }

    // Cinematic character reveal — Pricing and Activities section headers
    cinematicCharReveal(document.getElementById('pricing-section-header'));
    cinematicCharReveal(document.getElementById('activities-section-header'));
    cinematicCharReveal(document.getElementById('features-section-header'));
    cinematicCharReveal(document.getElementById('faq-section-header'));

    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        const navItems = Array.from(navLinks.querySelectorAll('a'));
        let menuOpen = false;
        let activeTweens = [];

        navItems.forEach(el => {
            if (!el.hasAttribute('data-original-text')) {
                el.setAttribute('data-original-text', el.innerText);
            }
        });

        function killActive() {
            activeTweens.forEach(t => t.kill());
            activeTweens = [];
        }

        function scrambleIn(el, delay) {
            const original = el.getAttribute('data-original-text');
            const obj = { value: 0 };
            let frames = 0;
            let scrambled = [];
            gsap.set(el, { opacity: 1 });
            return gsap.to(obj, {
                value: original.length,
                duration: 0.6,
                ease: 'power2.out',
                delay,
                onUpdate() {
                    const progress = Math.floor(obj.value);
                    let str = '';
                    for (let i = 0; i < original.length; i++) {
                        if (i < progress) {
                            str += original[i];
                        } else if (original[i] === ' ') {
                            str += ' ';
                        } else {
                            if (frames % 3 === 0 || !scrambled[i]) scrambled[i] = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                            str += scrambled[i];
                        }
                    }
                    el.innerText = str;
                    frames++;
                },
                onComplete() { el.innerText = original; }
            });
        }

        function scrambleOut(el, delay) {
            const original = el.getAttribute('data-original-text');
            const obj = { value: original.length };
            let frames = 0;
            let scrambled = [];
            return gsap.to(obj, {
                value: 0,
                duration: 0.35,
                ease: 'power2.in',
                delay,
                onUpdate() {
                    const progress = Math.floor(obj.value);
                    let str = '';
                    for (let i = 0; i < original.length; i++) {
                        if (i < progress) {
                            str += original[i];
                        } else if (original[i] === ' ') {
                            str += ' ';
                        } else {
                            if (frames % 3 === 0 || !scrambled[i]) scrambled[i] = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                            str += scrambled[i];
                        }
                    }
                    el.innerText = str;
                    frames++;
                },
                onComplete() { el.innerText = ''; }
            });
        }

        function openMenu() {
            menuOpen = true;
            killActive();
            menuToggle.classList.add('active');
            navLinks.classList.add('mobile-active');
            document.body.classList.add('menu-open');
            gsap.set(navItems, { opacity: 1 });
            // Clear scroll-hide y offset so the overlay sits at its natural fixed position
            gsap.set(navLinks, { y: 0 });

            activeTweens.push(gsap.to(navLinks, {
                clipPath: 'inset(0% 0% 0% 0%)',
                duration: 0.5,
                ease: 'power3.out'
            }));
            navItems.forEach((el, i) => {
                activeTweens.push(scrambleIn(el, i * 0.08));
            });
        }

        function closeMenu() {
            menuOpen = false;
            menuToggle.classList.remove('active');
            document.body.classList.remove('menu-open');
            killActive();

            navItems.forEach((el, i) => {
                activeTweens.push(scrambleOut(el, i * 0.05));
            });

            const closeDelay = (navItems.length - 1) * 0.05 + 0.35;
            activeTweens.push(gsap.to(navLinks, {
                clipPath: 'inset(100% 0% 0% 0%)',
                duration: 0.5,
                ease: 'power3.in',
                delay: closeDelay,
                onComplete: () => {
                    navLinks.classList.remove('mobile-active');
                    // Restore scroll-hide state only AFTER the overlay has fully
                    // closed — otherwise the still-visible overlay snaps up 120px.
                    if (navIsHidden) {
                        gsap.set([header, navLinks], { y: -120 });
                    }
                }
            }));
        }

        menuToggle.addEventListener('click', () => {
            if (menuOpen) closeMenu(); else openMenu();
        });
        navItems.forEach(link => {
            link.addEventListener('click', () => { if (menuOpen) closeMenu(); });
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > CONFIG.MOBILE_BREAKPOINT) {
                menuOpen = false;
                killActive();
                menuToggle.classList.remove('active');
                navLinks.classList.remove('mobile-active');
                document.body.classList.remove('menu-open');
                gsap.set(navLinks, { clearProps: 'clip-path,pointer-events,opacity' });
                navItems.forEach(el => {
                    const original = el.getAttribute('data-original-text');
                    if (original) el.innerText = original;
                    gsap.set(el, { clearProps: 'opacity' });
                });
            }
        });
    }

    function startHeroIdleAnimations() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        // --- SVG triangle periodic rotation (bottom-left triangle only) ---
        const triA = document.getElementById('geo-tri-a');
        if (triA) {
            gsap.delayedCall(1.5, function spin() {
                gsap.timeline()
                    .to(triA, { rotation: 360, duration: 1.1, ease: 'power2.inOut', svgOrigin: '114 75' })
                    .set(triA, { rotation: 0 })
                    .call(() => gsap.delayedCall(7 + Math.random() * 5, spin));
            });
        }

        // --- Top-right circle periodic bounce ---
        const circTR = document.getElementById('geo-circle-tr');
        function bounceCir() {
            if (!circTR) return;
            gsap.timeline()
                .to(circTR, { y: -12, duration: 0.22, ease: 'power2.out' })
                .to(circTR, { y: 0,   duration: 0.5,  ease: 'bounce.out' })
                .call(() => gsap.delayedCall(5 + Math.random() * 4, bounceCir));
        }
        gsap.delayedCall(2.5, bounceCir);

    }

    // ─── TESTIMONIALS CAROUSEL ──────────────────────────
    (function initTestimonialsCarousel() {
        function timeAgo(dateStr) {
            const then = new Date(dateStr);
            const now = new Date();
            const weeks = Math.floor((now - then) / (7 * 24 * 60 * 60 * 1000));
            if (weeks < 52) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
            const months = Math.floor((now - then) / (30.4375 * 24 * 60 * 60 * 1000));
            return `${months} month${months !== 1 ? 's' : ''} ago`;
        }

        const quoteEl  = document.getElementById('testi-quote');
        const attribEl = document.getElementById('testi-attrib');
        const counterEl = document.getElementById('testi-counter');
        const dotsEl   = document.getElementById('testi-dots');
        if (!quoteEl || !attribEl || !dotsEl) return;

        const slides       = Array.from(quoteEl.querySelectorAll('.testi-slide'));
        const attribSlides = Array.from(attribEl.querySelectorAll('.testi-attrib-slide'));
        const total = slides.length;
        let current = 0;
        let autoTimer = null;

        // Update relative timestamps from data-date attributes
        attribEl.querySelectorAll('.testi-attrib-when[data-date]').forEach(el => {
            el.textContent = `via Google · ${timeAgo(el.dataset.date)}`;
        });

        function renderDots() {
            dotsEl.innerHTML = slides.map((_, i) =>
                `<button class="testi-dot${i === current ? ' active' : ''}" data-i="${i}" aria-label="Review ${i + 1}"></button>`
            ).join('');
            dotsEl.querySelectorAll('.testi-dot').forEach(btn => {
                btn.addEventListener('click', () => goTo(+btn.dataset.i));
            });
        }

        function updateDots() {
            dotsEl.querySelectorAll('.testi-dot').forEach((btn, i) => {
                btn.classList.toggle('active', i === current);
            });
        }

        const FADE_MS = 220;

        function goTo(idx) {
            const next = ((idx % total) + total) % total;
            if (next === current) return;

            // Fade out containers
            quoteEl.style.transition  = `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`;
            attribEl.style.transition = `opacity ${FADE_MS}ms ease`;
            quoteEl.style.opacity     = '0';
            quoteEl.style.transform   = 'translateY(6px)';
            attribEl.style.opacity    = '0';

            setTimeout(() => {
                slides[current].classList.remove('active');
                slides[current].setAttribute('aria-hidden', 'true');
                attribSlides[current].classList.remove('active');
                attribSlides[current].setAttribute('aria-hidden', 'true');

                current = next;

                slides[current].classList.add('active');
                slides[current].removeAttribute('aria-hidden');
                attribSlides[current].classList.add('active');
                attribSlides[current].removeAttribute('aria-hidden');

                counterEl.textContent = `[${String(current + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}]`;
                updateDots();

                // Fade in containers
                quoteEl.style.opacity   = '1';
                quoteEl.style.transform = 'translateY(0)';
                attribEl.style.opacity  = '1';
            }, FADE_MS + 30);

            clearInterval(autoTimer);
            autoTimer = setInterval(() => goTo(current + 1), 8000);
        }

        // Lock container height to tallest slide so nothing below shifts
        requestAnimationFrame(() => {
            const qh = quoteEl.offsetHeight;
            if (qh > 0) quoteEl.style.minHeight = qh + 'px';
        });

        document.getElementById('testi-prev')?.addEventListener('click', () => goTo(current - 1));
        document.getElementById('testi-next')?.addEventListener('click', () => goTo(current + 1));

        document.addEventListener('keydown', e => {
            const section = document.getElementById('testimonials');
            if (!section) return;
            const rect = section.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;
            if (e.key === 'ArrowLeft') goTo(current - 1);
            if (e.key === 'ArrowRight') goTo(current + 1);
        });

        renderDots();
        autoTimer = setInterval(() => goTo(current + 1), 8000);
    })();

    // FAQ: category tab switching
    document.querySelectorAll('.faq-nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.faqNav;

            // Deactivate all nav items and panels; reset open questions in leaving panel
            document.querySelectorAll('.faq-nav-item').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            document.querySelectorAll('.faq-panel').forEach(panel => {
                panel.querySelectorAll('.faq-item.open').forEach(item => {
                    item.classList.remove('open');
                    item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                    item.querySelector('.faq-answer').style.maxHeight = '0';
                });
                panel.classList.remove('active');
            });

            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            document.querySelector(`.faq-panel[data-faq-panel="${id}"]`).classList.add('active');
        });
    });

    // FAQ: individual question accordion
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const answer = item.querySelector('.faq-answer');
            const isOpen = item.classList.contains('open');

            if (isOpen) {
                item.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
                answer.style.maxHeight = '0';
            } else {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

});
