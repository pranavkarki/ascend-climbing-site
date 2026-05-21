document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

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
                    ease: 'power3.out', stagger: 0.15,
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        }
    });

    document.querySelectorAll('.img-reveal-container').forEach(reveal => {
        gsap.fromTo(reveal,
            { clipPath: 'inset(100% 0% 0% 0%)' },
            {
                clipPath: 'inset(0% 0% 0% 0%)',
                ease: 'none',
                scrollTrigger: {
                    trigger: reveal.closest('.scroll-section'),
                    start: 'top bottom',
                    end: 'top top',
                    scrub: true
                }
            }
        );
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
                    start: 'top 60%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    }

    // Day pass prices: flash neon green then settle to white on scroll-in
    document.querySelectorAll('.pass-price').forEach((el, i) => {
        gsap.fromTo(el,
            { color: '#39FF14', immediateRender: false },
            {
                color: '#FAFAFA',
                duration: 0.7,
                ease: 'power2.out',
                delay: 0.45 + i * 0.15,
                scrollTrigger: {
                    trigger: el.closest('.scroll-section'),
                    start: 'top 85%',
                    toggleActions: 'play none none reset'
                }
            }
        );
    });

    // Feature image/placeholder reveal: wipes up from blue background
    document.querySelectorAll('.feature-img-wrap').forEach(wrap => {
        const img = wrap.querySelector('img');
        const trigger = wrap.closest('.feature-item');
        const scrollTriggerConfig = { trigger, start: 'top 85%', toggleActions: 'play none none reverse' };

        if (img) {
            gsap.set(img, { clipPath: 'inset(100% 0% 0% 0%)', filter: 'blur(2px)', scale: 1.03, opacity: 1 });
            gsap.timeline({ scrollTrigger: scrollTriggerConfig })
                .to(img, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'power3.out' })
                .to(img, { filter: 'blur(0px)', scale: 1, duration: 0.2, ease: 'power2.out' });
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
            timeZone: 'Asia/Kathmandu',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(now);
        const time = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Kathmandu',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).format(now);
        el.textContent = `${date} ${time}`;
        el.setAttribute('datetime', now.toISOString());
    };

    updateNavDateTime();
    setInterval(updateNavDateTime, 1000);

    const updateHeaderHeight = () => {
        const header = document.querySelector('header');
        if (header) {
            document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
        }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('load', updateHeaderHeight);

    const header = document.querySelector('header');
    const onScroll = () => {
        const scrolled = window.scrollY > 200;
        header.classList.toggle('scrolled', scrolled);
        document.body.classList.toggle('header-scrolled', scrolled);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    gsap.from(header, { yPercent: -100, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.1, clearProps: 'transform,opacity' });
    gsap.from('.menu-toggle', { y: 30, opacity: 0, duration: 0.5, ease: 'power3.out', delay: 0.8, clearProps: 'transform' });

    gsap.timeline({ delay: 0.5, onComplete: startHeroIdleAnimations })
        .from('.landing-geo',          { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' })
        .from('.landing-brand',        { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out' }, '-=0.3')
        .from('.landing-climbing-sub', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
        .from('.landing-tagline',      { y: 15, opacity: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3');

    const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    document.querySelectorAll('a').forEach(link => {
        if (link.children.length > 0) return;
        if (!link.hasAttribute('data-original-text')) {
            link.setAttribute('data-original-text', link.innerText);
        }
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

        const split = new SplitType(el, { types: 'chars' });
        const flashColor = '#39FF14';

        split.chars.forEach(char => {
            gsap.timeline({
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                }
            })
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
                onComplete: () => navLinks.classList.remove('mobile-active')
            }));
        }

        menuToggle.addEventListener('click', () => {
            if (menuOpen) closeMenu(); else openMenu();
        });
        navItems.forEach(link => {
            link.addEventListener('click', () => { if (menuOpen) closeMenu(); });
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 992) {
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
});
