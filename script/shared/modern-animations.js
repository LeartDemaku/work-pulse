document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Animate only once
            }
        });
    }, observerOptions);

    // Select elements to animate
    const animatedElements = document.querySelectorAll('.feature-card, .step, .section-title');

    animatedElements.forEach((el, index) => {
        el.classList.add('animate-on-scroll');
        // Add stagger delay via inline style
        el.style.transitionDelay = `${index % 4 * 100}ms`;
        observer.observe(el);
    });
});
