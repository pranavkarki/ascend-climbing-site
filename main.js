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
                        start: 'top 85%',
                        toggleActions: 'play none none reset'
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
                    start: 'top 85%',
                    toggleActions: 'play none none reset'
                }
            }
        );
    }

    // Day pass prices: flash blue then settle to white on scroll-in
    document.querySelectorAll('.pass-price').forEach((el, i) => {
        gsap.fromTo(el,
            { color: '#0000CD', immediateRender: false },
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
        header.classList.toggle('scrolled', window.scrollY > 200);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    gsap.from(header, { opacity: 0, duration: 1.4, ease: 'power2.out', delay: 0.2 });

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

    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('mobile-active');
            document.body.classList.toggle('menu-open');
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('mobile-active');
                document.body.classList.remove('menu-open');
            });
        });
    }
});
