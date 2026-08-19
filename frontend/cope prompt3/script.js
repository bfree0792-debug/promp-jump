const hasGsap = typeof gsap !== "undefined";
const hasScrollTrigger = typeof ScrollTrigger !== "undefined";

if (hasGsap && hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
}

/* =========================
   PROMPT HEADLINE BLUR
========================= */
if (hasGsap && document.querySelector('.prompt-headline')) {
    gsap.fromTo('.prompt-headline span',
        { opacity: 0, y: 40, filter: 'blur(14px)' },
        {
            opacity: 1, y: 0, filter: 'blur(0px)',
            stagger: 0.08, duration: 1.2, ease: 'power3.out',
            scrollTrigger: {
                trigger: '.prompt-headline',
                start: 'top 90%', end: 'top 40%', scrub: 1.5
            }
        }
    );
}

if (hasGsap && document.querySelector('.prompt-headline-sub')) {
    gsap.fromTo('.prompt-headline-sub',
        { opacity: 0, y: 30, filter: 'blur(10px)' },
        {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.2, ease: 'power3.out',
            scrollTrigger: {
                trigger: '.prompt-headline-sub',
                start: 'top 90%', end: 'top 40%', scrub: 1
            }
        }
    );
}

/* =========================
   SERVICES SMALL TOP BLUR
========================= */
if (hasGsap && document.querySelector('.services-small-top')) {
    gsap.fromTo('.services-small-top',
        { opacity: 0, y: 40, filter: 'blur(12px)' },
        {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.2, ease: 'power3.out',
            scrollTrigger: {
                trigger: '.services-small-top',
                start: 'top 90%', end: 'top 30%', scrub: 1
            }
        }
    );
}

/* =========================
   SERVICES HEADING BLUR
========================= */
if (hasGsap && document.querySelector('.services-heading')) {
    gsap.fromTo('.services-heading span',
        { opacity: 0, y: 80, filter: 'blur(14px)' },
        {
            opacity: 1, y: 0, filter: 'blur(0px)',
            stagger: 0.12, duration: 1.4, ease: 'power4.out',
            scrollTrigger: {
                trigger: '.services-heading',
                start: 'top 90%', end: 'top 30%', scrub: 2
            }
        }
    );
}

/* =========================
   SERVICES BOTTOM TEXT BLUR
========================= */
if (hasGsap && document.querySelector('.services-small-bottom')) {
    gsap.fromTo('.services-small-bottom',
        { opacity: 0, y: 40, filter: 'blur(12px)' },
        {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.2, ease: 'power3.out',
            scrollTrigger: {
                trigger: '.services-small-bottom',
                start: 'top 90%', end: 'top 30%', scrub: 1
            }
        }
    );
}

/* =========================
   STACK CARDS
========================= */
if (hasGsap && document.querySelector('.stack-card')) {
    const stackCards = gsap.utils.toArray('.stack-card');

    stackCards.forEach((card, index) => {

        /* BLUR IN */
        gsap.fromTo(card,
            { opacity: 0, y: 80, filter: 'blur(10px)' },
            {
                opacity: 1, y: 0, filter: 'blur(0px)',
                duration: 1, ease: 'power3.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%', end: 'top 40%', scrub: 1
                }
            }
        );

        /* SCALE DOWN */
        gsap.to(card, {
            scale: 1 - (stackCards.length - index) * 0.04,
            transformOrigin: 'top center',
            ease: 'none',
            scrollTrigger: {
                trigger: card,
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });

    });
}


if (hasGsap && document.querySelector('.trending-heading')) {
    gsap.fromTo('.trending-heading span',
        { opacity: 0, y: 40, filter: 'blur(14px)' },
        {
            opacity: 1, y: 0, filter: 'blur(0px)',
            stagger: 0.08, duration: 1.2, ease: 'power3.out',
            scrollTrigger: {
                trigger: '.trending-heading',
                start: 'top 90%',
                toggleActions: 'play none none reverse'
            }
        }
    );
}
if (hasGsap && document.querySelector('.trending-sub')) {
    gsap.fromTo('.trending-sub',
        { opacity: 0, y: 30, filter: 'blur(10px)' },
        {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.2, ease: 'power3.out',
            scrollTrigger: {
                trigger: '.trending-sub',
                start: 'top bottom',
                toggleActions: 'play none none none'
            }
        }
    );
}

/* =========================
   EXPLORE PAGE ANIMATIONS
========================= */
if (hasGsap && document.querySelector('.explore-hero-title')) {
    gsap.fromTo('.explore-hero-title',
        { opacity: 0, y: 30, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power3.out' }
    );
}

if (hasGsap && document.querySelector('.explore-search-wrapper')) {
    gsap.fromTo('.explore-search-wrapper',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' }
    );
}

if (hasGsap && document.querySelector('.explore-card')) {
    gsap.fromTo('.explore-card',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, delay: 0.3, ease: 'power3.out' }
    );
}

/* =========================
   ABOUT PAGE ANIMATIONS
========================= */
if (hasGsap && document.querySelector('.about-hero-title')) {
    gsap.fromTo('.about-hero-title',
        { opacity: 0, y: 30, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power3.out' }
    );
}

if (hasGsap && document.querySelector('.about-stat-card')) {
    gsap.fromTo('.about-stat-card',
        { opacity: 0, y: 30 },
        {
            opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
            scrollTrigger: {
                trigger: '.about-stats-grid',
                start: 'top 85%'
            }
        }
    );
}

/* =========================
   TOGGLE PASSWORD VISIBILITY
========================= */
function togglePassword() {
    const password = document.getElementById("password");
    if (!password) return;
    if (password.type === "password") {
        password.type = "text";
    } else {
        password.type = "password";
    }
}
