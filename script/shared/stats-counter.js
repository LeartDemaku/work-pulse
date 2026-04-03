document.addEventListener('DOMContentLoaded', () => {
    const statsSection = document.querySelector('.stats');
    if (!statsSection) return;

    const counters = document.querySelectorAll('.stat-number');
    const duration = 2000; // Animation duration in ms

    // Easing function: easeOutCubic
    const easeOutCubic = (x) => {
        return 1 - Math.pow(1 - x, 3);
    };

    const formatNumber = (num) => {
        return num.toLocaleString('en-US');
    };

    const animateCounter = (counter) => {
        const target = +counter.getAttribute('data-target');
        const suffix = counter.getAttribute('data-suffix') || '';
        const prefix = counter.getAttribute('data-prefix') || '';

        let startTime = null;

        const step = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeProgress = easeOutCubic(progress);

            const currentVal = Math.floor(easeProgress * target);

            counter.textContent = `${prefix}${formatNumber(currentVal)}${suffix}`;

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                counter.textContent = `${prefix}${formatNumber(target)}${suffix}`;
            }
        };

        window.requestAnimationFrame(step);
    };

    const observerOption = {
        threshold: 0.2,
        rootMargin: "0px"
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Animate section entrance
                entry.target.classList.add('visible');

                // Trigger counters with a slight delay for better UX
                counters.forEach((counter, index) => {
                    setTimeout(() => {
                        animateCounter(counter);
                    }, index * 100); // Stagger animations
                });

                observer.unobserve(entry.target);
            }
        });
    }, observerOption);

    observer.observe(statsSection);
});
